"use client";

import { useEffect, useRef, useState } from "react";
import type { Exam, ExamAttempt, ExamQuestion } from "@/lib/data/exam";
import type { TopicIcon } from "@/lib/types";
import { useToast } from "@/components/kit";
import { drawQuestions, gradeExam, seedFrom, type Answers, type ExamResult } from "./exam-logic";
import { ExamIntro } from "./exam-intro";
import { ExamSession } from "./exam-session";
import { ExamGrading } from "./exam-grading";
import { ExamResultView } from "./exam-result";

export type ExamTopic = { id: string; title: string; icon: TopicIcon };

export type ExamRequirement = {
  locked: boolean;
  done: number;
  total: number;
  topics: { id: string; title: string; done: number; total: number }[];
  continueHref?: string;
  continueLabel?: string;
};

export type ExamFlowProps = {
  path: { slug: string; title: string; level: string };
  topics: ExamTopic[];
  /** Hoofdstukken per slug, voor de "dit kun je herhalen"-links. */
  chapters: Record<string, { number: string; title: string }>;
  exam: Exam;
  initialAttempts: ExamAttempt[];
  requirement: ExamRequirement;
  certificateHref: string;
  hasSpecialisations: boolean;
};

type Phase = "intro" | "exam" | "grading" | "result";

export type ExamSessionState = {
  number: number;
  questions: ExamQuestion[];
  startedAt: number;
  deadline: number;
};

export type FinishedAttempt = ExamResult & {
  number: number;
  answers: Answers;
  durationMs: number;
  timedOut: boolean;
};

// Hele toetsflow in één client-component: intro, vragen, nakijken en resultaat.
export function ExamFlow(props: ExamFlowProps) {
  const { path, exam, initialAttempts, requirement } = props;
  const { toast } = useToast();
  const [phase, setPhase] = useState<Phase>("intro");
  const [demo, setDemo] = useState(false);
  const [attempts, setAttempts] = useState(initialAttempts);
  const [session, setSession] = useState<ExamSessionState | null>(null);
  const [finished, setFinished] = useState<FinishedAttempt | null>(null);
  // Na "Opnieuw proberen" gaat de focus naar de kop van de intro.
  const [returning, setReturning] = useState(false);
  const firstRender = useRef(true);

  // Bij elke nieuwe fase bovenaan beginnen; de fase zelf zet de focus op zijn kop.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    window.scrollTo({ top: 0 });
  }, [phase]);

  function start() {
    const number = attempts.length + 1;
    const now = Date.now();
    setSession({
      number,
      questions: drawQuestions(exam.questions, exam.questionCount, seedFrom(`${path.slug}:${number}`)),
      startedAt: now,
      deadline: now + exam.timeLimitMinutes * 60_000,
    });
    setFinished(null);
    setPhase("exam");
  }

  // Later: server action die de poging opslaat en open vragen via de Claude API laat beoordelen.
  function submit(answers: Answers, timedOut: boolean) {
    if (!session) return;
    const result = gradeExam(session.questions, answers, exam.passingScore);
    setFinished({
      ...result,
      number: session.number,
      answers,
      durationMs: Math.min(Date.now(), session.deadline) - session.startedAt,
      timedOut,
    });
    if (timedOut) {
      toast({ title: "De tijd is om", description: "Je toets is automatisch ingeleverd.", variant: "info" });
    }
    setPhase("grading");
  }

  function showResult() {
    if (!finished) return;
    setAttempts((list) => [
      ...list,
      { number: finished.number, date: new Date().toISOString(), score: finished.score, passed: finished.passed },
    ]);
    if (finished.passed) {
      toast({
        variant: "success",
        title: demo ? "Geslaagd (demo)" : "Certificaat behaald",
        description: demo
          ? "In de demo wordt er geen certificaat aangemaakt."
          : `Je certificaat ${path.title} staat in je profiel.`,
      });
    }
    setPhase("result");
  }

  if (phase === "exam" && session) {
    return (
      <ExamSession
        key={session.number}
        session={session}
        exam={exam}
        pathTitle={path.title}
        topics={props.topics}
        onSubmit={submit}
      />
    );
  }

  if (phase === "grading" && finished && session) {
    return (
      <ExamGrading
        pathTitle={path.title}
        hasOpen={session.questions.some((q) => q.type === "open")}
        onDone={showResult}
      />
    );
  }

  if (phase === "result" && finished && session) {
    return (
      <ExamResultView
        {...props}
        attempt={finished}
        questions={session.questions}
        attemptsLeft={exam.maxAttempts - attempts.length}
        demo={demo}
        onRetry={() => {
          setReturning(true);
          setPhase("intro");
        }}
      />
    );
  }

  return (
    <ExamIntro
      {...props}
      attempts={attempts}
      demo={demo}
      onDemoChange={setDemo}
      onStart={start}
      locked={requirement.locked && !demo}
      focusOnMount={returning}
    />
  );
}
