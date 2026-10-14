"use client";

import { useRef, useState } from "react";
import { Award, CalendarX, Database, Users } from "lucide-react";
import { Button, Checkbox, Dialog, Field, Select, Textarea } from "@/components/kit";
import { formatDate } from "@/lib/format";
import { Panel } from "../panel";
import { wait } from "../utils";
import styles from "./cancel-subscription.module.scss";

const REASONS = [
  { value: "prijs", label: "Te duur voor wat we eraan hebben" },
  { value: "gebruik", label: "Mijn team gebruikt het te weinig" },
  { value: "functies", label: "We missen functies" },
  { value: "ander-platform", label: "We stappen over naar een ander platform" },
  { value: "budget", label: "Tijdelijk geen budget" },
  { value: "afgerond", label: "Iedereen heeft de leerpaden afgerond" },
  { value: "anders", label: "Anders" },
];

type Props = {
  renewsAt: string;
  cancelled: boolean;
  onCancel: (reason: string) => void;
  onResume: () => void;
};

export function CancelSubscription({ renewsAt, cancelled, onCancel, onResume }: Props) {
  const [open, setOpen] = useState(false);
  const [resuming, setResuming] = useState(false);

  async function resume() {
    setResuming(true);
    // Straks: server action die de opzegging in Stripe intrekt.
    await wait(800);
    setResuming(false);
    onResume();
  }

  return (
    <>
      <Panel
        tone="danger"
        title="Abonnement opzeggen"
        description={
          cancelled
            ? `Je abonnement is opgezegd en stopt op ${formatDate(renewsAt)}. Tot die tijd kan iedereen gewoon verder leren.`
            : `Je abonnement loopt dan nog door tot ${formatDate(renewsAt)}. Je krijgt geen geld terug voor de lopende periode.`
        }
        actions={
          cancelled ? (
            <Button variant="secondary" onClick={resume} loading={resuming}>
              Opzegging intrekken
            </Button>
          ) : (
            <Button variant="danger" onClick={() => setOpen(true)}>
              Abonnement opzeggen
            </Button>
          )
        }
      />
      <CancelDialog open={open} onOpenChange={setOpen} renewsAt={renewsAt} onCancel={onCancel} />
    </>
  );
}

function CancelDialog({
  open,
  onOpenChange,
  renewsAt,
  onCancel,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  renewsAt: string;
  onCancel: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [understood, setUnderstood] = useState(false);
  const [errors, setErrors] = useState<{ reason?: string; understood?: boolean }>({});
  const [busy, setBusy] = useState(false);
  const reasonRef = useRef<HTMLSelectElement>(null);
  const checkRef = useRef<HTMLInputElement>(null);
  const end = formatDate(renewsAt);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const next = { reason: reason ? undefined : "Kies een reden.", understood: !understood || undefined };
    setErrors(next);
    if (next.reason) return reasonRef.current?.focus();
    if (next.understood) return checkRef.current?.focus();
    setBusy(true);
    // Straks: server action die cancel_at_period_end in Stripe zet en de reden opslaat.
    await wait(1000);
    setBusy(false);
    onCancel(REASONS.find((r) => r.value === reason)?.label ?? reason);
    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !busy && onOpenChange(next)}
      role="alertdialog"
      title="Abonnement opzeggen?"
      description={`Je abonnement stopt op ${end}. Tot die tijd verandert er niets.`}
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={busy}>
            Abonnement houden
          </Button>
          <Button type="submit" form="cancel-form" variant="danger" loading={busy}>
            Opzeggen per {end}
          </Button>
        </>
      }
    >
      <form id="cancel-form" className={styles.form} onSubmit={submit} noValidate>
        <ul className={styles.effects} aria-label="Wat er gebeurt na het opzeggen">
          <li>
            <CalendarX aria-hidden />
            <span>
              <strong>Tot {end}</strong> kunnen alle collega&apos;s gewoon verder leren. Daarna verliezen ze toegang.
            </span>
          </li>
          <li>
            <Award aria-hidden />
            <span>
              <strong>Certificaten blijven geldig</strong> en zijn openbaar te verifiëren.
            </span>
          </li>
          <li>
            <Database aria-hidden />
            <span>
              <strong>Voortgang bewaren we 90 dagen</strong>, zodat je zonder verlies opnieuw kunt starten.
            </span>
          </li>
          <li>
            <Users aria-hidden />
            <span>
              <strong>Licenties</strong> worden niet terugbetaald voor de lopende periode.
            </span>
          </li>
        </ul>

        <Field label="Waarom zeg je op?" required error={errors.reason}>
          <Select
            ref={reasonRef}
            placeholder="Kies een reden"
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              setErrors((er) => ({ ...er, reason: undefined }));
            }}
          >
            {REASONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Wat kunnen we beter doen?" optional>
          <Textarea
            rows={3}
            autoResize
            maxRows={6}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Je feedback gaat rechtstreeks naar ons productteam."
          />
        </Field>

        <Checkbox
          ref={checkRef}
          label={`Ik begrijp dat niemand van mijn organisatie na ${end} nog toegang heeft`}
          checked={understood}
          invalid={errors.understood}
          description={errors.understood ? "Vink dit aan om op te zeggen." : undefined}
          onChange={(e) => {
            setUnderstood(e.target.checked);
            setErrors((er) => ({ ...er, understood: undefined }));
          }}
        />
      </form>
    </Dialog>
  );
}
