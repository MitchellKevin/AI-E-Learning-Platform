"use client";

import { useId, type Ref } from "react";
import clsx from "clsx";
import { Check, Sparkles } from "lucide-react";
import type { ExamQuestion, OpenQuestion } from "@/lib/data/exam";
import { TopicIcon } from "@/components/topic-icon";
import { Badge, Field, Textarea } from "@/components/kit";
import { countWords, type AnswerValue } from "./exam-logic";
import type { ExamTopic } from "./exam-flow";
import styles from "./question-view.module.scss";

export const typeLabel = {
  single: "Eén antwoord",
  multiple: "Meerdere antwoorden",
  open: "Open vraag",
} as const;

const instruction = {
  single: "Kies het beste antwoord.",
  multiple: "Kies alle juiste antwoorden. Alleen precies de juiste combinatie telt als goed.",
  open: "Beantwoord de vraag in je eigen woorden.",
} as const;

export const letter = (i: number) => String.fromCharCode(65 + i);

type Props = {
  question: ExamQuestion;
  number: number;
  topic?: ExamTopic;
  answer: AnswerValue | undefined;
  onAnswer: (value: AnswerValue) => void;
  headingRef?: Ref<HTMLHeadingElement>;
};

export function QuestionView({ question, number, topic, answer, onAnswer, headingRef }: Props) {
  const id = useId().replace(/:/g, "");
  const headingId = `q${id}-title`;
  const instructionId = `q${id}-instruction`;

  return (
    <article className={styles.question} aria-labelledby={headingId}>
      <div className={styles.meta}>
        <span className={styles.number}>Vraag {number}</span>
        {topic && (
          <span className={styles.topic}>
            <TopicIcon name={topic.icon} strokeWidth={1.75} aria-hidden />
            {topic.title}
          </span>
        )}
        <Badge size="sm" variant={question.type === "open" ? "brand" : "neutral"}>
          {typeLabel[question.type]}
        </Badge>
      </div>

      <h1 id={headingId} ref={headingRef} tabIndex={-1} className={styles.prompt}>
        {question.prompt}
      </h1>
      <p id={instructionId} className={styles.instruction}>
        {instruction[question.type]}
      </p>

      {question.context && (
        <figure className={styles.context}>
          <figcaption className={styles.contextLabel}>{question.context.label}</figcaption>
          <blockquote className={styles.contextBody}>{question.context.body}</blockquote>
        </figure>
      )}

      {question.type === "open" ? (
        <OpenAnswer question={question} value={(answer as string) ?? ""} onChange={onAnswer} />
      ) : (
        <fieldset className={styles.choices} aria-labelledby={headingId} aria-describedby={instructionId}>
          <ul className={styles.options}>
            {question.options.map((option, i) => {
              const multiple = question.type === "multiple";
              const selected = multiple
                ? ((answer as string[] | undefined) ?? []).includes(option.id)
                : answer === option.id;
              return (
                <li key={option.id}>
                  <label className={clsx(styles.option, selected && styles.selected)}>
                    <input
                      type={multiple ? "checkbox" : "radio"}
                      name={`q${id}`}
                      value={option.id}
                      checked={selected}
                      onChange={() => {
                        if (!multiple) return onAnswer(option.id);
                        const current = (answer as string[] | undefined) ?? [];
                        onAnswer(
                          selected ? current.filter((x) => x !== option.id) : [...current, option.id],
                        );
                      }}
                      className={styles.input}
                    />
                    <span className={clsx(styles.marker, multiple && styles.square)} aria-hidden>
                      {multiple && selected ? <Check strokeWidth={3} /> : letter(i)}
                    </span>
                    <span className={styles.optionLabel}>{option.label}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </fieldset>
      )}
    </article>
  );
}

function OpenAnswer({
  question,
  value,
  onChange,
}: {
  question: OpenQuestion;
  value: string;
  onChange: (value: string) => void;
}) {
  const words = countWords(value);
  const enough = words >= question.minWords;

  return (
    <div className={styles.open}>
      <Badge variant="brand" size="sm" icon={<Sparkles />} className={styles.aiBadge}>
        Wordt beoordeeld door AI
      </Badge>
      <Field
        label="Jouw antwoord"
        description={`Schrijf minimaal ${question.minWords} woorden. De AI kijkt naar de inhoud, niet naar spelling of stijl.`}
      >
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={6}
          autoResize
          maxRows={16}
          placeholder="Typ hier je antwoord…"
          spellCheck
        />
      </Field>
      <p className={clsx(styles.wordCount, enough && styles.enough)}>
        {enough && <Check strokeWidth={3} aria-hidden />}
        {words} {words === 1 ? "woord" : "woorden"}
        {!enough && <span className={styles.wordGoal}> · nog {question.minWords - words} te gaan</span>}
      </p>
    </div>
  );
}
