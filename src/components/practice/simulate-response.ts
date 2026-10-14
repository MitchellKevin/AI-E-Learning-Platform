import type { PracticeExercise } from "@/lib/data/practice";
import { responseTier } from "./review-prompt";

// Kiest een voorbeeldantwoord bij de prompt. Straks komt hier het echte antwoord van de Claude API.

// Korte openingszin bij een volgende poging, zodat elk antwoord anders begint.
const intros = {
  better: [
    "Dank voor de extra richting. Dit is een nieuwe versie:",
    "Met deze aanvullingen kan ik gerichter antwoorden:",
    "Duidelijker zo. Hier is de aangepaste versie:",
  ],
  same: [
    "Hier is een nieuwe versie op basis van je prompt:",
    "Ik heb het opnieuw geprobeerd:",
    "Een tweede invalshoek op dezelfde vraag:",
  ],
  worse: [
    "Je prompt geeft minder houvast dan de vorige, dus ik moet meer invullen:",
    "Met minder context dan eerst kom ik hierop uit:",
    "Ik heb minder om op te bouwen dan net. Dit is mijn antwoord:",
  ],
};

// Begin van de prompt als onderwerp voor de vrije oefenruimte.
function topicOf(prompt: string) {
  const first = prompt.trim().split(/\n|(?<=[.!?])\s/)[0].replace(/[.:!?]+$/, "");
  return first.length > 64 ? `${first.slice(0, 61).trimEnd()}…` : first;
}

export function buildResponse({
  exercise,
  prompt,
  score,
  attempt,
  previousScore,
}: {
  exercise: PracticeExercise;
  prompt: string;
  score: number;
  /** 0-gebaseerd nummer van de poging. */
  attempt: number;
  previousScore?: number;
}) {
  const tier = responseTier(score);
  let text = exercise.responses[tier];
  if (exercise.free) text = text.replaceAll("{onderwerp}", topicOf(prompt));

  // Pure JSON-output krijgt geen inleiding; dat is juist wat de oefening vraagt.
  if (previousScore !== undefined && !/^\s*[[{]/.test(text)) {
    const previousTier = responseTier(previousScore);
    const kind = tier > previousTier ? "better" : tier < previousTier ? "worse" : "same";
    const list = intros[kind];
    text = `${list[attempt % list.length]}\n\n${text}`;
  }

  return text;
}
