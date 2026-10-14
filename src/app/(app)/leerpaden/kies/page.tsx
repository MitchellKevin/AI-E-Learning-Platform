import { getLearningPaths } from "@/lib/content";
import { SpecialisationPicker } from "@/components/specialisation-picker";
import styles from "./page.module.scss";

export default async function ChooseSpecialisationPage() {
  const paths = (await getLearningPaths()).filter((p) => p.prerequisite === "ai-101");

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <span className={styles.badge}>AI 101 afgerond · +500 punten</span>
        <h1 className={styles.title}>Kies je specialisatie</h1>
        <p className={styles.lead}>
          Je hebt de basis in handen. Kies het pad dat past bij je rol; het andere pad kun je later altijd
          nog volgen.
        </p>
      </header>
      <SpecialisationPicker paths={paths} />
    </main>
  );
}
