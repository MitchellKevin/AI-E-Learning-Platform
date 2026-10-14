import clsx from "clsx";
import { BellRing, CalendarClock } from "lucide-react";
import { Avatar, StatusPill } from "@/components/kit";
import type { TeamPreviewMember } from "@/lib/data/marketing";
import styles from "./team-preview.module.scss";

const statusVariant = { Afgerond: "success", "Op schema": "brand", Achter: "warning" } as const;

// Voorbeeld van het manageroverzicht, opgebouwd uit dezelfde bouwstenen als de app.
export function TeamPreview({ members }: { members: TeamPreviewMember[] }) {
  const average = Math.round(members.reduce((sum, m) => sum + m.percent, 0) / members.length);

  return (
    <div
      className={styles.preview}
      role="img"
      aria-label={`Voorbeeld van het manageroverzicht: team Design staat gemiddeld op ${average}%, met per persoon de voortgang en status.`}
    >
      <div className={styles.cardWrap}>
        <div className={styles.card}>
          <div className={styles.head}>
            <div>
              <span className={styles.eyebrow}>Team Design · AI 101</span>
              <span className={styles.title}>Gemiddeld {average}% afgerond</span>
            </div>
            <span className={styles.deadline}>
              <CalendarClock aria-hidden />
              Deadline 1 december
            </span>
          </div>
          <ul className={styles.rows}>
            {members.map((m) => (
              <li key={m.name} className={styles.row}>
                <Avatar initials={m.initials} size={28} />
                <span className={styles.person}>
                  <span className={styles.name}>{m.name}</span>
                  <span className={styles.path}>{m.path}</span>
                </span>
                <span className={styles.progress}>
                  <span className={styles.track}>
                    <span
                      className={clsx(styles.fill, m.status === "Achter" && styles.behind)}
                      style={{ width: `${m.percent}%` }}
                    />
                  </span>
                  <span className={styles.percent}>{m.percent}%</span>
                </span>
                <StatusPill variant={statusVariant[m.status]} size="sm" className={styles.status}>
                  {m.status}
                </StatusPill>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className={styles.toastWrap}>
        <div className={styles.toast}>
          <BellRing aria-hidden />
          <span>
            <strong>Herinnering verstuurd</strong>
            <span>Thomas krijgt een seintje in Slack.</span>
          </span>
        </div>
      </div>
    </div>
  );
}
