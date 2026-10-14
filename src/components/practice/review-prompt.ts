import type { CriterionKey, PracticeExercise } from "@/lib/data/practice";

// Beoordeelt een prompt met een eenvoudige heuristiek (trefwoorden, lengte, opsommingen).
// Wordt later een server action die Claude de prompt laat beoordelen; de vorm van PromptReview blijft gelijk.

export const criteria: { key: CriterionKey; label: string; description: string }[] = [
  { key: "doel", label: "Doel", description: "Is duidelijk wat de AI moet maken en waarvoor?" },
  { key: "context", label: "Context", description: "Weet de AI genoeg over de situatie, de rol en het materiaal?" },
  { key: "randvoorwaarden", label: "Randvoorwaarden", description: "Staan er grenzen in, zoals lengte, toon en wat niet mag?" },
  { key: "outputformaat", label: "Outputformaat", description: "Zegt de prompt in welke vorm het antwoord moet komen?" },
  { key: "iteratie", label: "Iteratie", description: "Scherp je de prompt aan op basis van het vorige antwoord?" },
];

export type CriterionReview = { key: CriterionKey; label: string; score: number; tip: string };

export type PromptReview = {
  score: number;
  criteria: CriterionReview[];
  summary: string;
};

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

const count = (text: string, pattern: RegExp) => new Set(text.match(pattern) ?? []).size;

const words = (text: string) => text.toLowerCase().match(/[\p{L}\d]+/gu) ?? [];

// Hoeveel de prompt veranderd is t.o.v. de vorige poging (0 = gelijk, 1 = compleet anders).
function changeRatio(a: string, b: string) {
  const setA = new Set(words(a));
  const setB = new Set(words(b));
  if (!setA.size && !setB.size) return 0;
  const shared = [...setA].filter((w) => setB.has(w)).length;
  return 1 - shared / new Set([...setA, ...setB]).size;
}

const tips: Record<CriterionKey, [low: string, mid: string, high: string]> = {
  doel: [
    "Begin met een werkwoord dat zegt wat je wilt: 'Schrijf', 'Vat samen', 'Bedenk'. Zeg er meteen bij waarvoor je het gebruikt.",
    "Je taak is helder. Maak hem sterker door het waarom toe te voegen, bijvoorbeeld met 'zodat…' of 'voor de sprintplanning van morgen'.",
    "Duidelijk doel: de AI weet wat er gemaakt moet worden en waarvoor.",
  ],
  context: [
    "De AI weet nog bijna niets over je situatie. Geef een rol ('Je bent een ervaren…'), de doelgroep en plak het materiaal erbij.",
    "Er staat wat context in. Voeg toe voor wie het resultaat is, of plak het bronmateriaal onder je vraag.",
    "Sterke context: rol, situatie en materiaal staan erin.",
  ],
  randvoorwaarden: [
    "Er staan nog geen grenzen in. Zet 2 of 3 eisen onder elkaar, zoals 'maximaal 100 woorden' of 'geen vakjargon'.",
    "Je noemt een paar eisen. Maak ze meetbaar (aantallen, lengte) en zeg ook wat de AI níét moet doen.",
    "Goede randvoorwaarden: meetbaar en concreet.",
  ],
  outputformaat: [
    "Zeg in welke vorm je het antwoord wilt: een lijst, tabel, JSON of tekst met kopjes. Dan hoef je minder om te bouwen.",
    "Je noemt een vorm. Maak hem preciezer: welke kopjes of velden, en in welke volgorde?",
    "Helder outputformaat: het antwoord is direct bruikbaar.",
  ],
  iteratie: [
    "Lees het antwoord en pas je prompt gericht aan. Verander één ding tegelijk, zodat je ziet wat het verschil maakt.",
    "Goed dat je verder bouwt. Benoem wat er aan het vorige antwoord beter moet, bijvoorbeeld 'korter' of 'met een voorbeeld'.",
    "Je bouwt gericht verder op het vorige antwoord.",
  ],
};

const tipFor = (key: CriterionKey, score: number) => tips[key][score < 40 ? 0 : score < 70 ? 1 : 2];

export function reviewPrompt(
  prompt: string,
  { exercise, previous }: { exercise?: PracticeExercise; previous?: string } = {},
): PromptReview {
  const text = prompt.toLowerCase();
  const wordCount = words(prompt).length;

  // Doel: een opdracht-werkwoord, het waarom en (bij een oefening) woorden die bij de opdracht horen.
  let doel = 0;
  if (/\b(schrijf|maak|vat|genereer|bedenk|geef|herschrijf|review|beoordeel|analyseer|beschrijf|stel|formuleer|classificeer|vertaal|controleer|ontwerp|leg uit|help|verbeter|zet)\b/.test(text)) doel += 35;
  if (/\b(zodat|om te|doel|bedoeld|waarvoor|gebruik(en)? (ik|we|in|voor|bij))\b|\bvoor (het|de|ons|onze|een|mijn)\b/.test(text)) doel += 30;
  if (exercise && exercise.keywords.length) {
    const hits = exercise.keywords.filter((k) => text.includes(k)).length;
    doel += Math.min(35, hits * 12);
  } else {
    doel += wordCount >= 25 ? 35 : wordCount >= 12 ? 20 : 0;
  }

  // Context: rol, situatie, materiaal en een beetje lengte.
  let context = 0;
  if (/\b(je bent|jij bent|neem de rol|als (een )?(ervaren|senior|expert)|expert|specialist)\b/.test(text)) context += 25;
  if (/\b(doelgroep|gebruikers?|klanten?|cursisten?|team|organisatie|project|product|app|bedrijf|coöperatie|we (bouwen|maken|werken))\b/.test(text)) context += 25;
  if (/"""|```|\bhieronder\b|\bnotities\b|:\s*\n|\bmateriaal\b/.test(text) || prompt.length > 400) context += 25;
  context += wordCount >= 40 ? 25 : wordCount >= 20 ? 12 : 0;

  // Randvoorwaarden: opsommingen, beperkende woorden, aantallen en toon.
  let randvoorwaarden = 0;
  const listLines = prompt.split("\n").filter((l) => /^\s*(\d+[.)]|[-*•])\s+/.test(l)).length;
  randvoorwaarden += listLines >= 2 ? 35 : listLines === 1 ? 15 : 0;
  randvoorwaarden += Math.min(40, count(text, /\b(maximaal|max|minimaal|hooguit|niet|geen|alleen|uitsluitend|moet|vermijd|zonder|precies|nooit)\b/g) * 12);
  if (/\d+\s*(woorden|zinnen|tekens|punten|regels|items|concepten|varianten|bullets|minuten|thema's|testcases|tests)\b/.test(text)) randvoorwaarden += 25;
  if (/\b(toon|tone of voice|informeel|formeel|je-vorm|jij-vorm|b1|taalniveau|vakjargon|jargon)\b/.test(text)) randvoorwaarden += 15;

  // Outputformaat: hoe meer de vorm is vastgelegd, hoe beter.
  const formats = count(
    text,
    /\b(tabel|lijst|opsomming|bullets?|json|markdown|kopjes?|kop|codeblok|schema|csv|stappenplan|gherkin|gegeven|given|template|format|structuur|secties?|kolommen|velden|varianten|hexcodes?|vorm|opbouw|indeling)\b/g,
  );
  let outputformaat = formats >= 3 ? 85 : formats === 2 ? 70 : formats === 1 ? 50 : 0;
  if (/\b(per (item|concept|punt|thema|variant)|elk(e)? (item|concept|punt|thema))\b/.test(text)) outputformaat += 10;
  if (/\b(bijvoorbeeld|zoals)\b|\{/.test(text)) outputformaat += 10;

  // Iteratie: eerste poging start laag; daarna telt hoe gericht je de prompt aanpast.
  const asksQuestions = /\b(stel (eerst )?(vragen|een vraag)|vraag (eerst|door)|als (iets )?onduidelijk|onduidelijk is|controleer (je|jezelf)|twijfel)\b/.test(text);
  let iteratie: number;
  if (!previous) {
    iteratie = 25 + (asksQuestions ? 40 : 0) + (/\b(varianten|alternatieven|opties)\b/.test(text) ? 15 : 0);
  } else {
    const change = changeRatio(prompt, previous);
    // Alleen wat er nieuw bij is komt in aanmerking voor de bonus; dezelfde prompt opnieuw sturen telt niet.
    const before = new Set(words(previous));
    const added = words(prompt).filter((w) => !before.has(w)).join(" ");
    if (change < 0.05) {
      iteratie = 10;
    } else {
      iteratie = 45 + (change > 0.15 ? 35 : 20);
      if (/\b(vorige|eerdere|antwoord|plaats|korter|langer|concreter|aanpassen|verbeter|scherper|preciezer)\b/.test(added)) iteratie += 20;
      if (asksQuestions) iteratie += 10;
    }
  }

  // Heel korte prompts kunnen nooit hoog scoren.
  const lengthCap = wordCount < 6 ? 40 : wordCount < 12 ? 70 : 100;

  const scores: Record<CriterionKey, number> = {
    doel: clamp(doel),
    context: clamp(Math.min(context, lengthCap)),
    randvoorwaarden: clamp(Math.min(randvoorwaarden, lengthCap)),
    outputformaat: clamp(Math.min(outputformaat, lengthCap)),
    iteratie: clamp(iteratie),
  };

  const list = criteria.map((c) => ({ key: c.key, label: c.label, score: scores[c.key], tip: tipFor(c.key, scores[c.key]) }));
  const score = clamp(list.reduce((sum, c) => sum + c.score, 0) / list.length);

  const summary =
    score >= 85
      ? "Sterke prompt. De AI heeft alles wat hij nodig heeft."
      : score >= 70
        ? "Goede prompt. Met een kleine aanscherping wordt hij nog beter."
        : score >= 45
          ? "Je bent op de goede weg. Werk de laagste onderdelen bij en probeer het opnieuw."
          : "Een begin. De AI moet nu veel raden; geef meer richting.";

  return { score, criteria: list, summary };
}

// Kwaliteit van de prompt bepaalt welk voorbeeldantwoord je krijgt (0 = zwak, 2 = sterk).
export const responseTier = (score: number) => (score >= 70 ? 2 : score >= 45 ? 1 : 0);
