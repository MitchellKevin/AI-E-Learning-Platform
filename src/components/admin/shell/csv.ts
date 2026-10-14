// CSV-export in de browser. Puntkomma als scheidingsteken en een BOM, zodat Excel (NL) het meteen goed opent.

type Cell = string | number | null | undefined;

function escape(cell: Cell) {
  let text = cell === null || cell === undefined ? "" : String(cell);
  // Geen formules laten uitvoeren in Excel (CSV-injectie).
  if (typeof cell === "string" && /^[=+\-@]/.test(text)) text = `'${text}`;
  return /[";\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(header: string[], rows: Cell[][]) {
  return [header, ...rows].map((row) => row.map(escape).join(";")).join("\r\n");
}

export function downloadCsv(filename: string, header: string[], rows: Cell[][]) {
  const blob = new Blob(["﻿", toCsv(header, rows)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.append(link);
  link.click();
  link.remove();
  // Even wachten zodat de download zeker gestart is.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Bestandsnaam met datum, bv. "studio-noord-team-2026-10-14.csv". */
export const csvFilename = (name: string, today: string) => `studio-noord-${name}-${today}.csv`;

export const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
