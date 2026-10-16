"use client";

import { useState } from "react";
import { Button, useToast } from "@/components/kit";
import { signInAsDemo } from "@/server/actions/auth";
import styles from "./demo-login.module.scss";

// Alleen zichtbaar met DEMO_LOGIN=true: direct inloggen als een geseede gebruiker.
const accounts = [
  { email: "sanne@studionoord.nl", name: "Sanne", role: "Beheerder" },
  { email: "lotte@studionoord.nl", name: "Lotte", role: "Teammanager" },
  { email: "tim@studionoord.nl", name: "Tim", role: "Cursist" },
];

export function DemoLogin({ next }: { next?: string }) {
  const [pending, setPending] = useState<string | null>(null);
  const { toast } = useToast();

  async function login(email: string) {
    setPending(email);
    try {
      const result = await signInAsDemo(email, next);
      // Gelukt: de server stuurt je door en er komt geen resultaat terug. Anders staat de reden erin (bv. te veel pogingen).
      if (result?.ok === false) {
        setPending(null);
        toast({ variant: "error", title: "Inloggen lukte niet", description: result.error });
      }
    } catch {
      setPending(null);
    }
  }

  return (
    <section className={styles.demo} aria-labelledby="demo-login">
      <p id="demo-login" className={styles.title}>
        Demo-omgeving
      </p>
      <div className={styles.buttons}>
        {accounts.map((account) => (
          <Button
            key={account.email}
            variant="ghost"
            size="sm"
            loading={pending === account.email}
            disabled={pending !== null && pending !== account.email}
            onClick={() => login(account.email)}
          >
            {account.name} · {account.role}
          </Button>
        ))}
      </div>
    </section>
  );
}
