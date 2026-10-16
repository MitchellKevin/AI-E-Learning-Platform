"use client";

import { useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";
import { Button, useToast } from "@/components/kit";
import { requestMagicLink } from "@/server/actions/auth";
import styles from "./resend-link.module.scss";

const COOLDOWN = 30;

const formatSeconds = (s: number) => `0:${String(s).padStart(2, "0")}`;

// Opnieuw versturen met een wachttijd, zodat niemand tien links tegelijk aanvraagt.
export function ResendLink({ email, next }: { email?: string; next?: string }) {
  const { toast } = useToast();
  // De eerste link is net verstuurd, dus de teller loopt al.
  const [seconds, setSeconds] = useState(COOLDOWN);
  const [busy, setBusy] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = setTimeout(() => {
      setSeconds((s) => s - 1);
      if (seconds === 1) setAnnouncement("Je kunt nu een nieuwe link aanvragen.");
    }, 1000);
    return () => clearTimeout(timer);
  }, [seconds]);

  async function resend() {
    setBusy(true);
    setAnnouncement("");
    const result = email ? await requestMagicLink(email, next).catch(() => ({ ok: false as const, error: "Versturen lukte niet. Probeer het opnieuw." })) : null;
    setBusy(false);
    if (result && !result.ok) {
      toast({ variant: "error", title: "Geen nieuwe link verstuurd", description: result.error });
      return;
    }
    setSeconds(COOLDOWN);
    toast({
      variant: "success",
      title: "Nieuwe inloglink verstuurd",
      description: email ? `Check de inbox van ${email}.` : "Check je inbox.",
    });
  }

  const waiting = seconds > 0;

  return (
    <div className={styles.row}>
      <Button
        variant="secondary"
        icon={<RotateCcw />}
        loading={busy}
        // aria-disabled in plaats van disabled: de knop blijft focusbaar tijdens het wachten.
        aria-disabled={waiting || undefined}
        onClick={waiting ? undefined : resend}
        aria-describedby={waiting ? "resend-wachttijd" : undefined}
      >
        Link opnieuw versturen
      </Button>
      {waiting && (
        <p id="resend-wachttijd" className={styles.countdown}>
          Kan weer over <span className={styles.time}>{formatSeconds(seconds)}</span>
        </p>
      )}
      <p className="visually-hidden" aria-live="polite">
        {announcement}
      </p>
    </div>
  );
}
