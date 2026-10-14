"use client";

import { useEffect } from "react";
import "@/styles/globals.scss";

// Laatste vangnet als zelfs de root-layout faalt. Bewust zonder kit-componenten.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Later: naar de foutmonitoring sturen.
    console.error(error);
  }, [error]);

  return (
    <html lang="nl">
      <body>
        <main
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            minHeight: "100dvh",
            padding: "48px 16px",
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "var(--color-brand)",
            }}
          >
            AI Academy
          </p>
          <h1 style={{ fontSize: 32, letterSpacing: "-0.02em", lineHeight: 1.2 }}>Er ging iets mis</h1>
          <p style={{ maxWidth: "28rem", fontSize: 15, lineHeight: 1.6, color: "var(--color-body)" }}>
            AI Academy kon niet worden geladen. Je voortgang is veilig opgeslagen. Probeer het opnieuw of kom zo
            nog even terug.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              height: 44,
              marginTop: 8,
              padding: "0 20px",
              border: "none",
              borderRadius: 999,
              background: "var(--color-brand)",
              color: "#fff",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Opnieuw proberen
          </button>
          {error.digest && (
            <p style={{ fontSize: 12, color: "var(--color-muted)" }}>
              Foutcode <code>{error.digest}</code>
            </p>
          )}
        </main>
      </body>
    </html>
  );
}
