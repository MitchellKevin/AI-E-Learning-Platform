import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import styles from "./privacy-note.module.scss";

// Laat zien of je zichtbaar bent voor collega's, met een link naar de instelling.
export function PrivacyNote({ visible }: { visible: boolean }) {
  return (
    <p className={styles.note}>
      <span className={styles.icon} aria-hidden>
        {visible ? <Eye /> : <EyeOff />}
      </span>
      <span>
        {visible
          ? "Je staat op het leaderboard. "
          : "Je bent verborgen: collega's zien jouw naam en punten niet. "}
        Wijzig dit in je{" "}
        <Link href="/instellingen" className={styles.link}>
          instellingen
        </Link>
        .
      </span>
    </p>
  );
}
