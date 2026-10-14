"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { ArrowLeft, ArrowRight, Eye, EyeOff, Flag, Send, Timer } from "lucide-react";
import type { Exam } from "@/lib/data/exam";
import { Alert, Button, Card, Dialog } from "@/components/kit";
import { formatDuration, isAnswered, type AnswerValue, type Answers } from "./exam-logic";
import { QuestionView } from "./question-view";
import type { ExamSessionState, ExamTopic } from "./exam-flow";
import styles from "./exam-session.module.scss";

type Props = {
  session: ExamSessionState;
  exam: Exam;
  pathTitle: string;
  topics: ExamTopic[];
  onSubmit: (answers: Answers, timedOut: boolean) => void;
};

// In de laatste minuten is de tijd altijd zichtbaar.
const WARNING_MS = 5 * 60_000;

export function ExamSession({ session, exam, pathTitle, topics, onSubmit }: Props) {
  const { questions, deadline } = session;
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [flagged, setFlagged] = useState<string[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const [timerHidden, setTimerHidden] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  const answersRef = useRef(answers);
  const done = useRef(false);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  const question = questions[index];
  const remaining = Math.max(0, deadline - now);
  const warning = remaining <= WARNING_MS;
  const answeredCount = questions.filter((q) => isAnswered(answers[q.id])).length;
  const unanswered = questions.map((q, i) => ({ q, i })).filter(({ q }) => !isAnswered(answers[q.id]));
  const flaggedItems = questions.map((q, i) => ({ q, i })).filter(({ q }) => flagged.includes(q.id));
  const isFlagged = flagged.includes(question.id);
  const isLast = index === questions.length - 1;

  // Focus op de vraag bij binnenkomst en bij elke wissel, zodat screenreaders meteen de nieuwe vraag horen.
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, [index]);

  // Klok; bij nul automatisch inleveren.
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (remaining > 0 || done.current) return;
    done.current = true;
    onSubmit(answersRef.current, true);
  }, [remaining, onSubmit]);

  // Alleen op vaste momenten voorlezen, niet elke seconde.
  const minutesLeft = Math.ceil(remaining / 60_000);
  useEffect(() => {
    if (minutesLeft === 5) setAnnouncement("Nog 5 minuten.");
    if (minutesLeft === 1) setAnnouncement("Nog 1 minuut. Daarna wordt je toets automatisch ingeleverd.");
  }, [minutesLeft]);

  // Waarschuwing bij per ongeluk sluiten of herladen.
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (done.current) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);

  function goTo(i: number) {
    setIndex(Math.max(0, Math.min(questions.length - 1, i)));
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  }

  function answer(value: AnswerValue) {
    setAnswers((prev) => ({ ...prev, [question.id]: value }));
  }

  function toggleFlag() {
    setFlagged((list) => (isFlagged ? list.filter((id) => id !== question.id) : [...list, question.id]));
  }

  async function submit() {
    if (done.current) return;
    setSubmitting(true);
    // Later: server action die de antwoorden opslaat.
    await new Promise((r) => setTimeout(r, 500));
    // Intussen kan de tijd om zijn gegaan; dan is er al ingeleverd.
    if (done.current) return;
    done.current = true;
    onSubmit(answersRef.current, false);
  }

  function jumpFromDialog(i: number) {
    setConfirmOpen(false);
    goTo(i);
    // De dialoog geeft bij sluiten de focus terug aan de knop; daarna naar de vraag.
    window.setTimeout(() => heading.current?.focus({ preventScroll: true }), 450);
  }

  const time = formatDuration(remaining);
  const showTime = !timerHidden || warning;

  return (
    <>
      <div className={styles.bar}>
        <div className={styles.barInner}>
          <div className={styles.barText}>
            <p className={styles.barEyebrow}>Eindtoets {pathTitle}</p>
            <p className={styles.barTitle}>
              Vraag {index + 1} <span>van {questions.length}</span>
            </p>
          </div>

          <div className={styles.barActions}>
            <div className={clsx(styles.timer, warning && styles.warning)}>
              <Timer aria-hidden />
              {showTime ? (
                <span className={styles.clock}>
                  <span className="visually-hidden">Resterende tijd: </span>
                  {time.clock}
                </span>
              ) : (
                <span className={styles.clockHidden}>Tijd verborgen</span>
              )}
              {!warning && (
                <button
                  type="button"
                  className={styles.timerToggle}
                  onClick={() => setTimerHidden((h) => !h)}
                  aria-label={timerHidden ? "Toon resterende tijd" : "Verberg resterende tijd"}
                  title={timerHidden ? "Toon tijd" : "Verberg tijd"}
                >
                  {timerHidden ? <Eye aria-hidden /> : <EyeOff aria-hidden />}
                </button>
              )}
            </div>
            <Button size="sm" variant="secondary" icon={<Send />} onClick={() => setConfirmOpen(true)}>
              Inleveren
            </Button>
          </div>
        </div>

        <div
          className={styles.segments}
          role="progressbar"
          aria-label="Voortgang"
          aria-valuemin={0}
          aria-valuemax={questions.length}
          aria-valuenow={answeredCount}
          aria-valuetext={`${answeredCount} van ${questions.length} vragen beantwoord`}
        >
          {questions.map((q, i) => (
            <span
              key={q.id}
              className={clsx(
                styles.segment,
                isAnswered(answers[q.id]) && styles.filled,
                i === index && styles.current,
              )}
            />
          ))}
        </div>
      </div>

      <p className="visually-hidden" aria-live="polite">
        {announcement}
      </p>

      <main className={styles.layout}>
        <div className={styles.main}>
          <Card className={styles.questionCard}>
            <QuestionView
              key={question.id}
              question={question}
              number={index + 1}
              topic={topics.find((t) => t.id === question.topicId)}
              answer={answers[question.id]}
              onAnswer={answer}
              headingRef={heading}
            />
          </Card>

          <nav className={styles.pager} aria-label="Vragen">
            <Button
              variant="secondary"
              icon={<ArrowLeft />}
              onClick={() => goTo(index - 1)}
              disabled={index === 0}
            >
              Vorige
            </Button>
            <Button
              variant="ghost"
              icon={<Flag className={clsx(isFlagged && styles.flagFilled)} />}
              onClick={toggleFlag}
              aria-pressed={isFlagged}
              className={clsx(isFlagged && styles.flagActive)}
            >
              <span className={styles.flagText}>{isFlagged ? "Gemarkeerd" : "Markeer"}</span>
              <span className="visually-hidden"> om later te controleren</span>
            </Button>
            {isLast ? (
              <Button iconRight={<Send />} onClick={() => setConfirmOpen(true)}>
                Inleveren
              </Button>
            ) : (
              <Button iconRight={<ArrowRight />} onClick={() => goTo(index + 1)}>
                Volgende
              </Button>
            )}
          </nav>
        </div>

        <aside className={styles.aside} aria-labelledby="exam-nav-title">
          <Card className={styles.navCard}>
            <div className={styles.navHead}>
              <h2 id="exam-nav-title" className={styles.navTitle}>
                Vragenoverzicht
              </h2>
              <p className={styles.navCount}>
                {answeredCount} van {questions.length} beantwoord
              </p>
            </div>

            <ol className={styles.navGrid}>
              {questions.map((q, i) => {
                const answered = isAnswered(answers[q.id]);
                const flag = flagged.includes(q.id);
                return (
                  <li key={q.id}>
                    <button
                      type="button"
                      onClick={() => goTo(i)}
                      aria-current={i === index ? "step" : undefined}
                      aria-label={`Vraag ${i + 1}, ${answered ? "beantwoord" : "nog niet beantwoord"}${flag ? ", gemarkeerd" : ""}`}
                      className={clsx(
                        styles.navItem,
                        answered && styles.answered,
                        i === index && styles.active,
                      )}
                    >
                      {i + 1}
                      {flag && (
                        <span className={styles.navFlag} aria-hidden>
                          <Flag />
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ol>

            <ul className={styles.legend} aria-label="Legenda">
              <li>
                <span className={clsx(styles.legendSwatch, styles.answered)} aria-hidden />
                Beantwoord
              </li>
              <li>
                <span className={styles.legendSwatch} aria-hidden />
                Open
              </li>
              <li>
                <span className={clsx(styles.legendSwatch, styles.legendFlag)} aria-hidden>
                  <Flag />
                </span>
                Gemarkeerd
              </li>
            </ul>

            <Button fullWidth variant="dark" icon={<Send />} onClick={() => setConfirmOpen(true)}>
              Toets inleveren
            </Button>
            <p className={styles.navNote}>
              Je kunt tot het inleveren alles aanpassen. Maximaal {exam.timeLimitMinutes} minuten.
            </p>
          </Card>
        </aside>
      </main>

      <Dialog
        open={confirmOpen}
        onOpenChange={(open) => !submitting && setConfirmOpen(open)}
        dismissible={!submitting}
        title={unanswered.length ? "Toch inleveren?" : "Klaar om in te leveren?"}
        description={
          unanswered.length
            ? `Je hebt ${unanswered.length} van de ${questions.length} vragen nog niet beantwoord. Die tellen als fout.`
            : "Je hebt alle vragen beantwoord. Na het inleveren kun je je antwoorden niet meer aanpassen."
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmOpen(false)} disabled={submitting}>
              Terug naar de toets
            </Button>
            <Button onClick={submit} loading={submitting} icon={<Send />}>
              Toets inleveren
            </Button>
          </>
        }
      >
        <div className={styles.confirm}>
          {unanswered.length > 0 && (
            <QuestionJumpList
              title="Niet beantwoord"
              items={unanswered}
              onJump={jumpFromDialog}
              disabled={submitting}
            />
          )}
          {flaggedItems.length > 0 && (
            <QuestionJumpList
              title="Gemarkeerd om te controleren"
              items={flaggedItems}
              onJump={jumpFromDialog}
              disabled={submitting}
              flagged
            />
          )}
          {unanswered.length === 0 && flaggedItems.length === 0 && (
            <Alert variant="success" icon={false}>
              Alle {questions.length} vragen zijn beantwoord en niets staat nog gemarkeerd.
            </Alert>
          )}
          {!warning && (
            <p className={styles.confirmTime}>
              Je hebt nog {time.minutes} {time.minutes === 1 ? "minuut" : "minuten"} over.
            </p>
          )}
        </div>
      </Dialog>
    </>
  );
}

function QuestionJumpList({
  title,
  items,
  onJump,
  disabled,
  flagged,
}: {
  title: string;
  items: { q: { id: string; prompt: string }; i: number }[];
  onJump: (i: number) => void;
  disabled?: boolean;
  flagged?: boolean;
}) {
  return (
    <section className={styles.jump}>
      <h3 className={styles.jumpTitle}>
        {flagged && <Flag aria-hidden />}
        {title} <span>({items.length})</span>
      </h3>
      <ul className={styles.jumpList}>
        {items.map(({ q, i }) => (
          <li key={q.id}>
            <button type="button" className={styles.jumpItem} onClick={() => onJump(i)} disabled={disabled}>
              <span className={styles.jumpNumber}>
                <span className="visually-hidden">Vraag </span>
                {i + 1}
              </span>
              <span className={styles.jumpPrompt}>{q.prompt}</span>
              <ArrowRight aria-hidden className={styles.jumpArrow} />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
