"use client";

import { useId, useState } from "react";
import clsx from "clsx";
import { ChevronDown, Flame } from "lucide-react";
import { Avatar } from "@/components/ui";
import { Badge, Button } from "@/components/kit";
import { formatNumber } from "@/lib/format";
import type { RankedEntry } from "@/lib/data/leaderboard";
import { changeText } from "./labels";
import styles from "./rank-list.module.scss";

// Zichtbaar zonder uitklappen (inclusief het podium).
const TOP = 10;

type Props = {
  entries: RankedEntry[];
  /** Vanaf welke positie de lijst begint (3 als het podium de top 3 al toont). */
  start: number;
  showTeam: boolean;
};

export function RankList({ entries, start, showTeam }: Props) {
  const listId = useId();
  const [expanded, setExpanded] = useState(false);
  const meIndex = entries.findIndex((e) => e.isMe);

  const top = entries.slice(start, expanded ? entries.length : TOP);
  // Buiten de top? Dan jouw regel met je directe buren eronder vastgezet.
  const around =
    !expanded && meIndex >= TOP
      ? entries.slice(Math.max(TOP, meIndex - 1), meIndex + 2).map((entry, i) => ({ entry, index: Math.max(TOP, meIndex - 1) + i }))
      : [];
  const hasGap = around.length > 0 && around[0].index > TOP;
  const hidden = entries.length - Math.max(TOP, start) - around.length;

  if (top.length === 0 && around.length === 0) return null;

  return (
    <div className={styles.root}>
      <div className={styles.head} aria-hidden>
        <span>#</span>
        <span />
        <span>Naam</span>
        <span className={styles.headEnd}>Streak</span>
        <span className={styles.headEnd}>Punten</span>
      </div>
      <ol id={listId} className={styles.list} start={top[0]?.rank}>
        {top.map((entry, i) => (
          <RankRow key={entry.id} entry={entry} showTeam={showTeam} index={i} />
        ))}
        {hasGap && (
          <li className={styles.gap} aria-hidden>
            <span />
            <span />
            <span />
          </li>
        )}
        {around.map(({ entry }, i) => (
          <RankRow key={entry.id} entry={entry} showTeam={showTeam} index={top.length + i + 1} />
        ))}
      </ol>
      {(hidden > 0 || expanded) && entries.length > TOP && (
        <div className={styles.more}>
          <Button
            variant="ghost"
            size="sm"
            aria-expanded={expanded}
            aria-controls={listId}
            iconRight={<ChevronDown className={clsx(styles.chevron, expanded && styles.flipped)} />}
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? "Toon alleen de top 10" : `Toon volledige ranglijst (${entries.length})`}
          </Button>
        </div>
      )}
    </div>
  );
}

function RankRow({ entry, showTeam, index }: { entry: RankedEntry; showTeam: boolean; index: number }) {
  return (
    <li
      value={entry.rank}
      className={clsx(styles.row, entry.isMe && styles.me)}
      style={{ "--i": Math.min(index, 12) } as React.CSSProperties}
      aria-current={entry.isMe ? "true" : undefined}
    >
      <span className={styles.rank}>
        <span className="sr-only">Plek </span>
        {entry.rank}
      </span>
      <RankChange change={entry.change} />
      <span className={styles.person}>
        <span className={styles.avatar}>
          <Avatar initials={entry.initials} size={32} />
        </span>
        <span className={styles.who}>
          <span className={styles.nameLine}>
            <span className={styles.name}>{entry.name}</span>
            {entry.isMe && (
              <Badge variant="brand" size="sm" className={styles.youBadge}>
                Jij
              </Badge>
            )}
          </span>
          {showTeam && <span className={styles.team}>{entry.team}</span>}
        </span>
      </span>
      <span className={clsx(styles.streak, entry.streak === 0 && styles.noStreak)}>
        <Flame aria-hidden />
        <span aria-hidden>{entry.streak || "–"}</span>
        <span className="sr-only">
          {entry.streak ? `${entry.streak} ${entry.streak === 1 ? "dag" : "dagen"} streak` : "geen streak"}
        </span>
      </span>
      <span className={styles.points}>
        {formatNumber(entry.points)}
        <span className="sr-only"> punten</span>
      </span>
    </li>
  );
}

export function RankChange({ change }: { change: number | null }) {
  const label = <span className="sr-only">{changeText(change)}</span>;

  if (change === null) {
    return (
      <span className={styles.change}>
        <Badge variant="neutral" size="sm" className={styles.newBadge}>
          Nieuw
        </Badge>
        {label}
      </span>
    );
  }

  return (
    <span className={clsx(styles.change, change > 0 ? styles.up : change < 0 ? styles.down : styles.same)}>
      <span aria-hidden>{change > 0 ? `▲${change}` : change < 0 ? `▼${-change}` : "–"}</span>
      {label}
    </span>
  );
}
