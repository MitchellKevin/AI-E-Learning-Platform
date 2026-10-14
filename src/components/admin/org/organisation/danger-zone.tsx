"use client";

import { useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import { Alert, Button, Dialog, Field, TextInput, useToast } from "@/components/kit";
import { Panel } from "../panel";
import { wait } from "../utils";
import styles from "./danger-zone.module.scss";

export function DangerZone({ orgName, userCount }: { orgName: string; userCount: number }) {
  const [open, setOpen] = useState(false);
  const [requested, setRequested] = useState(false);
  const { toast } = useToast();

  return (
    <>
      <Panel
        tone="danger"
        title="Organisatie verwijderen"
        description={`Verwijdert ${orgName} met alle ${userCount} accounts, voortgang en instellingen. Dit kan niet ongedaan worden gemaakt.`}
        actions={
          requested ? (
            <Button
              variant="secondary"
              onClick={() => {
                // Straks: server action die het verzoek intrekt.
                setRequested(false);
                toast({ variant: "success", title: "Verwijderverzoek ingetrokken" });
              }}
            >
              Verzoek intrekken
            </Button>
          ) : (
            <Button variant="danger" icon={<Trash2 />} onClick={() => setOpen(true)}>
              Organisatie verwijderen
            </Button>
          )
        }
      >
        {requested && (
          <Alert variant="danger" live title="Verwijdering ingepland">
            Over 14 dagen verwijderen we alles definitief. Tot die tijd kun je het verzoek nog intrekken.
          </Alert>
        )}
      </Panel>

      <DeleteDialog
        open={open}
        onOpenChange={setOpen}
        orgName={orgName}
        onDeleted={() => {
          setRequested(true);
          toast({
            variant: "success",
            title: "Verwijderverzoek ontvangen",
            description: "Alle beheerders krijgen een bevestiging per e-mail.",
          });
        }}
      />
    </>
  );
}

function DeleteDialog({
  open,
  onOpenChange,
  orgName,
  onDeleted,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgName: string;
  onDeleted: () => void;
}) {
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Bij elk openen leeg beginnen.
  const [lastOpen, setLastOpen] = useState(open);
  if (open !== lastOpen) {
    setLastOpen(open);
    if (open) {
      setConfirm("");
      setError(undefined);
    }
  }

  const matches = confirm.trim() === orgName;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!matches) {
      setError(`Typ precies “${orgName}” om te bevestigen.`);
      return inputRef.current?.focus();
    }
    setBusy(true);
    // Straks: server action die de verwijdering inplant, het abonnement stopt en alle sessies beëindigt.
    await wait(1200);
    setBusy(false);
    onDeleted();
    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !busy && onOpenChange(next)}
      role="alertdialog"
      title={`${orgName} verwijderen?`}
      description="Iedereen verliest direct toegang. Na 14 dagen verwijderen we alle gegevens definitief."
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={busy}>
            Annuleren
          </Button>
          <Button type="submit" form="delete-org-form" variant="danger" loading={busy}>
            Definitief verwijderen
          </Button>
        </>
      }
    >
      <form id="delete-org-form" className={styles.form} onSubmit={submit} noValidate>
        <ul className={styles.effects}>
          <li>Alle accounts, voortgang, punten en oefeningen worden verwijderd.</li>
          <li>Je abonnement stopt direct. Je krijgt geen geld terug voor de lopende periode.</li>
          <li>Uitgereikte certificaten blijven verifieerbaar, zonder naam van de cursist.</li>
        </ul>
        <Field label={`Typ “${orgName}” om te bevestigen`} error={error}>
          <TextInput
            ref={inputRef}
            value={confirm}
            onChange={(e) => {
              setConfirm(e.target.value);
              setError(undefined);
            }}
            autoComplete="off"
            spellCheck={false}
          />
        </Field>
      </form>
    </Dialog>
  );
}
