import type { ExamQuestion, OpenQuestion } from "@/lib/data/exam";

// Pure toetslogica: trekken, schudden en nakijken. Later verhuist het nakijken naar een server action.

export type AnswerValue = string | string[];
export type Answers = Record<string, AnswerValue | undefined>;

export type QuestionStatus = "correct" | "partial" | "wrong" | "unanswered";

export type OpenFeedback = {
  summary: string;
  criteria: { label: string; met: boolean }[];
};

export type QuestionResult = {
  questionId: string;
  status: QuestionStatus;
  /** 1 bij goed, 0,5 bij deels goed (alleen open vragen), anders 0. */
  points: number;
  feedback?: OpenFeedback;
};

export type ExamResult = {
  score: number;
  points: number;
  total: number;
  passed: boolean;
  results: QuestionResult[];
};

// Kleine, voorspelbare random-generator (mulberry32), zodat een poging altijd dezelfde volgorde heeft.
function random(seed: number) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function seedFrom(text: string) {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function shuffle<T>(items: T[], next: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Trekt `count` vragen, verdeeld over de onderwerpen, met minstens één open vraag als die er is.
 * Vraag- en antwoordvolgorde liggen vast per seed (pad + pogingnummer).
 */
export function drawQuestions(bank: ExamQuestion[], count: number, seed: number): ExamQuestion[] {
  const next = random(seed);
  const byTopic = new Map<string, ExamQuestion[]>();
  for (const q of bank) byTopic.set(q.topicId, [...(byTopic.get(q.topicId) ?? []), q]);
  const pools = [...byTopic.values()].map((pool) => shuffle(pool, next));

  // Om de beurt een vraag per onderwerp, zodat elk onderwerp aan bod komt.
  const drawn: ExamQuestion[] = [];
  while (drawn.length < Math.min(count, bank.length)) {
    for (const pool of pools) {
      const q = pool.shift();
      if (q && drawn.length < count) drawn.push(q);
    }
  }

  if (!drawn.some((q) => q.type === "open")) {
    const open = bank.find((q) => q.type === "open");
    if (open) {
      const sameTopic = drawn.findLastIndex((q) => q.topicId === open.topicId);
      drawn[sameTopic === -1 ? drawn.length - 1 : sameTopic] = open;
    }
  }

  return shuffle(drawn, next).map((q) => (q.type === "open" ? q : { ...q, options: shuffle(q.options, next) }));
}

export function isAnswered(answer: AnswerValue | undefined) {
  if (answer === undefined) return false;
  return Array.isArray(answer) ? answer.length > 0 : answer.trim().length > 0;
}

export const countWords = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

const normalize = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

// Gesimuleerde AI-beoordeling op basis van criteria. Later: Claude API met de criteria als rubric.
function gradeOpen(question: OpenQuestion, answer: string): QuestionResult {
  const text = normalize(answer);
  const criteria = question.criteria.map((c) => ({
    label: c.label,
    met: c.keywords.some((k) => text.includes(normalize(k))),
  }));
  const met = criteria.filter((c) => c.met).length;
  const tooShort = countWords(answer) < Math.ceil(question.minWords / 2);
  const needed = Math.ceil((question.criteria.length * 2) / 3);

  let status: QuestionStatus = met >= needed ? "correct" : met > 0 ? "partial" : "wrong";
  if (tooShort && status === "correct") status = "partial";

  const missing = criteria.filter((c) => !c.met).map((c) => lowerFirst(c.label));
  const summary =
    status === "correct"
      ? missing.length
        ? `Sterk antwoord: je raakt de kern. Om het helemaal af te maken: ${missing[0]}.`
        : "Sterk en volledig antwoord: je behandelt alle punten die we zochten."
      : status === "partial"
        ? tooShort && met >= needed
          ? "De inhoud klopt, maar je antwoord is erg kort. Licht je punten iets verder toe."
          : `Je bent op de goede weg, maar het antwoord is nog niet compleet. Je mist nog: ${missing.join("; ")}.`
        : "Je antwoord raakt de kern nog niet. Bekijk het voorbeeldantwoord en de uitleg hieronder.";

  return {
    questionId: question.id,
    status,
    points: status === "correct" ? 1 : status === "partial" ? 0.5 : 0,
    feedback: { summary, criteria },
  };
}

const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

export function gradeQuestion(question: ExamQuestion, answer: AnswerValue | undefined): QuestionResult {
  if (!isAnswered(answer)) return { questionId: question.id, status: "unanswered", points: 0 };

  if (question.type === "open") return gradeOpen(question, answer as string);

  const correct =
    question.type === "single"
      ? answer === question.correct
      : // Meerkeuze telt alleen als precies de juiste opties zijn gekozen.
        (answer as string[]).length === question.correct.length &&
        question.correct.every((id) => (answer as string[]).includes(id));

  return { questionId: question.id, status: correct ? "correct" : "wrong", points: correct ? 1 : 0 };
}

export function gradeExam(questions: ExamQuestion[], answers: Answers, passingScore: number): ExamResult {
  const results = questions.map((q) => gradeQuestion(q, answers[q.id]));
  const points = results.reduce((sum, r) => sum + r.points, 0);
  const score = Math.round((points / questions.length) * 100);
  return { score, points, total: questions.length, passed: score >= passingScore, results };
}

export function formatDuration(ms: number) {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return { clock: `${minutes}:${String(seconds).padStart(2, "0")}`, minutes, seconds };
}
