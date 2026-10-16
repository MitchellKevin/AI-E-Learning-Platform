"use client";

import { useState } from "react";
import { CreditCard, Landmark, Lock, Smartphone } from "lucide-react";
import { Alert, Button, Dialog, Field, RadioCard, RadioGroup, Select, TextInput, useToast } from "@/components/kit";
import type { PaymentMethod as Method, PaymentMethodType } from "@/lib/data/admin-org-shared";
import { Panel } from "../panel";
import { wait } from "../utils";
import styles from "./payment-method.module.scss";

const ICONS: Record<PaymentMethodType, React.ReactNode> = {
  sepa: <Landmark />,
  ideal: <Smartphone />,
  card: <CreditCard />,
};

const BANKS = ["ABN AMRO", "ASN Bank", "bunq", "ING", "Knab", "Rabobank", "Revolut", "SNS", "Triodos Bank"];

// IBAN-controle met de mod-97-check, zodat tikfouten meteen opvallen.
function isValidIban(value: string) {
  const iban = value.replace(/\s/g, "").toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(iban)) return false;
  if (iban.startsWith("NL") && iban.length !== 18) return false;
  const digits = (iban.slice(4) + iban.slice(0, 4)).replace(/[A-Z]/g, (c) => String(c.charCodeAt(0) - 55));
  let rest = 0;
  for (const d of digits) rest = (rest * 10 + Number(d)) % 97;
  return rest === 1;
}

const maskIban = (value: string) => {
  const iban = value.replace(/\s/g, "").toUpperCase();
  return `${iban.slice(0, 2)}•• ${iban.slice(4, 8)} •••• •••• ${iban.slice(-4)}`;
};

export function PaymentMethod({ initial }: { initial: Method }) {
  const [method, setMethod] = useState(initial);
  const [open, setOpen] = useState(false);

  return (
    <Panel
      title="Betaalmethode"
      description="Betalingen lopen via Stripe. Wij slaan zelf geen bank- of kaartgegevens op."
    >
      <div className={styles.method}>
        <span className={styles.icon} aria-hidden>
          {ICONS[method.type]}
        </span>
        <div className={styles.text}>
          <p className={styles.label}>{method.label}</p>
          <p className={styles.detail}>{method.detail}</p>
          <p className={styles.meta}>
            {method.holder} · {method.meta}
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => setOpen(true)} className={styles.change}>
          Wijzigen
        </Button>
      </div>
      <p className={styles.secure}>
        <Lock aria-hidden />
        Beveiligd met 3D Secure en versleuteld opgeslagen bij Stripe.
      </p>

      <ChangeDialog open={open} onOpenChange={setOpen} holder={method.holder} onSaved={setMethod} />
    </Panel>
  );
}

function ChangeDialog({
  open,
  onOpenChange,
  holder,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  holder: string;
  onSaved: (method: Method) => void;
}) {
  const [type, setType] = useState<PaymentMethodType>("sepa");
  const [iban, setIban] = useState("");
  const [name, setName] = useState(holder);
  const [bank, setBank] = useState("");
  const [errors, setErrors] = useState<Partial<Record<"iban" | "name" | "bank", string>>>({});
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (type === "sepa") {
      if (!isValidIban(iban))
        next.iban = "Dit IBAN klopt niet. Controleer het nummer, bijvoorbeeld NL91 ABNA 0417 1643 00.";
      if (!name.trim()) next.name = "Vul de naam van de rekeninghouder in.";
    }
    if (type === "ideal" && !bank) next.bank = "Kies je bank.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    // Straks: Stripe Customer Portal of een SetupIntent; nu simuleren we de terugkeer uit Stripe.
    await wait(1400);
    setBusy(false);

    const today = new Date().toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" });
    if (type === "sepa") {
      onSaved({
        type,
        label: "SEPA-incasso",
        detail: maskIban(iban),
        holder: name.trim(),
        meta: `Mandaat afgegeven op ${today}`,
      });
    } else if (type === "ideal") {
      onSaved({
        type: "sepa",
        label: "SEPA-incasso via iDEAL",
        detail: `${bank} •••• ${String(Math.floor(1000 + Math.random() * 9000))}`,
        holder,
        meta: `Gekoppeld via iDEAL op ${today}`,
      });
    } else {
      onSaved({ type, label: "Visa", detail: "•••• •••• •••• 4242", holder, meta: "Verloopt 09/2029" });
    }
    onOpenChange(false);
    toast({
      variant: "success",
      title: "Betaalmethode bijgewerkt",
      description: "De volgende factuur wordt hiermee betaald.",
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !busy && onOpenChange(next)}
      title="Betaalmethode wijzigen"
      description="Je gegevens gaan rechtstreeks naar Stripe, onze betaalpartner."
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={busy}>
            Annuleren
          </Button>
          <Button type="submit" form="payment-form" loading={busy}>
            {type === "ideal" ? "Verder naar je bank" : type === "card" ? "Verder naar Stripe" : "Opslaan"}
          </Button>
        </>
      }
    >
      <form id="payment-form" className={styles.form} onSubmit={submit} noValidate>
        <RadioGroup
          label="Hoe wil je betalen?"
          value={type}
          onValueChange={(v) => {
            setType(v as PaymentMethodType);
            setErrors({});
          }}
          columns={3}
        >
          <RadioCard
            value="sepa"
            icon={<Landmark />}
            title="SEPA-incasso"
            description="Automatisch van je zakelijke rekening."
          />
          <RadioCard
            value="ideal"
            icon={<Smartphone />}
            title="iDEAL"
            description="Machtig een incasso met één betaling van € 0,01."
          />
          <RadioCard
            value="card"
            icon={<CreditCard />}
            title="Creditcard"
            description="Visa, Mastercard of American Express."
          />
        </RadioGroup>

        {type === "sepa" && (
          <div className={styles.fields}>
            <Field label="IBAN" required error={errors.iban}>
              <TextInput
                value={iban}
                onChange={(e) => setIban(e.target.value.toUpperCase())}
                placeholder="NL00 BANK 0000 0000 00"
                autoComplete="off"
                spellCheck={false}
              />
            </Field>
            <Field label="Naam rekeninghouder" required error={errors.name}>
              <TextInput value={name} onChange={(e) => setName(e.target.value)} autoComplete="organization" />
            </Field>
            <p className={styles.mandate}>
              Door op Opslaan te klikken machtig je Stripe en AI Academy om facturen van deze rekening af te schrijven.
              Je kunt een afschrijving binnen 8 weken laten terugboeken.
            </p>
          </div>
        )}

        {type === "ideal" && (
          <div className={styles.fields}>
            <Field label="Bank" required error={errors.bank}>
              <Select placeholder="Kies je bank" value={bank} onChange={(e) => setBank(e.target.value)}>
                {BANKS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </Select>
            </Field>
            <Alert variant="info">
              Je betaalt € 0,01 via je bank-app. Daarmee koppelen we je rekening voor automatische incasso.
            </Alert>
          </div>
        )}

        {type === "card" && (
          <Alert variant="info" title="Je gaat naar de beveiligde pagina van Stripe">
            Daar vul je je kaartgegevens in. Daarna kom je vanzelf hier terug.
          </Alert>
        )}
      </form>
    </Dialog>
  );
}
