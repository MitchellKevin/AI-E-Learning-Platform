import { Alert, Button, Stat, StatGroup, type StatTrend } from "@/components/kit";
import { CountUp } from "@/components/count-up";
import { formatNumber } from "@/lib/format";
import type { LeaderboardBoard } from "@/lib/data/leaderboard";
import { periodPhrases, places } from "./labels";
import styles from "./my-position.module.scss";

// De streakbonus valt elke 7 dagen op rij (dag 7, 14, 21…).
const BONUS_EVERY = 7;

function streakHint(streak: number) {
  if (streak > 0 && streak % BONUS_EVERY === 0) return "Streakbonus vandaag verdiend";
  const left = BONUS_EVERY - (streak % BONUS_EVERY);
  const next = streak < BONUS_EVERY ? "je streakbonus" : "je volgende streakbonus";
  return `Nog ${left} ${left === 1 ? "dag" : "dagen"} tot ${next}`;
}

// Jouw plek, punten, streak en hoeveel je nog nodig hebt voor de volgende plek.
export function MyPosition({ board }: { board: LeaderboardBoard }) {
  const { me, entries, period, scope } = board;
  const people = scope === "team" ? "teamleden" : "collega's";

  if (!me) {
    return (
      <Alert
        title={`Je hebt ${periodPhrases[period]} nog geen punten`}
        action={
          <Button href="/dashboard" size="sm" variant="secondary">
            Verder leren
          </Button>
        }
      >
        Rond een hoofdstuk of oefening af om op de ranglijst te komen.
      </Alert>
    );
  }

  const index = entries.indexOf(me);
  // Laatste persoon boven je met meer punten (bij gelijke stand deel je de plek).
  const ahead = entries.slice(0, index).filter((e) => e.points > me.points).at(-1);
  const behind = entries.slice(index + 1).find((e) => e.points < me.points);

  const trend: StatTrend =
    me.change === null
      ? { value: "Nieuw", direction: "flat", label: "op de ranglijst" }
      : me.change === 0
        ? { value: "Gelijk", direction: "flat", label: "t.o.v. vorige week" }
        : {
            value: `${me.change > 0 ? "+" : "−"}${places(Math.abs(me.change))}`,
            direction: me.change > 0 ? "up" : "down",
            label: "t.o.v. vorige week",
          };

  return (
    <section aria-labelledby="my-position-title" className={styles.root}>
      <h2 id="my-position-title" className="sr-only">
        Jouw positie
      </h2>
      <StatGroup columns={4}>
        <Stat
          value={`#${me.rank}`}
          label={`Jouw plek van ${entries.length} ${people}`}
          accent
          trend={trend}
        />
        <Stat value={<CountUp value={me.points} />} label={`Punten ${periodPhrases[period]}`} />
        <Stat
          value={<CountUp value={me.streak} />}
          label="Dagen streak"
          hint={streakHint(me.streak)}
        />
        {ahead ? (
          <Stat
            value={formatNumber(ahead.points - me.points + 1)}
            label={`Punten tot plek ${ahead.rank}`}
            hint={`Haal ${ahead.name} in`}
          />
        ) : behind ? (
          <Stat
            value={`+${formatNumber(me.points - behind.points)}`}
            label={`Voorsprong op plek ${behind.rank}`}
            hint="Je staat bovenaan"
          />
        ) : (
          <Stat value="–" label="Volgende plek" hint="Je staat bovenaan" />
        )}
      </StatGroup>
    </section>
  );
}
