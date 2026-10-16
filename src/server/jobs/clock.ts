import { amsterdamMidnight, dayKey } from "@/server/services/dates";

export { amsterdamMidnight };

// Tijdhulpjes voor geplande taken. Alles in Europe/Amsterdam, ook als de server in UTC draait.

const zone = "Europe/Amsterdam";
const hourFormat = new Intl.DateTimeFormat("en-GB", { timeZone: zone, hour: "2-digit", hourCycle: "h23" });
const monthFormat = new Intl.DateTimeFormat("nl-NL", { timeZone: zone, month: "long", year: "numeric" });
const deadlineFormat = new Intl.DateTimeFormat("nl-NL", { timeZone: zone, weekday: "long", day: "numeric", month: "long" });

/** Uur van de dag (0–23) in Amsterdam. */
export function amsterdamHour(date: Date) {
  return Number(hourFormat.formatToParts(date).find((p) => p.type === "hour")?.value ?? 0);
}

/** Maandag t/m vrijdag in Amsterdam. */
export function isWeekday(date: Date) {
  const day = new Date(`${dayKey(date)}T12:00:00Z`).getUTCDay();
  return day >= 1 && day <= 5;
}

/** Dagsleutel van de dag ervoor ("YYYY-MM-DD"). */
export function previousDayKey(key: string) {
  return new Date(Date.parse(`${key}T12:00:00Z`) - 86_400_000).toISOString().slice(0, 10);
}

/** Aantal kalenderdagen van dag a naar dag b. */
export function daysBetween(a: string, b: string) {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);
}


/** De afgesloten maand vóór `now`: sleutel "YYYY-MM", begin en eind (exclusief). */
export function previousMonth(now: Date) {
  const [year, month] = dayKey(now).split("-").map(Number);
  const prev = month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
  const key = `${prev.year}-${String(prev.month).padStart(2, "0")}`;
  const start = amsterdamMidnight(`${key}-01`);
  const end = amsterdamMidnight(`${year}-${String(month).padStart(2, "0")}-01`);
  return { key, start, end, label: monthFormat.format(start) };
}

/** Hetzelfde moment, `months` maanden eerder. */
export function monthsBefore(date: Date, months: number) {
  const result = new Date(date);
  result.setUTCMonth(result.getUTCMonth() - months);
  return result;
}

/** Uur uit een tijd als "09:30"; ongeldig of leeg wordt 9 uur, net als de standaardinstelling. */
export function hourOf(time: string | null | undefined) {
  const hour = Number(time?.slice(0, 2));
  return time && Number.isInteger(hour) && hour >= 0 && hour <= 23 ? hour : 9;
}

export const formatDeadline = (date: Date) => deadlineFormat.format(date);
