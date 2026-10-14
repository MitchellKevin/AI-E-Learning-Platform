"use client";

import clsx from "clsx";
import { MessageCircleQuestion, Sparkles } from "lucide-react";
import { useStreamedText } from "@/components/tutor/stream";
import { useTutor } from "@/components/tutor/tutor-provider";
import styles from "./explanation.module.scss";

// "Uitleg" na een antwoord, in de stijl van AI-feedback. Later kan dit echte feedback van de Claude API zijn.
export function Explanation({
  text,
  animate = true,
  tone = "neutral",
}: {
  text: string;
  /** Woord voor woord binnenlaten; uit als de taak al eerder is afgerond. */
  animate?: boolean;
  tone?: "neutral" | "success";
}) {
  const { phase, shown } = useStreamedText(text, animate);

  return (
    <div className={clsx(styles.explanation, styles[tone])}>
      <p className={styles.label}>
        <Sparkles aria-hidden />
        Uitleg
      </p>
      {phase === "thinking" ? (
        <p className={styles.thinking}>
          <span className={styles.dots} aria-hidden>
            <span />
            <span />
            <span />
          </span>
          Feedback wordt opgesteld…
        </p>
      ) : (
        // Voorlezen gebeurt via de feedbackregel van het blok; hier de volledige tekst voor de screenreader.
        <p className={clsx(styles.text, phase === "streaming" && styles.streaming)}>
          <span aria-hidden={phase !== "done"}>{shown}</span>
          {phase !== "done" && <span className="visually-hidden">{text}</span>}
        </p>
      )}
    </div>
  );
}

// Knop die de AI-tutor opent met een vraag al ingevuld. Rendert niets buiten een TutorProvider.
export function AskTutorButton({ prompt, children }: { prompt: string; children?: React.ReactNode }) {
  const tutor = useTutor();
  if (!tutor) return null;
  return (
    <button type="button" className={styles.ask} onClick={() => tutor.openTutor(prompt)} aria-haspopup="dialog">
      <MessageCircleQuestion aria-hidden />
      {children ?? "Vraag de AI-tutor"}
    </button>
  );
}
