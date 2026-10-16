# AI Academy

E-learningplatform voor teams: de gezamenlijke basis AI 101, daarna de specialisatie UI/UX Design of Software Development. Met voortgang, punten, streaks, badges, een leaderboard, een eindtoets met certificaat en beheer voor teammanagers en beheerders.

## Starten

```bash
pnpm install
cp .env.example .env.local   # vul MONGODB_URI en AUTH_SECRET in
pnpm db:seed                 # demo-organisatie Studio Noord (wist de database eerst)
pnpm dev
```

Open http://localhost:3000/inloggen. Met `DEMO_LOGIN=true` staan onderaan knoppen om direct in te loggen:

| Account | Rol |
| --- | --- |
| sanne@studionoord.nl | Beheerder (ziet alles) |
| lotte@studionoord.nl | Teammanager |
| tim@studionoord.nl | Cursist |

Inloggen per e-mail werkt ook: in development staat de inloglink in de console van de dev-server en in `.dev-mail.log`.

## Scripts

| Script | Wat het doet |
| --- | --- |
| `pnpm dev` | Dev-server |
| `pnpm build` | Productiebuild (`NEXT_DIST_DIR=.next-check pnpm build` bouwt naast een draaiende dev-server) |
| `pnpm test` | Vitest: unit- en integratietests tegen een in-memory MongoDB |
| `pnpm db:seed` | Database vullen met Studio Noord (24 collega's) en Bureau Zuid (afschermingstest) |
| `pnpm cron <taak>` | Een geplande taak met de hand draaien tegen de database uit `.env.local` (zonder taak: lijst) |

## Geplande taken

Vercel Cron roept `/api/cron/<taak>` aan (zie `vercel.json`, tijden in UTC). De route vraagt `Authorization: Bearer <CRON_SECRET>`; zonder `CRON_SECRET` (minstens 16 tekens, bijvoorbeeld `openssl rand -base64 32`) in de omgeving geeft hij altijd 401. Zet hetzelfde geheim in Vercel, dan stuurt Vercel Cron het zelf mee. Elke taak is idempotent en heeft een slot in `JobRun`, dus nog een keer draaien stuurt of maakt niets dubbel.

| Taak | Schema | Wat het doet |
| --- | --- | --- |
| `herinneringen` | dagelijks 15:00 UTC | Dagelijkse leerherinnering (werkdagen, na de gekozen tijd, als je vandaag nog niet leerde), streak in gevaar (vanaf 16:00) en deadlines van toewijzingen (7, 3 en 1 dag van tevoren) |
| `leaderboard-maand` | dagelijks 05:00 UTC | Legt de stand van de vorige maand per team vast; de top 3 krijgt de badge Top 3. Staat de maand er al, dan gebeurt er niets |
| `opruimen` | dagelijks 03:00 UTC | Oude uitnodigingen weg, accounts 30 dagen na een verwijderverzoek, gedeactiveerde gebruikers na de bewaartermijn, organisaties 14 dagen na het verzoek |

Op het Hobby-plan mag elke cron één keer per dag. De herinnering komt dan om 16:00 of 17:00 (Nederlandse tijd, winter of zomer) voor iedereen wiens tijd dan voorbij is; wie een latere tijd kiest, krijgt die dag niets. Op Pro kun je `herinneringen` elk uur draaien (`"0 * * * *"`), dan komt de herinnering op de gekozen tijd. Lokaal: `pnpm cron herinneringen`.

## Stack

- Next.js 15 (App Router) + TypeScript, SCSS (CSS Modules, tokens en mixins in `src/styles`)
- MongoDB (Atlas, regio Frankfurt) met Mongoose
- Auth.js v5: inloglink per e-mail, Microsoft Entra ID en Google (actief zodra de keys in `.env.local` staan), JWT-sessies
- Hosting: Vercel

## Hoe het in elkaar zit

```
src/
  app/            routes: (marketing), (auth), (app) en /verify
  components/     UI; kit/ bevat de gedeelde bouwstenen
  lib/            datalaag die de pagina's aanroepen (content.ts, user-data.ts, data/*)
  server/
    models/       Mongoose-schema's
    services/     domeinlogica: voortgang, punten, streaks, badges, toets, leaderboard, beheer
    actions/      server actions (met zod-validatie) die de services aanroepen
    jobs/         geplande taken (herinneringen, maandstand leaderboard, opruimen)
    session.ts    requireUser / requireRole / assertRole
  auth.ts         Auth.js-config (Node), auth.config.ts het edge-deel voor de middleware
  middleware.ts   stuurt zonder sessie de app-routes naar /inloggen (meer niet)
scripts/seed.ts   demo-data
tests/            vitest
```

**Organisaties.** Elke query is beperkt tot de organisatie van de ingelogde gebruiker. Je komt in een organisatie via een uitnodiging of een geverifieerd domein met automatisch toetreden. Dat laatste kost ook een licentie: is alles bezet, dan is een uitnodiging nodig.

**Sessies.** De middleware kijkt alleen óf er een sessie is. Rol, onboarding en of je account nog actief is, controleert de server bij elke request tegen de database (`src/server/session.ts`). De claims in het JWT kunnen verouderd zijn, omdat Auth.js het cookie vanuit server components niet kan herschrijven. Daardoor gaat een rolwijziging of deactivatie direct in, zonder redirect-lussen. Een verouderd cookie zonder geldige gebruiker wordt via `/uitloggen` gewist.

**Rollen.** Er zijn drie rollen:

| Rol | Toegang |
| --- | --- |
| Cursist | Leren |
| Teammanager | Daarnaast `/beheer`: overzicht, team, toewijzingen en rapportages |
| Beheerder | Daarnaast gebruikers, abonnement en organisatie |

**Punten.** Elke `PointEvent` is uniek per reden en onderwerp, dus nooit dubbel. De regels:

| Actie | Punten |
| --- | --- |
| Hoofdstuk afronden | +120 |
| Quizvraag in één keer goed | +25 |
| Oefening afronden | +40 |
| Elke 7 dagen op rij | +50 |
| Certificaat behalen | +500 |

**Eindtoets.** De browser krijgt de vragen zonder antwoorden en de server kijkt na. Er zijn maximaal 3 pogingen en je slaagt vanaf 80%. Bij slagen volgen het certificaat, de punten en een melding.

## Beveiliging

- **Rate limiting** in MongoDB (`src/server/services/rate-limit.ts`, geen Redis nodig). Het werkt met een vast tijdvenster en gehashte sleutels, en geldt voor:
  - inloglinks (per adres en per IP), ook als iemand Auth.js direct aanroept;
  - de demo-login en de publieke formulieren;
  - uitnodigingen, herinneringen en toewijzingen;
  - de toets, Oefenen en het afronden van taken.

  De limieten per IP zijn ruim, omdat collega's vaak via hetzelfde kantoor-IP binnenkomen.
- **Headers:** CSP, `X-Frame-Options: DENY`, `nosniff`, Referrer- en Permissions-Policy, en HSTS in productie (`next.config.ts`).
- **SSO:** een SSO-login wordt nooit gekoppeld aan een sessie die er al is. "Alleen via SSO" blokkeert inloglinks voor de domeinen van de organisatie.
- **Domeinverificatie:** loopt via een echt DNS-TXT-record. Of een domein geverifieerd is, komt altijd uit de database.
- **Demo-login:** alleen met `DEMO_LOGIN=true`, en alleen voor de demo-accounts (`DEMO_ACCOUNTS` overschrijft de lijst).

## Nog mock

- **Content:** leerpaden, help- en marketingteksten en de vragenbank (`src/lib/mock-content.ts`, `src/lib/mock/*`). Dit wordt Storyblok.
- **AI-tutor en Oefenen:** de antwoorden en de beoordeling zijn gesimuleerd. Dit wordt de Claude API.
- **Abonnement, betaalmethode en facturen:** dit wordt Stripe.
- **E-mail:** gaat via `src/server/mailer.ts`, dat nu naar de console logt. Dit wordt Resend.
- **Certificaat als PDF:** nu via de printdialoog.
