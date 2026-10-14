import type { Exam, ExamAttempt, ExamOption, ExamQuestion } from "@/lib/data/exam";

// Tijdelijke vragenbank en pogingen. Wordt vervangen door Storyblok en MongoDB (zie src/lib/data/exam.ts).

// Opties krijgen vaste id's a, b, c… zodat juiste antwoorden leesbaar blijven.
const options = (...labels: string[]): ExamOption[] =>
  labels.map((label, i) => ({ id: String.fromCharCode(97 + i), label }));

const ai101Questions: ExamQuestion[] = [
  // Fundamenten van AI
  {
    id: "f-ml-vs-regels",
    type: "single",
    topicId: "fundamenten",
    chapterSlug: "1-2",
    prompt: "Wat is het belangrijkste verschil tussen traditionele software en machine learning?",
    options: options(
      "Bij machine learning schrijf je alle regels vooraf zelf uit",
      "Een ML-model leert patronen uit voorbeelddata in plaats van uit vooraf geprogrammeerde regels",
      "Machine learning werkt alleen met afbeeldingen en geluid",
      "Traditionele software kan niet met data omgaan",
    ),
    correct: "b",
    explanation:
      "Bij traditionele software bedenkt een developer de regels. Een machine-learningmodel leidt die regels zelf af uit voorbeelden. Daardoor is de kwaliteit van de data net zo belangrijk als het model.",
  },
  {
    id: "f-kan-wel-niet",
    type: "multiple",
    topicId: "fundamenten",
    chapterSlug: "1-4",
    prompt: "Welke taken kan een huidig taalmodel doorgaans goed uitvoeren?",
    options: options(
      "Een lange tekst samenvatten",
      "Een eerste opzet voor een e-mail schrijven",
      "Met zekerheid zeggen wat er vandaag in het nieuws is",
      "Een stuk code in gewone taal uitleggen",
      "Gegarandeerd foutloos rekenen met grote getallen",
    ),
    correct: ["a", "b", "d"],
    explanation:
      "Taalmodellen zijn sterk in taal: samenvatten, herschrijven, uitleggen en een eerste versie maken. Actuele feiten kennen ze alleen als je ze meegeeft of als de tool kan zoeken, en bij rekenwerk maken ze nog geregeld fouten.",
  },
  {
    id: "f-kennisgrens",
    type: "single",
    topicId: "fundamenten",
    chapterSlug: "1-3",
    prompt: "Een model is getraind op data tot en met maart 2025. Wat betekent dat in de praktijk?",
    options: options(
      "Het model werkt na maart 2025 niet meer",
      "Het kent gebeurtenissen na die datum niet, tenzij je ze zelf meegeeft of het model kan zoeken",
      "Het model leert automatisch bij van elk gesprek dat je voert",
      "Alle antwoorden over de periode daarvoor zijn gegarandeerd juist",
    ),
    correct: "b",
    explanation:
      "Een model leert niet vanzelf bij na de training. Alles na de kennisgrens moet je zelf als context meegeven, of je gebruikt een tool die op internet of in je eigen bronnen kan zoeken.",
  },

  // Generatieve AI en LLM's
  {
    id: "g-volgend-token",
    type: "single",
    topicId: "generatieve-ai",
    chapterSlug: "2-1",
    prompt: "Hoe genereert een groot taalmodel (LLM) tekst?",
    options: options(
      "Het zoekt het antwoord op in een database met vaste antwoorden",
      "Het voorspelt steeds het meest waarschijnlijke volgende token op basis van de tekst ervoor",
      "Het redeneert vanuit eigen ervaringen, net als een mens",
      "Het kopieert letterlijk passages uit zijn trainingsdata",
    ),
    correct: "b",
    explanation:
      "Een LLM bouwt tekst token voor token op. Elke stap is een kansberekening op basis van alles wat ervoor staat. Daarom klinkt het vloeiend, maar is het niet automatisch waar.",
  },
  {
    id: "g-contextvenster",
    type: "single",
    topicId: "generatieve-ai",
    chapterSlug: "2-2",
    prompt:
      "Je plakt een document van 300 pagina's in een chat en de AI lijkt details uit het begin te vergeten. Wat is de meest waarschijnlijke oorzaak?",
    options: options(
      "Het document past niet (volledig) in het contextvenster van het model",
      "Het model wordt minder scherp na een lang gesprek, net als een mens",
      "AI kan alleen de eerste pagina van een document lezen",
      "Het model heeft het document opgeslagen en haalt versies door elkaar",
    ),
    correct: "a",
    explanation:
      "Een model kan maar een beperkt aantal tokens tegelijk verwerken: het contextvenster. Wat daarbuiten valt, ziet het niet. Deel lange documenten op of vraag gericht naar specifieke hoofdstukken.",
  },
  {
    id: "g-hallucinatie",
    type: "open",
    topicId: "generatieve-ai",
    chapterSlug: "2-3",
    prompt: "Wat is een hallucinatie bij een taalmodel, en hoe verklein je de kans dat je erin trapt?",
    criteria: [
      {
        label: "Legt uit dat het model overtuigend klinkende maar onjuiste informatie verzint",
        keywords: ["verzin", "onjuist", "niet juist", "fout", "niet waar", "onwaar", "bestaat niet", "klopt niet", "overtuigend", "zelfverzekerd", "zeker"],
      },
      {
        label: "Noemt dat je de output controleert of verifieert",
        keywords: ["controle", "controleer", "check", "verifi", "nalopen", "natrekken", "nakijken", "toets", "dubbel"],
      },
      {
        label: "Noemt bronnen of context meegeven om het model te sturen",
        keywords: ["bron", "context", "document", "meegeven", "meegeeft", "referentie", "citeer", "citaat", "feiten"],
      },
    ],
    modelAnswer:
      "Een hallucinatie is een antwoord dat overtuigend klinkt, maar feitelijk onjuist of verzonnen is, zoals een niet-bestaande bron. Je verkleint het risico door het model betrouwbare context of bronnen mee te geven, te vragen om bronvermelding en de belangrijkste feiten altijd zelf te controleren.",
    minWords: 15,
    explanation:
      "Een taalmodel kiest woorden die waarschijnlijk klinken, niet woorden die waar zijn. Geef daarom context mee en controleer feiten, namen en cijfers altijd voordat je ze gebruikt.",
  },
  {
    id: "g-multimodaal",
    type: "multiple",
    topicId: "generatieve-ai",
    chapterSlug: "2-4",
    prompt: "Wat is waar over multimodale modellen?",
    options: options(
      "Ze kunnen naast tekst ook afbeeldingen als invoer verwerken",
      "Je kunt ze bijvoorbeeld een screenshot van een interface laten beoordelen",
      "Ze zijn per definitie betrouwbaarder dan modellen die alleen tekst verwerken",
      "Ze werken alleen zonder internetverbinding",
    ),
    correct: ["a", "b"],
    explanation:
      "Multimodaal betekent dat een model meerdere soorten invoer begrijpt, zoals tekst, beeld of geluid. Dat maakt ze handig voor bijvoorbeeld design-feedback, maar ze kunnen net zo goed fouten maken.",
  },

  // Prompting
  {
    id: "p-ontbrekende-context",
    type: "single",
    topicId: "prompting",
    chapterSlug: "3-1",
    prompt: "Wat ontbreekt er vooral aan deze prompt?",
    context: { label: "Prompt", body: "Schrijf een tekst over onze nieuwe app." },
    options: options(
      "Een beleefde aanhef zoals 'alsjeblieft'",
      "Doel, doelgroep, toon en gewenste lengte",
      "De naam van het AI-model dat je gebruikt",
      "Niets, korte prompts geven het model juist de meeste vrijheid",
    ),
    correct: "b",
    explanation:
      "Zonder doel, doelgroep, toon en lengte moet het model gokken. Een goede prompt geeft de context mee die jij vanzelfsprekend vindt, zodat de eerste versie al dicht bij je bedoeling ligt.",
  },
  {
    id: "p-iteratieloop",
    type: "single",
    topicId: "prompting",
    chapterSlug: "3-3",
    prompt: "In welke stap van de iteratieloop controleer je de output op juistheid, toon en volledigheid?",
    options: options("Vragen", "Beoordelen", "Bijsturen", "Afronden"),
    correct: "b",
    explanation:
      "De loop bestaat uit vragen, beoordelen en bijsturen. In de stap beoordelen kijk je kritisch naar wat er terugkomt, voordat je concreet benoemt wat er anders moet.",
  },
  {
    id: "p-vervolgprompt",
    type: "open",
    topicId: "prompting",
    chapterSlug: "3-3",
    prompt: "Schrijf een vervolgprompt waarmee je deze output bijstuurt.",
    context: {
      label: "Situatie",
      body: "Je vroeg om een productomschrijving van 50 woorden voor nieuwe gebruikers. De AI levert 180 woorden vol vakjargon, maar de opbouw is goed.",
    },
    criteria: [
      {
        label: "Vraagt om de juiste lengte",
        keywords: ["50", "woorden", "korter", "inkorten", "kort", "lengte", "maximaal", "max"],
      },
      {
        label: "Vraagt om taal die past bij nieuwe gebruikers",
        keywords: ["jargon", "eenvoudig", "begrijpelijk", "nieuwe gebruiker", "beginner", "simpel", "vakterm", "doelgroep", "leek", "gewone taal"],
      },
      {
        label: "Benoemt wat goed is en behouden moet blijven",
        keywords: ["goed", "behoud", "houd", "laat", "sterk", "prima", "opbouw", "structuur"],
      },
    ],
    modelAnswer:
      "Goede opbouw, die mag blijven. Twee aanpassingen: 1. Maak het maximaal 50 woorden. 2. Schrijf voor nieuwe gebruikers: vervang vakjargon door gewone taal.",
    minWords: 10,
    explanation:
      "Een sterke vervolgprompt benoemt concreet wat er anders moet en wat goed is. Zo hoeft het model niet opnieuw te beginnen en verlies je de onderdelen die al werkten.",
  },
  {
    id: "p-technieken",
    type: "multiple",
    topicId: "prompting",
    chapterSlug: "3-2",
    prompt: "Welke technieken helpen om betrouwbaardere, bruikbare output te krijgen?",
    options: options(
      "Een voorbeeld geven van de gewenste output",
      "Om een vast format vragen, zoals een tabel of JSON",
      "Het model een rol geven, bijvoorbeeld 'je bent een ervaren UX-writer'",
      "Zo kort mogelijk prompten, zodat het model vrij is",
      "Dezelfde vraag in hoofdletters herhalen",
    ),
    correct: ["a", "b", "c"],
    explanation:
      "Voorbeelden, een duidelijk format en een rol geven het model houvast. Kortere prompts of hoofdletters maken de output niet beter, ze laten alleen meer aan het toeval over.",
  },
  {
    id: "p-opnieuw-beginnen",
    type: "single",
    topicId: "prompting",
    chapterSlug: "3-3",
    prompt: "De AI blijft terugvallen op een misverstand van eerder in het gesprek. Wat doe je?",
    options: options(
      "Dezelfde correctie blijven herhalen tot het lukt",
      "Een nieuw gesprek starten met een verbeterde eerste prompt",
      "Overstappen op een andere taal, bijvoorbeeld Engels",
      "Accepteren dat de AI deze taak niet kan",
    ),
    correct: "b",
    explanation:
      "Een vervuild gesprek trekt het model steeds terug naar de verkeerde aanname. Begin opnieuw en verwerk wat je hebt geleerd in een betere eerste prompt.",
  },

  // AI in de werkpraktijk
  {
    id: "w-samenvatten",
    type: "single",
    topicId: "werkpraktijk",
    chapterSlug: "4-2",
    prompt: "Je laat AI een klantinterview van 40 minuten samenvatten. Wat is de beste werkwijze?",
    options: options(
      "De samenvatting direct doorsturen: samenvatten gaat AI altijd foutloos af",
      "De samenvatting laten maken en de kernpunten en citaten controleren tegen het transcript",
      "Alleen om een samenvatting van één zin vragen, dan kan er weinig misgaan",
      "Het interview overslaan en AI vragen wat klanten meestal zeggen",
    ),
    correct: "b",
    explanation:
      "AI bespaart veel tijd bij samenvatten, maar kan nuances missen of citaten verdraaien. Controleer daarom de kernpunten tegen de bron voordat je conclusies deelt.",
  },
  {
    id: "w-teamafspraken",
    type: "multiple",
    topicId: "werkpraktijk",
    chapterSlug: "4-5",
    prompt: "Welke afspraken zijn zinvol om in je team te maken over AI-gebruik?",
    options: options(
      "Welke tools zijn goedgekeurd en voor welke soorten data",
      "Hoe je AI-gebruik vermeldt in opgeleverd werk",
      "Wie output controleert voordat het naar een klant gaat",
      "Dat output van een betaalde tool niet gecontroleerd hoeft te worden",
    ),
    correct: ["a", "b", "c"],
    explanation:
      "Duidelijke afspraken over tools, data, transparantie en controle voorkomen verrassingen. Ook betaalde tools maken fouten, dus controle blijft altijd nodig.",
  },
  {
    id: "w-automatiseren",
    type: "single",
    topicId: "werkpraktijk",
    chapterSlug: "4-4",
    prompt: "Welke taak leent zich het best om (deels) met AI te automatiseren?",
    options: options(
      "Een definitief besluit nemen over een sollicitant",
      "Wekelijks meetingnotities omzetten naar actiepunten in een vast format",
      "Een contract met een klant goedkeuren",
      "Een functioneringsgesprek voeren",
    ),
    correct: "b",
    explanation:
      "Repetitief werk met een vast format en weinig risico is ideaal om te automatiseren. Besluiten over mensen of juridische zaken vragen om menselijk oordeel en verantwoordelijkheid.",
  },

  // Ethiek en verantwoord gebruik
  {
    id: "e-persoonsgegevens",
    type: "single",
    topicId: "ethiek",
    chapterSlug: "5-1",
    prompt:
      "Een collega wil een klantbestand met namen en e-mailadressen in een gratis publieke chatbot plakken om het te analyseren. Wat adviseer je?",
    options: options(
      "Prima, zolang het bestand niet groter is dan een paar honderd regels",
      "Niet doen: gebruik alleen goedgekeurde tools en anonimiseer persoonsgegevens eerst",
      "Alleen de e-mailadressen weghalen, namen zijn geen persoonsgegevens",
      "Het mag als je de chat daarna verwijdert",
    ),
    correct: "b",
    explanation:
      "Namen en e-mailadressen zijn persoonsgegevens onder de AVG. Gratis publieke tools kunnen invoer gebruiken voor training. Werk daarom met goedgekeurde tools en anonimiseer waar het kan.",
  },
  {
    id: "e-bias",
    type: "multiple",
    topicId: "ethiek",
    chapterSlug: "5-2",
    prompt: "Hoe kan bias in AI-output ontstaan of zichtbaar worden?",
    options: options(
      "Trainingsdata bevat stereotypen die het model overneemt",
      "Gegenereerde persona's hebben steeds hetzelfde geslacht of dezelfde achtergrond",
      "De formulering van je prompt geeft al een richting voor",
      "Bias komt alleen voor in oudere modellen",
      "Een model zonder internettoegang heeft geen bias",
    ),
    correct: ["a", "b", "c"],
    explanation:
      "Bias zit in de data waarop een model is getraind en kan ook door je eigen prompt worden versterkt. Ook nieuwe modellen hebben er last van, dus blijf kritisch kijken naar wie er wel en niet in de output voorkomt.",
  },
  {
    id: "e-ai-act",
    type: "single",
    topicId: "ethiek",
    chapterSlug: "5-4",
    prompt: "Hoe deelt de EU AI Act AI-systemen in?",
    options: options(
      "Op basis van de grootte van het bedrijf dat het systeem gebruikt",
      "Op basis van risico, van minimaal risico tot verboden toepassingen",
      "Op basis van het land waar het model is ontwikkeld",
      "Alleen open-sourcemodellen vallen onder de wet",
    ),
    correct: "b",
    explanation:
      "De AI Act werkt met risiconiveaus: hoe groter het risico voor mensen, hoe strenger de eisen. Sommige toepassingen, zoals social scoring door overheden, zijn helemaal verboden.",
  },
  {
    id: "e-transparantie",
    type: "open",
    topicId: "ethiek",
    chapterSlug: "5-5",
    prompt: "Je hebt een groot deel van een klantrapport met AI geschreven. Hoe ga je daar transparant mee om, en waarom?",
    criteria: [
      {
        label: "Vermeldt het AI-gebruik richting de klant",
        keywords: ["vermeld", "meld", "aangeven", "aangeeft", "transparant", "eerlijk", "laten weten", "benoem", "open", "vertel"],
      },
      {
        label: "Benoemt dat je zelf controleert en verantwoordelijk blijft",
        keywords: ["controle", "controleer", "verantwoordelijk", "gecheckt", "nagelopen", "eindverantwoord", "zelf", "nakijken", "review"],
      },
      {
        label: "Legt uit waarom: vertrouwen, afspraken of beleid",
        keywords: ["vertrouwen", "afspraak", "afspraken", "beleid", "verwachting", "integriteit", "betrouwbaar", "regels"],
      },
    ],
    modelAnswer:
      "Ik vermeld in het rapport of in de begeleidende mail dat ik AI heb gebruikt en waarvoor. Ik geef aan dat ik de inhoud zelf heb gecontroleerd en er verantwoordelijk voor blijf. Dat doe ik omdat de klant erop moet kunnen vertrouwen hoe het werk tot stand komt, en omdat het vaak in afspraken of beleid staat.",
    minWords: 15,
    explanation:
      "Transparantie over AI-gebruik bouwt vertrouwen op. Belangrijk is dat je duidelijk maakt dat jij de inhoud hebt gecontroleerd en er verantwoordelijk voor blijft.",
  },
];

const uiuxQuestions: ExamQuestion[] = [
  {
    id: "u-clusteren",
    type: "single",
    topicId: "t1",
    chapterSlug: "1-2",
    prompt: "Je laat AI twintig interviewtranscripten clusteren in thema's. Wat is daarna jouw rol?",
    options: options(
      "Geen: de thema's zijn objectief en kunnen direct de presentatie in",
      "De thema's toetsen aan de ruwe data en zelf de interpretatie maken",
      "Het aantal thema's terugbrengen tot drie, zodat het overzichtelijk blijft",
      "De transcripten verwijderen, want de samenvatting is genoeg",
    ),
    correct: "b",
    explanation:
      "AI is snel in het vinden van patronen, maar weet niet wat belangrijk is voor jouw onderzoeksvraag. Toets de thema's aan de bron en maak zelf de vertaalslag naar inzichten.",
  },
  {
    id: "u-synthetische-gebruikers",
    type: "single",
    topicId: "t1",
    chapterSlug: "1-4",
    prompt: "Wat is het grootste risico van synthetische gebruikers, oftewel AI-persona's die interviews beantwoorden?",
    options: options(
      "Ze zijn te duur om op grote schaal in te zetten",
      "Ze geven plausibele, gemiddelde antwoorden en missen echte, onverwachte inzichten",
      "Ze spreken alleen Engels",
      "Ze zijn wettelijk verboden onder de AVG",
    ),
    correct: "b",
    explanation:
      "Synthetische gebruikers geven antwoorden die waarschijnlijk klinken. De verrassende inzichten die onderzoek waardevol maken, haal je alleen bij echte mensen op.",
  },
  {
    id: "u-ideation",
    type: "multiple",
    topicId: "t2",
    chapterSlug: "2-1",
    prompt: "Hoe zet je AI zinvol in tijdens ideation?",
    options: options(
      "Veel varianten laten genereren om daarna zelf te selecteren",
      "Je eigen concept laten bekritiseren vanuit een ander perspectief",
      "Het eindconcept laten kiezen zonder teamdiscussie",
      "Analogieën uit andere sectoren laten zoeken",
    ),
    correct: ["a", "b", "d"],
    explanation:
      "AI is een sterke sparringpartner voor kwantiteit en nieuwe perspectieven. De keuze voor een concept blijft een teambeslissing, gebaseerd op je doelen en gebruikers.",
  },
  {
    id: "u-beeldgeneratie",
    type: "single",
    topicId: "t3",
    chapterSlug: "3-3",
    prompt: "Je gebruikt een beeldgenerator voor campagnebeeld. Waar let je vooral op?",
    options: options(
      "Alleen op de resolutie van het beeld",
      "Licentievoorwaarden, herkenbare personen of merken en aansluiting op de huisstijl",
      "Dat je altijd de nieuwste versie van de tool gebruikt",
      "Nergens op: gegenereerd beeld is altijd vrij te gebruiken",
    ),
    correct: "b",
    explanation:
      "Gegenereerd beeld is niet automatisch vrij van rechten. Controleer de voorwaarden van de tool, vermijd herkenbare personen en merken en bewaak de consistentie met de huisstijl.",
  },
  {
    id: "u-prototyping",
    type: "single",
    topicId: "t4",
    chapterSlug: "4-2",
    prompt: "Wat is een realistische plek voor AI in prototyping?",
    options: options(
      "Een productieklaar ontwerp opleveren zonder tussenkomst van een designer",
      "Snel een eerste klikbare variant maken om een idee te toetsen, die je daarna zelf verfijnt",
      "Het designsystem vervangen",
      "Gebruikerstests overbodig maken",
    ),
    correct: "b",
    explanation:
      "AI verkort de weg naar een eerste prototype. Verfijning, consistentie met je designsystem en toetsing met gebruikers blijven jouw werk.",
  },
  {
    id: "u-ontwerpen-voor-fouten",
    type: "open",
    topicId: "t5",
    chapterSlug: "5-1",
    prompt: "Je ontwerpt een feature die AI-suggesties toont aan gebruikers. Hoe ontwerp je voor het feit dat de AI soms fout zit?",
    criteria: [
      {
        label: "Maakt duidelijk dat de suggestie door AI is gemaakt",
        keywords: ["ai", "label", "gegenereerd", "transparant", "aangeven", "duidelijk", "markeer"],
      },
      {
        label: "Geeft de gebruiker controle om aan te passen of te negeren",
        keywords: ["aanpassen", "bewerken", "corrigeren", "ongedaan", "weigeren", "controle", "keuze", "negeren", "afwijzen"],
      },
      {
        label: "Bouwt vertrouwen op met uitleg of een feedbackmogelijkheid",
        keywords: ["feedback", "melden", "duim", "vertrouwen", "uitleg", "waarom", "bron", "zekerheid"],
      },
    ],
    modelAnswer:
      "Ik label de suggestie duidelijk als AI-gegenereerd, zodat gebruikers weten dat ze kritisch moeten kijken. Gebruikers kunnen de suggestie altijd aanpassen, negeren of ongedaan maken. Daarnaast toon ik waar mogelijk waarom iets wordt voorgesteld en kan de gebruiker feedback geven als het niet klopt.",
    minWords: 15,
    explanation:
      "Goed ontwerp voor AI gaat ervan uit dat het model soms fout zit: wees transparant, geef de gebruiker de regie en maak het makkelijk om fouten te herstellen en te melden.",
  },
  {
    id: "u-conversational",
    type: "multiple",
    topicId: "t6",
    chapterSlug: "6-2",
    prompt: "Wat zijn goede principes voor een conversational interface?",
    options: options(
      "Laat zien wat de assistent wel en niet kan",
      "Bied voorbeeldvragen aan om op gang te komen",
      "Verberg dat de gebruiker met AI praat, dat voelt natuurlijker",
      "Maak het makkelijk om bij een mens uit te komen",
    ),
    correct: ["a", "b", "d"],
    explanation:
      "Duidelijke verwachtingen, een goed startpunt en een uitweg naar een mens maken een chatinterface bruikbaar. Verbergen dat het AI is schaadt het vertrouwen en is onder de AI Act vaak niet toegestaan.",
  },
  {
    id: "u-agent-bevestigen",
    type: "single",
    topicId: "t6",
    chapterSlug: "6-4",
    prompt: "Een AI-agent plant namens de gebruiker een afspraak in. Welk ontwerpprincipe is hier het belangrijkst?",
    options: options(
      "De agent zo snel mogelijk laten handelen, zonder tussenstappen",
      "De gebruiker de actie laten bevestigen voordat de agent iets onomkeerbaars doet",
      "Zo min mogelijk informatie tonen om de gebruiker niet te overladen",
      "De agent altijd laten kiezen voor het eerste vrije tijdslot",
    ),
    correct: "b",
    explanation:
      "Bij agents die namens iemand handelen is bevestiging vóór onomkeerbare acties essentieel. Zo houdt de gebruiker de regie en voorkom je dure fouten.",
  },
  {
    id: "u-alt-teksten",
    type: "single",
    topicId: "t7",
    chapterSlug: "7-1",
    prompt: "Wat is een toegankelijkheidsrisico van AI-gegenereerde alt-teksten?",
    options: options(
      "Ze zijn altijd te kort",
      "Ze beschrijven wat er te zien is, maar missen vaak de functie of context van de afbeelding",
      "Screenreaders kunnen ze niet voorlezen",
      "Ze maken de pagina trager",
    ),
    correct: "b",
    explanation:
      "Een goede alt-tekst beschrijft wat de afbeelding betekent op die plek. AI ziet wat er afgebeeld is, maar kent het doel op de pagina niet. Controleer en herschrijf waar nodig.",
  },
  {
    id: "u-bias-ontwerp",
    type: "multiple",
    topicId: "t7",
    chapterSlug: "7-3",
    prompt: "Hoe ga je om met bias in een AI-feature die je ontwerpt?",
    options: options(
      "Testen met diverse gebruikersgroepen",
      "Gegenereerde voorbeelden en standaardwaarden controleren op stereotypen",
      "Ervan uitgaan dat de leverancier van het model dit al heeft opgelost",
      "Een manier bieden om ongepaste output te melden",
    ),
    correct: ["a", "b", "d"],
    explanation:
      "Bias los je niet in één keer op bij de leverancier. Test breed, kijk kritisch naar voorbeelden en standaarden, en geef gebruikers een manier om problemen te melden.",
  },
];

const softwareQuestions: ExamQuestion[] = [
  {
    id: "s-suggestie-reviewen",
    type: "single",
    topicId: "t1",
    chapterSlug: "1-2",
    prompt: "Een coding assistant stelt een functie van zestig regels voor. Wat doe je?",
    options: options(
      "Direct committen: de assistant is getraind op miljoenen repositories",
      "De code lezen en begrijpen, de tests draaien en aanpassen waar nodig voordat je commit",
      "Alleen accepteren als de code compileert",
      "De suggestie weggooien: AI-code is per definitie onveilig",
    ),
    correct: "b",
    explanation:
      "Jij blijft verantwoordelijk voor de code die je commit. Behandel een suggestie als een pull request van een collega: lezen, begrijpen, testen en dan pas mergen.",
  },
  {
    id: "s-testen",
    type: "multiple",
    topicId: "t2",
    chapterSlug: "2-1",
    prompt: "Waarvoor is AI nuttig bij testen en debuggen?",
    options: options(
      "Randgevallen bedenken die je zelf over het hoofd ziet",
      "Een eerste opzet van unittests genereren",
      "Vaststellen dat de code klopt zonder de tests te draaien",
      "Een foutmelding en stacktrace laten uitleggen",
    ),
    correct: ["a", "b", "d"],
    explanation:
      "AI helpt goed bij het bedenken en opzetten van tests en het uitleggen van fouten. Of de code werkt, bewijzen alleen tests die echt draaien.",
  },
  {
    id: "s-api-sleutel",
    type: "single",
    topicId: "t3",
    chapterSlug: "3-1",
    prompt: "Waarom zet je de API-sleutel van een LLM-provider niet in je frontend-code?",
    options: options(
      "Dan wordt de app trager",
      "Iedereen kan hem dan uitlezen en op jouw kosten gebruiken",
      "De provider blokkeert sleutels die in JavaScript staan",
      "Dat mag wel, zolang je hem in een .env-bestand zet",
    ),
    correct: "b",
    explanation:
      "Alles wat naar de browser gaat, is voor iedereen leesbaar, ook variabelen uit een .env-bestand die in de bundle belanden. Roep het model aan vanaf je server.",
  },
  {
    id: "s-structured-output",
    type: "single",
    topicId: "t3",
    chapterSlug: "3-3",
    prompt: "Je wilt dat het model altijd geldige JSON teruggeeft voor je app. Wat is de robuustste aanpak?",
    options: options(
      "In de prompt zetten: 'antwoord alleen in JSON'",
      "Een schema afdwingen met structured output en het antwoord valideren voordat je het gebruikt",
      "De temperatuur op 2 zetten",
      "Het antwoord met een reguliere expressie repareren",
    ),
    correct: "b",
    explanation:
      "Een instructie in de prompt helpt, maar is geen garantie. Met structured output en validatie aan jouw kant vang je afwijkingen af voordat ze je app breken.",
  },
  {
    id: "s-rag",
    type: "single",
    topicId: "t4",
    chapterSlug: "4-1",
    prompt: "Wat doet Retrieval-Augmented Generation (RAG)?",
    options: options(
      "Het traint het model opnieuw op je eigen documenten",
      "Het zoekt relevante stukken uit je eigen bronnen en geeft die als context mee aan het model",
      "Het maakt het model sneller door antwoorden te cachen",
      "Het vervangt het taalmodel door een zoekmachine",
    ),
    correct: "b",
    explanation:
      "Bij RAG blijft het model hetzelfde. Je haalt per vraag de relevante stukken uit je eigen bronnen op en geeft die mee, zodat het antwoord gebaseerd is op actuele, eigen informatie.",
  },
  {
    id: "s-rag-debuggen",
    type: "open",
    topicId: "t4",
    chapterSlug: "4-3",
    prompt: "Je RAG-chatbot geeft antwoorden die niet in de documentatie staan. Noem mogelijke oorzaken en hoe je dit aanpakt.",
    criteria: [
      {
        label: "Kijkt naar de retrieval: worden de juiste stukken opgehaald?",
        keywords: ["retrieval", "zoek", "chunk", "embedding", "relevant", "ophalen", "opgehaald", "index"],
      },
      {
        label: "Stuurt het model om alleen de bronnen te gebruiken",
        keywords: ["instructie", "prompt", "alleen", "bron", "citeer", "weet het niet", "grounding", "systeemprompt"],
      },
      {
        label: "Meet het effect met evaluatie of logging",
        keywords: ["evalu", "test", "meten", "meet", "testset", "logging", "log", "monitor"],
      },
    ],
    modelAnswer:
      "Mogelijk haalt de retrieval niet de juiste stukken op, bijvoorbeeld door te grote chunks of slechte embeddings. Ook kan de systeemprompt het model niet genoeg dwingen om alleen de bronnen te gebruiken en 'weet ik niet' te zeggen. Ik controleer de opgehaalde chunks in de logs, scherp de instructies aan en meet het effect met een vaste evaluatieset.",
    minWords: 15,
    explanation:
      "Onjuiste antwoorden in RAG komen meestal door slechte retrieval of te vrije instructies. Debug beide stappen apart en meet verbeteringen met een vaste set testvragen.",
  },
  {
    id: "s-agent-tools",
    type: "multiple",
    topicId: "t5",
    chapterSlug: "5-2",
    prompt: "Wat is verstandig bij een agent die zelf tools mag aanroepen?",
    options: options(
      "Alleen toegang geven tot de tools die nodig zijn",
      "Destructieve acties door een mens laten bevestigen",
      "Vastleggen welke stappen de agent heeft gezet",
      "De agent adminrechten geven, zodat hij nooit vastloopt",
    ),
    correct: ["a", "b", "c"],
    explanation:
      "Minimale rechten, menselijke bevestiging bij risicovolle acties en goede logging houden agents veilig en uitlegbaar.",
  },
  {
    id: "s-evaluatie",
    type: "single",
    topicId: "t6",
    chapterSlug: "6-1",
    prompt: "Je past een systeemprompt aan. Hoe weet je of het resultaat beter is geworden?",
    options: options(
      "Een paar keer met de hand proberen en kijken of het goed voelt",
      "Een vaste evaluatieset met verwachte uitkomsten draaien, vóór en na de wijziging",
      "Het model zelf vragen of de nieuwe prompt beter is",
      "Wachten tot gebruikers klagen",
    ),
    correct: "b",
    explanation:
      "Zonder vaste evaluatieset vergelijk je gevoel met gevoel. Een set testgevallen met verwachte uitkomsten laat objectief zien of een wijziging helpt of juist iets anders breekt.",
  },
  {
    id: "s-prompt-injection",
    type: "single",
    topicId: "t7",
    chapterSlug: "7-1",
    prompt: "Wat is prompt injection?",
    options: options(
      "Een techniek om prompts sneller te verwerken",
      "Invoer, bijvoorbeeld van een gebruiker of uit een document, die de instructies van je systeem probeert te overschrijven",
      "Het automatisch toevoegen van voorbeelden aan een prompt",
      "Een fout in de tokenizer van het model",
    ),
    correct: "b",
    explanation:
      "Bij prompt injection bevat de invoer instructies zoals 'negeer alle eerdere regels'. Omdat het model instructies en data niet strikt scheidt, kan het daar gevolg aan geven.",
  },
  {
    id: "s-injection-maatregelen",
    type: "multiple",
    topicId: "t7",
    chapterSlug: "7-3",
    prompt: "Welke maatregelen beperken de schade van prompt injection?",
    options: options(
      "Output valideren voordat je er acties op baseert",
      "Het model minimale rechten geven",
      "In de systeemprompt zetten dat het model nooit gehackt mag worden, dat is genoeg",
      "Onbetrouwbare inhoud gescheiden houden van je instructies",
    ),
    correct: ["a", "b", "d"],
    explanation:
      "Een instructie in de systeemprompt is makkelijk te omzeilen. Beperk wat het model kan doen, scheid instructies van onbetrouwbare inhoud en valideer de output.",
  },
];

export const mockExams: Exam[] = [
  {
    pathSlug: "ai-101",
    questionCount: 10,
    passingScore: 80,
    maxAttempts: 3,
    estimatedMinutes: 20,
    timeLimitMinutes: 30,
    chapterSlug: "5-6",
    questions: ai101Questions,
  },
  {
    pathSlug: "ui-ux-design",
    questionCount: 8,
    passingScore: 80,
    maxAttempts: 3,
    estimatedMinutes: 15,
    timeLimitMinutes: 25,
    questions: uiuxQuestions,
  },
  {
    pathSlug: "software-development",
    questionCount: 8,
    passingScore: 80,
    maxAttempts: 3,
    estimatedMinutes: 15,
    timeLimitMinutes: 25,
    questions: softwareQuestions,
  },
];

// Sanne heeft de eindtoets van AI 101 nog niet gemaakt.
export const mockExamAttempts: Record<string, ExamAttempt[]> = {};
