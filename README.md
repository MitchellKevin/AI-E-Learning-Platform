# AI Academy

E-learningplatform voor het team: leerpad AI 101, daarna de specialisatie UI/UX Design of Software Development.

## Starten

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000.

## Stack

- Next.js 15 (App Router) + TypeScript
- SCSS: CSS Modules per component, tokens en mixins in `src/styles`
- Later: Storyblok (content), MongoDB (gebruikers, voortgang, punten), Auth.js, Vercel

## Structuur

| Scherm | Route |
| --- | --- |
| Dashboard | `/` |
| Leerpaden | `/leerpaden` |
| Leerpad-detail | `/leerpaden/[path]` |
| Hoofdstuk met taken | `/leerpaden/[path]/[chapter]` |
| Kies je specialisatie | `/leerpaden/kies` |
| Certificaat | `/profiel/certificaten/[path]` |

Data loopt via twee lagen die nu mock-data teruggeven:

- `src/lib/content.ts`: leerpaden, onderwerpen, hoofdstukken, taken. Wordt Storyblok.
- `src/lib/user-data.ts`: gebruiker, voortgang, punten, leaderboard, badges, certificaten. Wordt MongoDB.

De pagina's gebruiken alleen deze functies, dus de backend aansluiten verandert niets aan de componenten.

## Nog niet gebouwd

- Opslaan van voortgang: afgeronde taken leven nu alleen in de browser-state van de pagina
- Inloggen, echte punten/streaks, de eindtoets, PDF-generatie en de publieke `/verify/[nummer]`-pagina
- De pagina's Oefenen en Leaderboard zijn placeholders
