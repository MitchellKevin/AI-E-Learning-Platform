"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { CircleCheck, ThumbsDown, ThumbsUp } from "lucide-react";
import { Button, Field, Textarea } from "@/components/kit";
import { helpFeedbackAction } from "@/server/actions/public";
import styles from "./help-feedback.module.scss";

type State = "idle" | "nee" | "sent";

const storageKey = (slug: string) => `aia-help-feedback:${slug}`;

// Feedback per artikel; de stem (en eventuele toelichting) wordt opgeslagen.
export function HelpFeedback({ slug }: { slug: string }) {
  const [state, setState] = useState<State>("idle");
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const focusThanks = useRef(false);
  const thanksRef = useRef<HTMLParagraphElement>(null);
  const commentRef = useRef<HTMLTextAreaElement>(null);

  // Eerder gegeven feedback onthouden, zodat de vraag niet steeds terugkomt.
  useEffect(() => {
    try {
      if (window.localStorage.getItem(storageKey(slug))) setState("sent");
    } catch {
      // Geen opslag beschikbaar (privévenster): gewoon opnieuw vragen.
    }
  }, [slug]);

  function remember(vote: "ja" | "nee") {
    try {
      window.localStorage.setItem(storageKey(slug), vote);
    } catch {
      // Niet erg als dit niet lukt.
    }
  }

  async function send(vote: "ja" | "nee") {
    setBusy(true);
    // Niet blokkeren als opslaan mislukt: de bezoeker heeft zijn mening al gegeven.
    await helpFeedbackAction(slug, vote === "ja", comment.trim() || undefined).catch(() => {});
    remember(vote);
    focusThanks.current = true;
    setBusy(false);
    setState("sent");
  }

  async function onSubmitComment(e: FormEvent) {
    e.preventDefault();
    await send("nee");
  }

  // Focus meegeven bij een statuswissel, zodat toetsenbordgebruikers niet "verdwalen".
  useEffect(() => {
    if (state === "nee") commentRef.current?.focus();
    if (state === "sent" && focusThanks.current) thanksRef.current?.focus();
  }, [state]);

  return (
    <section aria-labelledby="feedback-title" className={styles.card}>
      <div aria-live="polite">
        {state === "sent" ? (
          <p ref={thanksRef} tabIndex={-1} className={styles.thanks}>
            <CircleCheck className={styles.thanksIcon} aria-hidden />
            <span>
              <strong id="feedback-title">Bedankt voor je feedback!</strong> Zo kunnen we het helpcentrum steeds beter
              maken.
            </span>
          </p>
        ) : (
          <div className={styles.ask}>
            <h2 id="feedback-title" className={styles.title}>
              Was dit artikel nuttig?
            </h2>
            <div className={styles.buttons} role="group" aria-label="Was dit artikel nuttig?">
              <Button
                variant={state === "idle" ? "secondary" : "ghost"}
                size="sm"
                icon={<ThumbsUp />}
                onClick={() => send("ja")}
                disabled={busy}
                loading={busy && state === "idle"}
              >
                Ja
              </Button>
              <Button
                variant="secondary"
                size="sm"
                icon={<ThumbsDown />}
                onClick={() => setState("nee")}
                disabled={busy}
                aria-pressed={state === "nee"}
              >
                Nee
              </Button>
            </div>
          </div>
        )}
      </div>

      {state === "nee" && (
        <form onSubmit={onSubmitComment} className={styles.form}>
          <Field label="Wat kunnen we verbeteren?" optional description="Je toelichting is anoniem.">
            <Textarea
              ref={commentRef}
              name="toelichting"
              rows={3}
              autoResize
              maxRows={8}
              maxLength={1000}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Bijvoorbeeld: de stap om een collega uit te nodigen klopt niet meer."
            />
          </Field>
          <div className={styles.formActions}>
            <Button type="button" variant="ghost" size="sm" onClick={() => setState("idle")} disabled={busy}>
              Annuleren
            </Button>
            <Button type="submit" size="sm" loading={busy}>
              Feedback versturen
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}
