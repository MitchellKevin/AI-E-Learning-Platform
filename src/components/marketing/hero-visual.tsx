import clsx from "clsx";
import { ArrowRight, Award, Sparkles } from "lucide-react";
import styles from "./hero-visual.module.scss";

type Props = {
  /** Titel van het basispad, bv. "AI 101". */
  pathTitle: string;
  chapter: { number: string; title: string; minutes: string; points: number; level: string };
  /** Leerpaden met een voorbeeldpercentage; null = nog niet gestart. */
  paths: { title: string; percent: number | null }[];
};

// Mini-versie van het echte dashboard in HTML/CSS, als productbeeld in de hero.
// Voorbeeldcijfers staan hier vast: de marketingpagina toont nooit echte gebruikersdata.
export function HeroVisual({ pathTitle, chapter, paths }: Props) {
  const stats = [
    { value: "12", label: "Dagen streak", accent: true },
    { value: "2.340", label: "Punten" },
    { value: "#3", label: "Rang in je team" },
    { value: "12/26", label: "Hoofdstukken" },
  ];

  return (
    <div
      className={styles.visual}
      role="img"
      aria-label={`Voorbeeld van het dashboard: voortgang in ${pathTitle}, punten, een streak en een behaald certificaat.`}
    >
      <div className={styles.windowWrap}>
        <div className={styles.window}>
          <div className={styles.bar}>
            <span className={styles.logo}>
              <span className={styles.mark}>AI</span>
              <span className={styles.logoText}>Academy</span>
            </span>
            <span className={clsx(styles.navPill, styles.active)}>Dashboard</span>
            <span className={styles.navPill}>Leerpaden</span>
            <span className={clsx(styles.navPill, styles.wide)}>Oefenen</span>
            <span className={styles.avatar}>SV</span>
          </div>

          <div className={styles.body}>
            <p className={styles.eyebrow}>Jouw dashboard</p>
            <p className={styles.hello}>Welkom terug, Sanne</p>

            <div className={styles.stats}>
              {stats.map((s) => (
                <div key={s.label} className={styles.stat}>
                  <span className={clsx(styles.statValue, s.accent && styles.accent)}>{s.value}</span>
                  <span className={styles.statLabel}>{s.label}</span>
                </div>
              ))}
            </div>

            <div className={styles.resume}>
              <div className={styles.resumeTrack}>
                <div className={styles.resumeFill} />
              </div>
              <div className={styles.resumeBody}>
                <div className={styles.resumeText}>
                  <span className={styles.small}>Verder waar je gebleven was · {pathTitle}</span>
                  <span className={styles.resumeTitle}>
                    {chapter.number} {chapter.title}
                  </span>
                  <span className={styles.tags}>
                    <span className={clsx(styles.tag, styles.brand)}>{chapter.level}</span>
                    <span className={styles.tag}>{chapter.minutes}</span>
                    <span className={styles.tag}>+{chapter.points} punten</span>
                  </span>
                </div>
                <span className={styles.fakeButton}>
                  <span className={styles.fakeLabel}>Ga verder</span>
                  <span className={styles.fakeArrow}>
                    <ArrowRight />
                  </span>
                </span>
              </div>
            </div>

            <div className={styles.paths}>
              {paths.map((p) => (
                <div key={p.title} className={styles.path}>
                  <span className={styles.small}>{p.percent === null ? "Na AI 101" : "Bezig"}</span>
                  <span className={styles.pathTitle}>{p.title}</span>
                  <span className={styles.track}>
                    <span className={styles.fill} style={{ width: `${p.percent ?? 0}%` }} />
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.certWrap}>
        <div className={styles.float}>
          <span className={styles.floatIcon}>
            <Award />
          </span>
          <span>
            <span className={styles.floatTitle}>Certificaat behaald</span>
            <span className={styles.floatText}>{pathTitle} · score 92%</span>
          </span>
        </div>
      </div>

      <div className={styles.feedbackWrap}>
        <div className={clsx(styles.float, styles.feedback)}>
          <span className={clsx(styles.floatIcon, styles.soft)}>
            <Sparkles />
          </span>
          <span>
            <span className={styles.floatTitle}>AI-feedback op je prompt</span>
            <span className={styles.floatText}>Duidelijk doel. Noem nog voor wie de tekst is.</span>
            <span className={styles.meter}>
              {[1, 2, 3, 4, 5].map((n) => (
                <span key={n} className={clsx(styles.dot, n <= 4 && styles.on)} />
              ))}
              <span className={styles.meterLabel}>4/5</span>
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
