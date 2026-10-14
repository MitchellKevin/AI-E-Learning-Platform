import clsx from "clsx";
import { formatNumber } from "@/lib/format";
import type { LeaderboardPeriod, TeamAverage } from "@/lib/data/leaderboard";
import { periodPhrases } from "./labels";
import styles from "./team-comparison.module.scss";

type Props = { teams: TeamAverage[]; period: LeaderboardPeriod };

// Teams naast elkaar op gemiddelde punten per lid, zodat grote teams geen voordeel hebben.
export function TeamComparison({ teams, period }: Props) {
  const max = Math.max(...teams.map((t) => t.average), 1);
  const mineIndex = teams.findIndex((t) => t.isMine);
  const mine = teams[mineIndex];

  return (
    <section className={styles.card} aria-labelledby="team-comparison-title">
      <h2 id="team-comparison-title" className={styles.title}>
        Teams vergeleken
      </h2>
      <p className={styles.description}>Gemiddelde punten per teamlid, {periodPhrases[period]}.</p>

      <ul className={styles.list}>
        {teams.map((team, i) => (
          <li
            key={team.team}
            className={clsx(styles.team, team.isMine && styles.mine)}
            style={{ "--i": i } as React.CSSProperties}
          >
            <div className={styles.label}>
              <span className={styles.name}>
                {team.team}
                {team.isMine && <span className={styles.mineTag}>Jouw team</span>}
              </span>
              <span className={styles.value}>
                {formatNumber(team.average)}
                <span className="sr-only"> punten gemiddeld,</span>
              </span>
            </div>
            <div className={styles.track} aria-hidden>
              <div className={styles.fill} style={{ width: `${(team.average / max) * 100}%` }} />
            </div>
            <span className={styles.members}>
              {team.members} {team.members === 1 ? "lid" : "leden"}
            </span>
          </li>
        ))}
      </ul>

      {mine && (
        <p className={styles.summary}>
          {mineIndex === 0
            ? `Team ${mine.team} staat ${periodPhrases[period]} bovenaan. Mooi bezig!`
            : `Team ${mine.team} staat ${periodPhrases[period]} ${mineIndex + 1}e van ${teams.length} teams.`}
        </p>
      )}
    </section>
  );
}
