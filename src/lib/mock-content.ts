import type { Chapter, LearningPath, Task, Topic, TopicIcon } from "./types";

// Tijdelijke content. Wordt vervangen door Storyblok (zie src/lib/content.ts).

function placeholderTasks(chapterTitle: string): Task[] {
  return [
    {
      id: "intro",
      title: "Introductie",
      blocks: [{ type: "text", body: `In dit hoofdstuk: ${chapterTitle.toLowerCase()}.` }],
    },
    {
      id: "theorie",
      title: "Theorie",
      blocks: [
        {
          type: "text",
          body: "Bekijk de video hieronder. Zodra je minstens 90% hebt gezien, kun je de taak afronden.",
        },
        {
          type: "video",
          title: `${chapterTitle} in anderhalve minuut`,
          duration: 96,
          transcript: [
            { start: 0, text: `Welkom bij dit hoofdstuk: ${chapterTitle.toLowerCase()}.` },
            {
              start: 8,
              text: "In deze korte video zetten we de belangrijkste begrippen op een rij, zodat je de rest van de taken makkelijker volgt.",
            },
            {
              start: 22,
              text: "We beginnen bij de vraag waarom dit onderwerp ertoe doet in jouw werk, als designer of als developer.",
            },
            { start: 38, text: "Daarna kijken we naar een paar voorbeelden uit projecten zoals die van jouw team." },
            { start: 56, text: "Let vooral op waar AI je tijd bespaart, en waar je zelf kritisch moet blijven kijken." },
            { start: 74, text: "In de volgende taak ga je aan de slag met een voorbeeld uit de praktijk." },
            { start: 88, text: "Tot zo!" },
          ],
        },
      ],
    },
    { id: "voorbeeld", title: "Voorbeeld uit de praktijk", blocks: [{ type: "text", body: "Inhoud volgt." }] },
    { id: "oefening", title: "Oefening", blocks: [{ type: "text", body: "Inhoud volgt." }] },
    { id: "quiz", title: "Korte quiz", blocks: [{ type: "text", body: "Inhoud volgt." }] },
  ];
}

function chapter(
  number: string,
  title: string,
  shortTitle = title,
  tasks?: Task[],
): Chapter {
  return {
    id: "", // wordt gezet door withIds()
    slug: number.replace(".", "-"),
    number,
    title,
    shortTitle,
    minutes: "20–30 min",
    points: 120,
    level: "Beginner",
    audience: "Designers en developers",
    tasks: tasks ?? placeholderTasks(title),
  };
}

function withIds(path: LearningPath): LearningPath {
  path.topics.forEach((t) => t.chapters.forEach((c) => (c.id = `${path.slug}/${c.slug}`)));
  return path;
}

function topic(id: string, title: string, icon: TopicIcon, chapters: Chapter[]): Topic {
  return { id, title, icon, chapters };
}

const iterationTasks: Task[] = [
  {
    id: "introductie",
    title: "Introductie",
    blocks: [
      {
        type: "text",
        body: "Wie AI als zoekmachine gebruikt, krijgt vaak middelmatige antwoorden. In dit hoofdstuk leer je hoe je via een gesprek tot betere output komt.",
      },
      {
        type: "video",
        title: "Itereren in twee minuten",
        duration: 134,
        posterColor: "#1e3a8a",
        transcript: [
          { start: 0, text: "Stel je voor: je vraagt een AI om een user story voor een nieuwe inlogflow." },
          { start: 9, text: "Het antwoord is netjes, maar generiek. Het had over elk product kunnen gaan." },
          { start: 20, text: "Veel mensen stoppen hier. Ze concluderen dat AI niet goed genoeg is voor hun werk." },
          { start: 32, text: "Maar dat eerste antwoord is geen eindproduct. Het laat vooral zien wat de AI van je vraag heeft begrepen." },
          { start: 46, text: "Behandel het daarom als een collega die net is aangeschoven: je geeft context, kijkt mee en stuurt bij." },
          { start: 60, text: "Dat doe je in drie stappen. Eerst vragen: doel, context en randvoorwaarden." },
          { start: 73, text: "Dan beoordelen: klopt het, past de toon, mist er iets?" },
          { start: 84, text: "En tot slot bijsturen: benoem concreet wat er anders moet, liefst meetbaar." },
          { start: 97, text: "Die loop herhaal je tot de output bruikbaar is. Meestal zijn twee of drie rondes genoeg." },
          { start: 110, text: "En soms is opnieuw beginnen slimmer dan doorgaan. Daarover meer in taak 4." },
          { start: 124, text: "Klaar? Dan duiken we in de eerste taak." },
        ],
      },
    ],
  },
  {
    id: "een-prompt",
    title: "Waarom één prompt zelden genoeg is",
    blocks: [
      {
        type: "text",
        body: "Een eerste prompt mist bijna altijd context die jij vanzelfsprekend vindt. Het eerste antwoord laat zien wat de AI heeft begrepen, en dus ook wat je nog moet toevoegen.",
      },
    ],
  },
  {
    id: "iteratieloop",
    title: "De iteratieloop: vragen, beoordelen, bijsturen",
    blocks: [
      {
        type: "text",
        body: "Een goed antwoord ontstaat zelden in één keer. Behandel de AI als een collega: je stelt een vraag, beoordeelt wat er terugkomt en stuurt bij. Die drie stappen herhaal je tot de output bruikbaar is.",
      },
      {
        type: "steps",
        steps: [
          { label: "01 · Vragen", body: "Geef doel, context en randvoorwaarden." },
          { label: "02 · Beoordelen", body: "Controleer juistheid, toon en volledigheid." },
          { label: "03 · Bijsturen", body: "Benoem concreet wat er anders moet." },
        ],
      },
      {
        type: "code",
        label: "Voorbeeld van een vervolgprompt",
        code: "Goed begin. Drie aanpassingen:\n1. Schrijf het vanuit een nieuwe gebruiker.\n2. Houd het onder de 40 woorden.\n3. Voeg één acceptatiecriterium toe voor foutmeldingen.",
      },
      {
        type: "knowledge_check",
        question: "In welke stap van de loop controleer je de output op juistheid?",
        answers: ["beoordelen", "02", "stap 2", "2"],
        hint: "Het is de middelste van de drie stappen.",
        explanation:
          "In de stap Beoordelen kijk je kritisch naar wat de AI teruggeeft: klopt het, past de toon en mist er iets? Pas daarna weet je wat je in de stap Bijsturen moet vragen.",
      },
    ],
  },
  {
    id: "valkuilen",
    title: "Valkuilen: wanneer je opnieuw moet beginnen",
    blocks: [
      {
        type: "text",
        body: "Soms raakt een gesprek vervuild met verkeerde aannames. Herken je dat de AI blijft terugvallen op een eerder misverstand, begin dan een nieuw gesprek met een verbeterde eerste prompt.",
      },
    ],
  },
  {
    id: "quiz",
    title: "Korte quiz",
    blocks: [
      {
        type: "text",
        body: "Twee vragen om te checken of de stof is geland. Je krijgt direct feedback op elk antwoord.",
      },
      {
        type: "quiz",
        question: "De AI blijft terugvallen op een misverstand uit het begin van het gesprek. Wat doe je?",
        options: [
          {
            label: "Dezelfde vraag nog een keer stellen, met meer nadruk",
            feedback: "Nadruk helpt weinig: het misverstand staat nog steeds in de context van het gesprek.",
          },
          {
            label: "Een nieuw gesprek starten met een verbeterde eerste prompt",
            correct: true,
          },
          {
            label: "Het misverstand negeren en de output zelf aanpassen",
            feedback: "Dat kan een keer, maar je loopt dan in elk volgend antwoord tegen dezelfde fout aan.",
          },
          {
            label: "De AI vragen om het eerdere deel van het gesprek te vergeten",
            feedback: "Binnen hetzelfde gesprek telt alles mee als context. Het model kan niet echt ‘vergeten’.",
          },
        ],
        explanation:
          "Alles wat eerder in een gesprek staat, telt mee als context. Een hardnekkig misverstand krijg je daar zelden uit. Begin opnieuw en verwerk wat je hebt geleerd in je eerste prompt, zodat de AI meteen met de juiste aannames start.",
      },
      {
        type: "quiz",
        question: "Welke vervolgprompt stuurt het meest concreet bij?",
        options: [
          {
            label: "“Kan het beter?”",
            feedback: "Te vaag: de AI moet raden wát er beter moet.",
          },
          {
            label: "“Dit is niet goed, probeer het opnieuw.”",
            feedback: "Je zegt dát het niet goed is, maar niet wat er anders moet.",
          },
          {
            label: "“Maak het korter, maximaal 40 woorden, en schrijf vanuit een nieuwe gebruiker.”",
            correct: true,
          },
        ],
        explanation:
          "Goed bijsturen is benoemen wat er anders moet, het liefst meetbaar. Een woordlimiet en een duidelijk perspectief geven de AI twee concrete criteria om op te sturen.",
      },
    ],
  },
];

export const ai101: LearningPath = withIds({
  slug: "ai-101",
  title: "AI 101",
  shortDescription: "De gezamenlijke basis voor designers en developers.",
  description:
    "De gezamenlijke basis voor iedereen in het team. Je leert hoe AI werkt, hoe je er effectief mee samenwerkt en hoe je het verantwoord inzet. Daarna kies je je eigen specialisatie.",
  level: "Beginner",
  hours: 14,
  learningGoals: [
    "Uitleggen hoe generatieve AI en LLM's werken",
    "Prompts schrijven die betrouwbare output geven",
    "AI inzetten in je dagelijkse workflow",
    "Risico's rond privacy, bias en de EU AI Act herkennen",
  ],
  certificateText:
    "de basisvaardigheden beheerst om AI effectief en verantwoord in te zetten in het werk.",
  topics: [
    topic("fundamenten", "Fundamenten van AI", "cpu", [
      chapter("1.1", "Wat is AI eigenlijk?"),
      chapter("1.2", "Machine learning in het kort"),
      chapter("1.3", "Data, training en modellen"),
      chapter("1.4", "Wat AI wel en niet kan"),
      chapter("1.5", "AI in jouw vakgebied"),
    ]),
    topic("generatieve-ai", "Generatieve AI en LLM’s begrijpen", "sparkles", [
      chapter("2.1", "Hoe een taalmodel tekst voorspelt"),
      chapter("2.2", "Tokens, context en geheugen"),
      chapter("2.3", "Hallucinaties en betrouwbaarheid"),
      chapter("2.4", "Multimodale modellen"),
      chapter("2.5", "Het landschap van AI-tools"),
    ]),
    topic("prompting", "Prompting en effectief samenwerken met AI", "terminal", [
      chapter("3.1", "De basis van een goede prompt"),
      chapter("3.2", "Voorbeelden, rollen en stapsgewijze instructies", "Voorbeelden en rollen"),
      chapter(
        "3.3",
        "Itereren: een gesprek voeren in plaats van één vraag stellen",
        "Itereren: een gesprek voeren",
        iterationTasks,
      ),
      chapter("3.4", "Gestructureerde output vragen", "Gestructureerde output"),
      chapter("3.5", "AI-output kritisch beoordelen"),
    ]),
    topic("werkpraktijk", "AI in de dagelijkse werkpraktijk", "briefcase", [
      chapter("4.1", "Je eigen workflow in kaart brengen"),
      chapter("4.2", "Schrijven en samenvatten met AI"),
      chapter("4.3", "AI in overleg en samenwerking"),
      chapter("4.4", "Repetitief werk automatiseren"),
      chapter("4.5", "Afspraken maken in je team"),
    ]),
    topic("ethiek", "Ethiek, veiligheid en verantwoord gebruik", "scale", [
      chapter("5.1", "Privacy en vertrouwelijke data"),
      chapter("5.2", "Bias en eerlijkheid"),
      chapter("5.3", "Auteursrecht en eigenaarschap"),
      chapter("5.4", "De EU AI Act"),
      chapter("5.5", "Transparant zijn over AI-gebruik"),
      chapter("5.6", "Eindtoets AI 101"),
    ]),
  ],
});

function specialisationTopics(items: [string, TopicIcon][], offset = 1): Topic[] {
  return items.map(([title, icon], i) => {
    const n = i + offset;
    return topic(
      `t${n}`,
      title,
      icon,
      [1, 2, 3, 4, 5].map((c) => ({
        ...chapter(`${n}.${c}`, `${title} – deel ${c}`),
        level: "Gemiddeld" as const,
      })),
    );
  });
}

export const uiux: LearningPath = withIds({
  slug: "ui-ux-design",
  title: "UI/UX Design",
  audience: "Voor designers",
  shortDescription: "AI in onderzoek, ontwerp en het ontwerpen vóór AI-producten.",
  description:
    "Zet AI in bij onderzoek, ideation en prototyping, en leer ontwerpen voor producten waar AI in zit.",
  level: "Gemiddeld",
  hours: 18,
  prerequisite: "ai-101",
  learningGoals: [
    "AI inzetten in gebruikersonderzoek en ideation",
    "Sneller prototypen met AI-tools",
    "Ontwerpen voor conversational en agentic interfaces",
  ],
  certificateText: "AI effectief inzet in het ontwerpproces en ontwerpt voor AI-producten.",
  topics: specialisationTopics([
    ["AI-ondersteund gebruikersonderzoek", "users"],
    ["Ideation en conceptontwikkeling", "lightbulb"],
    ["Generatieve AI voor visueel ontwerp", "image"],
    ["AI in designtools en prototyping", "pen-tool"],
    ["Ontwerpen voor AI-producten", "sparkles"],
    ["Conversational en agentic interfaces", "message-square"],
    ["Toegankelijkheid, inclusie en ethiek", "accessibility"],
  ]),
});

export const softwareDevelopment: LearningPath = withIds({
  slug: "software-development",
  title: "Software Development",
  audience: "Voor developers",
  shortDescription: "AI-assisted coding, LLM-integratie, RAG en agents.",
  description:
    "Werk effectief met coding assistants en bouw zelf toepassingen met LLM’s, RAG en agents.",
  level: "Gemiddeld",
  hours: 18,
  prerequisite: "ai-101",
  learningGoals: [
    "Effectief werken met coding assistants",
    "LLM's integreren via API's",
    "RAG-toepassingen en agents bouwen",
  ],
  certificateText: "AI-toepassingen veilig en verantwoord bouwt en evalueert.",
  topics: specialisationTopics([
    ["AI-assisted coding", "code"],
    ["Testen, debuggen en codekwaliteit", "bug"],
    ["LLM’s integreren via API’s", "plug"],
    ["Retrieval-Augmented Generation", "database"],
    ["AI-agents en orkestratie", "network"],
    ["Evaluatie en LLMOps", "line-chart"],
    ["Security en verantwoorde AI-engineering", "shield"],
  ]),
});

export const learningPaths: LearningPath[] = [ai101, uiux, softwareDevelopment];
