import clsx from "clsx";
import { Check, Lock } from "lucide-react";
import type { ProfileBadge } from "@/lib/data/profile";
import { formatNumber } from "@/lib/format";
import { ProgressBar } from "@/components/ui";
import styles from "./badge-grid.module.scss";

const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" });

// Alle badges, behaald en nog te halen, met hoe je ze verdient.
export function BadgeGrid({ badges }: { badges: ProfileBadge[] }) {
  // Behaalde badges eerst, daarna de badges waar je het dichtst bij zit.
  const sorted = [...badges].sort((a, b) => {
    if (a.earned !== b.earned) return a.earned ? -1 : 1;
    const ratio = (x: ProfileBadge) => (x.progress ? x.progress.current / x.progress.target : -1);
    return ratio(b) - ratio(a);
  });

  return (
    <ul className={styles.grid}>
      {sorted.map((badge, i) => (
        <li key={badge.code} className={styles.item} style={{ "--i": i } as React.CSSProperties}>
          <article className={clsx(styles.badge, badge.earned && styles.earned)}>
            <span className={styles.icon} aria-hidden>
              {badge.code}
              {!badge.earned && (
                <span className={styles.lock}>
                  <Lock />
                </span>
              )}
            </span>
            <h3 className={styles.label}>{badge.label}</h3>
            <p className={styles.description}>{badge.description}</p>
            <div className={styles.foot}>
              {badge.earned ? (
                <p className={styles.earnedOn}>
                  <Check aria-hidden />
                  {badge.earnedAt ? `Behaald op ${shortDate(badge.earnedAt)}` : "Behaald"}
                </p>
              ) : badge.progress ? (
                <>
                  <ProgressBar
                    value={Math.min(100, (badge.progress.current / badge.progress.target) * 100)}
                    className={styles.progress}
                  />
                  <p className={styles.progressText}>
                    <span className="visually-hidden">Nog niet behaald. Voortgang: </span>
                    {formatNumber(badge.progress.current)} van {formatNumber(badge.progress.target)}{" "}
                    {badge.progress.unit}
                  </p>
                </>
              ) : (
                <p className={styles.progressText}>Nog niet behaald</p>
              )}
            </div>
          </article>
        </li>
      ))}
    </ul>
  );
}
