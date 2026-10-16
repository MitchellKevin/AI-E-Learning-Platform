// Datumhulpjes. Kalenderdagen rekenen we in Europe/Amsterdam, ook als de server in UTC draait.

const dayFormat = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Amsterdam", year: "numeric", month: "2-digit", day: "2-digit" });

/** "YYYY-MM-DD" in Amsterdamse tijd. */
export function dayKey(date: Date = new Date()) {
  return dayFormat.format(date);
}

export function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

const hourFormat = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Amsterdam", hour: "2-digit", hourCycle: "h23" });

/** Middernacht in Amsterdam aan het begin van dag `key`, rekening houdend met zomer- en wintertijd. */
export function amsterdamMidnight(key: string) {
  for (const offset of ["+02:00", "+01:00"]) {
    const date = new Date(`${key}T00:00:00${offset}`);
    if (dayKey(date) === key && Number(hourFormat.format(date)) === 0) return date;
  }
  return new Date(`${key}T00:00:00+01:00`);
}

/** De dagsleutel `days` dagen na `key` ("YYYY-MM-DD"). */
export function shiftDayKey(key: string, days: number) {
  return new Date(Date.parse(`${key}T12:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);
}

/** Laatste seconde van dag `key` in Amsterdam (voor deadlines "tot en met"). */
export function endOfAmsterdamDay(key: string) {
  return new Date(amsterdamMidnight(shiftDayKey(key, 1)).getTime() - 1000);
}

/** Maandag 00:00 in Amsterdam van de week waarin `date` valt. */
export function startOfWeek(date: Date = new Date()) {
  const key = dayKey(date);
  const weekday = (new Date(`${key}T12:00:00Z`).getUTCDay() + 6) % 7; // ma = 0
  return amsterdamMidnight(shiftDayKey(key, -weekday));
}

/** De eerste van de maand, 00:00 in Amsterdam. */
export function startOfMonth(date: Date = new Date()) {
  const [y, m] = dayKey(date).split("-");
  return amsterdamMidnight(`${y}-${m}-01`);
}

/** De zeven dagsleutels (ma t/m zo) van de huidige week. */
export function weekDayKeys(date: Date = new Date()) {
  const monday = startOfWeek(date);
  return Array.from({ length: 7 }, (_, i) => dayKey(addDays(monday, i)));
}
