import type { Level } from "@/lib/types";
import { mockExercises, mockFreePractice, mockPracticeProgress } from "@/lib/mock/practice";

// Oefenen: opdrachten, voortgang en (straks) de echte AI-antwoorden.
// Nu op mock-data; later komen de opdrachten uit Storyblok en de voortgang uit MongoDB.

export type PracticeAudience = "iedereen" | "designers" | "developers";

export type CriterionKey = "doel" | "context" | "randvoorwaarden" | "outputformaat" | "iteratie";

export type PracticeIcon =
  | "file-text"
  | "notebook"
  | "code"
  | "flask"
  | "lightbulb"
  | "braces"
  | "message"
  | "palette"
  | "sparkles";

export type PracticeExercise = {
  slug: string;
  title: string;
  summary: string;
  audience: PracticeAudience;
  level: Level;
  minutes: number;
  points: number;
  icon: PracticeIcon;
  /** Vrije oefenruimte: geen criteria, geen afronding. */
  free?: boolean;
  /** Situatie waarin de cursist zit. */
  context: string[];
  /** Wat de prompt moet opleveren. */
  goal: string;
  /** Bronmateriaal dat de cursist in de prompt kan plakken (notities, code, mails…). */
  material?: { label: string; body: string; kind: "text" | "code" };
  /** Checklist links; een punt is behaald zodra het bijbehorende criterium goed scoort. */
  criteria: { criterion: CriterionKey; label: string }[];
  tips: string[];
  /** Woorden die laten zien dat de prompt over déze opdracht gaat; tellen mee voor "Doel". */
  keywords: string[];
  /** Startideeën als knoppen (alleen vrije oefenruimte). */
  starters?: { label: string; prompt: string }[];
  placeholder: string;
  /** Minimale score (0–100) om af te ronden. */
  passScore: number;
  /** Voorbeeldantwoorden van zwak naar sterk; de kwaliteit van de prompt bepaalt welke je krijgt. */
  responses: [string, string, string];
};

export type PracticeProgress = {
  /** slug -> beste score van een afgeronde oefening */
  completed: Record<string, number>;
};

export async function getExercises() {
  return mockExercises;
}

// Ook de vrije oefenruimte ("vrij") is via deze functie op te halen.
export async function getExercise(slug: string) {
  if (slug === mockFreePractice.slug) return mockFreePractice;
  return mockExercises.find((e) => e.slug === slug);
}

export async function getFreePractice() {
  return mockFreePractice;
}

export async function getPracticeProgress() {
  return mockPracticeProgress;
}

// Eerstvolgende oefening die nog niet af is (na de huidige), voor "Volgende oefening".
export async function getNextExercise(slug: string) {
  const [exercises, progress] = await Promise.all([getExercises(), getPracticeProgress()]);
  const index = exercises.findIndex((e) => e.slug === slug);
  const rest = [...exercises.slice(index + 1), ...exercises.slice(0, Math.max(index, 0))];
  return rest.find((e) => !(e.slug in progress.completed)) ?? rest[0];
}

export const audienceLabel: Record<PracticeAudience, string> = {
  iedereen: "Voor iedereen",
  designers: "Voor designers",
  developers: "Voor developers",
};
