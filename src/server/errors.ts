// Een fout die de gebruiker mag zien, met een Nederlandse melding.
// Next.js vervangt in productie de melding van elke fout die uit een server action wordt gegooid door een
// algemene tekst. Server actions geven een UserError daarom terug als data (zie guarded in actions/result.ts).
// Bewust zonder server-only imports: services en tests gebruiken deze klasse ook.
export class UserError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserError";
  }
}
