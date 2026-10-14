"use client";

import { useState, type FormEvent } from "react";
import { Trash2 } from "lucide-react";
import { Alert, Button, Dialog, Field, TextInput, useToast } from "@/components/kit";
import { formatDate } from "@/lib/format";
import { SettingsCard, SettingsGroup } from "./settings-form";
import styles from "./delete-account.module.scss";

const CONFIRM_WORD = "VERWIJDEREN";
const GRACE_DAYS = 30;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const consequences = [
  "Je voortgang, punten, badges en streak worden gewist.",
  "Je verdwijnt van het leaderboard en uit de teamrapportages.",
  "De openbare verificatielinks van je certificaten werken niet meer. Download ze dus eerst.",
];

export function DeleteAccount({ organisation }: { organisation: string }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [scheduledFor, setScheduledFor] = useState<string>();

  const matches = typed.trim().toUpperCase() === CONFIRM_WORD;

  function openDialog() {
    setTyped("");
    setError(undefined);
    setOpen(true);
  }

  // Later: server action die het verzoek vastlegt en de beheerder van de organisatie op de hoogte brengt.
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!matches) {
      setError(`Typ ${CONFIRM_WORD} om te bevestigen.`);
      return;
    }
    setBusy(true);
    await wait(900);
    const date = new Date(Date.now() + GRACE_DAYS * 24 * 60 * 60 * 1000).toISOString();
    setScheduledFor(date);
    setBusy(false);
    setOpen(false);
    toast({
      variant: "success",
      title: "Verzoek ontvangen",
      description: `Je account wordt op ${formatDate(date)} verwijderd. Je krijgt een bevestiging per e-mail.`,
    });
  }

  // Later: server action die het verzoek intrekt.
  async function cancelRequest() {
    setBusy(true);
    await wait(600);
    setScheduledFor(undefined);
    setBusy(false);
    toast({ variant: "success", title: "Verwijderen ingetrokken", description: "Je account blijft gewoon bestaan." });
  }

  return (
    <SettingsCard
      tone="danger"
      title="Account verwijderen"
      description={`Je account en alles wat je hebt geleerd worden definitief verwijderd. ${organisation} krijgt hiervan een melding, omdat je licentie dan vrijkomt.`}
    >
      <SettingsGroup>
        {scheduledFor ? (
          <Alert
            variant="warning"
            title={`Je account wordt op ${formatDate(scheduledFor)} verwijderd`}
            action={
              <Button variant="secondary" size="sm" loading={busy} onClick={cancelRequest}>
                Verzoek intrekken
              </Button>
            }
            live
          >
            Tot die tijd kun je gewoon blijven leren en kun je het verzoek nog intrekken.
          </Alert>
        ) : (
          <>
            <ul className={styles.list}>
              {consequences.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <div className={styles.action}>
              <Button variant="danger" icon={<Trash2 />} onClick={openDialog}>
                Account verwijderen
              </Button>
            </div>
          </>
        )}
      </SettingsGroup>

      <Dialog
        open={open}
        onOpenChange={(next) => !busy && setOpen(next)}
        role="alertdialog"
        size="sm"
        title="Account verwijderen?"
        description={`Je hebt nog ${GRACE_DAYS} dagen om je te bedenken. Daarna kan het niet meer ongedaan worden gemaakt.`}
        dismissible={!busy}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={busy}>
              Annuleren
            </Button>
            <Button type="submit" form="delete-account-form" variant="danger" loading={busy}>
              Definitief verwijderen
            </Button>
          </>
        }
      >
        <form id="delete-account-form" onSubmit={submit} className={styles.form} noValidate>
          <ul className={styles.list}>
            {consequences.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <Field
            label={
              <>
                Typ <strong className={styles.word}>{CONFIRM_WORD}</strong> om te bevestigen
              </>
            }
            error={error}
          >
            <TextInput
              value={typed}
              onChange={(e) => {
                setTyped(e.target.value);
                if (error) setError(undefined);
              }}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              inputClassName={styles.input}
            />
          </Field>
        </form>
      </Dialog>
    </SettingsCard>
  );
}
