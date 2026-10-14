import type { TutorEntry } from "@/lib/data/tutor";

// Tijdelijke antwoorden voor de AI-tutor. Wordt vervangen door de Claude API (zie src/lib/data/tutor.ts).

export const chapterTutorSuggestions: Record<string, string[]> = {
  "ai-101/3-3": [
    "Hoe werkt de iteratieloop precies?",
    "Wanneer begin ik beter een nieuw gesprek?",
    "Geef een voorbeeld van een goede vervolgprompt",
    "Hoeveel rondes zijn normaal?",
  ],
};

export const generalTutorSuggestions = [
  "Vat dit hoofdstuk kort samen",
  "Hoe voorkom ik dat AI dingen verzint?",
  "Mag ik klantdata in een AI-tool plakken?",
];

export const chapterTutorKnowledge: Record<string, TutorEntry[]> = {
  "ai-101/3-3": [
    {
      id: "loop",
      keywords: ["loop", "iteratieloop", "stappen", "drie stappen", "itereren", "iteratie", "hoe werkt", "beoordelen"],
      answer:
        "De iteratieloop bestaat uit drie stappen die je herhaalt tot de output bruikbaar is:\n\n- Vragen: geef doel, context en randvoorwaarden. Wat wil je bereiken, voor wie en binnen welke grenzen?\n- Beoordelen: controleer de output op juistheid, toon en volledigheid. Hier ontdek je wat de AI nog niet weet.\n- Bijsturen: benoem concreet wat er anders moet, het liefst meetbaar (“maximaal 40 woorden”, “vanuit een nieuwe gebruiker”).\n\nZie het als samenwerken met een nieuwe collega: die heeft ook een paar rondes feedback nodig voordat het werk past.",
      followUps: ["Geef een voorbeeld van een goede vervolgprompt", "Hoeveel rondes zijn normaal?"],
    },
    {
      id: "opnieuw",
      keywords: ["opnieuw", "nieuw gesprek", "misverstand", "vastlopen", "loopt vast", "vervuild", "valkuil", "terugvallen", "reset"],
      answer:
        "Begin opnieuw als de AI steeds terugvalt op een eerder misverstand. Alles wat in het gesprek staat telt mee als context, dus een verkeerde aanname blijft doorwerken, ook als je die later corrigeert.\n\nZo pak je dat aan:\n\n- Noteer wat je in het huidige gesprek hebt geleerd: welke context ontbrak, welke formulering werkte wel.\n- Start een nieuw gesprek en verwerk dat meteen in je eerste prompt.\n- Kopieer alleen de bruikbare delen van eerdere output mee, niet het hele gesprek.\n\nVuistregel: corrigeer je hetzelfde punt voor de derde keer, dan is een nieuwe start sneller.",
      followUps: ["Hoe werkt de iteratieloop precies?"],
    },
    {
      id: "vervolgprompt",
      keywords: ["vervolgprompt", "bijsturen", "feedback geven", "aanpassen", "concreet", "voorbeeld", "follow-up", "vervolg"],
      answer:
        "Een goede vervolgprompt benoemt wat goed is en wat er concreet anders moet. Bijvoorbeeld bij een user story voor een inlogflow:\n\n“Goed begin. Drie aanpassingen: 1. Schrijf het vanuit een nieuwe gebruiker. 2. Houd het onder de 40 woorden. 3. Voeg één acceptatiecriterium toe voor foutmeldingen.”\n\nWaarom dit werkt:\n\n- Je bevestigt wat al klopt, zodat de AI dat niet weggooit.\n- Elke aanpassing is los te controleren.\n- Een getal (40 woorden, één criterium) laat weinig ruimte voor interpretatie.\n\nVermijd vage feedback zoals “kan het beter?”: dan moet de AI raden wat jij bedoelt.",
      followUps: ["Wanneer begin ik beter een nieuw gesprek?"],
    },
    {
      id: "rondes",
      keywords: ["hoeveel", "rondes", "hoe vaak", "wanneer stoppen", "klaar", "genoeg", "keer"],
      answer:
        "Meestal heb je twee tot drie rondes nodig. De eerste ronde laat zien wat de AI heeft begrepen, de tweede vult de ontbrekende context aan en de derde is fijnslijpen.\n\nKom je na vier of vijf rondes nog niet in de buurt? Dan ligt het vaak aan de basis: het doel of de context in je eerste prompt is niet helder. Begin dan liever opnieuw met een sterkere eerste prompt.",
      followUps: ["Wanneer begin ik beter een nieuw gesprek?"],
    },
    {
      id: "een-prompt",
      keywords: ["één prompt", "een prompt", "eerste prompt", "waarom", "zoekmachine", "middelmatig", "generiek"],
      answer:
        "Eén prompt is zelden genoeg omdat je eerste vraag bijna altijd context mist die jij vanzelfsprekend vindt: je doelgroep, de toon van je merk, technische beperkingen.\n\nHet eerste antwoord is daarom vooral een diagnose. Het laat zien wat de AI heeft begrepen en dus ook wat je nog moet toevoegen. Wie AI als zoekmachine gebruikt en bij het eerste antwoord stopt, mist precies die stap.",
      followUps: ["Hoe werkt de iteratieloop precies?"],
    },
    {
      id: "praktijk",
      keywords: ["voorbeeld uit de praktijk", "voorbeeld", "designer", "design", "developer", "code", "toepassen", "praktijk", "mijn werk", "project"],
      answer:
        "Een paar manieren om itereren in je dagelijkse werk toe te passen:\n\n- Designers: laat de AI vijf varianten van een microcopy-tekst maken, kies de beste twee en stuur bij op toon en lengte.\n- Developers: vraag eerst om een aanpak in stappen, beoordeel die, en laat pas daarna code schrijven per stap.\n- Samen: gebruik dezelfde vervolgprompts als teamafspraak, zodat iedereen op dezelfde manier bijstuurt.\n\nIn taak 3 vind je een voorbeeld van een vervolgprompt die je direct kunt hergebruiken.",
    },
  ],
};

export const generalTutorKnowledge: TutorEntry[] = [
  {
    id: "hallucinaties",
    keywords: ["hallucin", "verzint", "verzonnen", "klopt niet", "betrouwbaar", "fouten", "fout", "onjuist", "bronnen"],
    answer:
      "Een taalmodel voorspelt welke tekst waarschijnlijk volgt. Het weet niet zelf of iets waar is, dus het kan overtuigend klinkende onzin geven. Zo verklein je die kans:\n\n- Geef de bronnen of data mee waarop het antwoord moet steunen.\n- Vraag expliciet om “ik weet het niet” als het antwoord niet in de context staat.\n- Controleer feiten, cijfers en citaten altijd zelf, zeker als je ze deelt met klanten.",
    source: "AI 101 · hoofdstuk 2.3",
  },
  {
    id: "privacy",
    keywords: ["privacy", "vertrouwelijk", "klantdata", "persoonsgegevens", "avg", "gevoelig", "data plakken", "geheim"],
    answer:
      "Plak geen persoonsgegevens of vertrouwelijke klantinformatie in een AI-tool, tenzij jullie organisatie daar een goedgekeurde zakelijke omgeving voor heeft. Anonimiseer waar het kan: vervang namen, e-mailadressen en bedragen door neutrale voorbeelden.\n\nTwijfel je? Check het AI-beleid van je organisatie of vraag het je teamlead.",
    source: "AI 101 · hoofdstuk 5.1",
  },
  {
    id: "prompt-basis",
    keywords: ["goede prompt", "prompt schrijven", "basis", "hoe prompt", "structuur"],
    answer:
      "Een goede prompt heeft vier onderdelen:\n\n- Doel: wat moet er uitkomen?\n- Context: voor wie, in welke situatie, met welke achtergrond?\n- Randvoorwaarden: lengte, toon, format, wat juist niet.\n- Voorbeeld: laat zien hoe goede output eruitziet, als je dat hebt.\n\nBegin klein en vul aan op basis van het eerste antwoord.",
    source: "AI 101 · hoofdstuk 3.1",
  },
  {
    id: "praktijkvoorbeeld",
    keywords: ["voorbeeld uit de praktijk", "praktijkvoorbeeld", "voorbeeld", "praktijk"],
    answer:
      "Een herkenbaar voorbeeld: een designer moet twintig foutmeldingen herschrijven voor een formulier. Met AI maakt ze in één keer een eerste versie van alle teksten, beoordeelt die op toon en lengte en stuurt in twee rondes bij. Wat eerst een middag kostte, is nu een half uur, en de tijd die overblijft gaat naar het checken met een developer of alle foutscenario’s gedekt zijn.\n\nProbeer het zelf: kies een klus die je deze week vaker doet en doorloop er bewust twee rondes bijsturen mee.",
  },
];
