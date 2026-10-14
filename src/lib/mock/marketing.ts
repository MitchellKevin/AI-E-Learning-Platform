import type {
  ComparisonGroup,
  DemoOptions,
  Faq,
  Plan,
  ProofStat,
  TeamPreviewMember,
  Testimonial,
} from "@/lib/data/marketing";

// Tijdelijke marketingdata. Prijzen gaan later naar Stripe, teksten naar Storyblok.

export const mockPlans: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    tagline: "Voor kleine teams die een stevige basis willen leggen.",
    monthlyPrice: 19,
    minSeats: 3,
    maxSeats: 25,
    cta: { label: "Probeer Starter", href: "/demo?plan=starter" },
    featuresIntro: "Inbegrepen:",
    features: [
      "AI 101 en beide specialisaties",
      "Eindtoets en certificaat met verificatielink",
      "50 AI-oefeningen per persoon per maand",
      "Voortgang per team",
      "Support via e-mail",
    ],
  },
  {
    id: "team",
    name: "Team",
    tagline: "Voor organisaties die AI structureel in het werk willen brengen.",
    monthlyPrice: 29,
    minSeats: 10,
    maxSeats: 250,
    highlighted: true,
    cta: { label: "Plan een demo", href: "/demo?plan=team" },
    featuresIntro: "Alles uit Starter, plus:",
    features: [
      "Onbeperkt oefenen met echte AI",
      "AI-tutor in elk hoofdstuk",
      "Leerpaden toewijzen met deadlines",
      "Rapportages en export voor L&D",
      "Single sign-on met Google of Microsoft",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    tagline: "Voor grote organisaties met eigen beleid en een eigen leerplatform.",
    monthlyPrice: null,
    minSeats: 100,
    maxSeats: null,
    cta: { label: "Neem contact op", href: "/demo?plan=enterprise" },
    featuresIntro: "Alles uit Team, plus:",
    features: [
      "Eigen content, zoals jullie AI-beleid",
      "SAML-SSO en automatisch gebruikersbeheer (SCIM)",
      "SCORM- en xAPI-export voor je LMS",
      "Verwerkersovereenkomst op maat",
      "Vaste customer success manager",
    ],
  },
];

export const mockComparison: ComparisonGroup[] = [
  {
    title: "Leren",
    rows: [
      { label: "AI 101 voor het hele team", values: { starter: true, team: true, enterprise: true } },
      { label: "Specialisaties UI/UX Design en Software Development", values: { starter: true, team: true, enterprise: true } },
      { label: "Eindtoets en certificaat met verificatie", values: { starter: true, team: true, enterprise: true } },
      {
        label: "Oefenomgeving met echte AI",
        values: { starter: "50 per maand", team: "Onbeperkt", enterprise: "Onbeperkt" },
      },
      { label: "AI-tutor per hoofdstuk", values: { starter: false, team: true, enterprise: true } },
      { label: "Eigen content en eigen AI-beleid", values: { starter: false, team: false, enterprise: true } },
    ],
  },
  {
    title: "Teams en beheer",
    rows: [
      { label: "Voortgang per team", values: { starter: "Basis", team: "Uitgebreid", enterprise: "Uitgebreid" } },
      { label: "Leerpaden toewijzen met deadlines", values: { starter: false, team: true, enterprise: true } },
      { label: "Rapportages en CSV-export", values: { starter: false, team: true, enterprise: true } },
      { label: "Teams en afdelingen", values: { starter: "1 team", team: "Onbeperkt", enterprise: "Onbeperkt" } },
      { label: "Leaderboard en badges", values: { starter: true, team: true, enterprise: true } },
    ],
  },
  {
    title: "Beveiliging en koppelingen",
    rows: [
      { label: "Hosting in de EU, AVG-proof", values: { starter: true, team: true, enterprise: true } },
      { label: "Verwerkersovereenkomst", values: { starter: "Standaard", team: "Standaard", enterprise: "Op maat" } },
      { label: "Single sign-on met Google of Microsoft", values: { starter: false, team: true, enterprise: true } },
      { label: "SAML-SSO en SCIM", values: { starter: false, team: false, enterprise: true } },
      { label: "Meldingen in Slack of Teams", values: { starter: false, team: true, enterprise: true } },
      { label: "SCORM- en xAPI-export", values: { starter: false, team: false, enterprise: true } },
    ],
  },
  {
    title: "Support",
    rows: [
      { label: "Support via e-mail", values: { starter: true, team: true, enterprise: true } },
      { label: "Onboardingsessie met je team", values: { starter: false, team: "1 sessie", enterprise: "Onbeperkt" } },
      { label: "Vaste customer success manager", values: { starter: false, team: false, enterprise: true } },
      { label: "Uptime-garantie (SLA)", values: { starter: false, team: false, enterprise: "99,9%" } },
    ],
  },
];

export const mockBillingFaqs: Faq[] = [
  {
    question: "Zijn de prijzen inclusief btw?",
    answer:
      "Nee. Alle prijzen zijn per gebruiker per maand en exclusief 21% btw. Zit je organisatie in een ander EU-land en heb je een geldig btw-nummer, dan verleggen we de btw.",
  },
  {
    question: "Hoe kan ik betalen?",
    answer:
      "Met iDEAL, creditcard of SEPA-incasso. Bij een jaarabonnement kun je ook op factuur betalen, met een betaaltermijn van 30 dagen.",
  },
  {
    question: "Hoe zien de facturen eruit?",
    answer:
      "Je krijgt per maand of per jaar één factuur voor het aantal actieve gebruikers. Alle facturen staan als pdf in je beheeromgeving. Een inkoopordernummer of kostenplaats zetten we er op verzoek bij.",
  },
  {
    question: "Kan ik tussentijds gebruikers toevoegen of verwijderen?",
    answer:
      "Ja. Nieuwe gebruikers rekenen we naar rato af vanaf de dag dat ze erbij komen. Haal je iemand weg, dan zie je dat terug op de volgende factuur.",
  },
  {
    question: "Hoe zeg ik op?",
    answer:
      "Een maandabonnement zeg je op tot de laatste dag van de maand, zonder opzegtermijn. Een jaarabonnement loopt tot het einde van het contractjaar. Twee maanden voor de verlenging sturen we je een herinnering.",
  },
  {
    question: "Kunnen we eerst proberen?",
    answer:
      "Ja. Na de demo krijg je 14 dagen gratis toegang voor maximaal vijf collega's. Je hebt geen creditcard nodig en het proefaccount stopt vanzelf.",
  },
];

export const mockLandingFaqs: Faq[] = [
  {
    question: "Voor wie is AI Academy bedoeld?",
    answer:
      "Voor design- en developmentteams, en de mensen die met hen samenwerken, zoals productmanagers. Iedereen begint met AI 101. Daarna kiezen designers en developers hun eigen specialisatie.",
  },
  {
    question: "Hoeveel tijd kost het?",
    answer:
      "Een hoofdstuk duurt 20 tot 30 minuten. De meeste teams besteden een tot twee uur per week aan AI Academy en ronden AI 101 binnen twee maanden af.",
  },
  {
    question: "Welke AI gebruiken jullie in de oefenomgeving?",
    answer:
      "De oefenomgeving en de AI-tutor werken met Claude van Anthropic. Wat je collega's invoeren, gebruiken we niet om modellen te trainen.",
  },
  {
    question: "Is AI Academy AVG-proof?",
    answer:
      "Ja. We hosten alle data in de EU, verwerken alleen wat nodig is om te leren en sluiten met elke klant een verwerkersovereenkomst.",
  },
  {
    question: "Kunnen we ons eigen AI-beleid toevoegen?",
    answer:
      "Met Enterprise kun je eigen hoofdstukken toevoegen, bijvoorbeeld over jullie AI-beleid of goedgekeurde tools. Die staan dan gewoon tussen de vaste lessen.",
  },
];

export const mockTestimonials: Testimonial[] = [
  {
    quote:
      "Binnen zes weken had ons hele designteam AI 101 afgerond. Dat zie je terug in hoe we onderzoek doen: sneller, maar ook kritischer op wat AI teruggeeft.",
    name: "Lotte de Graaf",
    initials: "LG",
    role: "Head of Design",
    company: "Noordlicht",
  },
  {
    quote:
      "Eindelijk een training die developers niet als beginners behandelt. Direct feedback op je eigen prompts werkt beter dan elke workshop die we eerder deden.",
    name: "Daan Mulder",
    initials: "DM",
    role: "Engineering Manager",
    company: "Polder Digital",
  },
  {
    quote:
      "Voor ons was de AVG doorslaggevend. Hosting in de EU, een nette verwerkersovereenkomst en certificaten die we aan klanten kunnen laten zien.",
    name: "Yasmin El Amrani",
    initials: "YE",
    role: "L&D-adviseur",
    company: "Kade & Co",
  },
];

// Cijfers bij de ervaringen; komen later uit de rapportages in MongoDB.
export const mockProofStats: ProofStat[] = [
  { value: "87%", label: "rondt AI 101 binnen twee maanden af" },
  { value: "4,8/5", label: "gemiddelde waardering per hoofdstuk" },
  { value: "1,5 uur", label: "per week, naast het gewone werk" },
];

// Fictieve klantnamen als tekstlogo's.
export const mockCustomers = ["Noordlicht", "Brightlane", "Studio Veld", "Kade & Co", "Polder Digital", "Lumenwerk"];

export const mockTeamPreview: TeamPreviewMember[] = [
  { name: "Joris Bakker", initials: "JB", path: "UI/UX Design", percent: 100, status: "Afgerond" },
  { name: "Fatima Ouali", initials: "FO", path: "AI 101", percent: 82, status: "Op schema" },
  { name: "Mila Jansen", initials: "MJ", path: "AI 101", percent: 64, status: "Op schema" },
  { name: "Sanne Visser", initials: "SV", path: "AI 101", percent: 46, status: "Op schema" },
  { name: "Thomas de Wit", initials: "TW", path: "AI 101", percent: 18, status: "Achter" },
];

export const mockDemoOptions: DemoOptions = {
  teamSizes: [
    { value: "1-10", label: "1 tot 10 mensen" },
    { value: "11-50", label: "11 tot 50 mensen" },
    { value: "51-200", label: "51 tot 200 mensen" },
    { value: "201-1000", label: "201 tot 1.000 mensen" },
    { value: "1000+", label: "Meer dan 1.000 mensen" },
  ],
  roles: [
    { value: "design-lead", label: "Design lead of designmanager" },
    { value: "engineering-lead", label: "Engineering manager of CTO" },
    { value: "learning", label: "L&D of HR" },
    { value: "management", label: "Directie of management" },
    { value: "maker", label: "Designer of developer" },
    { value: "anders", label: "Iets anders" },
  ],
};
