"use client";

import { useEffect, useId, useState, type FormEvent, type KeyboardEvent, type Ref } from "react";
import clsx from "clsx";
import { Send, Square } from "lucide-react";
import { Button, Field, Kbd, Textarea } from "@/components/kit";
import styles from "./prompt-composer.module.scss";

export const MAX_PROMPT = 4000;

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (prompt: string) => void;
  onStop: () => void;
  /** Er loopt een antwoord; de knop wordt dan "Stop". */
  busy: boolean;
  placeholder: string;
  /** Aantal eerdere pogingen, voor het label. */
  attempts: number;
  textareaRef?: Ref<HTMLTextAreaElement>;
};

// Invoer onderaan de oefenruimte. Eén knop wisselt tussen Verstuur en Stop, zodat de focus niet verspringt.
export function PromptComposer({ value, onChange, onSubmit, onStop, busy, placeholder, attempts, textareaRef }: Props) {
  const [error, setError] = useState<string>();
  const [mac, setMac] = useState(false);
  const countId = useId();

  // Pas na hydratie bekend; op de server tonen we "Ctrl".
  useEffect(() => {
    setMac(/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent));
  }, []);

  function submit(e?: FormEvent) {
    e?.preventDefault();
    if (busy) return;
    const prompt = value.trim();
    if (!prompt) {
      setError("Schrijf eerst een prompt.");
      return;
    }
    if (prompt.split(/\s+/).length < 3) {
      setError("Je prompt is wel heel kort. Schrijf minstens een zin, zodat de AI weet wat je wilt.");
      return;
    }
    setError(undefined);
    onSubmit(prompt);
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      submit();
    }
  }

  const near = value.length > MAX_PROMPT * 0.9;

  return (
    <form className={styles.composer} onSubmit={submit} noValidate>
      <Field
        label={attempts > 0 ? "Pas je prompt aan" : "Jouw prompt"}
        description={
          attempts > 0
            ? "Je vorige prompt staat er nog. Verander gericht één of twee dingen en verstuur opnieuw."
            : undefined
        }
        error={error}
      >
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            if (error) setError(undefined);
          }}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          rows={4}
          autoResize
          maxRows={14}
          maxLength={MAX_PROMPT}
          aria-describedby={countId}
          className={styles.textarea}
          spellCheck
        />
      </Field>

      <div className={styles.bar}>
        <p className={styles.hint}>
          <span aria-hidden className={styles.keys}>
            <Kbd>{mac ? "⌘" : "Ctrl"}</Kbd>
            <Kbd>Enter</Kbd>
          </span>
          <span>om te versturen</span>
        </p>
        <p id={countId} className={clsx(styles.count, near && styles.near)}>
          {value.length.toLocaleString("nl-NL")}
          <span className={styles.max}> / {MAX_PROMPT.toLocaleString("nl-NL")}</span>
          <span className="visually-hidden"> tekens</span>
        </p>
        <Button
          type={busy ? "button" : "submit"}
          variant={busy ? "secondary" : "primary"}
          onClick={busy ? onStop : undefined}
          icon={busy ? <Square className={styles.stopIcon} /> : <Send />}
          className={styles.send}
        >
          {busy ? "Stop" : "Verstuur"}
        </Button>
      </div>
    </form>
  );
}
