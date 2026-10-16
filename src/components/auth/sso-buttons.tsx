"use client";

import { useState } from "react";
import { Button, VisuallyHidden, useToast } from "@/components/kit";
import type { SsoProvider } from "@/lib/data/auth";
import { signInWithSso } from "@/server/actions/auth";
import { GoogleMark, MicrosoftMark } from "./brand-marks";
import styles from "./sso-buttons.module.scss";

const providers: { id: SsoProvider; label: string; mark: React.ReactNode }[] = [
  { id: "microsoft", label: "Microsoft", mark: <MicrosoftMark /> },
  { id: "google", label: "Google", mark: <GoogleMark /> },
];

export type SsoButtonsProps = {
  /** Waar je na het inloggen terechtkomt. */
  next: string;
  /** Aanbieder die de organisatie gebruikt; komt bovenaan met een label. */
  recommended?: SsoProvider;
  /** Welke aanbieders op de server zijn ingesteld; de rest is uitgeschakeld. */
  enabled?: SsoProvider[];
};

export function SsoButtons({ next, recommended, enabled = [] }: SsoButtonsProps) {
  const [pending, setPending] = useState<SsoProvider | null>(null);
  const { toast } = useToast();
  const ordered = recommended
    ? [...providers].sort((a, b) => Number(b.id === recommended) - Number(a.id === recommended))
    : providers;
  const pendingLabel = providers.find((p) => p.id === pending)?.label;

  async function signIn(provider: SsoProvider) {
    setPending(provider);
    try {
      // Auth.js stuurt je door naar Microsoft of Google; alleen als dat niet kan, komt er een resultaat terug.
      const result = await signInWithSso(provider, next);
      if (result?.ok === false) {
        setPending(null);
        toast({ variant: "error", title: "Inloggen lukte niet", description: result.error });
      }
    } catch {
      setPending(null);
    }
  }

  return (
    <div className={styles.list}>
      {ordered.map((provider) => (
        <Button
          key={provider.id}
          variant="secondary"
          size="lg"
          fullWidth
          icon={provider.mark}
          loading={pending === provider.id}
          disabled={!enabled.includes(provider.id) || (pending !== null && pending !== provider.id)}
          title={enabled.includes(provider.id) ? undefined : "Nog niet ingesteld voor deze omgeving"}
          onClick={() => signIn(provider.id)}
          className={styles.button}
          iconRight={
            provider.id === recommended ? <span className={styles.recommended}>Aanbevolen</span> : undefined
          }
        >
          Doorgaan met {provider.label}
          {provider.id === recommended && <VisuallyHidden> (aanbevolen door je organisatie)</VisuallyHidden>}
        </Button>
      ))}
      <p className="visually-hidden" aria-live="polite">
        {pendingLabel ? `Je wordt doorgestuurd naar ${pendingLabel}…` : ""}
      </p>
    </div>
  );
}
