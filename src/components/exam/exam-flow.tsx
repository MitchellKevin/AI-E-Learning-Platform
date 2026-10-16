"use client";

import { useEffect, useRef, useState } from "react";
import type { Exam, ExamAttempt, ExamQuestion } from "@/lib/data/exam";
import type { TopicIcon } from "@/lib/types";
import { useToast } from "@/components/kit";
import { startExamAction, submitExamAction } from "@/server/actions/exam";
import type { Answers, ExamResult } from "./exam-logic";
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
  /** null bij een demo-poging: die wordt niet opgeslagen. */
  attemptId: string | null;
  /** Bewijs dat de server deze demo heeft getrokken. */
  demoToken: string | null;
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
  // Vragen met uitwerkingen; die stuurt de server pas na het inleveren.
  const [reviewQuestions, setReviewQuestions] = useState<ExamQuestion[] | null>(null);
  const [gradingDone, setGradingDone] = useState(false);
  const [wasDemo, setWasDemo] = useState(false);
  const [certificateHref, setCertificateHref] = useState(props.certificateHref);
  const [starting, setStarting] = useState(false);
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

  async function start() {
    setStarting(true);
    const response = await startExamAction(path.slug, demo).catch(() => null);
    setStarting(false);
    if (!response?.ok) {
      toast({ variant: "error", title: "Starten lukte niet", description: response?.error ?? "Probeer het opnieuw." });
      return;
    }
    setSession({
      attemptId: response.attemptId,
      demoToken: response.demoToken,
      number: response.number,
      questions: response.questions,
      startedAt: response.startedAt,
      deadline: response.deadline,
    });
    setFinished(null);
    setReviewQuestions(null);
    setGradingDone(false);
    setPhase("exam");
  }

  // Inleveren: de server kijkt na (en geeft bij slagen het certificaat uit).
  async function submit(answers: Answers, timedOut: boolean) {
    if (!session) return;
    if (timedOut) {
      toast({ title: "De tijd is om", description: "Je toets is automatisch ingeleverd.", variant: "info" });
    }
    setPhase("grading");
    const response = await submitExamAction({
      pathSlug: path.slug,
      attemptId: session.attemptId,
      questionIds: session.questions.map((q) => q.id),
      answers,
      demo: session.demoToken ? { token: session.demoToken, startedAt: session.startedAt } : undefined,
    }).catch(() => null);

    if (!response?.ok) {
      toast({ variant: "error", title: "Inleveren lukte niet", description: response?.error ?? "Controleer je verbinding en probeer het opnieuw." });
      setPhase("exam");
      return;
    }
    setReviewQuestions(response.questions);
    setWasDemo(response.demo);
    if (response.certificateNumber) setCertificateHref(`/profiel/certificaten/${path.slug}`);
    setFinished({
      ...response.result,
      number: session.number,
      answers,
      durationMs: Math.min(Date.now(), session.deadline) - session.startedAt,
      timedOut: timedOut || response.late,
    });
  }

  // Het resultaat verschijnt als de nakijkanimatie klaar is én de server heeft geantwoord.
  useEffect(() => {
    if (phase !== "grading" || !gradingDone || !finished) return;
    if (!wasDemo) {
      setAttempts((list) => [
        ...list,
        { number: finished.number, date: new Date().toISOString(), score: finished.score, passed: finished.passed },
      ]);
    }
    if (finished.passed) {
      toast({
        variant: "success",
        title: wasDemo ? "Geslaagd (demo)" : "Certificaat behaald",
        description: wasDemo
          ? "In de demo wordt er geen certificaat aangemaakt."
          : `Je certificaat ${path.title} staat in je profiel. +500 punten`,
      });
    }
    setPhase("result");
  }, [phase, gradingDone, finished, wasDemo, path.title, toast]);

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
        onDone={() => setGradingDone(true)}
      />
    );
  }

  if (phase === "result" && finished && session) {
    return (
      <ExamResultView
        {...props}
        certificateHref={certificateHref}
        attempt={finished}
        questions={reviewQuestions ?? session.questions}
        attemptsLeft={exam.maxAttempts - attempts.length}
        demo={wasDemo}
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
      starting={starting}
      locked={requirement.locked && !demo}
      focusOnMount={returning}
    />
  );
}
