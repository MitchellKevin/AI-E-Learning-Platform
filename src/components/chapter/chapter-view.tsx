"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { ArrowLeft, ArrowRight, Check, ChevronDown } from "lucide-react";
import { errorMessage, unwrap } from "@/lib/action-result";
import type { Chapter } from "@/lib/types";
import { Breadcrumbs, ProgressBar, Tag, Tags } from "@/components/ui";
import { useToast } from "@/components/kit";
import { completeTaskAction, recordMinuteAction, recordQuizAction } from "@/server/actions/learning";
import { TutorButton } from "@/components/tutor/tutor-provider";
import { TaskBlocks, type ContinueAction } from "./task-blocks";
import styles from "./chapter-view.module.scss";

type NavLink = { href: string; label: string };

// Voortgang wordt direct getoond en via een server action opgeslagen.
export function ChapterView({
  chapter,
  initialCompleted,
  breadcrumbs,
  prev,
  next,
}: {
  chapter: Chapter;
  initialCompleted: string[];
  breadcrumbs: { label: string; href?: string }[];
  prev?: NavLink;
  next?: NavLink;
}) {
  const { toast } = useToast();
  const [completed, setCompleted] = useState(initialCompleted);
  const [openId, setOpenId] = useState<string | null>(
    chapter.tasks.find((t) => !initialCompleted.includes(t.id))?.id ?? null,
  );

  const done = completed.length;
  const total = chapter.tasks.length;

  const firstOpen = (list: string[]) => chapter.tasks.find((t) => !list.includes(t.id))?.id ?? null;

  // `stay`: de taak blijft open zodat de uitleg te lezen is; doorgaan gaat dan via continueFor().
  function complete(taskId: string, stay = false) {
    if (completed.includes(taskId)) return;
    const updated = [...completed, taskId];
    setCompleted(updated);
    if (!stay) setOpenId(firstOpen(updated));

    completeTaskAction(chapter.id, taskId)
      .then(unwrap)
      .then((result) => {
        if (result.points) toast({ variant: "success", title: `Hoofdstuk afgerond: +${result.points} punten` });
        for (const label of result.badges) toast({ variant: "success", title: "Nieuwe badge behaald", description: label });
      })
      .catch((error) => {
        // Terugdraaien, zodat het scherm niet meer belooft dan er is opgeslagen.
        setCompleted((list) => list.filter((id) => id !== taskId));
        toast({ variant: "error", title: "Opslaan lukte niet", description: errorMessage(error, "Controleer je verbinding en probeer het opnieuw.") });
      });
  }

  // Leertijd: elke minuut dat de pagina zichtbaar is.
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") recordMinuteAction().catch(() => {});
    }, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  // De knop verdwijnt mee met het dichtklappende paneel; de focus gaat naar de kop van de taak.
  function openAndFocus(taskId: string | null, focusId: string) {
    setOpenId(taskId);
    requestAnimationFrame(() => document.getElementById(`kop-${focusId}`)?.focus());
  }

  function continueFor(taskId: string): ContinueAction {
    const nextTask = chapter.tasks.find((t) => t.id !== taskId && !completed.includes(t.id));
    if (nextTask) return { label: "Volgende taak", onClick: () => openAndFocus(nextTask.id, nextTask.id) };
    if (next) return { label: `Verder met ${next.label}`, href: next.href };
    return { label: "Taak sluiten", onClick: () => openAndFocus(null, taskId) };
  }

  return (
    <main>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div>
            <Breadcrumbs items={breadcrumbs} />
            <h1 className={styles.title}>{chapter.title}</h1>
            <Tags>
              <Tag variant="brand">{chapter.level}</Tag>
              <Tag>{chapter.minutes}</Tag>
              <Tag>+{chapter.points} punten</Tag>
              <Tag>{chapter.audience}</Tag>
            </Tags>
          </div>
          <div className={styles.progress}>
            <div className={styles.progressHead}>
              <span>Voortgang</span>
              {/* key laat de teller opnieuw binnenkomen bij elke afgeronde taak */}
              <strong key={done} className={styles.count}>
                {done} van {total} taken
              </strong>
            </div>
            <ProgressBar value={(done / total) * 100} className={styles.progressBar} />
            <TutorButton />
          </div>
        </div>
      </section>

      <div className={styles.body}>
        {done === total && (
          <div className={styles.completeBanner} role="status">
            <Check className={styles.bannerIcon} />
            Hoofdstuk afgerond! Je hebt {chapter.points} punten verdiend.
          </div>
        )}

        <ol className={styles.tasks}>
          {chapter.tasks.map((task, i) => {
            const isDone = completed.includes(task.id);
            // Alleen taken die in deze sessie zijn afgerond krijgen de pop-animatie.
            const isNew = isDone && !initialCompleted.includes(task.id);
            const isOpen = openId === task.id;
            const panelId = `taak-${task.id}`;
            return (
              <li key={task.id} className={clsx(styles.task, isOpen && styles.open)}>
                <button
                  id={`kop-${task.id}`}
                  className={styles.taskHead}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpenId(isOpen ? null : task.id)}
                >
                  <span className={clsx(styles.check, isDone && styles.done, isNew && styles.justDone)}>
                    {isDone && <Check />}
                  </span>
                  <span className={styles.taskNumber}>Taak {i + 1}</span>
                  <span className={styles.taskTitle}>{task.title}</span>
                  <ChevronDown className={styles.chevron} />
                </button>
                {/* Paneel blijft gemount zodat het kan in- en uitklappen; dicht is het onzichtbaar en niet focusbaar. */}
                <div id={panelId} className={styles.panel}>
                  <div className={styles.panelInner}>
                    <div className={styles.taskBody}>
                      <TaskBlocks
                        blocks={task.blocks}
                        done={isDone}
                        active={isOpen}
                        onComplete={(stay) => complete(task.id, stay)}
                        onQuizResult={(firstTry) => recordQuizAction(chapter.id, task.id, firstTry).catch(() => {})}
                        continueAction={continueFor(task.id)}
                      />
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>

        <nav className={styles.pager} aria-label="Hoofdstuknavigatie">
          {prev ? (
            <Link href={prev.href} className={clsx(styles.pagerLink, styles.prev)}>
              <ArrowLeft /> {prev.label}
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link href={next.href} className={clsx(styles.pagerLink, styles.next)}>
              {next.label} <ArrowRight />
            </Link>
          )}
        </nav>
      </div>
    </main>
  );
}
