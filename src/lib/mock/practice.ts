import type { PracticeExercise, PracticeProgress } from "@/lib/data/practice";

// Tijdelijke oefeningen. Opdrachten gaan later naar Storyblok, antwoorden komen dan live van de Claude API.

export const mockExercises: PracticeExercise[] = [
  {
    slug: "user-story-met-acceptatiecriteria",
    title: "Schrijf een user story met acceptatiecriteria",
    summary: "Zet losse notities uit een refinement om in een heldere story die je team kan oppakken.",
    audience: "iedereen",
    level: "Beginner",
    minutes: 10,
    points: 40,
    icon: "file-text",
    context: [
      "Je team bouwt aan een leerapp. In de refinement van vanochtend is besproken dat gebruikers hun weekdoel zelf willen aanpassen. Er ligt alleen een rommelig lijstje notities.",
      "De product owner vraagt je om er voor de sprintplanning van morgen een user story van te maken.",
    ],
    goal: "Laat de AI één user story schrijven met toetsbare acceptatiecriteria, gebaseerd op de notities.",
    material: {
      label: "Notities uit de refinement",
      kind: "text",
      body: `- gebruikers willen weekdoel zelf kiezen (nu vast 120 min)
- keuze tussen 30, 60, 120, 180 min? of vrij invullen
- aanpassen via instellingen + vanuit dashboard
- streak mag niet resetten als je doel verlaagt
- manager ziet wel het doel van teamleden
- mobiel belangrijk, veel mensen leren in de trein`,
    },
    criteria: [
      { criterion: "doel", label: "Je vraagt om één user story in de vorm rol, wens en doel" },
      { criterion: "context", label: "Je geeft de notities uit de refinement mee" },
      { criterion: "randvoorwaarden", label: "Je begrenst de scope, bijvoorbeeld wat buiten de story valt" },
      { criterion: "outputformaat", label: "Je vraagt om acceptatiecriteria in Gegeven / Als / Dan" },
    ],
    tips: [
      "Plak de notities tussen aanhalingstekens of onder een kopje, zodat de AI weet wat bronmateriaal is.",
      "Noem wie de story leest: een developer die er morgen mee aan de slag gaat, heeft andere details nodig dan een stakeholder.",
      "Vraag de AI om open vragen apart te zetten in plaats van ze zelf in te vullen.",
    ],
    keywords: ["user story", "acceptatiecriteria", "weekdoel", "refinement", "gegeven", "zodat", "story"],
    placeholder: "Bijvoorbeeld: Je bent een ervaren product owner. Schrijf op basis van de notities hieronder…",
    passScore: 70,
    responses: [
      `## User story

Als gebruiker wil ik mijn weekdoel kunnen aanpassen, zodat de app beter bij mij past.

## Acceptatiecriteria
- De gebruiker kan het weekdoel aanpassen.
- Het nieuwe doel wordt opgeslagen.
- Het werkt ook op mobiel.

Laat me weten als je meer details wilt!`,
      `## User story

**Als** cursist **wil ik** mijn weekdoel zelf kunnen kiezen, **zodat** het doel past bij de tijd die ik echt heb om te leren.

## Acceptatiecriteria
1. **Gegeven** ik ben op de instellingenpagina, **als** ik een weekdoel van 30, 60, 120 of 180 minuten kies, **dan** wordt dat doel direct opgeslagen.
2. **Gegeven** ik heb een streak van 12 dagen, **als** ik mijn doel verlaag, **dan** blijft mijn streak behouden.
3. **Gegeven** ik ben op het dashboard, **als** ik op het weekdoel tik, **dan** kan ik het daar ook aanpassen.

## Open vragen
- Mogen gebruikers ook een eigen aantal minuten invullen?`,
      `## User story

**Als** cursist die naast mijn werk leert, **wil ik** mijn weekdoel zelf kiezen, **zodat** ik een doel heb dat haalbaar is en ik gemotiveerd blijf.

## Acceptatiecriteria
1. **Gegeven** ik ben in Instellingen > Leren, **als** ik 30, 60, 120 of 180 minuten kies, **dan** wordt mijn weekdoel direct opgeslagen en zie ik een bevestiging.
2. **Gegeven** ik ben op het dashboard, **als** ik het weekdoel open, **dan** kan ik het daar met dezelfde opties aanpassen.
3. **Gegeven** ik heb een lopende streak, **als** ik mijn doel verlaag, **dan** blijft mijn streak ongewijzigd.
4. **Gegeven** ik ben manager van het team, **als** ik het teamoverzicht bekijk, **dan** zie ik per teamlid het ingestelde weekdoel.
5. **Gegeven** ik gebruik een scherm van 390px breed, **als** ik mijn doel aanpas, **dan** past alles zonder horizontaal te scrollen.

## Buiten scope
- Herinneringen op basis van het weekdoel.
- Historie van eerdere weekdoelen.

## Open vragen voor de PO
- Willen we naast de vaste opties ook vrije invoer? Zo ja: wat is het minimum en maximum?
- Krijgt de manager een melding als iemand zijn doel verlaagt?`,
    ],
  },
  {
    slug: "interviewnotities-samenvatten",
    title: "Vat interviewnotities samen",
    summary: "Haal de belangrijkste inzichten uit een gebruikersinterview, zonder dat de AI gaat verzinnen.",
    audience: "designers",
    level: "Beginner",
    minutes: 10,
    points: 40,
    icon: "notebook",
    context: [
      "Je hebt een interview gehouden met een teamleider over hoe haar team nu leert werken met AI. Je notities zijn snel getypt tijdens het gesprek.",
      "Morgen deel je de inzichten met het designteam. Je wilt een samenvatting die je kunt vertrouwen.",
    ],
    goal: "Laat de AI de notities samenvatten in thema's, met citaten als onderbouwing en zonder eigen interpretaties.",
    material: {
      label: "Interviewnotities (teamleider, 34 min)",
      kind: "text",
      body: `R. is teamlead bij een webbureau, 9 mensen
- "iedereen doet maar wat met ChatGPT" - geen afspraken
- juniors gebruiken het veel, seniors wantrouwen output
- zorgen over klantdata: "ik weet niet wat er in die prompts staat"
- wil dat team sneller wordt maar niet slordiger
- e-learning eerder geprobeerd, niemand maakte het af ("te lang, te saai")
- kort en praktisch werkt beter, liefst met echte cases
- wil kunnen zien wie wat gedaan heeft, niet om te controleren maar om te helpen`,
    },
    criteria: [
      { criterion: "doel", label: "Je zegt waarvoor de samenvatting is en wie hem leest" },
      { criterion: "context", label: "Je geeft de notities en de onderzoeksvraag mee" },
      { criterion: "randvoorwaarden", label: "Je verbiedt aannames: alleen wat in de notities staat" },
      { criterion: "outputformaat", label: "Je vraagt om thema's met een citaat per thema" },
    ],
    tips: [
      "Schrijf expliciet: 'Gebruik alleen informatie uit de notities. Markeer twijfel met [onzeker].'",
      "Vraag om een vast aantal thema's (bijvoorbeeld 3 tot 5), dan dwingt de AI zichzelf om te kiezen.",
      "Laat citaten letterlijk overnemen, zodat je ze kunt terugvinden in je notities.",
    ],
    keywords: ["samenvatting", "samenvatten", "vat", "interview", "notities", "thema", "citaat", "inzichten"],
    placeholder: "Bijvoorbeeld: Vat de interviewnotities hieronder samen voor ons designteam…",
    passScore: 70,
    responses: [
      `De teamleider vindt AI belangrijk, maar haar team gebruikt het nog niet goed. Ze wil meer structuur en veiligheid. E-learning werkt niet goed omdat het saai is. Ze zou graag een platform willen met gamification en AI-coaching, en budget is waarschijnlijk geen probleem.`,
      `## Samenvatting interview teamleider

- **Geen afspraken:** iedereen gebruikt AI op een eigen manier.
- **Verschil junior en senior:** juniors gebruiken het veel, seniors vertrouwen de output niet.
- **Privacy:** zorgen over klantdata in prompts.
- **Leervorm:** eerdere e-learning werd niet afgemaakt, kort en praktisch werkt beter.
- **Inzicht:** ze wil zien wie wat gedaan heeft.`,
      `## Thema's uit het interview (teamleider webbureau, 9 personen)

## 1. Geen gedeelde werkwijze
Het team gebruikt AI zonder afspraken. Juniors veel, seniors wantrouwend.
> "iedereen doet maar wat met ChatGPT"

## 2. Zorgen over klantdata
Ze heeft geen zicht op wat er in prompts terechtkomt.
> "ik weet niet wat er in die prompts staat"

## 3. Sneller, maar niet slordiger
De wens is snelheid zonder kwaliteitsverlies.

## 4. Korte, praktische leervorm
Eerdere e-learning werd niet afgemaakt. Echte cases werken beter.
> "te lang, te saai"

## 5. Inzicht om te helpen
Ze wil voortgang zien om te ondersteunen, niet om te controleren.

**[onzeker]** Het is niet duidelijk of ze zelf budget beheert.`,
    ],
  },
  {
    slug: "component-laten-reviewen",
    title: "Laat AI een component reviewen",
    summary: "Krijg een bruikbare code review op toegankelijkheid en onderhoudbaarheid, geen lijst vol meningen.",
    audience: "developers",
    level: "Gemiddeld",
    minutes: 15,
    points: 60,
    icon: "code",
    context: [
      "Een collega heeft een herbruikbare knopcomponent gemaakt voor jullie React 19-project met TypeScript. Voordat hij in de UI-kit komt, wil je een tweede blik.",
      "Jullie team let vooral op toegankelijkheid (WCAG 2.2 AA) en houdt componenten graag klein.",
    ],
    goal: "Laat de AI de component reviewen en vraag om concrete, geprioriteerde verbeterpunten met codevoorbeelden.",
    material: {
      label: "PrimaryButton.tsx",
      kind: "code",
      body: `export function PrimaryButton(props: any) {
  return (
    <div
      className="btn"
      style={{ background: "#1d4ed8", color: "#fff", padding: 8 }}
      onClick={props.onClick}
    >
      {props.loading ? <img src="/spinner.gif" /> : props.label}
    </div>
  );
}`,
    },
    criteria: [
      { criterion: "doel", label: "Je zegt waar de review op moet letten" },
      { criterion: "context", label: "Je noemt de stack en de teamafspraken" },
      { criterion: "randvoorwaarden", label: "Je vraagt om alleen echte problemen, geprioriteerd" },
      { criterion: "outputformaat", label: "Je vraagt om een vaste structuur met ernst, probleem en oplossing" },
    ],
    tips: [
      "Vraag om een ernst per punt (hoog, middel, laag), zodat je weet waar je moet beginnen.",
      "Zeg welke standaard telt, bijvoorbeeld WCAG 2.2 AA. Dan krijg je minder smaakkwesties.",
      "Vraag om een herschreven versie pas na de lijst met punten, zodat je de redenering kunt volgen.",
    ],
    keywords: ["review", "component", "toegankelijk", "wcag", "react", "typescript", "button", "knop"],
    placeholder: "Bijvoorbeeld: Je bent een senior React-developer. Review de component hieronder op…",
    passScore: 70,
    responses: [
      `Ziet er goed uit! Een paar suggesties:

- Gebruik misschien Tailwind in plaats van inline styles.
- Je kunt de naam veranderen naar \`Button\`.
- Voeg eventueel tests toe.

Verder is de component prima bruikbaar.`,
      `## Review PrimaryButton

1. **Gebruik een \`<button>\` in plaats van een \`<div>\`.** Een div is niet bereikbaar met het toetsenbord en wordt niet als knop voorgelezen.
2. **Typ de props.** \`any\` haalt het nut van TypeScript weg.
3. **Spinner zonder alt-tekst.** Screenreaders weten niet dat er geladen wordt.
4. **Inline styles.** Moeilijk te onderhouden; gebruik jullie bestaande classes.`,
      `## Review PrimaryButton, op volgorde van ernst

**Hoog: niet bedienbaar met toetsenbord (WCAG 2.1.1).** Een \`<div>\` met \`onClick\` krijgt geen focus en reageert niet op Enter of spatie. Gebruik \`<button type="button">\`.

**Hoog: laadstatus niet toegankelijk (WCAG 4.1.2).** De spinner heeft geen tekst en de knop blijft klikbaar. Zet \`aria-busy\` en \`disabled\` tijdens het laden.

**Middel: \`any\` als props-type.** Je verliest autocompletion en typecontrole.

**Laag: inline styles.** Wijken af van jullie tokens en zijn lastig te overschrijven.

## Voorstel

\`\`\`tsx
type Props = ComponentProps<"button"> & { loading?: boolean };

export function PrimaryButton({ loading, children, ...props }: Props) {
  return (
    <button type="button" className="btn" aria-busy={loading} disabled={loading} {...props}>
      {loading ? <Spinner label="Laden…" /> : children}
    </button>
  );
}
\`\`\``,
    ],
  },
  {
    slug: "testcases-genereren",
    title: "Genereer testcases",
    summary: "Laat AI de randgevallen vinden die jij vergeet, en krijg ze direct als Vitest-tests.",
    audience: "developers",
    level: "Gemiddeld",
    minutes: 15,
    points: 60,
    icon: "flask",
    context: [
      "Je werkt aan de streakfunctie van de leerapp. Een streak is het aantal dagen achter elkaar dat iemand minimaal één taak heeft afgerond.",
      "De functie is af, maar er zijn nog geen tests. Je wilt vooral de lastige gevallen afdekken.",
    ],
    goal: "Laat de AI een set testcases maken voor de functie, inclusief randgevallen, als uitvoerbare Vitest-code.",
    material: {
      label: "Specificatie berekenStreak",
      kind: "code",
      body: `// Geeft het aantal opeenvolgende dagen t/m vandaag (of gisteren)
// waarop minimaal één taak is afgerond.
// dagen: ISO-datums (YYYY-MM-DD), ongesorteerd, mogelijk dubbel.
// Tijdzone: Europe/Amsterdam.
function berekenStreak(dagen: string[], vandaag: string): number`,
    },
    criteria: [
      { criterion: "doel", label: "Je zegt dat je tests wilt voor deze specifieke functie" },
      { criterion: "context", label: "Je geeft de specificatie en het testframework mee" },
      { criterion: "randvoorwaarden", label: "Je vraagt expliciet om randgevallen (dubbel, ongesorteerd, tijdzone)" },
      { criterion: "outputformaat", label: "Je vraagt om uitvoerbare code in één codeblok" },
      { criterion: "iteratie", label: "Je scherpt je prompt aan na het eerste antwoord" },
    ],
    tips: [
      "Vraag eerst om een lijst met testgevallen en pas daarna om code. Dan kun je de lijst nog aanvullen.",
      "Noem de lastige gevallen die je zelf al kent; de AI vult de rest aan.",
      "Geef de naam van je testframework en de importstijl, dan hoef je minder te herschrijven.",
    ],
    keywords: ["test", "testcases", "vitest", "randgeval", "streak", "berekenstreak", "edge case"],
    placeholder: "Bijvoorbeeld: Schrijf Vitest-tests voor de functie hieronder. Let vooral op…",
    passScore: 70,
    responses: [
      `Hier zijn een paar tests:

\`\`\`ts
test("streak werkt", () => {
  expect(berekenStreak(["2026-10-13", "2026-10-14"], "2026-10-14")).toBe(2);
});
\`\`\`

Je kunt meer tests toevoegen voor andere gevallen.`,
      `## Testgevallen
1. Lege lijst geeft 0.
2. Alleen vandaag geeft 1.
3. Drie opeenvolgende dagen geeft 3.
4. Een gat breekt de streak.

\`\`\`ts
import { describe, expect, it } from "vitest";

describe("berekenStreak", () => {
  it("geeft 0 bij een lege lijst", () => {
    expect(berekenStreak([], "2026-10-14")).toBe(0);
  });

  it("telt opeenvolgende dagen", () => {
    expect(berekenStreak(["2026-10-12", "2026-10-13", "2026-10-14"], "2026-10-14")).toBe(3);
  });
});
\`\`\``,
      `## Testgevallen
1. Lege lijst geeft 0.
2. Streak t/m gisteren telt nog (vandaag nog niets gedaan).
3. Gat van één dag breekt de streak.
4. Dubbele datums tellen één keer.
5. Ongesorteerde invoer geeft hetzelfde resultaat.
6. Overgang naar wintertijd (26 oktober) telt als gewone dag.

\`\`\`ts
import { describe, expect, it } from "vitest";
import { berekenStreak } from "./streak";

const vandaag = "2026-10-14";

describe("berekenStreak", () => {
  it.each([
    ["lege lijst", [], 0],
    ["alleen gisteren", ["2026-10-13"], 1],
    ["gat breekt streak", ["2026-10-11", "2026-10-13", "2026-10-14"], 2],
    ["dubbele datums", ["2026-10-14", "2026-10-14", "2026-10-13"], 2],
    ["ongesorteerd", ["2026-10-14", "2026-10-12", "2026-10-13"], 3],
  ])("%s", (_, dagen, verwacht) => {
    expect(berekenStreak(dagen, vandaag)).toBe(verwacht);
  });

  it("telt door over de wintertijd", () => {
    expect(berekenStreak(["2026-10-25", "2026-10-26"], "2026-10-26")).toBe(2);
  });
});
\`\`\``,
    ],
  },
  {
    slug: "concepten-voor-onboarding",
    title: "Bedenk 10 concepten voor een onboarding",
    summary: "Gebruik AI als sparringpartner om breed te divergeren voordat je gaat schetsen.",
    audience: "designers",
    level: "Beginner",
    minutes: 10,
    points: 40,
    icon: "lightbulb",
    context: [
      "Een zorgverzekeraar wil dat nieuwe medewerkers in hun eerste week de interne app leren gebruiken. Nu haakt de helft af na de eerste dag.",
      "Je staat aan het begin van het ontwerptraject en wilt veel verschillende richtingen verkennen voordat je kiest.",
    ],
    goal: "Laat de AI precies 10 uiteenlopende concepten bedenken voor de onboarding, kort en vergelijkbaar opgeschreven.",
    criteria: [
      { criterion: "doel", label: "Je vraagt om precies 10 concepten voor deze onboarding" },
      { criterion: "context", label: "Je beschrijft de doelgroep en het probleem" },
      { criterion: "randvoorwaarden", label: "Je vraagt om echt verschillende richtingen en noemt grenzen" },
      { criterion: "outputformaat", label: "Je vraagt per concept om dezelfde opbouw" },
    ],
    tips: [
      "Vraag om spreiding: 'minstens drie concepten die niet in de app zelf plaatsvinden'.",
      "Geef een vaste opbouw per concept, bijvoorbeeld naam, idee in één zin en grootste risico.",
      "Laat de AI de concepten aan het eind zelf groeperen. Dat helpt bij het kiezen.",
    ],
    keywords: ["concepten", "concept", "ideeën", "onboarding", "nieuwe medewerkers", "zorgverzekeraar", "10", "tien"],
    placeholder: "Bijvoorbeeld: Bedenk 10 concepten voor de onboarding van nieuwe medewerkers…",
    passScore: 70,
    responses: [
      `Hier zijn wat ideeën voor een onboarding:

- Een welkomstvideo
- Een tour door de app
- Tooltips
- Een checklist
- Gamification met punten

Wil je dat ik een van deze ideeën verder uitwerk?`,
      `## 10 concepten
1. **Rondleiding:** stap voor stap door de belangrijkste schermen.
2. **Checklist eerste week:** vijf taken met vinkjes.
3. **Buddy-systeem:** een collega helpt in de eerste week.
4. **Video's:** korte uitleg per functie.
5. **Quiz:** test wat je weet na dag één.
6. **Tooltips:** hints op het moment dat je iets nodig hebt.
7. **Welkomstmail:** met links naar de belangrijkste functies.
8. **Badges:** beloning voor eerste acties.
9. **Oefenomgeving:** een sandbox met nepdata.
10. **FAQ:** antwoorden op veelgestelde vragen.`,
      `## 10 concepten voor de eerste week

1. **Eerste dossier samen** · Dag één verwerk je een oefendossier met een buddy die meekijkt. · Risico: kost tijd van senior collega's.
2. **Vijf-minutenmissies** · Elke ochtend één korte opdracht in de app. · Risico: voelt schools.
3. **Schaduwmodus** · Je ziet live hoe een collega een klantvraag afhandelt. · Risico: privacy van klantdata.
4. **Fouten mogen** · Een sandbox met nepklanten waarin niets stuk kan. · Risico: verschil met de echte app.
5. **Vraag het de app** · Een zoekbalk die antwoordt in gewone taal. · Risico: verkeerde antwoorden.
6. **Teamquest** · Nieuwe medewerkers lossen samen een week lang een case op. · Risico: lastig te plannen.
7. **Papieren kickstart** · Een kaart op je bureau met de vijf belangrijkste handelingen. · Risico: raakt verouderd.
8. **Terugbelmoment** · Op dag drie belt iemand van het team: waar loop je vast? · Risico: schaalt slecht.
9. **Voortgangsmuur** · Het team ziet welke stappen de nieuwe collega heeft gezet. · Risico: voelt als controle.
10. **Omgekeerde onboarding** · De nieuwe medewerker noteert wat onduidelijk was en verbetert zo de app. · Risico: weinig direct effect.

## Groepen
- **Sociaal:** 1, 3, 6, 8
- **In de app:** 2, 4, 5
- **Buiten de app:** 7, 9, 10`,
    ],
  },
  {
    slug: "gestructureerde-json-output",
    title: "Vraag gestructureerde JSON-output",
    summary: "Laat AI supportmails classificeren in een vast schema dat je code direct kan inlezen.",
    audience: "developers",
    level: "Gevorderd",
    minutes: 20,
    points: 80,
    icon: "braces",
    context: [
      "Het supportteam krijgt elke dag honderden mails. Je bouwt een koppeling die mails automatisch labelt, zodat ze bij het juiste team terechtkomen.",
      "Je code verwacht valide JSON. Elke uitleg of afwijkende waarde laat de koppeling crashen.",
    ],
    goal: "Schrijf een prompt die voor elke mail exact één JSON-object teruggeeft volgens een vast schema, zonder extra tekst.",
    material: {
      label: "Voorbeeldmail",
      kind: "text",
      body: `Onderwerp: Factuur klopt niet + kan niet inloggen

Hoi, ik heb deze maand twee keer betaald voor het teamabonnement (factuur 2026-0412 en 2026-0419). Daarnaast krijg ik sinds gisteren een foutmelding bij het inloggen. Graag snel reactie want mijn team kan niet verder.

Groet, Pieter`,
    },
    criteria: [
      { criterion: "doel", label: "Je zegt dat elke mail geclassificeerd moet worden" },
      { criterion: "outputformaat", label: "Je geeft het exacte JSON-schema met veldnamen en types" },
      { criterion: "randvoorwaarden", label: "Je vraagt om alleen JSON en noemt de toegestane waarden" },
      { criterion: "context", label: "Je legt uit waar de output voor gebruikt wordt" },
      { criterion: "iteratie", label: "Je test je prompt en verbetert hem op basis van het antwoord" },
    ],
    tips: [
      "Geef het schema letterlijk, met de toegestane waarden voor elk veld: \"categorie\": \"factuur\" | \"inloggen\" | \"overig\".",
      "Zeg wat de AI moet doen bij twijfel, bijvoorbeeld \"categorie\": \"overig\" met een lage \"zekerheid\".",
      "Schrijf: 'Antwoord met alleen het JSON-object, zonder uitleg en zonder codeblok.'",
    ],
    keywords: ["json", "classificeer", "classificeren", "categorie", "schema", "mail", "support", "label"],
    placeholder: 'Bijvoorbeeld: Classificeer de supportmail hieronder. Antwoord met alleen JSON volgens dit schema: {"categorie": …}',
    passScore: 75,
    responses: [
      `Deze mail gaat over twee dingen: een factuurprobleem en een inlogprobleem. Ik zou hem classificeren als **Facturatie** met hoge prioriteit, omdat de klant dubbel heeft betaald. Hier is de JSON:

\`\`\`json
{ "type": "Facturatie", "urgent": "ja" }
\`\`\``,
      `\`\`\`json
{
  "categorie": "factuur",
  "prioriteit": "hoog",
  "samenvatting": "Klant heeft twee keer betaald en kan niet inloggen."
}
\`\`\``,
      `{"categorieen":["factuur","inloggen"],"prioriteit":"hoog","zekerheid":0.92,"samenvatting":"Dubbel betaald (2026-0412, 2026-0419) en sinds gisteren inlogfout; team kan niet verder.","factuurnummers":["2026-0412","2026-0419"]}`,
    ],
  },
  {
    slug: "foutmelding-herschrijven",
    title: "Herschrijf een foutmelding",
    summary: "Maak van een technische melding een zin waar een gebruiker wél iets mee kan.",
    audience: "iedereen",
    level: "Beginner",
    minutes: 5,
    points: 30,
    icon: "message",
    context: [
      "Bij het aanmelden voor een teamabonnement krijgen gebruikers een technische foutmelding als hun IBAN niet klopt. Support krijgt er veel vragen over.",
      "De app spreekt gebruikers aan met 'je' en gebruikt eenvoudige taal (B1).",
    ],
    goal: "Laat de AI drie betere varianten van de foutmelding schrijven die passen bij de tone of voice.",
    material: {
      label: "Huidige foutmelding",
      kind: "code",
      body: `Error 422: Unprocessable Entity. Validation failed for field "iban" (mod97 check).`,
    },
    criteria: [
      { criterion: "doel", label: "Je vraagt om een herschreven foutmelding" },
      { criterion: "context", label: "Je legt uit waar de melding verschijnt en voor wie" },
      { criterion: "randvoorwaarden", label: "Je noemt tone of voice, taalniveau en maximale lengte" },
      { criterion: "outputformaat", label: "Je vraagt om meerdere varianten om uit te kiezen" },
    ],
    tips: [
      "Een goede foutmelding zegt wat er misging en wat de gebruiker nu kan doen.",
      "Geef een maximum aantal tekens; foutmeldingen staan vaak onder een smal invoerveld.",
      "Vraag de AI om technische termen zoals '422' of 'mod97' weg te laten.",
    ],
    keywords: ["foutmelding", "herschrijf", "iban", "melding", "varianten", "gebruiker"],
    placeholder: "Bijvoorbeeld: Herschrijf deze foutmelding voor gebruikers van onze app…",
    passScore: 70,
    responses: [
      `Hier is een betere versie:

"Er is een fout opgetreden bij het valideren van uw IBAN. Controleer de invoer en probeer het opnieuw."`,
      `## Drie varianten
1. Dit IBAN klopt niet. Controleer of je het goed hebt overgenomen.
2. We herkennen dit IBAN niet. Kijk of er geen cijfer mist.
3. Je IBAN lijkt niet te kloppen. Probeer het nog een keer.`,
      `## Drie varianten (max. 80 tekens)

1. **Dit IBAN klopt niet. Check of je geen cijfer of letter mist.** (63 tekens)
2. **We herkennen dit IBAN niet. Het begint meestal met NL en twee cijfers.** (72 tekens)
3. **Controleer je IBAN even. Je vindt het in je bankapp of op je bankpas.** (70 tekens)

## Waarom dit werkt
- Zegt wat er mis is, zonder de gebruiker de schuld te geven.
- Geeft een concrete volgende stap.
- Geen technische termen, taalniveau B1, je-vorm.

**Advies:** variant 2 helpt het meest, omdat de meeste fouten in het begin van het IBAN zitten.`,
    ],
  },
  {
    slug: "moodboard-beschrijving",
    title: "Prompt een moodboard-beschrijving",
    summary: "Vertaal merkwaarden naar een beschrijving die je kunt gebruiken voor beeldgeneratie en briefings.",
    audience: "designers",
    level: "Gemiddeld",
    minutes: 15,
    points: 50,
    icon: "palette",
    context: [
      "Een energiecoöperatie uit Zwolle wil een nieuwe uitstraling. Ze willen niet 'groen en wollig' overkomen, maar nuchter, lokaal en betrouwbaar.",
      "Je wilt een moodboard-beschrijving die je kunt delen met de klant én kunt gebruiken als basis voor beeldgeneratie.",
    ],
    goal: "Laat de AI een gestructureerde moodboard-beschrijving schrijven die de merkwaarden vertaalt naar sfeer, kleur, typografie en beeld.",
    criteria: [
      { criterion: "doel", label: "Je zegt waarvoor de beschrijving gebruikt wordt" },
      { criterion: "context", label: "Je geeft merkwaarden en doelgroep van de coöperatie mee" },
      { criterion: "randvoorwaarden", label: "Je noemt wat je juist wilt vermijden" },
      { criterion: "outputformaat", label: "Je vraagt om vaste secties zoals sfeer, kleur en beeld" },
    ],
    tips: [
      "Noem wat het merk níét is. 'Geen windmolens tegen een blauwe lucht' stuurt sterker dan 'duurzaam'.",
      "Vraag om kleuren als hexcodes, zodat je ze direct kunt testen.",
      "Laat de AI per sectie één beeldprompt schrijven die je in een beeldgenerator kunt plakken.",
    ],
    keywords: ["moodboard", "sfeer", "merk", "coöperatie", "cooperatie", "energie", "kleur", "beeld", "typografie"],
    placeholder: "Bijvoorbeeld: Je bent art director. Schrijf een moodboard-beschrijving voor…",
    passScore: 70,
    responses: [
      `Een moodboard voor een duurzaam energiebedrijf kan bestaan uit groene kleuren, windmolens, zonnepanelen en blije mensen in de natuur. Gebruik een modern lettertype en veel wit. Zo straal je duurzaamheid en vertrouwen uit.`,
      `## Moodboard energiecoöperatie

**Sfeer:** nuchter, lokaal en betrouwbaar.

**Kleur:** donkergroen, warm grijs en een accent in oker.

**Typografie:** een stevige schreefloze letter met veel ruimte.

**Beeld:** echte leden uit Zwolle, daken met zonnepanelen, buurtbijeenkomsten.`,
      `## Moodboard: energiecoöperatie Zwolle

## Sfeer
Nuchter en dichtbij. Eerder een buurthuis dan een kantoor. Geen beloftes over het redden van de wereld, wel over de buurt.

## Kleur
- Klei #6B4F3A, als basis: aards en eerlijk
- IJsselgrijs #8C9399, voor rust
- Signaaloker #E0A526, als accent voor acties
- **Vermijden:** felgroen en hemelsblauw

## Typografie
Een stevige grotesk met korte uitlopers. Koppen in kleine letters, net als een handgeschreven briefje van de buren.

## Beeld
Leden op hun eigen dak, de monteur aan de keukentafel, avondlicht in een Zwolse straat. **Vermijden:** windmolens tegen een strakblauwe lucht en stockfoto's van groene blaadjes.

## Beeldprompt
\`documentairefoto, avondlicht, twee buren op een dak in Zwolle met zonnepanelen, warme kleuren, 35mm, natuurlijk\``,
    ],
  },
];

// Vrije oefenruimte: geen opdracht. {onderwerp} wordt vervangen door het begin van de prompt.
export const mockFreePractice: PracticeExercise = {
  slug: "vrij",
  title: "Vrije oefenruimte",
  summary: "Probeer elke prompt uit die je in je werk wilt gebruiken, met directe feedback.",
  audience: "iedereen",
  level: "Beginner",
  minutes: 0,
  points: 0,
  icon: "sparkles",
  free: true,
  context: [
    "Hier oefen je zonder opdracht. Probeer een prompt die je deze week echt nodig hebt, of experimenteer met een andere aanpak.",
    "Je krijgt bij elke poging feedback op de vijf onderdelen van een sterke prompt.",
  ],
  goal: "Schrijf een prompt, bekijk het antwoord en scherp hem aan tot je tevreden bent.",
  criteria: [],
  tips: [
    "Begin met wat je wilt hebben, niet met wat de AI is.",
    "Plak voorbeeldmateriaal onder je vraag en zet het tussen aanhalingstekens.",
    "Lees het antwoord en pas één ding tegelijk aan. Zo zie je wat het verschil maakt.",
  ],
  keywords: [],
  starters: [
    {
      label: "Mail herschrijven",
      prompt:
        "Herschrijf de mail hieronder zodat hij korter en vriendelijker is, voor een klant die al twee keer heeft gebeld.\n- Maximaal 120 woorden\n- Je-vorm\n- Eindig met één duidelijke volgende stap\n\nMail:\n\"\"\"\n[plak hier je mail]\n\"\"\"",
    },
    {
      label: "Workshop voorbereiden",
      prompt:
        "Je bent een ervaren facilitator. Maak een programma voor een workshop van 90 minuten over AI-afspraken in ons team van 8 designers en developers.\nGeef het programma als tabel met tijd, onderdeel en werkvorm.",
    },
    {
      label: "Regex uitleggen",
      prompt:
        "Leg uit wat deze reguliere expressie doet, stap voor stap, voor een junior developer:\n`^(?=.*\\d)(?=.*[A-Z]).{12,}$`\nGeef daarna drie strings die wel matchen en drie die niet matchen.",
    },
  ],
  placeholder: "Waar wil je hulp bij? Beschrijf je doel, de context en wat voor antwoord je terug wilt.",
  passScore: 0,
  responses: [
    `Ik help je graag met "{onderwerp}". Om een antwoord te geven dat echt bruikbaar is, mis ik nog wat informatie:

1. **Voor wie** is het resultaat bedoeld?
2. **Waarvoor** ga je het gebruiken?
3. **Welke vorm** wil je terug: een lijst, een tekst, een tabel of code?
4. Zijn er dingen die ik **moet vermijden** of waar ik rekening mee moet houden?

Hoe meer je hiervan in je prompt zet, hoe minder je hoeft te verbeteren.`,
    `## Eerste opzet

Je vraagt om hulp bij "{onderwerp}". Ik heb het opgedeeld in drie stappen:

1. **Uitgangspunt:** wat er nu ligt en wat er beter moet.
2. **Uitwerking:** een eerste versie op basis van je prompt.
3. **Controle:** waar je zelf nog naar moet kijken voordat je het gebruikt.

Wil je dat ik één van deze stappen verder uitwerk? Dan helpt het als je aangeeft hoe lang het antwoord mag zijn en voor wie het is.`,
    `## Uitwerking

Op basis van je prompt over "{onderwerp}" heb ik rekening gehouden met je doel, de context en je randvoorwaarden.

- **Doel:** helder benoemd, dus ik heb de uitwerking daarop afgestemd.
- **Vorm:** zoals gevraagd, zodat je het direct kunt overnemen.
- **Grenzen:** ik heb me gehouden aan je beperkingen en niets toegevoegd wat je niet vroeg.

**Volgende stap:** lees het kritisch na en vraag me om één onderdeel aan te scherpen, bijvoorbeeld: "Maak punt 2 concreter met een voorbeeld uit de zorg."`,
  ],
};

// Sanne heeft twee oefeningen afgerond.
export const mockPracticeProgress: PracticeProgress = {
  completed: {
    "foutmelding-herschrijven": 88,
    "interviewnotities-samenvatten": 76,
  },
};
