"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, VisuallyHidden } from "@/components/kit";
import type { SsoProvider } from "@/lib/data/auth";
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
};

export function SsoButtons({ next, recommended }: SsoButtonsProps) {
  const router = useRouter();
  const [pending, setPending] = useState<SsoProvider | null>(null);
  const ordered = recommended
    ? [...providers].sort((a, b) => Number(b.id === recommended) - Number(a.id === recommended))
    : providers;
  const pendingLabel = providers.find((p) => p.id === pending)?.label;

  async function signIn(provider: SsoProvider) {
    setPending(provider);
    // Later: signIn(provider) van Auth.js; dat stuurt je door naar Microsoft of Google.
    await new Promise((resolve) => setTimeout(resolve, 900));
    router.push(next);
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
          disabled={pending !== null && pending !== provider.id}
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
