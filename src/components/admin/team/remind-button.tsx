"use client";

import { useState } from "react";
import { BellRing, Check } from "lucide-react";
import { Button, useToast, type ButtonSize, type ButtonVariant } from "@/components/kit";
import { errorMessage, unwrap } from "@/lib/action-result";
import { sendRemindersAction } from "@/server/actions/admin-team";

type Props = {
  /** Id's van wie de herinnering krijgt (gebruikers, of "inv_…" voor een open uitnodiging). */
  ids: string[];
  /** Volledige naam(en) van wie de herinnering krijgt. */
  names: string[];
  /** Waar de herinnering over gaat, bv. "AI 101". */
  topic?: string;
  label?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
};

export function reminderCopy(names: string[], topic?: string) {
  const who = names.length === 1 ? names[0].split(" ")[0] : `${names.length} collega's`;
  return {
    title: names.length === 1 ? "Herinnering verstuurd" : "Herinneringen verstuurd",
    description: `${who} ${names.length === 1 ? "krijgt" : "krijgen"} een e-mail en een melding in de app${topic ? ` over ${topic}` : ""}.`,
  };
}

// Knop die een herinnering stuurt; daarna blijft hij op "Verstuurd" staan.
export function RemindButton({ ids, names, topic, label = "Stuur herinnering", variant = "secondary", size = "sm", className }: Props) {
  const { toast } = useToast();
  const [state, setState] = useState<"idle" | "busy" | "sent">("idle");

  async function send() {
    setState("busy");
    try {
      unwrap(await sendRemindersAction(ids, topic));
    } catch (error) {
      setState("idle");
      toast({ variant: "error", title: "Versturen lukte niet", description: errorMessage(error, "Probeer het opnieuw.") });
      return;
    }
    setState("sent");
    toast({ variant: "success", ...reminderCopy(names, topic) });
  }

  return (
    <Button
      variant={variant}
      size={size}
      loading={state === "busy"}
      disabled={state === "sent"}
      icon={state === "sent" ? <Check /> : <BellRing />}
      onClick={send}
      className={className}
      aria-label={state === "sent" ? `Herinnering verstuurd aan ${names.join(", ")}` : `${label} aan ${names.join(", ")}`}
    >
      {state === "sent" ? "Verstuurd" : label}
    </Button>
  );
}
