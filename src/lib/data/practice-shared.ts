import type { PracticeAudience } from "./practice";

// Labels die ook in client-componenten nodig zijn (zonder de database-code van practice.ts).
export const audienceLabel: Record<PracticeAudience, string> = {
  iedereen: "Voor iedereen",
  designers: "Voor designers",
  developers: "Voor developers",
};
