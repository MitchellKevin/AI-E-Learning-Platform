"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { TutorContext } from "@/lib/data/tutor";
import { findAnswer } from "./match";
import { prefersReducedMotion, THINKING_MS, tokenize, TOKEN_MS } from "./stream";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  status: "thinking" | "streaming" | "done" | "stopped";
  source?: string;
  followUps?: string[];
  /** Geen passend antwoord gevonden. */
  fallback?: boolean;
};

// Gesprek met de AI-tutor. Leeft in de provider, zodat het blijft staan als de drawer dicht gaat.
export function useTutorChat(context: TutorContext) {
  const greeting: ChatMessage = { id: "welkom", role: "assistant", text: context.greeting, status: "done" };
  const [messages, setMessages] = useState<ChatMessage[]>([greeting]);
  const [announcement, setAnnouncement] = useState("");
  const timeout = useRef<number | undefined>(undefined);
  const interval = useRef<number | undefined>(undefined);
  const counter = useRef(0);

  const busy = messages.some((m) => m.status === "thinking" || m.status === "streaming");

  const clearTimers = useCallback(() => {
    window.clearTimeout(timeout.current);
    window.clearInterval(interval.current);
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  function patch(id: string, update: Partial<ChatMessage>) {
    setMessages((list) => list.map((m) => (m.id === id ? { ...m, ...update } : m)));
  }

  function stream(id: string, answer: string) {
    const finish = () => {
      patch(id, { text: answer, status: "done" });
      setAnnouncement(`AI-tutor: ${answer}`);
    };
    if (prefersReducedMotion()) return finish();

    const tokens = tokenize(answer);
    let shown = 0;
    patch(id, { status: "streaming" });
    interval.current = window.setInterval(() => {
      shown = Math.min(tokens.length, shown + 1 + Math.round(Math.random()));
      if (shown >= tokens.length) {
        window.clearInterval(interval.current);
        finish();
      } else {
        patch(id, { text: tokens.slice(0, shown).join("") });
      }
    }, TOKEN_MS);
  }

  /** Verstuurt een vraag; geeft false terug als er nog een antwoord loopt. */
  function send(raw: string) {
    const question = raw.trim();
    if (!question || busy) return false;

    // Later: POST naar een route handler die de Claude API aanroept met de hoofdstukinhoud als context,
    // en de stream doorgeeft. De matching en timers hieronder vervallen dan.
    const entry = findAnswer(context, question);
    const id = `m${++counter.current}`;
    setMessages((list) => [
      ...list,
      { id: `${id}-vraag`, role: "user", text: question, status: "done" },
      {
        id,
        role: "assistant",
        text: "",
        status: "thinking",
        source: entry ? (entry.source ?? context.source) : undefined,
        followUps: entry?.followUps,
        fallback: !entry,
      },
    ]);
    setAnnouncement("De AI-tutor denkt na…");
    timeout.current = window.setTimeout(
      () => stream(id, entry?.answer ?? context.fallback),
      THINKING_MS + Math.random() * 400,
    );
    return true;
  }

  function stop() {
    clearTimers();
    setMessages((list) =>
      list.map((m) => (m.status === "thinking" || m.status === "streaming" ? { ...m, status: "stopped" } : m)),
    );
    setAnnouncement("Antwoord gestopt.");
  }

  function reset() {
    clearTimers();
    setMessages([greeting]);
    setAnnouncement("Nieuw gesprek gestart.");
  }

  return { messages, busy, announcement, send, stop, reset };
}

export type TutorChat = ReturnType<typeof useTutorChat>;
