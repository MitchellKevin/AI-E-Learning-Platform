"use client";

import { useId, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { Minus, Plus } from "lucide-react";
import { Button, IconButton, useToast } from "@/components/kit";
import { formatDate } from "@/lib/format";
import { VAT_RATE, formatEuro, prorate, type Subscription } from "@/lib/data/admin-org-shared";
import { Panel } from "../panel";
import { plural, wait } from "../utils";
import styles from "./seats-stepper.module.scss";

type Props = {
  subscription: Subscription;
  seatsUsed: number;
  today: string;
  /** Lager aantal dat bij de verlenging ingaat. */
  scheduledSeats: number | null;
  onChange: (change: { seats: number; immediate: boolean }) => void;
};

export function SeatsStepper({ subscription: sub, seatsUsed, today, scheduledSeats, onChange }: Props) {
  const base = scheduledSeats ?? sub.seats;
  const [seats, setSeats] = useState(base);
  const [raw, setRaw] = useState(String(base));
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();
  const id = useId().replace(/:/g, "");

  const min = Math.max(sub.minSeats, seatsUsed);
  const max = sub.maxSeats;
  const months = sub.interval === "jaar" ? 12 : 1;
  const diff = seats - sub.seats;
  const proration = prorate(sub, seats, today);
  const newPeriodTotal = sub.pricePerSeat * seats * months;
  const changed = seats !== base;
  const disabled = sub.cancelAtPeriodEnd;

  const tooLow = Number(raw) < min && raw !== "";
  const tooHigh = Number(raw) > max;

  function set(next: number) {
    const clamped = Math.min(max, Math.max(min, Math.round(next)));
    setSeats(clamped);
    setRaw(String(clamped));
  }

  async function save() {
    setBusy(true);
    // Straks: server action die het abonnement in Stripe bijwerkt (met proration).
    await wait(1000);
    setBusy(false);
    const immediate = diff > 0;
    onChange({ seats, immediate });
    toast(
      immediate
        ? {
            variant: "success",
            title: `${plural(diff, "licentie", "licenties")} toegevoegd`,
            description: `Je ontvangt een factuur van ${formatEuro(proration.amount * (1 + VAT_RATE))} incl. btw.`,
          }
        : seats === sub.seats
          ? { variant: "success", title: "Wijziging geannuleerd", description: `Je houdt ${sub.seats} licenties.` }
          : {
              variant: "success",
              title: "Wijziging ingepland",
              description: `Vanaf ${formatDate(sub.renewsAt)} heb je ${seats} licenties.`,
            },
    );
  }

  return (
    <Panel
      title="Licenties aanpassen"
      description={
        <>
          Extra licenties zijn direct beschikbaar. Minder licenties gaan in bij de verlenging. Je hebt er nu {seatsUsed}{" "}
          in gebruik; <Link href="/beheer/gebruikers">beheer gebruikers</Link> om er vrij te maken.
        </>
      }
      footer={
        <>
          <p className={styles.vat}>Alle bedragen excl. {Math.round(VAT_RATE * 100)}% btw.</p>
          <Button onClick={save} loading={busy} disabled={!changed || disabled}>
            {diff > 0 ? "Licenties toevoegen" : "Wijziging opslaan"}
          </Button>
        </>
      }
    >
      <div className={styles.stepperRow}>
        <div className={styles.stepper} role="group" aria-labelledby={`${id}-label`}>
          <IconButton
            label="Eén licentie minder"
            icon={<Minus />}
            onClick={() => set(seats - 1)}
            disabled={seats <= min || disabled}
          />
          <div className={styles.inputWrap}>
            <label id={`${id}-label`} htmlFor={`${id}-input`} className={styles.label}>
              Aantal licenties
            </label>
            <input
              id={`${id}-input`}
              type="number"
              inputMode="numeric"
              min={min}
              max={max}
              value={raw}
              disabled={disabled}
              aria-describedby={`${id}-range`}
              aria-invalid={tooLow || tooHigh || undefined}
              onChange={(e) => {
                setRaw(e.target.value);
                const n = Number(e.target.value);
                if (e.target.value !== "" && n >= min && n <= max) setSeats(Math.round(n));
              }}
              onBlur={() => set(raw === "" ? seats : Number(raw))}
              className={clsx(styles.input, (tooLow || tooHigh) && styles.inputInvalid)}
            />
          </div>
          <IconButton
            label="Eén licentie meer"
            icon={<Plus />}
            onClick={() => set(seats + 1)}
            disabled={seats >= max || disabled}
          />
        </div>
        <div className={styles.quick}>
          {[5, 10, 25].map((n) => (
            <Button
              key={n}
              variant="secondary"
              size="sm"
              onClick={() => set(seats + n)}
              disabled={seats + n > max || disabled}
            >
              +{n}
            </Button>
          ))}
        </div>
      </div>
      <p id={`${id}-range`} className={clsx(styles.range, (tooLow || tooHigh) && styles.rangeError)}>
        {tooLow
          ? `Minimaal ${min}: je hebt ${seatsUsed} licenties in gebruik.`
          : tooHigh
            ? `Maximaal ${max} op het Team-abonnement. Neem contact op voor Enterprise.`
            : `Tussen ${min} en ${max} licenties.`}
      </p>

      <dl className={styles.preview} aria-live="polite">
        <div className={styles.line}>
          <dt>Per gebruiker per maand</dt>
          <dd>{formatEuro(sub.pricePerSeat)}</dd>
        </div>
        <div className={styles.line}>
          <dt>
            Nieuw {sub.interval === "jaar" ? "jaarbedrag" : "maandbedrag"} ({seats} licenties)
          </dt>
          <dd>{formatEuro(newPeriodTotal)}</dd>
        </div>
        {diff > 0 ? (
          <div className={clsx(styles.line, styles.total)}>
            <dt>
              Nu te betalen
              <span>
                {plural(diff, "extra licentie", "extra licenties")} naar rato voor de resterende{" "}
                {plural(proration.remainingDays, "dag", "dagen")} tot {formatDate(sub.renewsAt)}
              </span>
            </dt>
            <dd key={seats}>{formatEuro(proration.amount)}</dd>
          </div>
        ) : diff < 0 ? (
          <div className={clsx(styles.line, styles.total)}>
            <dt>
              Gaat in op {formatDate(sub.renewsAt)}
              <span>
                Tot die tijd houd je {sub.seats} licenties. Je krijgt geen geld terug voor de lopende periode.
              </span>
            </dt>
            <dd>{formatEuro(0)}</dd>
          </div>
        ) : (
          <div className={clsx(styles.line, styles.total)}>
            <dt>
              Geen wijziging
              <span>Kies hierboven een ander aantal om de prijs te zien.</span>
            </dt>
            <dd>{formatEuro(0)}</dd>
          </div>
        )}
      </dl>
    </Panel>
  );
}
