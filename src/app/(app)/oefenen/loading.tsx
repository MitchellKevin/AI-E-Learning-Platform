import { Skeleton, SkeletonText } from "@/components/kit";
import styles from "./loading.module.scss";

// Skelet van het oefenoverzicht terwijl opdrachten en voortgang laden.
export default function PracticeLoading() {
  return (
    <main aria-busy="true" aria-label="Oefeningen laden">
      <div className={styles.band}>
        <div className={styles.head}>
          <div className={styles.text}>
            <Skeleton width={80} height={12} />
            <Skeleton width="min(480px, 90%)" height={44} />
            <SkeletonText lines={2} />
          </div>
          <Skeleton width={288} height={176} radius="md" />
        </div>
      </div>
      <div className={styles.content}>
        <div className={styles.intro}>
          <Skeleton height={168} radius="md" />
          <Skeleton height={168} radius="md" />
        </div>
        <Skeleton width={140} height={20} />
        <div className={styles.grid}>
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} height={210} radius="md" />
          ))}
        </div>
      </div>
    </main>
  );
}
