import { Skeleton, SkeletonText } from "@/components/kit";
import styles from "./page.module.scss";

// Skelet terwijl de ranglijsten laden (straks een aggregatie-query).
export default function LeaderboardLoading() {
  return (
    <main className={styles.main} aria-busy="true" aria-label="Leaderboard laden">
      <div className={styles.loadingHead}>
        <Skeleton width={120} height={12} />
        <Skeleton width={240} height={36} />
        <SkeletonText lines={2} />
      </div>

      <div className={styles.loadingGrid}>
        <div className={styles.loadingMain}>
          <div className={styles.loadingToolbar}>
            <Skeleton width={260} height={36} radius="pill" />
            <Skeleton width={272} height={32} radius="pill" />
          </div>
          <Skeleton height={112} radius="md" />
          <div className={styles.loadingCard}>
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className={styles.loadingRow}>
                <Skeleton width={32} height={32} radius="circle" />
                <Skeleton width="45%" height={14} />
                <Skeleton width={48} height={14} />
              </div>
            ))}
          </div>
        </div>
        <div className={styles.loadingMain}>
          <Skeleton height={220} radius="md" />
          <Skeleton height={300} radius="md" />
        </div>
      </div>
    </main>
  );
}
