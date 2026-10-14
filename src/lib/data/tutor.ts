import type { Chapter, LearningPath } from "@/lib/types";
import { chapterTutorKnowledge, chapterTutorSuggestions, generalTutorKnowledge, generalTutorSuggestions } from "@/lib/mock/tutor";

export type TutorEntry = {
  id: string;
  /** Woorden of woorddelen waarop een vraag matcht (kleine letters). */
  keywords: string[];
  answer: string;
  /** Bron onder het antwoord; standaard het huidige hoofdstuk. */
  source?: string;
  followUps?: string[];
};

export type TutorContext = {
  chapterId: string;
  chapterNumber: string;
  chapterTitle: string;
  pathTitle: string;
  greeting: string;
  suggestions: string[];
  entries: TutorEntry[];
  fallback: string;
  /** Standaardbron, bv. "hoofdstuk 3.3". */
  source: string;
};

// Kennis voor de AI-tutor per hoofdstuk. Wordt later een Claude API-aanroep met de lesinhoud als context.
export async function getTutorContext(path: LearningPath, chapter: Chapter, firstName: string): Promise<TutorContext> {
  const specific = chapterTutorKnowledge[chapter.id] ?? [];

  return {
    chapterId: chapter.id,
    chapterNumber: chapter.number,
    chapterTitle: chapter.title,
    pathTitle: path.title,
    greeting: `Hoi ${firstName}! Ik ben je AI-tutor voor hoofdstuk ${chapter.number}, “${chapter.title}”. Ik beantwoord je vragen op basis van de lesstof. Waar kan ik je mee helpen?`,
    suggestions: chapterTutorSuggestions[chapter.id] ?? generalTutorSuggestions,
    entries: [...specific, summaryEntry(chapter), ...generalTutorKnowledge],
    fallback: `Daar kan ik op basis van hoofdstuk ${chapter.number} geen goed antwoord op geven. Probeer je vraag anders te formuleren of kies een van de suggesties. Gaat je vraag over je account of abonnement? Dan helpt het helpcentrum je verder.`,
    source: `hoofdstuk ${chapter.number}`,
  };
}

// Samenvatting op basis van de taken in het hoofdstuk zelf.
function summaryEntry(chapter: Chapter): TutorEntry {
  const intro = chapter.tasks
    .flatMap((t) => t.blocks)
    .find((b) => b.type === "text" && !/^(Inhoud volgt|In dit hoofdstuk|Bekijk de video|Twee vragen)/.test(b.body));
  const tasks = chapter.tasks.map((t, i) => `- Taak ${i + 1}: ${t.title}`).join("\n");

  return {
    id: "samenvatting",
    keywords: ["samenvat", "samenvatting", "overzicht", "waar gaat", "kort uitleggen", "hoofdpunten", "tl;dr", "tldr"],
    answer: [
      `In hoofdstuk ${chapter.number} draait het om ${chapter.title.charAt(0).toLowerCase()}${chapter.title.slice(1)}. Je werkt in ${chapter.tasks.length} taken door de stof:`,
      tasks,
      intro && intro.type === "text" ? `De kern in één zin: ${intro.body}` : "Begin bij de introductie en werk de taken op volgorde af; ze bouwen op elkaar voort.",
    ].join("\n\n"),
    followUps: ["Geef een voorbeeld uit de praktijk", "Hoe voorkom ik dat AI dingen verzint?"],
  };
}
