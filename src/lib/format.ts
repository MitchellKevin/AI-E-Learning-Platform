export const formatNumber = (n: number) => n.toLocaleString("nl-NL");

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" });

export const formatToday = (date = new Date()) =>
  date.toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long" });
