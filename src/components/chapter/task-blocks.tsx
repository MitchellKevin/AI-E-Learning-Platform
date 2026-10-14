"use client";

import { useEffect, useId, useRef, useState } from "react";
import clsx from "clsx";
import { ArrowRight, Check, X } from "lucide-react";
import type { QuizOption, TaskBlock } from "@/lib/types";
import { Eyebrow } from "@/components/ui";
import { Button } from "@/components/kit";
import { AskTutorButton, Explanation } from "./explanation";
import { VideoPlayer } from "./video-player";
import styles from "./task-blocks.module.scss";

const normalize = (s: string) => s.trim().toLowerCase().replace(/[.!?]/g, "");

// Blokken die eerst gehaald moeten worden voordat de taak af is.
const isGate = (b: TaskBlock) => b.type === "knowledge_check" || b.type === "quiz" || b.type === "video";
const isQuestion = (b: TaskBlock) => b.type === "knowledge_check" || b.type === "quiz";
const hasExplanation = (b: TaskBlock) =>
  b.type === "quiz" || (b.type === "knowledge_check" && Boolean(b.explanation));

export type ContinueAction = { label: string; onClick?: () => void; href?: string };

export function TaskBlocks({
  blocks,
  done,
  active = true,
  onComplete,
  continueAction,
}: {
  blocks: TaskBlock[];
  done: boolean;
  /** Taak is opengeklapt; een video pauzeert als dat niet zo is. */
  active?: boolean;
  /** `stay`: taak afronden maar open laten, zodat de uitleg te lezen blijft. */
  onComplete: (stay?: boolean) => void;
  /** Vervolgstap na een uitleg, bv. "Volgende taak". */
  continueAction?: ContinueAction;
}) {
  const hintId = useId();
  // Eerder afgeronde taken tonen hun uitleg zonder animatie.
  const [initiallyDone] = useState(done);
  const gates = blocks.flatMap((b, i) => (isGate(b) ? [i] : []));
  const [passed, setPassed] = useState<number[]>(done ? gates : []);
  const [stayed, setStayed] = useState(false);

  const allPassed = gates.every((i) => passed.includes(i));
  const asksQuestions = blocks.some(isQuestion);
  const explains = blocks.some(hasExplanation);

  const completeRef = useRef(onComplete);
  useEffect(() => {
    completeRef.current = onComplete;
  });

  function pass(index: number) {
    setPassed((list) => (list.includes(index) ? list : [...list, index]));
  }

  // Vragen goed beantwoord: de taak rondt zichzelf af. Met uitleg blijft de taak open.
  useEffect(() => {
    if (done || !allPassed || !asksQuestions) return;
    if (explains) {
      setStayed(true);
      completeRef.current(true);
      return;
    }
    const timeout = window.setTimeout(() => completeRef.current(), 900);
    return () => window.clearTimeout(timeout);
  }, [done, allPassed, asksQuestions, explains]);

  const quizCount = blocks.filter((b) => b.type === "quiz").length;
  let quizNumber = 0;

  return (
    <div className={styles.blocks}>
      {blocks.map((block, i) => {
        switch (block.type) {
          case "text":
            return (
              <p key={i} className={styles.text}>
                {block.body}
              </p>
            );
          case "steps":
            return (
              <ol key={i} className={styles.steps}>
                {block.steps.map((step) => (
                  <li key={step.label}>
                    <Eyebrow className={styles.stepLabel}>{step.label}</Eyebrow>
                    <p>{step.body}</p>
                  </li>
                ))}
              </ol>
            );
          case "code":
            return (
              <div key={i}>
                <Eyebrow className={styles.label}>{block.label}</Eyebrow>
                <pre className={styles.code}>{block.code}</pre>
              </div>
            );
          case "knowledge_check":
            return (
              <KnowledgeCheck
                key={i}
                {...block}
                done={done}
                animate={!initiallyDone}
                onCorrect={() => pass(i)}
              />
            );
          case "quiz":
            quizNumber += 1;
            return (
              <Quiz
                key={i}
                {...block}
                number={quizCount > 1 ? `Vraag ${quizNumber} van ${quizCount}` : "Vraag"}
                done={done}
                animate={!initiallyDone}
                onCorrect={() => pass(i)}
              />
            );
          case "video":
            return (
              <VideoPlayer
                key={i}
                title={block.title}
                duration={block.duration}
                posterColor={block.posterColor}
                transcript={block.transcript}
                done={done}
                active={active}
                onWatched={() => pass(i)}
              />
            );
        }
      })}

      {/* Zonder vragen rond je zelf af; een video moet daarvoor eerst grotendeels bekeken zijn. */}
      {!asksQuestions && !done && (
        <div className={styles.completeRow}>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => onComplete()}
            disabled={!allPassed}
            aria-describedby={allPassed ? undefined : hintId}
          >
            Markeer als afgerond
          </button>
          {!allPassed && (
            <span id={hintId} className={styles.completeHint}>
              Bekijk eerst minstens 90% van de video.
            </span>
          )}
        </div>
      )}

      {stayed && done && continueAction && (
        <div className={styles.continueRow}>
          <Button
            size="sm"
            variant="dark"
            href={continueAction.href}
            onClick={continueAction.onClick}
            iconRight={<ArrowRight />}
          >
            {continueAction.label}
          </Button>
        </div>
      )}
    </div>
  );
}

function KnowledgeCheck({
  question,
  answers,
  hint,
  explanation,
  done,
  animate,
  onCorrect,
}: {
  question: string;
  answers: string[];
  hint: string;
  explanation?: string;
  done: boolean;
  animate: boolean;
  onCorrect: () => void;
}) {
  const id = useId();
  const [value, setValue] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [result, setResult] = useState<"correct" | "wrong" | null>(done ? "correct" : null);
  // Telt foute pogingen zodat de shake ook bij hetzelfde foute antwoord opnieuw afspeelt.
  const [attempt, setAttempt] = useState(0);

  // Uitleg na een goed antwoord, of na twee foute pogingen zodat niemand vast blijft zitten.
  const showExplanation = Boolean(explanation) && (result === "correct" || attempt >= 2);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    // Later beoordeelt de Claude API het antwoord en schrijft de uitleg op maat.
    const correct = answers.some((a) => normalize(value).includes(normalize(a)));
    setResult(correct ? "correct" : "wrong");
    if (correct) onCorrect();
    else setAttempt((n) => n + 1);
  }

  return (
    <form onSubmit={submit} className={styles.check}>
      <Eyebrow className={styles.label}>Controleer je kennis</Eyebrow>
      <label htmlFor={id} className={styles.question}>
        {question}
      </label>
      <div className={styles.inputRow}>
        <input
          id={id}
          className={clsx(styles.input, result && styles[result], result === "wrong" && attempt % 2 === 0 && styles.again)}
          placeholder={result === "correct" && !value ? "Beantwoord" : "Typ je antwoord"}
          value={value}
          disabled={result === "correct"}
          autoComplete="off"
          onChange={(e) => {
            setValue(e.target.value);
            if (result === "wrong") setResult(null);
          }}
        />
        <button type="submit" className={styles.primaryButton} disabled={!value.trim() || result === "correct"}>
          Indienen
        </button>
        {result !== "correct" && (
          <button
            type="button"
            className={styles.secondaryButton}
            aria-expanded={showHint}
            onClick={() => setShowHint((s) => !s)}
          >
            Hint
          </button>
        )}
      </div>
      <p className={styles.feedback} aria-live="polite">
        {result === "correct" && (
          <span className={clsx(styles.message, styles.success)}>
            <Check aria-hidden />
            {explanation ? "Goed! Lees de uitleg hieronder." : "Goed! Op naar de volgende taak."}
          </span>
        )}
        {result === "wrong" && (
          <span key={attempt} className={styles.message}>
            {showExplanation
              ? "Nog niet helemaal. De uitleg hieronder helpt je op weg."
              : "Nog niet helemaal. Probeer het opnieuw of bekijk de hint."}
          </span>
        )}
        {showHint && result !== "correct" && <span className={styles.hint}>Hint: {hint}</span>}
      </p>
      {showExplanation && explanation && (
        <div className={styles.explanationWrap}>
          <Explanation text={explanation} animate={animate} tone={result === "correct" ? "success" : "neutral"} />
          <AskTutorButton prompt={`Kun je dit verder uitleggen? ${question}`}>
            Nog vragen? Vraag het de AI-tutor
          </AskTutorButton>
        </div>
      )}
    </form>
  );
}

const LETTERS = "ABCDEFGH";

function Quiz({
  number,
  question,
  options,
  explanation,
  done,
  animate,
  onCorrect,
}: {
  number: string;
  question: string;
  options: QuizOption[];
  explanation: string;
  done: boolean;
  animate: boolean;
  onCorrect: () => void;
}) {
  const id = useId();
  const [wrong, setWrong] = useState<number[]>([]);
  const [solved, setSolved] = useState(done);
  const [last, setLast] = useState<number | null>(null);

  function pick(index: number) {
    if (solved || wrong.includes(index)) return;
    setLast(index);
    // Later: antwoord opslaan via een server action (voor de rapportages van de teamlead).
    if (options[index].correct) {
      setSolved(true);
      onCorrect();
    } else {
      setWrong((list) => [...list, index]);
    }
  }

  const lastOption = last === null ? undefined : options[last];

  return (
    <div className={styles.quiz} role="group" aria-labelledby={`${id}-vraag`}>
      <Eyebrow className={styles.label}>{number}</Eyebrow>
      <p id={`${id}-vraag`} className={styles.question}>
        {question}
      </p>

      <ul className={styles.options}>
        {options.map((option, i) => {
          const isWrong = wrong.includes(i);
          const isRight = solved && option.correct;
          const locked = solved || isWrong;
          return (
            // De wrapper schudt, de knop zelf heeft de hover-overgang.
            <li key={option.label} className={clsx(isWrong && last === i && styles.shake)}>
              <button
                type="button"
                className={clsx(
                  styles.option,
                  isWrong && styles.optionWrong,
                  isRight && styles.optionRight,
                  solved && !option.correct && styles.optionMuted,
                )}
                aria-disabled={locked || undefined}
                aria-describedby={isWrong && last === i ? `${id}-feedback` : undefined}
                onClick={() => pick(i)}
              >
                <span className={styles.marker} aria-hidden>
                  {isRight ? <Check /> : isWrong ? <X /> : LETTERS[i]}
                </span>
                <span className={styles.optionLabel}>{option.label}</span>
                {(isRight || isWrong) && (
                  <span className="visually-hidden">{isRight ? " (juist)" : " (onjuist)"}</span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      <p id={`${id}-feedback`} className={styles.feedback} aria-live="polite">
        {solved && (
          <span className={clsx(styles.message, styles.success)}>
            <Check aria-hidden />
            {done && last === null ? "Je hebt deze vraag goed beantwoord." : "Goed gekozen!"}
          </span>
        )}
        {!solved && lastOption && !lastOption.correct && (
          <span key={last} className={clsx(styles.message, styles.danger)}>
            {lastOption.feedback ?? "Dat is niet het juiste antwoord."} Probeer een ander antwoord.
          </span>
        )}
      </p>

      {solved && (
        <div className={styles.explanationWrap}>
          <Explanation text={explanation} animate={animate} tone="success" />
          <AskTutorButton prompt={`Kun je dit verder uitleggen? ${question}`}>
            Nog vragen? Vraag het de AI-tutor
          </AskTutorButton>
        </div>
      )}
    </div>
  );
}
