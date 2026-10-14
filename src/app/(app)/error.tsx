"use client";

import { useEffect, useRef, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/kit";
import styles from "./error.module.scss";

// Foutgrens voor alle app-pagina's; de header blijft gewoon staan.
export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const router = useRouter();
  const [retrying, startTransition] = useTransition();
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    // Later: naar de foutmonitoring sturen in plaats van de console.
    console.error(error);
    headingRef.current?.focus();
  }, [error]);

  function retry() {
    startTransition(() => {
      router.refresh();
      reset();
    });
  }

  return (
    <main className={styles.main}>
      <div className={styles.card}>
        <span className={styles.icon} aria-hidden>
          <AlertTriangle />
        </span>
        <p className={styles.eyebrow}>Er ging iets mis</p>
        <h1 ref={headingRef} tabIndex={-1} className={styles.title}>
          Deze pagina kon niet worden geladen
        </h1>
        <p className={styles.lead}>
          Dat ligt niet aan jou, en je voortgang is veilig opgeslagen. Probeer het nog een keer. Blijft het misgaan?
          Kijk dan in het <Link href="/help">helpcentrum</Link> of neem contact met ons op.
        </p>
        <div className={styles.actions}>
          <Button onClick={retry} loading={retrying} icon={<RotateCcw />}>
            Opnieuw proberen
          </Button>
          <Button href="/dashboard" variant="secondary">
            Naar je dashboard
          </Button>
        </div>
        {error.digest && (
          <p className={styles.digest}>
            Foutcode <code>{error.digest}</code>
          </p>
        )}
      </div>
    </main>
  );
}
