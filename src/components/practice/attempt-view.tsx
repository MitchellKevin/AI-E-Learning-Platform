"use client";

import { useState, type ReactNode, type Ref } from "react";
import clsx from "clsx";
import { CornerDownLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/kit";
import { PromptFeedback } from "./prompt-feedback";
import { ResponseText } from "./response-text";
import type { PromptReview } from "./review-prompt";
import type { StreamPhase } from "./use-simulated-stream";
import styles from "./attempt-view.module.scss";

export type Attempt = {
  id: number;
  prompt: string;
  /** Volledig (of bij stoppen: gedeeltelijk) antwoord; leeg zolang het nog binnenkomt. */
  response: string;
  status: "pending" | "done" | "stopped";
  review: PromptReview;
};

type Props = {
  attempt: Attempt;
  /** Live tekst en fase van de stream, alleen voor de poging die nu binnenkomt. */
  live?: { text: string; phase: StreamPhase };
  previous?: PromptReview;
  passScore?: number;
  feedbackFooter?: ReactNode;
  feedbackHeadingRef?: Ref<HTMLHeadingElement>;
  onReuse: (prompt: string) => void;
};

const LONG_PROMPT = 360;

// Eén poging: je prompt, het (streamende) antwoord en de feedback.
export function AttemptView({ attempt, live, previous, passScore, feedbackFooter, feedbackHeadingRef, onReuse }: Props) {
  const [expanded, setExpanded] = useState(false);
  const pending = attempt.status === "pending";
  const phase = live?.phase ?? "idle";
  const text = pending ? (live?.text ?? "") : attempt.response;
  const long = attempt.prompt.length > LONG_PROMPT;

  const status = pending
    ? phase === "thinking" || !text
      ? "Denkt na…"
      : "Schrijft…"
    : attempt.status === "stopped"
      ? "Gestopt"
      : null;

  return (
    <div className={styles.attempt}>
      <div className={styles.prompt}>
        <div className={styles.promptHead}>
          <p className={styles.eyebrow}>Jouw prompt · poging {attempt.id}</p>
          <Button variant="ghost" size="sm" icon={<CornerDownLeft />} onClick={() => onReuse(attempt.prompt)}>
            Opnieuw gebruiken
          </Button>
        </div>
        <p className={clsx(styles.promptText, long && !expanded && styles.clamped)}>{attempt.prompt}</p>
        {long && (
          <button type="button" className={styles.more} aria-expanded={expanded} onClick={() => setExpanded((v) => !v)}>
            {expanded ? "Toon minder" : "Toon hele prompt"}
          </button>
        )}
      </div>

      <div className={styles.response}>
        <div className={styles.responseHead}>
          <span className={styles.avatar} aria-hidden>
            <Sparkles />
          </span>
          <p className={styles.who}>AI-assistent</p>
          {status && (
            <p className={clsx(styles.status, attempt.status === "stopped" && styles.stopped)}>
              {pending && <span className={styles.pulse} aria-hidden />}
              {status}
            </p>
          )}
        </div>

        {/* Screenreaders lezen het antwoord pas voor als het compleet is (aria-busy). */}
        <div className={styles.responseBody} aria-live="polite" aria-busy={pending}>
          {pending && !text ? (
            <span className={styles.thinking} aria-hidden>
              <span />
              <span />
              <span />
            </span>
          ) : text ? (
            <ResponseText text={text} caret={pending} />
          ) : (
            <p className={styles.empty}>Je hebt het antwoord gestopt voordat er tekst was.</p>
          )}
        </div>

        {attempt.status === "stopped" && text && (
          <p className={styles.stoppedNote}>Je hebt het antwoord halverwege gestopt. De feedback op je prompt staat hieronder.</p>
        )}
      </div>

      {!pending && (
        <PromptFeedback
          review={attempt.review}
          previous={previous}
          passScore={passScore}
          footer={feedbackFooter}
          headingRef={feedbackHeadingRef}
        />
      )}
    </div>
  );
}
