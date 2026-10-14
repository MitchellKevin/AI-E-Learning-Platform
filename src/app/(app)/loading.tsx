import { Skeleton, SkeletonText } from "@/components/kit";
import styles from "./loading.module.scss";

// Algemeen skelet tijdens het laden van een app-pagina (kop, statistieken, kaarten).
export default function AppLoading() {
  return (
    <main className={styles.main} aria-busy="true">
      <p className="sr-only" role="status">
        Pagina wordt geladen…
      </p>

      <div className={styles.intro}>
        <div className={styles.introText}>
          <Skeleton width={140} height={11} />
          <Skeleton width="min(100%, 360px)" height={36} />
          <SkeletonText lines={2} className={styles.lead} />
        </div>
        <div className={styles.stats}>
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className={styles.stat}>
              <Skeleton width={56} height={24} />
              <Skeleton width={72} height={10} />
            </div>
          ))}
        </div>
      </div>

      <div className={styles.grid}>
        <div className={styles.content}>
          <div className={styles.card}>
            <Skeleton width={220} height={11} />
            <Skeleton width="70%" height={20} />
            <SkeletonText lines={2} />
            <div className={styles.row}>
              <Skeleton width={72} height={24} radius="pill" />
              <Skeleton width={64} height={24} radius="pill" />
              <Skeleton width={96} height={24} radius="pill" />
            </div>
          </div>

          <div className={styles.cards}>
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className={styles.card}>
                <Skeleton width={80} height={10} />
                <Skeleton width="60%" height={18} />
                <SkeletonText lines={2} />
                <Skeleton height={6} radius="pill" />
              </div>
            ))}
          </div>
        </div>

        <div className={styles.aside}>
          <div className={styles.card}>
            <Skeleton width={120} height={18} />
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className={styles.row}>
                <Skeleton width={24} height={24} radius="circle" />
                <Skeleton width="60%" height={12} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
