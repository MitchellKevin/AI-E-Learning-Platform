import { Skeleton, SkeletonText } from "@/components/kit";
import styles from "./page.module.scss";

// Skelet van de oefenruimte terwijl de opdracht laadt (straks uit Storyblok).
export default function ExerciseLoading() {
  return (
    <main aria-busy="true" aria-label="Oefening laden">
      <div className={styles.loadingBand}>
        <div className={styles.loadingHead}>
          <Skeleton width={160} height={12} />
          <Skeleton width="min(520px, 90%)" height={36} />
          <SkeletonText lines={1} />
          <Skeleton width={260} height={26} radius="pill" />
        </div>
      </div>
      <div className={styles.content}>
        <div className={styles.loadingGrid}>
          <div className={styles.loadingColumn}>
            <Skeleton height={260} radius="md" />
            <Skeleton height={180} radius="md" />
          </div>
          <div className={styles.loadingColumn}>
            <Skeleton width={160} height={20} />
            <Skeleton height={220} radius="md" />
            <Skeleton height={170} radius="md" />
          </div>
        </div>
      </div>
    </main>
  );
}
