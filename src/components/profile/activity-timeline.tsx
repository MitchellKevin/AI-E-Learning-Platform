import Link from "next/link";
import clsx from "clsx";
import { Award, BookOpenCheck, ListChecks, Medal, Sparkles } from "lucide-react";
import type { Activity, ActivityType } from "@/lib/data/profile";
import { formatNumber } from "@/lib/format";
import styles from "./activity-timeline.module.scss";

const TIME_ZONE = "Europe/Amsterdam";

const icons: Record<ActivityType, React.ReactNode> = {
  chapter: <BookOpenCheck />,
  quiz: <ListChecks />,
  badge: <Medal />,
  practice: <Sparkles />,
  certificate: <Award />,
};

const dayKey = (date: Date) => date.toLocaleDateString("sv-SE", { timeZone: TIME_ZONE });

function dayLabel(iso: string, now: Date) {
  const date = new Date(iso);
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  if (dayKey(date) === dayKey(now)) return "Vandaag";
  if (dayKey(date) === dayKey(yesterday)) return "Gisteren";
  const label = date.toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long", timeZone: TIME_ZONE });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

const time = (iso: string) =>
  new Date(iso).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit", timeZone: TIME_ZONE });

// Tijdlijn van recente activiteit, gegroepeerd per dag.
export function ActivityTimeline({ items }: { items: Activity[] }) {
  const now = new Date();
  const days = items.reduce<{ key: string; label: string; items: Activity[] }[]>((acc, item) => {
    const key = dayKey(new Date(item.at));
    const last = acc[acc.length - 1];
    if (last?.key === key) last.items.push(item);
    else acc.push({ key, label: dayLabel(item.at, now), items: [item] });
    return acc;
  }, []);

  let index = 0;

  return (
    <div className={styles.timeline}>
      {days.map((day) => (
        <div key={day.key} className={styles.day}>
          <h3 className={styles.dayLabel} style={{ "--i": index++ } as React.CSSProperties}>
            {day.label}
          </h3>
          <ol className={styles.list}>
            {day.items.map((item) => (
              <li
                key={item.id}
                className={clsx(styles.item, styles[item.type])}
                style={{ "--i": index++ } as React.CSSProperties}
              >
                <span className={styles.icon} aria-hidden>
                  {icons[item.type]}
                </span>
                <div className={styles.body}>
                  <p className={styles.title}>
                    {item.href ? (
                      <Link href={item.href} className={styles.link}>
                        {item.title}
                      </Link>
                    ) : (
                      item.title
                    )}
                  </p>
                  <p className={styles.meta}>
                    <time dateTime={item.at}>{time(item.at)}</time>
                    {item.detail && <span>{item.detail}</span>}
                  </p>
                </div>
                {item.points !== undefined && (
                  <span className={styles.points}>
                    +{formatNumber(item.points)}
                    <span className="visually-hidden"> punten</span>
                  </span>
                )}
              </li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  );
}
