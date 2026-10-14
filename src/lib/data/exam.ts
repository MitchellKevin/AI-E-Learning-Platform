import { mockExamAttempts, mockExams } from "@/lib/mock/exam";

// Eindtoets per leerpad. Nu op mock-data; later vragen uit Storyblok en pogingen uit MongoDB.

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

// Later: alleen vragen zonder antwoorden naar de client; nakijken gebeurt dan in een server action.
export async function getExam(pathSlug: string): Promise<Exam | undefined> {
  return mockExams.find((e) => e.pathSlug === pathSlug);
}

export async function getExams(): Promise<Exam[]> {
  return mockExams;
}

// Pogingen van de ingelogde gebruiker; later uit MongoDB.
export async function getExamAttempts(pathSlug: string): Promise<ExamAttempt[]> {
  return mockExamAttempts[pathSlug] ?? [];
}

// Samenvatting voor op de leerpadpagina.
export async function getExamOverview(pathSlug: string) {
  const [exam, attempts] = await Promise.all([getExam(pathSlug), getExamAttempts(pathSlug)]);
  if (!exam) return undefined;
  const best = attempts.reduce<number | null>((max, a) => (max === null || a.score > max ? a.score : max), null);
  return {
    questionCount: exam.questionCount,
    passingScore: exam.passingScore,
    maxAttempts: exam.maxAttempts,
    estimatedMinutes: exam.estimatedMinutes,
    chapterSlug: exam.chapterSlug,
    attemptsUsed: attempts.length,
    bestScore: best,
    passed: attempts.some((a) => a.passed),
  };
}
