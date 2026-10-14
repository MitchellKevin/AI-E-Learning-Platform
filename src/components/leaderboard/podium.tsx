import clsx from "clsx";
import { Avatar } from "@/components/ui";
import { CountUp } from "@/components/count-up";
import type { RankedEntry } from "@/lib/data/leaderboard";
import styles from "./podium.module.scss";

type Props = {
  /** De eerste drie van de ranglijst. */
  entries: RankedEntry[];
  showTeam: boolean;
};

// Top 3 op een podium: in de DOM 1-2-3, visueel 2-1-3. De treden rijzen op, daarna verschijnen de namen.
export function Podium({ entries, showTeam }: Props) {
  return (
    <ol className={styles.podium} aria-label="Top 3">
      {entries.slice(0, 3).map((entry, i) => (
        <li
          key={entry.id}
          className={clsx(styles.place, styles[`place${i + 1}`], entry.isMe && styles.me)}
          // Derde rijst eerst, de winnaar als laatste.
          style={{ "--order": 2 - i } as React.CSSProperties}
        >
          <span className="sr-only">Plek {entry.rank}: </span>
          <div className={styles.person}>
            <span className={styles.avatar}>
              <Avatar initials={entry.initials} size={i === 0 ? 56 : 44} />
              {i === 0 && (
                <span className={styles.crown} aria-hidden>
                  <CrownMark />
                </span>
              )}
            </span>
            <p className={styles.name}>
              {entry.name}
              {entry.isMe && <span className={styles.you}> (jij)</span>}
            </p>
            {showTeam && <p className={styles.team}>{entry.team}</p>}
            <p className={styles.points}>
              <CountUp value={entry.points} duration={900} /> <span className={styles.unit}>punten</span>
            </p>
          </div>
          <div className={styles.step} aria-hidden>
            <span className={styles.rank}>{entry.rank}</span>
          </div>
        </li>
      ))}
    </ol>
  );
}

// Klein kroontje boven de nummer 1.
function CrownMark() {
  return (
    <svg viewBox="0 0 24 16" width="20" height="14" fill="currentColor">
      <path d="M2 4.5 7 9l5-8 5 8 5-4.5-2 11.5H4L2 4.5Z" />
    </svg>
  );
}
