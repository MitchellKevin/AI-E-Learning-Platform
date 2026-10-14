import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { pathProgress } from "@/lib/content";
import type { Certificate, LearningPath, Progress } from "@/lib/types";
import { Badge, StatusPill } from "@/components/kit";
import { ProgressBar } from "@/components/ui";
import styles from "./path-progress-list.module.scss";

type Props = { paths: LearningPath[]; progress: Progress; certificates: Certificate[] };

// Voortgang per leerpad, compact onder elkaar.
export function PathProgressList({ paths, progress, certificates }: Props) {
  return (
    <ul className={styles.list}>
      {paths.map((path, i) => {
        const p = pathProgress(progress, path);
        const certificate = certificates.find((c) => c.pathSlug === path.slug);
        const prerequisite = paths.find((x) => x.slug === path.prerequisite);
        const status = p.done === p.total ? (
          <StatusPill variant="success" size="sm">
            Voltooid
          </StatusPill>
        ) : p.started ? (
          <StatusPill variant="brand" size="sm">
            Bezig
          </StatusPill>
        ) : (
          <StatusPill variant="neutral" size="sm">
            {prerequisite ? `Na ${prerequisite.title}` : "Nog niet gestart"}
          </StatusPill>
        );

        return (
          <li key={path.slug} className={styles.item} style={{ "--i": i } as React.CSSProperties}>
            <Link href={`/leerpaden/${path.slug}`} className={styles.row}>
              <div className={styles.head}>
                <span className={styles.title}>{path.title}</span>
                <span className={styles.badges}>
                  {certificate && (
                    <Badge variant="success" size="sm">
                      Certificaat
                    </Badge>
                  )}
                  {status}
                </span>
              </div>
              <ProgressBar value={p.percent} className={styles.bar} />
              <div className={styles.foot}>
                <span>
                  {p.done} van {p.total} hoofdstukken
                </span>
                <span className={styles.percent}>{p.percent}%</span>
              </div>
              <ChevronRight className={styles.chevron} aria-hidden />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
