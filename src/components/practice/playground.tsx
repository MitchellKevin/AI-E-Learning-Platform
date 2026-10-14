"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { PenLine, Sparkles } from "lucide-react";
import { Badge, Button, Tab, TabList, TabPanel, Tabs, useToast } from "@/components/kit";
import type { CriterionKey, PracticeExercise } from "@/lib/data/practice";
import { AttemptView, type Attempt } from "./attempt-view";
import { CompletionCard } from "./completion-card";
import { ExerciseBrief } from "./exercise-brief";
import { MAX_PROMPT, PromptComposer } from "./prompt-composer";
import { reviewPrompt } from "./review-prompt";
import { buildResponse } from "./simulate-response";
import { useSimulatedStream } from "./use-simulated-stream";
import styles from "./playground.module.scss";

type Props = {
  exercise: PracticeExercise;
  /** Beste score als de oefening al eerder is afgerond. */
  completedScore?: number;
  next?: { slug: string; title: string };
};

// Te snel na versturen op "Stop" (dubbelklik) telt niet.
const STOP_GUARD_MS = 500;

// Oefenruimte: links de opdracht, rechts pogingen met streamend antwoord en feedback.
export function Playground({ exercise, completedScore, next }: Props) {
  const free = Boolean(exercise.free);
  const { toast } = useToast();
  const stream = useSimulatedStream();

  const [draft, setDraft] = useState("");
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [selected, setSelected] = useState<string>();
  const [announcement, setAnnouncement] = useState("");
  const [finishing, setFinishing] = useState(false);
  const [finished, setFinished] = useState<{ score: number; points: number } | null>(null);

  const textarea = useRef<HTMLTextAreaElement>(null);
  const completionHeading = useRef<HTMLHeadingElement>(null);
  const startedAt = useRef(0);
  const finishedRef = useRef(false);
  // Cursorpositie die na de volgende render in het tekstveld gezet moet worden.
  const caret = useRef<number | null>(null);

  const busy = stream.phase !== "idle";
  const reviewed = attempts.filter((a) => a.status !== "pending");
  const bestScore = reviewed.reduce((max, a) => Math.max(max, a.review.score), 0);
  const best: Partial<Record<CriterionKey, number>> = {};
  for (const a of reviewed) {
    for (const c of a.review.criteria) best[c.key] = Math.max(best[c.key] ?? 0, c.score);
  }

  useLayoutEffect(() => {
    const el = textarea.current;
    if (caret.current === null || !el) return;
    el.focus();
    el.setSelectionRange(caret.current, caret.current);
    caret.current = null;
  }, [draft]);

  useEffect(() => {
    if (finished) completionHeading.current?.focus();
  }, [finished]);

  function focusComposer(value: string, position = value.length) {
    caret.current = position;
    if (value === draft) {
      // Geen render nodig; direct focussen.
      textarea.current?.focus();
      textarea.current?.setSelectionRange(position, position);
      caret.current = null;
    }
    setDraft(value);
  }

  function insertMaterial() {
    const material = exercise.material;
    if (!material) return;
    if (draft.includes(material.body)) {
      toast({ title: "Het materiaal staat al in je prompt" });
      textarea.current?.focus();
      return;
    }
    const block = `${material.label}:\n"""\n${material.body}\n"""`;
    // Leeg veld: materiaal onderaan, cursor bovenaan voor je vraag.
    if (!draft.trim()) focusComposer(`\n\n${block}`.slice(0, MAX_PROMPT), 0);
    else focusComposer(`${draft.trimEnd()}\n\n${block}`.slice(0, MAX_PROMPT));
  }

  function send(prompt: string) {
    const previous = attempts.at(-1);
    const review = reviewPrompt(prompt, { exercise, previous: previous?.prompt });
    const id = attempts.length + 1;
    const response = buildResponse({
      exercise,
      prompt,
      score: review.score,
      attempt: attempts.length,
      previousScore: previous?.review.score,
    });

    setAttempts((list) => [...list, { id, prompt, response: "", status: "pending", review }]);
    setSelected(String(id));
    setAnnouncement(`Poging ${id} verstuurd. De AI schrijft een antwoord.`);
    startedAt.current = Date.now();

    // Straks: een server action of route handler die de Claude API streamt en de prompt laat beoordelen.
    stream.start(response, (text, stopped) => {
      setAttempts((list) =>
        list.map((a) => (a.id === id ? { ...a, response: text, status: stopped ? "stopped" : "done" } : a)),
      );
      const norm =
        free || finishedRef.current
          ? ""
          : review.score >= exercise.passScore
            ? " Je haalt de norm en kunt de oefening afronden."
            : ` Afronden kan vanaf ${exercise.passScore}.`;
      setAnnouncement(
        `${stopped ? "Antwoord gestopt." : "Antwoord compleet."} Je prompt scoort ${review.score} van 100.${norm}`,
      );
    });
  }

  function stop() {
    if (Date.now() - startedAt.current < STOP_GUARD_MS) return;
    stream.stop();
  }

  async function finish(score: number) {
    setFinishing(true);
    // Straks een server action die de score in MongoDB opslaat en de punten toekent.
    await new Promise((resolve) => setTimeout(resolve, 700));
    const points = completedScore === undefined ? exercise.points : 0;
    finishedRef.current = true;
    setFinished({ score, points });
    setFinishing(false);
    toast({
      variant: "success",
      title: points ? `Oefening afgerond: +${points} punten` : "Oefening opnieuw afgerond",
      description: points ? `Je prompt scoorde ${score}. Mooi werk!` : `Je prompt scoorde ${score}.`,
    });
  }

  function footerFor(attempt: Attempt) {
    if (free) return null;
    if (finished) {
      return <p className={styles.footerText}>Je hebt deze oefening afgerond met een score van {finished.score}.</p>;
    }
    if (attempt.review.score >= exercise.passScore) {
      return (
        <div className={styles.footerRow}>
          <p className={styles.footerText}>
            <strong>Deze prompt haalt de norm.</strong> Rond de oefening af, of scherp hem nog verder aan.
          </p>
          <Button loading={finishing} onClick={() => finish(attempt.review.score)}>
            Rond oefening af
          </Button>
        </div>
      );
    }
    const lowest = [...attempt.review.criteria].sort((a, b) => a.score - b.score)[0];
    return (
      <div className={styles.footerRow}>
        <p className={styles.footerText}>
          Begin bij <strong>{lowest.label.toLowerCase()}</strong>: daar valt het meeste te winnen.
        </p>
        <Button
          variant="secondary"
          icon={<PenLine />}
          // Wat je al aan het aanpassen bent blijft staan.
          onClick={() => focusComposer(draft.trim() ? draft : attempt.prompt)}
          disabled={busy}
        >
          Verbeter je prompt
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.layout}>
      <aside className={styles.brief} aria-label="Opdracht">
        <ExerciseBrief exercise={exercise} best={best} onInsertMaterial={insertMaterial} />
      </aside>

      <section className={styles.workspace} aria-labelledby="workspace-title">
        <div className={styles.workspaceHead}>
          <h2 id="workspace-title" className={styles.workspaceTitle}>
            {free ? "Jouw oefenruimte" : "Jouw pogingen"}
          </h2>
          {reviewed.length > 0 && (
            <Badge variant={!free && bestScore >= exercise.passScore ? "success" : "neutral"}>
              Beste score {bestScore}
            </Badge>
          )}
        </div>

        {finished && (
          <CompletionCard
            score={finished.score}
            points={finished.points}
            previousBest={completedScore}
            next={next}
            headingRef={completionHeading}
          />
        )}

        {attempts.length === 0 ? (
          <div className={styles.empty}>
            <span className={styles.emptyIcon} aria-hidden>
              <Sparkles />
            </span>
            <h3 className={styles.emptyTitle}>{free ? "Waar wil je mee oefenen?" : "Schrijf je eerste prompt"}</h3>
            <p className={styles.emptyText}>
              {free
                ? "Schrijf een prompt die je deze week echt nodig hebt, of begin met een van de voorbeelden. Je krijgt bij elke poging feedback."
                : "Gebruik de opdracht hiernaast. Na het versturen zie je wat de AI ervan maakt, met feedback op vijf onderdelen van je prompt."}
            </p>
            {free && exercise.starters && (
              <div className={styles.starters}>
                {exercise.starters.map((s) => (
                  <Button key={s.label} variant="secondary" size="sm" onClick={() => focusComposer(s.prompt)}>
                    {s.label}
                  </Button>
                ))}
              </div>
            )}
            {!free && exercise.material && (
              <Button variant="secondary" size="sm" className={styles.emptyAction} onClick={insertMaterial}>
                Begin met het materiaal
              </Button>
            )}
          </div>
        ) : (
          <Tabs value={selected} onValueChange={setSelected} variant="pill" className={styles.tabs}>
            <TabList aria-label="Pogingen">
              {attempts.map((a) => (
                <Tab key={a.id} value={String(a.id)} count={a.status === "pending" ? undefined : a.review.score}>
                  Poging {a.id}
                  {a.status !== "pending" && <span className="visually-hidden">, score</span>}
                </Tab>
              ))}
            </TabList>
            {attempts.map((a, i) => {
              const previous = attempts[i - 1];
              return (
                <TabPanel key={a.id} value={String(a.id)} className={styles.panel}>
                  <AttemptView
                    attempt={a}
                    live={a.status === "pending" ? { text: stream.text, phase: stream.phase } : undefined}
                    previous={previous && previous.status !== "pending" ? previous.review : undefined}
                    passScore={free ? undefined : exercise.passScore}
                    feedbackFooter={footerFor(a)}
                    onReuse={(prompt) => focusComposer(prompt)}
                  />
                </TabPanel>
              );
            })}
          </Tabs>
        )}

        <div className={styles.composer}>
          <PromptComposer
            value={draft}
            onChange={setDraft}
            onSubmit={send}
            onStop={stop}
            busy={busy}
            placeholder={exercise.placeholder}
            attempts={attempts.length}
            textareaRef={textarea}
          />
        </div>

        <p role="status" className="visually-hidden">
          {announcement}
        </p>
      </section>
    </div>
  );
}
