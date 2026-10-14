import type { TutorContext, TutorEntry } from "@/lib/data/tutor";

// Simpele trefwoordmatching als stand-in voor de Claude API.

function normalize(text: string) {
  return ` ${text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\p{L}\p{N};\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()}`;
}

/** Beste antwoord voor een vraag, of undefined als niets goed genoeg matcht. */
export function findAnswer(context: TutorContext, question: string): TutorEntry | undefined {
  const q = normalize(question);
  let best: TutorEntry | undefined;
  let bestScore = 0;

  for (const entry of context.entries) {
    // Trefwoorden matchen aan het begin van een woord, zodat "hallucin" ook "hallucineren" vindt.
    let score = entry.keywords.reduce((sum, kw) => (q.includes(normalize(kw)) ? sum + kw.length : sum), 0);
    // Stof uit het eigen hoofdstuk weegt iets zwaarder dan algemene kennis.
    if (score > 0 && !entry.source) score += 3;
    if (score > bestScore) {
      best = entry;
      bestScore = score;
    }
  }

  return bestScore >= 4 ? best : undefined;
}
