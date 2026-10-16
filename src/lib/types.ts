// Contenttypes: komen later uit Storyblok.

export type Level = "Beginner" | "Gemiddeld" | "Gevorderd";

export type TopicIcon =
  | "cpu"
  | "sparkles"
  | "terminal"
  | "briefcase"
  | "scale"
  | "users"
  | "lightbulb"
  | "image"
  | "pen-tool"
  | "message-square"
  | "accessibility"
  | "code"
  | "bug"
  | "plug"
  | "database"
  | "network"
  | "line-chart"
  | "shield";

export type TranscriptCue = {
  start: number; // seconden vanaf het begin
  text: string;
};

export type QuizOption = {
  label: string;
  correct?: boolean;
  feedback?: string; // korte toelichting bij dit antwoord
};

export type TaskBlock =
  | { type: "text"; body: string }
  | { type: "steps"; steps: { label: string; body: string }[] }
  | { type: "code"; label: string; code: string }
  | {
      type: "knowledge_check";
      question: string;
      answers: string[];
      hint: string;
      explanation?: string; // "Uitleg" na het antwoord
    }
  | {
      type: "video";
      title: string;
      duration: number; // seconden
      posterColor?: string;
      transcript: TranscriptCue[];
    }
  | {
      type: "quiz";
      question: string;
      options: QuizOption[]; // precies één optie met correct: true
      explanation: string;
    };

export type TaskBlockType = TaskBlock["type"];

export type Task = {
  id: string;
  title: string;
  blocks: TaskBlock[];
};

export type Chapter = {
  id: string; // uniek over paden heen: "<pad>/<hoofdstuk>"
  slug: string;
  number: string;
  title: string;
  shortTitle: string;
  minutes: string;
  points: number;
  level: Level;
  audience: string;
  tasks: Task[];
};

export type Topic = {
  id: string;
  title: string;
  icon: TopicIcon;
  chapters: Chapter[];
};

export type LearningPath = {
  slug: string;
  title: string;
  audience?: string;
  shortDescription: string;
  description: string;
  level: Level;
  hours: number;
  prerequisite?: string;
  learningGoals: string[];
  certificateText: string;
  topics: Topic[];
};

// Gebruikersdata (uit MongoDB, zie src/lib/user-data.ts).

export type User = {
  id: string;
  firstName: string;
  lastName: string;
  initials: string;
};

export type Progress = {
  completedTasks: Record<string, string[]>; // chapter.id -> taak-id's
};

export type LeaderboardEntry = {
  rank: number;
  name: string;
  initials: string;
  points: number;
  isMe?: boolean;
};

export type Badge = {
  code: string;
  label: string;
  earned: boolean;
};

export type Certificate = {
  number: string;
  pathSlug: string;
  issuedAt: string;
  score: number;
};

export type Stats = {
  streak: number;
  points: number;
  teamRank: number;
  weekMinutes: (number | null)[];
  weekGoal: number;
};
