"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type StreamPhase = "idle" | "thinking" | "streaming";

type Job = {
  tokens: string[];
  index: number;
  text: string;
  onEnd: (text: string, stopped: boolean) => void;
};

// Simuleert een streamend AI-antwoord: eerst even "nadenken", dan woord voor woord.
// Wordt later een fetch naar een route handler die de Claude API streamt; start/stop blijven gelijk.
export function useSimulatedStream() {
  const [text, setText] = useState("");
  const [phase, setPhase] = useState<StreamPhase>("idle");
  const timer = useRef<number | undefined>(undefined);
  const job = useRef<Job | null>(null);

  const clear = () => window.clearTimeout(timer.current);

  // Geen losse timers meer na het verlaten van de pagina.
  useEffect(
    () => () => {
      clear();
      job.current = null;
    },
    [],
  );

  const finish = useCallback((stopped: boolean) => {
    clear();
    const current = job.current;
    if (!current) return;
    job.current = null;
    setPhase("idle");
    current.onEnd(current.text, stopped);
  }, []);

  const start = useCallback(
    (full: string, onEnd: Job["onEnd"]) => {
      clear();
      job.current = { tokens: full.match(/\s+|\S+/g) ?? [], index: 0, text: "", onEnd };
      setText("");
      setPhase("thinking");

      const tick = () => {
        const current = job.current;
        if (!current) return;
        // 1 tot 4 tokens per stap, met wisselende pauzes: voelt als een echt model.
        const next = Math.min(current.tokens.length, current.index + 1 + Math.floor(Math.random() * 4));
        current.text += current.tokens.slice(current.index, next).join("");
        current.index = next;
        setText(current.text);
        if (next >= current.tokens.length) {
          finish(false);
          return;
        }
        timer.current = window.setTimeout(tick, 16 + Math.random() * 44);
      };

      timer.current = window.setTimeout(() => {
        setPhase("streaming");
        tick();
      }, 650 + Math.random() * 550);
    },
    [finish],
  );

  const stop = useCallback(() => finish(true), [finish]);

  return { text, phase, start, stop };
}
