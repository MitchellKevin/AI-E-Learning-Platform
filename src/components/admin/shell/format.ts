// Datum- en tekstopmaak voor het beheergedeelte. Alles in UTC, zodat server en browser dezelfde dag zien.

const DAY = 24 * 60 * 60 * 1000;

export const toDate = (iso: string) => new Date(iso.length === 10 ? `${iso}T00:00:00Z` : iso);

export const toIsoDay = (date: Date) => date.toISOString().slice(0, 10);

/** Aantal hele dagen van `from` naar `to` (negatief als `to` eerder ligt). */
export const daysBetween = (from: string, to: string) => Math.round((toDate(to).getTime() - toDate(from).getTime()) / DAY);

export const addDays = (iso: string, days: number) => toIsoDay(new Date(toDate(iso).getTime() + days * DAY));

/** "30 nov" */
export const formatShortDate = (iso: string) =>
  toDate(iso).toLocaleDateString("nl-NL", { day: "numeric", month: "short", timeZone: "UTC" }).replace(".", "");

/** "30 november 2026" */
export const formatLongDate = (iso: string) =>
  toDate(iso).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

/** "nov" of "nov 2026" */
export const formatMonth = (yyyyMm: string, withYear = false) =>
  toDate(`${yyyyMm}-01`)
    .toLocaleDateString("nl-NL", { month: withYear ? "long" : "short", year: withYear ? "numeric" : undefined, timeZone: "UTC" })
    .replace(".", "");

export function formatDaysAgo(days: number | null) {
  if (days === null) return "Nog niet ingelogd";
  if (days <= 0) return "Vandaag";
  if (days === 1) return "Gisteren";
  return `${days} dagen geleden`;
}

export function formatDaysLeft(days: number) {
  if (days < -1) return `${-days} dagen verlopen`;
  if (days === -1) return "Gisteren verlopen";
  if (days === 0) return "Vandaag";
  if (days === 1) return "Morgen";
  return `Nog ${days} dagen`;
}

export const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** Uren met één decimaal waar nodig: "12", "1,5". */
export const formatHours = (hours: number) =>
  hours.toLocaleString("nl-NL", { maximumFractionDigits: hours < 10 ? 1 : 0 });
