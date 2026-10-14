"use client";

import { useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { ArrowRight, Check, ChevronDown, CircleCheck, Lightbulb, Minus, Sparkles, X } from "lucide-react";
import type { ExamQuestion } from "@/lib/data/exam";
import { Badge, EmptyState, SegmentedControl, type BadgeVariant } from "@/components/kit";
import type { Answers, QuestionResult, QuestionStatus } from "./exam-logic";
import { letter, typeLabel } from "./question-view";
import styles from "./exam-review.module.scss";

type Props = {
  pathSlug: string;
  questions: ExamQuestion[];
  results: QuestionResult[];
  answers: Answers;
  chapters: Record<string, { number: string; title: string }>;
};

type Filter = "alle" | "verbeteren" | "goed";

export const statusMeta: Record<QuestionStatus, { label: string; variant: BadgeVariant }> = {
  correct: { label: "Goed", variant: "success" },
  partial: { label: "Deels goed", variant: "warning" },
  wrong: { label: "Fout", variant: "danger" },
  unanswered: { label: "Niet beantwoord", variant: "neutral" },
};

const statusIcon = { correct: Check, partial: Minus, wrong: X, unanswered: Minus } as const;

// Nabespreking per vraag, met filter op wat beter kan.
export function ExamReview({ pathSlug, questions, results, answers, chapters }: Props) {
  const items = questions.map((q, i) => ({ question: q, result: results[i], number: i + 1 }));
  const toImprove = items.filter((x) => x.result.status !== "correct");
  const [filter, setFilter] = useState<Filter>(toImprove.length ? "verbeteren" : "alle");

  const visible = filter === "alle" ? items : filter === "goed" ? items.filter((x) => x.result.status === "correct") : toImprove;

  return (
    <div className={styles.review}>
      <SegmentedControl<Filter>
        label="Toon vragen"
        size="sm"
        value={filter}
        onValueChange={setFilter}
        className={styles.filter}
        options={[
          { value: "verbeteren", label: `Te verbeteren (${toImprove.length})` },
          { value: "goed", label: `Goed (${items.length - toImprove.length})` },
          { value: "alle", label: `Alle (${items.length})` },
        ]}
      />

      {visible.length === 0 ? (
        filter === "goed" ? (
          <EmptyState icon={<Lightbulb />} title="Nog geen vragen goed" variant="dashed">
            Lees de uitleg bij &lsquo;Te verbeteren&rsquo; en herhaal de hoofdstukken voor je volgende poging.
          </EmptyState>
        ) : (
          <EmptyState icon={<CircleCheck />} title="Niets te verbeteren" variant="dashed">
            Je hebt elke vraag goed beantwoord. Bekijk via &lsquo;Alle&rsquo; nog eens de uitleg per vraag.
          </EmptyState>
        )
      ) : (
        <ol className={styles.list} key={filter}>
          {visible.map(({ question, result, number }) => (
            <li key={question.id}>
              <ReviewItem
                question={question}
                result={result}
                number={number}
                answer={answers[question.id]}
                chapter={chapters[question.chapterSlug]}
                chapterHref={`/leerpaden/${pathSlug}/${question.chapterSlug}`}
              />
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function ReviewItem({
  question,
  result,
  number,
  answer,
  chapter,
  chapterHref,
}: {
  question: ExamQuestion;
  result: QuestionResult;
  number: number;
  answer: Answers[string];
  chapter?: { number: string; title: string };
  chapterHref: string;
}) {
  const meta = statusMeta[result.status];
  const Icon = statusIcon[result.status];

  return (
    <details className={clsx(styles.item, styles[result.status])} open={result.status !== "correct"}>
      <summary className={styles.summary}>
        <span className={styles.statusIcon} aria-hidden>
          <Icon strokeWidth={3} />
        </span>
        <span className={styles.summaryText}>
          <span className={styles.summaryMeta}>
            <span className={styles.number}>Vraag {number}</span>
            <Badge size="sm" variant={meta.variant}>
              {meta.label}
            </Badge>
            <span className={styles.type}>{typeLabel[question.type]}</span>
          </span>
          <span className={styles.prompt}>{question.prompt}</span>
        </span>
        <ChevronDown className={styles.chevron} aria-hidden />
      </summary>

      <div className={styles.body}>
        {question.context && (
          <figure className={styles.context}>
            <figcaption className={styles.contextLabel}>{question.context.label}</figcaption>
            <blockquote className={styles.contextBody}>{question.context.body}</blockquote>
          </figure>
        )}

        {question.type === "open" ? (
          <div className={styles.openReview}>
            <div>
              <p className={styles.blockLabel}>Jouw antwoord</p>
              {typeof answer === "string" && answer.trim() ? (
                <blockquote className={styles.ownAnswer}>{answer}</blockquote>
              ) : (
                <p className={styles.empty}>Je hebt deze vraag niet beantwoord.</p>
              )}
            </div>

            {result.feedback && (
              <div className={styles.aiFeedback}>
                <p className={styles.aiLabel}>
                  <Sparkles aria-hidden />
                  Beoordeling door AI
                </p>
                <p className={styles.aiSummary}>{result.feedback.summary}</p>
                <ul className={styles.criteria} aria-label="Beoordelingscriteria">
                  {result.feedback.criteria.map((c) => (
                    <li key={c.label} className={clsx(styles.criterion, c.met && styles.met)}>
                      <span className={styles.criterionIcon} aria-hidden>
                        {c.met ? <Check strokeWidth={3} /> : <X strokeWidth={3} />}
                      </span>
                      <span>
                        <span className="visually-hidden">{c.met ? "Behaald: " : "Niet behaald: "}</span>
                        {c.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <p className={styles.blockLabel}>Voorbeeldantwoord</p>
              <p className={styles.modelAnswer}>{question.modelAnswer}</p>
            </div>
          </div>
        ) : (
          <ul className={styles.options} aria-label="Antwoordopties">
            {question.options.map((option, i) => {
              const correct =
                question.type === "single" ? question.correct === option.id : question.correct.includes(option.id);
              const chosen = Array.isArray(answer) ? answer.includes(option.id) : answer === option.id;
              return (
                <li
                  key={option.id}
                  className={clsx(
                    styles.option,
                    correct && styles.optionCorrect,
                    chosen && !correct && styles.optionWrong,
                  )}
                >
                  <span className={styles.optionMarker} aria-hidden>
                    {correct ? <Check strokeWidth={3} /> : chosen ? <X strokeWidth={3} /> : letter(i)}
                  </span>
                  <span className={styles.optionLabel}>{option.label}</span>
                  {(chosen || correct) && (
                    <span className={styles.optionTags}>
                      {chosen && <span className={styles.optionTag}>Jouw antwoord</span>}
                      {correct && <span className={clsx(styles.optionTag, styles.tagCorrect)}>Juist</span>}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <div className={styles.explanation}>
          <p className={styles.explanationLabel}>
            <Lightbulb aria-hidden />
            Uitleg
          </p>
          <p className={styles.explanationText}>{question.explanation}</p>
        </div>

        {chapter && result.status !== "correct" && (
          <Link href={chapterHref} className={styles.chapterLink}>
            Herhaal {chapter.number} {chapter.title}
            <ArrowRight aria-hidden />
          </Link>
        )}
      </div>
    </details>
  );
}
