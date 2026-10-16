"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Mail } from "lucide-react";
import { Button, useToast } from "@/components/kit";
import { requestMagicLink } from "@/server/actions/auth";

// Stuurt een inloglink naar het uitgenodigde adres; na het klikken kom je in de intake.
export function InviteEmailButton({ email }: { email: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  async function send() {
    setBusy(true);
    const result = await requestMagicLink(email, "/welkom");
    if (!result.ok) {
      setBusy(false);
      toast({ variant: "error", title: "Versturen lukte niet", description: result.error });
      return;
    }
    router.push(`/inloggen/check-je-mail?email=${encodeURIComponent(email)}`);
  }

  return (
    <Button variant="ghost" size="lg" fullWidth icon={<Mail />} iconRight={<ArrowRight />} loading={busy} onClick={send}>
      Doorgaan met e-mail
    </Button>
  );
}
