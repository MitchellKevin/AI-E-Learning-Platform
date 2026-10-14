import clsx from "clsx";
import { Check, Clock, Layers } from "lucide-react";
import { allChapters } from "@/lib/content";
import type { LearningPath } from "@/lib/types";
import { Tag, Tags } from "@/components/kit";
import styles from "./path-overview.module.scss";

// Leerlijn op de landingspagina: AI 101 als basis, daaronder de specialisaties.
export function PathOverview({ paths }: { paths: LearningPath[] }) {
  const base = paths.find((p) => !p.prerequisite);
  const specialisations = paths.filter((p) => p.prerequisite);

  return (
    <div className={styles.overview}>
      {base && (
        <div className={styles.baseWrap}>
          <PathCard path={base} featured />
        </div>
      )}

      {specialisations.length > 0 && (
        <>
          <div className={styles.fork}>
            <p className={styles.forkLabel}>Daarna kies je je specialisatie</p>
          </div>
          <ul className={styles.specialisations}>
            {specialisations.map((path) => (
              <li key={path.slug}>
                <PathCard path={path} />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function PathCard({ path, featured }: { path: LearningPath; featured?: boolean }) {
  const chapters = allChapters(path).length;

  return (
    <article className={clsx(styles.card, featured && styles.featured)}>
      <div className={styles.main}>
        <p className={styles.eyebrow}>{path.audience ?? "Voor het hele team"}</p>
        <h3 className={styles.title}>{path.title}</h3>
        <p className={styles.description}>{path.description}</p>
        <Tags>
          <Tag variant="brand">{path.level}</Tag>
          <Tag>
            <Clock aria-hidden className={styles.tagIcon} />
            {path.hours} uur
          </Tag>
          <Tag>
            <Layers aria-hidden className={styles.tagIcon} />
            {chapters} hoofdstukken
          </Tag>
        </Tags>
      </div>

      <div className={styles.side}>
        <p className={styles.sideTitle}>{featured ? "Onderwerpen" : "Je leert"}</p>
        {featured ? (
          <ol className={styles.topics}>
            {path.topics.map((topic, i) => (
              <li key={topic.id}>
                <span className={styles.topicNumber}>{i + 1}</span>
                {topic.title}
              </li>
            ))}
          </ol>
        ) : (
          <ul className={styles.goals}>
            {path.learningGoals.map((goal) => (
              <li key={goal}>
                <Check aria-hidden />
                {goal}
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}
