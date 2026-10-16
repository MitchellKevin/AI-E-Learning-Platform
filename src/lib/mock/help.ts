import type {
  CompanyInfo,
  CookieInfo,
  HelpArticle,
  HelpCategory,
  HelpFaq,
  LegalDates,
  Processor,
  RetentionPeriod,
  SupportInfo,
} from "@/lib/data/help";

// Tijdelijke helpcentrum-inhoud. Wordt vervangen door Storyblok (zie src/lib/data/help.ts).

export const helpCategories: HelpCategory[] = [
  {
    slug: "aan-de-slag",
    title: "Aan de slag",
    description: "Je account activeren, inloggen en je eerste hoofdstuk starten.",
    icon: "rocket",
  },
  {
    slug: "leerpaden-en-certificaten",
    title: "Leerpaden en certificaten",
    description: "Hoe leerpaden, de eindtoets en je certificaat werken.",
    icon: "route",
  },
  {
    slug: "voor-managers",
    title: "Voor managers",
    description: "Collega's uitnodigen, leerpaden toewijzen en voortgang volgen.",
    icon: "users",
  },
  {
    slug: "account-en-privacy",
    title: "Account en privacy",
    description: "Je gegevens, meldingen en zichtbaarheid zelf regelen.",
    icon: "shield",
  },
  {
    slug: "abonnement-en-facturen",
    title: "Abonnement en facturen",
    description: "Licenties, betaalgegevens en facturen van je organisatie.",
    icon: "receipt",
  },
];

export const helpArticles: HelpArticle[] = [
  // Aan de slag
  {
    slug: "account-activeren",
    title: "Je account activeren via de uitnodiging",
    summary: "Je organisatie heeft je uitgenodigd. Zo activeer je je account en vul je de korte intake in.",
    category: "aan-de-slag",
    updatedAt: "2026-09-22",
    popular: true,
    keywords: ["uitnodiging", "activeren", "registreren", "aanmelden", "link verlopen", "intake"],
    related: ["inloggen-met-e-maillink", "eerste-leerpad-starten"],
    body: [
      {
        type: "p",
        text: "AI Academy werkt met uitnodigingen. Je beheerder of manager nodigt je uit met je zakelijke e-mailadres, waarna je een e-mail krijgt met de onderwerpregel **Je bent uitgenodigd voor AI Academy**.",
      },
      { type: "h2", id: "stappen", text: "In drie stappen aan de slag" },
      {
        type: "ol",
        items: [
          "Open de uitnodiging en klik op **Uitnodiging accepteren**.",
          "Controleer je naam en kies je rol: designer, developer of iets anders. Dit kun je later altijd aanpassen.",
          "Vul de korte intake in. We vragen naar je ervaring met AI, zodat we je een passend startpunt kunnen aanraden.",
        ],
      },
      {
        type: "p",
        text: "Na de intake kom je op je dashboard terecht. Daar zie je meteen welk hoofdstuk je als eerste kunt doen.",
      },
      { type: "h2", id: "link-verlopen", text: "Is de link verlopen?" },
      {
        type: "p",
        text: "Een uitnodiging is 14 dagen geldig. Is de link verlopen, vraag je beheerder dan om de uitnodiging opnieuw te versturen. Dat kan met één klik vanuit het teamoverzicht.",
      },
      {
        type: "tip",
        title: "Geen e-mail ontvangen?",
        text: "Kijk in je map met ongewenste e-mail en zoek op **AI Academy**. Gebruikt je organisatie een strenge spamfilter, vraag IT dan om e-mail van ons domein toe te staan.",
      },
    ],
  },
  {
    slug: "inloggen-met-e-maillink",
    title: "Inloggen met een e-maillink",
    summary: "We werken zonder wachtwoorden. Je logt in met een link die we naar je e-mail sturen.",
    category: "aan-de-slag",
    updatedAt: "2026-09-10",
    popular: true,
    keywords: ["inloggen", "wachtwoord", "magic link", "login", "sso", "single sign-on"],
    related: ["account-activeren"],
    body: [
      {
        type: "p",
        text: "Je hoeft bij AI Academy geen wachtwoord te onthouden. Vul op de [inlogpagina](/inloggen) je zakelijke e-mailadres in en we sturen je een link waarmee je direct bent ingelogd.",
      },
      { type: "h2", id: "hoe-het-werkt", text: "Hoe het werkt" },
      {
        type: "ol",
        items: [
          "Ga naar de [inlogpagina](/inloggen) en vul je e-mailadres in.",
          "Open de e-mail **Je inloglink voor AI Academy**.",
          "Klik op **Inloggen**. De link werkt 15 minuten en maar één keer.",
        ],
      },
      { type: "h2", id: "andere-apparaat", text: "Inloggen op een ander apparaat" },
      {
        type: "p",
        text: "Open de link op het apparaat waarop je wilt leren. Open je de e-mail op je telefoon maar wil je op je laptop werken? Vraag dan op je laptop een nieuwe link aan.",
      },
      {
        type: "tip",
        title: "Inloggen via je organisatie",
        text: "Gebruikt je organisatie Microsoft of Google voor single sign-on? Dan zie je op de inlogpagina een extra knop om daarmee in te loggen.",
      },
    ],
  },
  {
    slug: "eerste-leerpad-starten",
    title: "Zo begin je aan AI 101",
    summary: "AI 101 is de gezamenlijke basis voor iedereen. Zo haal je er het meeste uit.",
    category: "aan-de-slag",
    updatedAt: "2026-08-28",
    keywords: ["beginnen", "starten", "eerste hoofdstuk", "ai 101", "weekdoel", "streak"],
    related: ["hoe-werken-leerpaden"],
    body: [
      {
        type: "p",
        text: "Iedereen in je team begint met [AI 101](/leerpaden/ai-101). Je leert hoe generatieve AI werkt, hoe je goede prompts schrijft en hoe je AI verantwoord inzet. Reken op ongeveer 14 uur, verdeeld over 26 korte hoofdstukken.",
      },
      { type: "h2", id: "ritme", text: "Kies een vast ritme" },
      {
        type: "p",
        text: "Een hoofdstuk duurt 15 tot 25 minuten. Teams die twee of drie keer per week een hoofdstuk doen, ronden AI 101 gemiddeld binnen zes weken af. Je stelt je weekdoel in bij [Instellingen](/instellingen).",
      },
      { type: "h2", id: "opbouw", text: "Zo is een hoofdstuk opgebouwd" },
      {
        type: "ul",
        items: [
          "**Introductie**: waarom het onderwerp ertoe doet.",
          "**Theorie en voorbeeld**: de kern, met een voorbeeld uit de praktijk van designers en developers.",
          "**Oefening**: je past het meteen toe, vaak in de [oefenomgeving](/oefenen).",
          "**Korte quiz**: een paar vragen om te checken of het is blijven hangen.",
        ],
      },
      {
        type: "tip",
        text: "Je voortgang wordt na elke taak opgeslagen. Je kunt dus altijd stoppen en later verdergaan waar je gebleven was.",
      },
    ],
  },

  // Leerpaden en certificaten
  {
    slug: "hoe-werken-leerpaden",
    title: "Hoe leerpaden, onderwerpen en hoofdstukken werken",
    summary: "Van AI 101 naar je eigen specialisatie: zo zit het aanbod in elkaar.",
    category: "leerpaden-en-certificaten",
    updatedAt: "2026-09-02",
    keywords: ["leerpad", "specialisatie", "designer", "developer", "volgorde", "onderwerpen"],
    related: ["certificaat-behalen-en-delen", "eerste-leerpad-starten"],
    body: [
      {
        type: "p",
        text: "Een leerpad bestaat uit onderwerpen, en elk onderwerp uit een aantal hoofdstukken. Je ziet alle leerpaden op de pagina [Leerpaden](/leerpaden).",
      },
      { type: "h2", id: "specialisaties", text: "Na AI 101: kies je specialisatie" },
      {
        type: "p",
        text: "Heb je AI 101 afgerond, dan kies je een specialisatie die past bij je werk: **UI/UX Design** voor designers of **Software Development** voor developers. Beide paden duren ongeveer 18 uur. Je kunt ze ook allebei volgen.",
      },
      { type: "h2", id: "volgorde", text: "Moet ik de volgorde aanhouden?" },
      {
        type: "p",
        text: "Binnen een onderwerp raden we de volgorde aan, omdat hoofdstukken op elkaar voortbouwen. Ken je een onderwerp al, dan kun je bij de intake een niveautoets doen om onderdelen over te slaan.",
      },
      { type: "h2", id: "punten", text: "Punten, streaks en badges" },
      {
        type: "ul",
        items: [
          "Voor elk afgerond hoofdstuk krijg je punten. Die tellen mee op het [leaderboard](/leaderboard).",
          "Je streak groeit elke dag dat je minstens één taak afrondt.",
          "Badges verdien je voor mijlpalen, zoals je eerste afgeronde onderwerp.",
        ],
      },
    ],
  },
  {
    slug: "certificaat-behalen-en-delen",
    title: "Je certificaat behalen, downloaden en delen",
    summary: "Haal de eindtoets met 80% of meer en je krijgt een certificaat dat anderen kunnen controleren.",
    category: "leerpaden-en-certificaten",
    updatedAt: "2026-10-06",
    popular: true,
    keywords: ["certificaat", "eindtoets", "examen", "linkedin", "pdf", "verificatie", "herkansen", "score"],
    related: ["hoe-werken-leerpaden"],
    body: [
      {
        type: "p",
        text: "Elk leerpad sluit af met een eindtoets. Heb je alle hoofdstukken afgerond, dan kun je de toets starten vanaf de pagina van het leerpad.",
      },
      { type: "h2", id: "eindtoets", text: "Over de eindtoets" },
      {
        type: "ul",
        items: [
          "De toets bestaat uit 25 vragen en duurt ongeveer 30 minuten.",
          "Je hebt 80% of meer nodig om te slagen.",
          "Niet gehaald? Je kunt na 24 uur opnieuw. Je krijgt dan andere vragen.",
        ],
      },
      { type: "h2", id: "downloaden", text: "Je certificaat downloaden" },
      {
        type: "p",
        text: "Je vindt al je certificaten onder [Profiel → Certificaten](/profiel/certificaten). Daar download je ze als pdf of print je ze direct.",
      },
      { type: "h2", id: "delen", text: "Delen op LinkedIn" },
      {
        type: "p",
        text: "Op de pagina van je certificaat staat de knop **Toevoegen aan LinkedIn**. Het certificaatnummer en de verificatielink worden automatisch ingevuld.",
      },
      {
        type: "tip",
        title: "Echtheid controleren",
        text: "Iedereen kan een certificaat controleren via de verificatielink, zonder in te loggen. Daar staan alleen je naam, het leerpad en de datum, en niet je score.",
      },
    ],
  },

  // Voor managers
  {
    slug: "collega-uitnodigen",
    title: "Collega's uitnodigen en aan een team toevoegen",
    summary: "Nodig collega's één voor één of in één keer uit en zet ze meteen in het juiste team.",
    category: "voor-managers",
    updatedAt: "2026-09-30",
    popular: true,
    keywords: ["uitnodigen", "team", "collega", "csv", "toevoegen", "licentie", "beheerder"],
    related: ["voortgang-team-bekijken", "licenties-aanpassen"],
    body: [
      {
        type: "p",
        text: "Als manager of beheerder nodig je collega's uit vanuit [Beheer → Team](/beheer/team). Elke uitgenodigde collega gebruikt één licentie zodra de uitnodiging is geaccepteerd.",
      },
      { type: "h2", id: "een-collega", text: "Eén collega uitnodigen" },
      {
        type: "ol",
        items: [
          "Ga naar [Beheer → Team](/beheer/team) en klik op **Collega uitnodigen**.",
          "Vul het zakelijke e-mailadres in en kies het team.",
          "Kies eventueel meteen een leerpad met een deadline.",
          "Klik op **Uitnodiging versturen**.",
        ],
      },
      { type: "h2", id: "meerdere", text: "Meerdere collega's tegelijk" },
      {
        type: "p",
        text: "Plak een lijst met e-mailadressen, gescheiden door komma's of regels. Je kunt ook een CSV-bestand uploaden met de kolommen **e-mail** en **team**.",
      },
      {
        type: "tip",
        text: "Openstaande uitnodigingen zie je in het teamoverzicht met de status **Uitgenodigd**. Na 14 dagen verlopen ze, en dan verstuur je ze opnieuw met één klik.",
      },
    ],
  },
  {
    slug: "voortgang-team-bekijken",
    title: "De voortgang van je team bekijken en leerpaden toewijzen",
    summary: "Zie wie waar staat, wijs leerpaden toe met een deadline en exporteer rapportages.",
    category: "voor-managers",
    updatedAt: "2026-10-01",
    keywords: ["voortgang", "rapportage", "export", "deadline", "toewijzen", "dashboard manager", "csv"],
    related: ["collega-uitnodigen"],
    body: [
      {
        type: "p",
        text: "In [Beheer](/beheer) zie je in één oogopslag hoe je team ervoor staat: wie actief is, wie achterloopt en hoeveel certificaten er zijn behaald.",
      },
      { type: "h2", id: "wat-je-ziet", text: "Wat je als manager ziet" },
      {
        type: "ul",
        items: [
          "Voortgang per collega en per leerpad.",
          "Behaalde certificaten en de datum waarop ze zijn behaald.",
          "Activiteit van de afgelopen 30 dagen.",
        ],
      },
      {
        type: "p",
        text: "Je ziet **niet** welke antwoorden iemand gaf of welke prompts iemand schreef in de oefenomgeving. Zo blijft er ruimte om te oefenen en fouten te maken.",
      },
      { type: "h2", id: "toewijzen", text: "Een leerpad toewijzen" },
      {
        type: "p",
        text: "Via [Beheer → Toewijzingen](/beheer/toewijzingen) wijs je een leerpad toe aan een team of aan losse collega's, eventueel met een deadline. Collega's krijgen daar een e-mail over, en een herinnering een week voor de deadline.",
      },
      { type: "h2", id: "exporteren", text: "Rapportages exporteren" },
      {
        type: "p",
        text: "Onder [Beheer → Rapportages](/beheer/rapportages) exporteer je de voortgang als CSV of pdf, bijvoorbeeld voor een opleidingsbudget of een kwartaalrapportage.",
      },
    ],
  },

  // Account en privacy
  {
    slug: "gegevens-inzien-en-verwijderen",
    title: "Je gegevens inzien, downloaden of laten verwijderen",
    summary: "Je hebt recht op inzage in je gegevens en kunt een kopie downloaden of verwijdering aanvragen.",
    category: "account-en-privacy",
    updatedAt: "2026-09-18",
    popular: true,
    keywords: ["avg", "gdpr", "privacy", "export", "verwijderen", "inzage", "account verwijderen", "data"],
    related: ["leaderboard-afmelden"],
    body: [
      {
        type: "p",
        text: "Onder de AVG heb je het recht om je gegevens in te zien, mee te nemen en te laten verwijderen. Bij AI Academy regel je het meeste daarvan zelf.",
      },
      { type: "h2", id: "downloaden", text: "Een kopie van je gegevens downloaden" },
      {
        type: "ol",
        items: [
          "Ga naar [Instellingen](/instellingen) en open het onderdeel **Privacy**.",
          "Klik op **Mijn gegevens downloaden**.",
          "Je krijgt binnen een paar minuten een e-mail met een downloadlink. Het bestand bevat je profiel, voortgang, toetsresultaten en certificaten in JSON-formaat.",
        ],
      },
      { type: "h2", id: "verwijderen", text: "Je account laten verwijderen" },
      {
        type: "p",
        text: "Je account valt onder de licentie van je organisatie. Vraag daarom je beheerder om je account te verwijderen, of mail ons via [privacy@aiacademy.nl](mailto:privacy@aiacademy.nl). We verwijderen je gegevens binnen 30 dagen.",
      },
      {
        type: "tip",
        title: "Wat blijft er bewaard?",
        text: "Een behaald certificaat blijft controleerbaar, tenzij je vraagt om ook de verificatiepagina te verwijderen. Facturen bewaren we 7 jaar, omdat de wet dat verplicht. Daar staan geen leergegevens in.",
      },
      {
        type: "p",
        text: "Meer lees je in onze [privacyverklaring](/privacy).",
      },
    ],
  },
  {
    slug: "leaderboard-afmelden",
    title: "Je zichtbaarheid op het leaderboard aanpassen",
    summary: "Liever niet op het leaderboard? Je kunt je afmelden en je punten privé houden.",
    category: "account-en-privacy",
    updatedAt: "2026-08-14",
    keywords: ["leaderboard", "ranglijst", "afmelden", "zichtbaar", "anoniem", "punten"],
    related: ["gegevens-inzien-en-verwijderen"],
    body: [
      {
        type: "p",
        text: "Het [leaderboard](/leaderboard) laat zien wie in je team de meeste punten heeft verdiend deze maand. Niet iedereen vindt dat prettig, en dat is prima.",
      },
      { type: "h2", id: "afmelden", text: "Afmelden voor het leaderboard" },
      {
        type: "ol",
        items: [
          "Ga naar [Instellingen](/instellingen) en open **Privacy**.",
          "Zet **Toon mij op het leaderboard** uit.",
        ],
      },
      {
        type: "p",
        text: "Je verdwijnt meteen van het leaderboard. Je blijft wel punten, streaks en badges verdienen voor jezelf, en je ziet je eigen positie nog steeds.",
      },
      {
        type: "tip",
        text: "Je manager ziet je voortgang los van het leaderboard. Afmelden heeft dus geen invloed op rapportages.",
      },
    ],
  },

  // Abonnement en facturen
  {
    slug: "facturen-downloaden",
    title: "Facturen downloaden en betaalgegevens wijzigen",
    summary: "Waar je facturen vindt en hoe je de betaalmethode of het factuuradres aanpast.",
    category: "abonnement-en-facturen",
    updatedAt: "2026-09-25",
    keywords: ["factuur", "facturen", "betaling", "creditcard", "sepa", "btw", "inkoopnummer", "po"],
    related: ["licenties-aanpassen"],
    body: [
      {
        type: "p",
        text: "Facturen en betaalgegevens beheer je als beheerder onder [Beheer → Abonnement](/beheer/abonnement).",
      },
      { type: "h2", id: "facturen", text: "Facturen downloaden" },
      {
        type: "p",
        text: "Onderaan de pagina staat een overzicht van alle facturen met datum, bedrag en status. Klik op een factuur om de pdf te downloaden. We sturen elke factuur ook naar het factuur-e-mailadres van je organisatie.",
      },
      { type: "h2", id: "betaalmethode", text: "Betaalmethode wijzigen" },
      {
        type: "p",
        text: "Klik op **Betaalmethode wijzigen** om een andere creditcard of SEPA-incasso in te stellen. Betalingen lopen via Stripe. Wij zien en bewaren je volledige kaartgegevens niet.",
      },
      { type: "h2", id: "factuurgegevens", text: "Inkoopnummer of btw-nummer toevoegen" },
      {
        type: "p",
        text: "Onder **Factuurgegevens** vul je het btw-nummer, het factuuradres en eventueel een inkoopnummer in. Dat nummer komt op elke volgende factuur te staan.",
      },
    ],
  },
  {
    slug: "licenties-aanpassen",
    title: "Licenties toevoegen of je abonnement aanpassen",
    summary: "Meer collega's laten leren of overstappen naar jaarlijks betalen? Zo werkt het.",
    category: "abonnement-en-facturen",
    updatedAt: "2026-10-08",
    keywords: ["licenties", "seats", "abonnement", "opzeggen", "upgrade", "jaarlijks", "maandelijks", "prijs"],
    related: ["facturen-downloaden", "collega-uitnodigen"],
    body: [
      {
        type: "p",
        text: "Je betaalt per actieve licentie. Een licentie is in gebruik zodra een collega de uitnodiging heeft geaccepteerd. Bekijk de actuele prijzen op [Prijzen](/prijzen).",
      },
      { type: "h2", id: "toevoegen", text: "Licenties toevoegen" },
      {
        type: "p",
        text: "Ga naar [Beheer → Abonnement](/beheer/abonnement) en pas het aantal licenties aan. Extra licenties zijn direct beschikbaar. Je betaalt naar rato voor de rest van de lopende periode.",
      },
      { type: "h2", id: "jaarlijks", text: "Overstappen naar jaarlijks betalen" },
      {
        type: "p",
        text: "Bij jaarlijks betalen krijg je 20% korting. Je stapt over aan het einde van je huidige maand, en het resterende bedrag wordt verrekend.",
      },
      { type: "h2", id: "opzeggen", text: "Opzeggen" },
      {
        type: "p",
        text: "Een maandabonnement zeg je op tot het einde van de lopende maand, een jaarabonnement tot het einde van het contractjaar. Tot die datum houdt iedereen toegang, en behaalde certificaten blijven daarna geldig.",
      },
      {
        type: "tip",
        text: "Meer dan 50 licenties nodig? [Plan een gesprek](/demo) voor een Enterprise-aanbod met eigen content en een vaste contactpersoon.",
      },
    ],
  },
];

export const helpFaqs: HelpFaq[] = [
  {
    id: "duur",
    question: "Hoeveel tijd kost AI 101?",
    answer:
      "Ongeveer 14 uur, verdeeld over 26 hoofdstukken van 15 tot 25 minuten. Je leert in je eigen tempo, en de meeste teams ronden AI 101 binnen zes weken af.",
  },
  {
    id: "voorkennis",
    question: "Heb ik technische kennis nodig?",
    answer:
      "Nee. AI 101 is geschreven voor designers én developers en begint bij de basis. In de specialisatie Software Development schrijf je wel code.",
  },
  {
    id: "mobiel",
    question: "Kan ik ook op mijn telefoon leren?",
    answer:
      "Ja. AI Academy werkt in elke moderne browser, ook op je telefoon en tablet. Je voortgang wordt gesynchroniseerd, dus je kunt op je laptop verdergaan waar je op je telefoon gebleven was.",
  },
  {
    id: "manager-ziet",
    question: "Wat ziet mijn manager van mijn voortgang?",
    answer:
      "Je manager ziet per leerpad hoe ver je bent en of je een certificaat hebt behaald. Je antwoorden op quizvragen en je prompts in de oefenomgeving zijn alleen voor jou zichtbaar.",
  },
  {
    id: "training",
    question: "Worden mijn prompts gebruikt om AI te trainen?",
    answer:
      "Nee. De prompts die je in de oefenomgeving schrijft, worden niet gebruikt om AI-modellen te trainen. We bewaren ze 90 dagen, zodat je je eigen oefeningen kunt teruglezen. Meer staat in onze [privacyverklaring](/privacy).",
  },
  {
    id: "overdoen",
    question: "Kan ik een hoofdstuk of de eindtoets opnieuw doen?",
    answer:
      "Een hoofdstuk kun je zo vaak doen als je wilt. De eindtoets kun je na 24 uur opnieuw maken als je niet geslaagd bent. Je krijgt dan andere vragen.",
  },
  {
    id: "vertrek",
    question: "Wat gebeurt er met mijn certificaten als ik van baan wissel?",
    answer:
      "Je certificaten blijven geldig en controleerbaar via de verificatielink. Download ze als pdf voordat je account wordt gesloten, want daarna kun je niet meer inloggen.",
  },
  {
    id: "proberen",
    question: "Kunnen we AI Academy eerst uitproberen?",
    answer:
      "Ja. [Vraag een demo aan](/demo) en je team krijgt daarna 14 dagen gratis toegang tot AI 101, zonder dat je een betaalmethode hoeft in te vullen.",
  },
];

export const supportInfo: SupportInfo = {
  email: "support@aiacademy.nl",
  responseTime: "Binnen 1 werkdag",
  hours: "Maandag tot en met vrijdag, 9.00 tot 17.00 uur",
  salesEmail: "sales@aiacademy.nl",
  privacyEmail: "privacy@aiacademy.nl",
};

export const cookieList: CookieInfo[] = [
  // Noodzakelijk
  {
    name: "aia_session",
    provider: "AI Academy",
    purpose: "Houdt je ingelogd en koppelt je voortgang aan je account.",
    retention: "30 dagen, of tot je uitlogt",
    category: "noodzakelijk",
    kind: "cookie",
  },
  {
    name: "__Host-aia.csrf",
    provider: "AI Academy",
    purpose: "Beschermt formulieren tegen misbruik door andere websites (CSRF).",
    retention: "Sessie",
    category: "noodzakelijk",
    kind: "cookie",
  },
  {
    name: "aia-cookie-consent",
    provider: "AI Academy",
    purpose: "Onthoudt welke cookies je hebt toegestaan, zodat we het niet steeds opnieuw vragen.",
    retention: "12 maanden",
    category: "noodzakelijk",
    kind: "opslag",
  },
  {
    name: "aia-help-feedback:*",
    provider: "AI Academy",
    purpose: "Onthoudt dat je feedback gaf op een helpartikel.",
    retention: "Tot je je browsergegevens wist",
    category: "noodzakelijk",
    kind: "opslag",
  },
  {
    name: "__stripe_mid",
    provider: "Stripe",
    purpose: "Fraudepreventie bij het afrekenen. Alleen op de betaalpagina's voor beheerders.",
    retention: "1 jaar",
    category: "noodzakelijk",
    kind: "cookie",
  },
  {
    name: "__stripe_sid",
    provider: "Stripe",
    purpose: "Fraudepreventie tijdens één betaalsessie.",
    retention: "30 minuten",
    category: "noodzakelijk",
    kind: "cookie",
  },

  // Analytisch
  {
    name: "_pk_id.*",
    provider: "Matomo (eigen server in de EU)",
    purpose: "Herkent terugkerende bezoekers anoniem, zodat we zien welke pagina's goed werken.",
    retention: "13 maanden",
    category: "analytisch",
    kind: "cookie",
  },
  {
    name: "_pk_ses.*",
    provider: "Matomo (eigen server in de EU)",
    purpose: "Groepeert paginabezoeken binnen één bezoek.",
    retention: "30 minuten",
    category: "analytisch",
    kind: "cookie",
  },

  // Marketing
  {
    name: "li_fat_id",
    provider: "LinkedIn",
    purpose: "Meet of een advertentie op LinkedIn leidde tot een demo-aanvraag.",
    retention: "30 dagen",
    category: "marketing",
    kind: "cookie",
  },
  {
    name: "bcookie",
    provider: "LinkedIn",
    purpose: "Herkent je browser voor LinkedIn-advertenties en de Inzicht-tag.",
    retention: "1 jaar",
    category: "marketing",
    kind: "cookie",
  },
];

// Juridische pagina's. Fictieve bedrijfsgegevens; vervangen door de echte gegevens vóór livegang.
export const companyInfo: CompanyInfo = {
  name: "AI Academy B.V.",
  address: "Herengracht 182, 1016 BR Amsterdam",
  kvk: "87654321",
  vat: "NL004512345B01",
  dpo: "Lotte de Graaf",
  privacyEmail: "privacy@aiacademy.nl",
  accessibilityEmail: "toegankelijkheid@aiacademy.nl",
  legalEmail: "juridisch@aiacademy.nl",
};

export const legalDates: LegalDates = {
  privacy: "2026-09-30",
  voorwaarden: "2026-09-01",
  cookies: "2026-09-30",
  toegankelijkheid: "2026-09-15",
  accessibilityAudit: "2026-09-08",
};

export const processors: Processor[] = [
  {
    name: "MongoDB Atlas",
    purpose: "Database met accounts, voortgang en certificaten",
    location: "Frankfurt, Duitsland (EU)",
    transfer: "Nee",
  },
  {
    name: "Vercel",
    purpose: "Hosting van de website en de leeromgeving",
    location: "Frankfurt, Duitsland (EU)",
    transfer: "Alleen ondersteuning vanuit de VS, op basis van standaardcontractbepalingen",
  },
  {
    name: "Storyblok",
    purpose: "Beheer van lesinhoud en helpartikelen (bevat geen gegevens van deelnemers)",
    location: "EU",
    transfer: "Nee",
  },
  {
    name: "Stripe",
    purpose: "Abonnementen, betalingen en facturen voor beheerders",
    location: "Dublin, Ierland (EU)",
    transfer: "Mogelijk naar de VS, op basis van het EU-VS Data Privacy Framework",
  },
  {
    name: "Postmark",
    purpose: "Versturen van inloglinks, uitnodigingen en meldingen",
    location: "EU-datacenter",
    transfer: "Alleen ondersteuning vanuit de VS, op basis van standaardcontractbepalingen",
  },
  {
    name: "Anthropic",
    purpose: "AI-model voor de oefenomgeving en de AI-tutor; prompts worden niet gebruikt voor training",
    location: "Verenigde Staten",
    transfer: "Ja, op basis van het EU-VS Data Privacy Framework en standaardcontractbepalingen",
  },
  {
    name: "Matomo (eigen installatie)",
    purpose: "Bezoekstatistieken, alleen met je toestemming",
    location: "Amsterdam, Nederland (EU)",
    transfer: "Nee",
  },
];

export const retentionPeriods: RetentionPeriod[] = [
  { data: "Accountgegevens en voortgang", period: "Zolang je account actief is; daarna de bewaartermijn van je organisatie (12, 24 of 36 maanden of tot einde contract). Op eigen verzoek na 30 dagen" },
  { data: "Behaalde certificaten (voor verificatie)", period: "10 jaar, of korter als je daarom vraagt" },
  { data: "Prompts in de oefenomgeving", period: "90 dagen" },
  { data: "Gesprekken met de AI-tutor", period: "30 dagen" },
  { data: "Facturen en betaalgegevens", period: "7 jaar (fiscale bewaarplicht)" },
  { data: "Demo-aanvragen zonder vervolg", period: "12 maanden" },
  { data: "Supportvragen per e-mail", period: "2 jaar na afhandeling" },
  { data: "Beheeracties (auditlog)", period: "24 maanden" },
  { data: "Beveiligingslogs", period: "6 maanden" },
];
