import type {
  Invite,
  LevelTestQuestion,
  OnboardingOptions,
  OnboardingProfile,
  SsoDomain,
} from "@/lib/data/auth";

// Tijdelijke data voor inloggen, uitnodigingen en onboarding. Wordt vervangen door Auth.js + MongoDB.

const studioNoord = {
  name: "Studio Noord",
  initials: "SN",
  memberCount: 24,
  ssoProvider: "microsoft" as const,
};

const lisa = { name: "Lisa de Jong", initials: "LJ", title: "Design lead" };

export const mockInvites: Invite[] = [
  {
    token: "demo",
    status: "open",
    email: "sanne.visser@studionoord.nl",
    organisation: studioNoord,
    inviter: lisa,
    role: "Cursist",
    team: "Design",
    paths: ["AI 101"],
    deadline: "2026-12-01",
    expiresAt: "2026-10-28",
  },
  {
    token: "verlopen",
    status: "expired",
    email: "sanne.visser@studionoord.nl",
    organisation: studioNoord,
    inviter: lisa,
    role: "Cursist",
    team: "Design",
    paths: ["AI 101"],
    expiresAt: "2026-09-30",
  },
  {
    token: "gebruikt",
    status: "accepted",
    email: "sanne.visser@studionoord.nl",
    organisation: studioNoord,
    inviter: lisa,
    role: "Cursist",
    team: "Design",
    paths: ["AI 101"],
    expiresAt: "2026-10-28",
  },
];

export const mockSsoDomains: SsoDomain[] = [
  { domain: "studionoord.nl", organisation: "Studio Noord", provider: "microsoft" },
];

export const mockOnboardingProfile: OnboardingProfile = {
  firstName: "Sanne",
  lastName: "Visser",
  email: "sanne.visser@studionoord.nl",
  organisation: "Studio Noord",
  team: "Design",
  assignedPath: { slug: "ai-101", title: "AI 101", deadline: "2026-12-01" },
};

export const mockOnboardingOptions: OnboardingOptions = {
  roles: [
    {
      value: "designer",
      title: "Designer",
      eyebrow: "UI, UX, visueel",
      description: "Je ontwerpt interfaces, flows of visuals en wilt AI inzetten in onderzoek, ideeën en prototypes.",
      recommendedPath: "UI/UX Design",
    },
    {
      value: "developer",
      title: "Developer",
      eyebrow: "Front-end, back-end",
      description: "Je schrijft code en wilt AI gebruiken om sneller te bouwen, te debuggen en te reviewen.",
      recommendedPath: "Software Development",
    },
    {
      value: "anders",
      title: "Iets anders",
      eyebrow: "Product, strategie, content",
      description: "Je werkt met designers en developers samen, bijvoorbeeld als product owner, strateeg of copywriter.",
    },
  ],
  levels: [
    {
      value: "nieuw",
      title: "Nog nieuw",
      description: "Ik heb AI-tools nog niet of nauwelijks gebruikt.",
    },
    {
      value: "af-en-toe",
      title: "Af en toe",
      description: "Ik stel weleens een vraag aan ChatGPT of Claude, maar niet in mijn werk.",
    },
    {
      value: "regelmatig",
      title: "Regelmatig",
      description: "Ik gebruik AI elke week in mijn werk, maar haal er nog niet alles uit.",
    },
    {
      value: "gevorderd",
      title: "Gevorderd",
      description: "AI zit in mijn dagelijkse workflow en ik schrijf zelf uitgebreide prompts.",
    },
  ],
  goals: [
    { value: "sneller", label: "Sneller werken" },
    { value: "prompts", label: "Betere prompts schrijven" },
    { value: "verantwoord", label: "AI verantwoord inzetten" },
    { value: "prototypes", label: "Prototypes bouwen" },
    { value: "code", label: "Code schrijven en reviewen" },
    { value: "onderzoek", label: "Onderzoek en analyse" },
    { value: "teksten", label: "Teksten en content" },
    { value: "team", label: "Afspraken maken in mijn team" },
    { value: "bijblijven", label: "Bijblijven met nieuwe tools" },
  ],
  weekGoals: [60, 120, 180],
  reminders: [
    { value: "dagelijks", label: "Elke werkdag", description: "Een korte herinnering als je die dag nog niet hebt geleerd." },
    { value: "wekelijks", label: "Twee keer per week", description: "Op maandag en donderdag, als je achterloopt op je weekdoel." },
    { value: "geen", label: "Geen herinneringen", description: "Je kunt dit later altijd aanzetten bij je instellingen." },
  ],
};

// Eén vraag per onderwerp van AI 101; een goed antwoord betekent dat je dat onderwerp kunt overslaan.
export const mockLevelTest: LevelTestQuestion[] = [
  {
    id: "q1",
    topicId: "fundamenten",
    question: "Wat is het verschil tussen AI en machine learning?",
    options: [
      "Machine learning is een manier om AI te bouwen: het systeem leert patronen uit data.",
      "Het zijn twee woorden voor precies hetzelfde.",
      "AI werkt alleen met tekst, machine learning alleen met beelden.",
    ],
    answer: 0,
  },
  {
    id: "q2",
    topicId: "generatieve-ai",
    question: "Waarom kan een taalmodel een bron verzinnen die niet bestaat?",
    options: [
      "Omdat het model bewust liegt als het het antwoord niet weet.",
      "Omdat het model het meest waarschijnlijke vervolg voorspelt, niet controleert wat waar is.",
      "Omdat de internetverbinding wegviel tijdens het antwoorden.",
    ],
    answer: 1,
  },
  {
    id: "q3",
    topicId: "prompting",
    question: "Welke prompt geeft waarschijnlijk het bruikbaarste resultaat?",
    options: [
      "Schrijf een tekst over onze app.",
      "Schrijf iets leuks.",
      "Schrijf drie korte onboarding-teksten voor een budgetapp, voor studenten, in een vriendelijke toon van maximaal 20 woorden.",
    ],
    answer: 2,
  },
  {
    id: "q4",
    topicId: "werkpraktijk",
    question: "Je wilt AI inzetten voor een terugkerende taak in je team. Wat doe je eerst?",
    options: [
      "Direct de duurste tool aanschaffen.",
      "De huidige stappen in kaart brengen en kijken waar AI echt tijd bespaart.",
      "Iedereen zelf laten uitzoeken hoe het werkt.",
    ],
    answer: 1,
  },
  {
    id: "q5",
    topicId: "ethiek",
    question: "Mag je klantgegevens in een gratis AI-chattool plakken om een samenvatting te maken?",
    options: [
      "Ja, zolang je de samenvatting daarna controleert.",
      "Nee, niet zonder afspraken over hoe de tool met die data omgaat.",
      "Ja, als je de tool in een incognitovenster opent.",
    ],
    answer: 1,
  },
];
