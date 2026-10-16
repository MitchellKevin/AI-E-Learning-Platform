import { addDays, dayKey } from "./dates";

// Streakberekening op kalenderdagen ("YYYY-MM-DD"). Puur, dus makkelijk te testen.

/** Aantal dagen op rij tot en met vandaag; telt ook door als je vandaag nog niet hebt geleerd maar gisteren wel. */
export function currentStreak(days: Iterable<string>, today: Date = new Date()) {
  const set = new Set(days);
  let cursor = set.has(dayKey(today)) ? today : addDays(today, -1);
  let streak = 0;
  while (set.has(dayKey(cursor))) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

/** Langste reeks opeenvolgende dagen ooit. */
export function longestStreak(days: Iterable<string>) {
  const sorted = [...new Set(days)].sort();
  let longest = 0;
  let run = 0;
  let previous: string | undefined;
  for (const day of sorted) {
    run = previous && dayKey(addDays(new Date(`${previous}T12:00:00Z`), 1)) === day ? run + 1 : 1;
    longest = Math.max(longest, run);
    previous = day;
  }
  return longest;
}
