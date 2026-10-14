import Link from "next/link";
import { getLearningPaths, pathProgress } from "@/lib/content";
import { getProgress } from "@/lib/user-data";
import { Card, Eyebrow, ProgressBar, Tag, Tags } from "@/components/ui";
import styles from "./page.module.scss";

export default async function LearningPathsPage() {
  const [paths, progress] = await Promise.all([getLearningPaths(), getProgress()]);

  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Leerpaden</h1>
      <p className={styles.lead}>
        Begin met AI 101, de gezamenlijke basis. Daarna kies je de specialisatie die past bij je rol.
      </p>
      <div className={styles.paths}>
        {paths.map((path) => {
          const p = pathProgress(progress, path);
          return (
            <Link key={path.slug} href={`/leerpaden/${path.slug}`} className={styles.pathLink}>
              <Card className={styles.card}>
                <Eyebrow>{path.audience ?? "Voor iedereen"}</Eyebrow>
                <h2 className={styles.cardTitle}>{path.title}</h2>
                <p className={styles.cardText}>{path.description}</p>
                <Tags>
                  <Tag variant="brand">{path.level}</Tag>
                  <Tag>{path.topics.length} onderwerpen</Tag>
                </Tags>
                <ProgressBar value={p.percent} className={styles.progress} />
                <p className={styles.foot}>
                  {p.started ? `${p.done} van ${p.total} hoofdstukken` : "Nog niet gestart"}
                </p>
              </Card>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
