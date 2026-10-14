"use client";

import { useEffect, useState } from "react";

// Hulpjes om een "gestreamd" AI-antwoord na te bootsen. Later komt de stream echt van de Claude API.

/** Woorden inclusief de witruimte ervoor, zodat regelovergangen meekomen met het volgende woord. */
export function tokenize(text: string) {
  return text.match(/\s*\S+/g) ?? [];
}

export function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export const THINKING_MS = 650;
export const TOKEN_MS = 32;

export type StreamPhase = "thinking" | "streaming" | "done";

/** Toont `text` woord voor woord na een korte denkpauze. Zonder `animate` staat alles er meteen. */
export function useStreamedText(text: string, animate: boolean) {
  const [phase, setPhase] = useState<StreamPhase>(animate ? "thinking" : "done");
  const [count, setCount] = useState(0);
  const tokens = tokenize(text);

  useEffect(() => {
    if (!animate) return;
    if (prefersReducedMotion()) {
      setPhase("done");
      return;
    }
    const total = tokenize(text).length;
    let shown = 0;
    let interval: number | undefined;
    const timeout = window.setTimeout(() => {
      setPhase("streaming");
      interval = window.setInterval(() => {
        shown = Math.min(total, shown + 1 + Math.round(Math.random()));
        setCount(shown);
        if (shown >= total) {
          window.clearInterval(interval);
          setPhase("done");
        }
      }, TOKEN_MS);
    }, THINKING_MS);

    return () => {
      window.clearTimeout(timeout);
      window.clearInterval(interval);
    };
  }, [text, animate]);

  return { phase, shown: phase === "done" ? text : tokens.slice(0, count).join("") };
}
