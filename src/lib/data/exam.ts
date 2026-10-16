import { mockExams } from "@/lib/mock/exam";

// Eindtoets per leerpad: de vragenbank (nu mock, later Storyblok). Pogingen staan in exam-attempts.ts.

export type ExamOption = { id: string; label: string };

type QuestionBase = {
  id: string;
  /** Onderwerp uit het leerpad, voor de score per onderwerp. */
  topicId: string;
  /** Hoofdstuk om te herhalen als je deze vraag fout hebt. */
  chapterSlug: string;
  prompt: string;
  /** Optioneel fragment bij de vraag, zoals een prompt of AI-antwoord. */
  context?: { label: string; body: string };
  /** Uitleg die na het inleveren bij de vraag staat. */
  explanation: string;
};

export type SingleChoiceQuestion = QuestionBase & {
  type: "single";
  options: ExamOption[];
  correct: string;
};

export type MultipleChoiceQuestion = QuestionBase & {
  type: "multiple";
  options: ExamOption[];
  correct: string[];
};

export type OpenCriterion = {
  /** Wat de beoordelaar zoekt, in gewone taal. */
  label: string;
  /** Tijdelijk: trefwoorden voor de gesimuleerde beoordeling. Later beoordeelt de Claude API. */
  keywords: string[];
};

export type OpenQuestion = QuestionBase & {
  type: "open";
  criteria: OpenCriterion[];
  modelAnswer: string;
  minWords: number;
};

export type ExamQuestion = SingleChoiceQuestion | MultipleChoiceQuestion | OpenQuestion;

export type Exam = {
  pathSlug: string;
  /** Aantal vragen per poging, getrokken uit de vragenbank. */
  questionCount: number;
  /** Minimale score in procenten. */
  passingScore: number;
  maxAttempts: number;
  /** Geschatte duur in minuten. */
  estimatedMinutes: number;
  /** Harde tijdslimiet in minuten; daarna wordt automatisch ingeleverd. */
  timeLimitMinutes: number;
  /** Hoofdstuk dat de toets zelf is; telt niet mee als voorwaarde. */
  chapterSlug?: string;
  questions: ExamQuestion[];
};

export type ExamAttempt = {
  number: number;
  date: string;
  score: number;
  passed: boolean;
};

// Volledige vragenbank met antwoorden: alleen op de server gebruiken (zie server/services/exam.ts).
export async function getExam(pathSlug: string): Promise<Exam | undefined> {
  return mockExams.find((e) => e.pathSlug === pathSlug);
}

export async function getExams(): Promise<Exam[]> {
  return mockExams;
}
