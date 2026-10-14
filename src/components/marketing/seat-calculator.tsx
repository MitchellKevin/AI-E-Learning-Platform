"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ArrowRight, Minus, Plus } from "lucide-react";
import { Alert, Button, Field, IconButton, SegmentedControl, TextInput } from "@/components/kit";
import { VAT_RATE, formatEuro, seatPrice, type Plan, type PlanId } from "@/lib/data/marketing";
import { formatNumber } from "@/lib/format";
import { BillingPeriodToggle, useBillingPeriod } from "./billing-period";
import styles from "./seat-calculator.module.scss";

const SLIDER_MAX = 300;
const INPUT_MAX = 5000;

const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max);

// Rekenhulp: aantal gebruikers en abonnement in, totaalprijs excl. btw uit.
export function SeatCalculator({ plans, defaultPlan = "team" }: { plans: Plan[]; defaultPlan?: PlanId }) {
  const { period, setPeriod } = useBillingPeriod();
  const priced = plans.filter((p) => p.monthlyPrice !== null);
  const enterprise = plans.find((p) => p.monthlyPrice === null);

  const [planId, setPlanId] = useState<PlanId>(priced.some((p) => p.id === defaultPlan) ? defaultPlan : priced[0].id);
  const [seats, setSeats] = useState(25);
  // Los tekstveld, zodat je het getal tijdens het typen even leeg kunt maken.
  const [draft, setDraft] = useState("25");

  const plan = priced.find((p) => p.id === planId) ?? priced[0];
  const price = seatPrice(plan, period) ?? 0;
  const billedSeats = Math.max(seats, plan.minSeats);
  const perMonth = price * billedSeats;
  const perYear = perMonth * 12;
  const yearlySavings = ((seatPrice(plan, "maand") ?? 0) - (seatPrice(plan, "jaar") ?? 0)) * billedSeats * 12;
  const total = period === "jaar" ? perYear : perMonth;
  const overMax = plan.maxSeats !== null && seats > plan.maxSeats;
  const nextPlan = priced.find((p) => p.minSeats <= seats && (p.maxSeats === null || seats <= p.maxSeats));

  function update(next: number) {
    const value = clamp(Math.round(next), 1, INPUT_MAX);
    setSeats(value);
    setDraft(String(value));
  }

  // Rustige samenvatting voor screenreaders, pas als de schuifregelaar even stilstaat.
  const summary = `${formatEuro(total)} ${period === "jaar" ? "per jaar" : "per maand"} exclusief btw, voor ${formatNumber(billedSeats)} gebruikers met ${plan.name}.`;
  const [announcement, setAnnouncement] = useState("");
  const initialSummary = useRef(summary);
  useEffect(() => {
    if (summary === initialSummary.current && !announcement) return;
    const t = setTimeout(() => setAnnouncement(summary), 600);
    return () => clearTimeout(t);
  }, [summary, announcement]);

  const sliderId = useId();
  const fill = `${((clamp(seats, 1, SLIDER_MAX) - 1) / (SLIDER_MAX - 1)) * 100}%`;

  return (
    <div className={styles.calculator}>
      <div className={styles.inputs}>
        <div className={styles.group}>
          <p className={styles.groupLabel} aria-hidden>
            Abonnement
          </p>
          <SegmentedControl<PlanId>
            label="Abonnement"
            options={priced.map((p) => ({ value: p.id, label: p.name }))}
            value={planId}
            onValueChange={setPlanId}
            fullWidth
          />
        </div>

        <div className={styles.group}>
          <p className={styles.groupLabel} aria-hidden>
            Betaalperiode
          </p>
          <BillingPeriodToggle fullWidth />
        </div>

        <Field
          label="Aantal gebruikers"
          description={`Sleep, of typ een getal tot ${formatNumber(INPUT_MAX)}.`}
          className={styles.seatsField}
        >
          <div className={styles.seatsRow}>
            <IconButton
              label="Eén gebruiker minder"
              icon={<Minus />}
              size="sm"
              onClick={() => update(seats - 1)}
              disabled={seats <= 1}
            />
            <TextInput
              type="number"
              inputMode="numeric"
              min={1}
              max={INPUT_MAX}
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                const n = Number(e.target.value);
                if (e.target.value !== "" && Number.isFinite(n) && n >= 1) setSeats(clamp(Math.round(n), 1, INPUT_MAX));
              }}
              onBlur={() => setDraft(String(seats))}
              suffix="gebruikers"
              className={styles.number}
            />
            <IconButton
              label="Eén gebruiker meer"
              icon={<Plus />}
              size="sm"
              onClick={() => update(seats + 1)}
              disabled={seats >= INPUT_MAX}
            />
          </div>
          <input
            id={sliderId}
            type="range"
            min={1}
            max={SLIDER_MAX}
            step={1}
            value={clamp(seats, 1, SLIDER_MAX)}
            onChange={(e) => update(Number(e.target.value))}
            aria-label="Aantal gebruikers, schuifregelaar"
            aria-valuetext={`${formatNumber(seats)} gebruikers`}
            className={styles.range}
            style={{ "--fill": fill } as React.CSSProperties}
          />
          <div className={styles.scale} aria-hidden>
            <span>1</span>
            <span>100</span>
            <span>200</span>
            <span>{SLIDER_MAX}+</span>
          </div>
        </Field>
      </div>

      <div className={styles.result}>
        <p className={styles.resultEyebrow}>
          {plan.name} · {period === "jaar" ? "jaarlijks" : "maandelijks"}
        </p>

        <dl className={styles.lines}>
          <div className={styles.line}>
            <dt>Per gebruiker per maand</dt>
            <dd>{formatEuro(price)}</dd>
          </div>
          <div className={styles.line}>
            <dt>Gebruikers</dt>
            <dd>
              {formatNumber(billedSeats)}
              {billedSeats > seats && <span className={styles.minimum}> (minimum)</span>}
            </dd>
          </div>
          {period === "jaar" && (
            <div className={styles.line}>
              <dt>Per maand</dt>
              <dd>{formatEuro(perMonth)}</dd>
            </div>
          )}
        </dl>

        <div className={styles.total}>
          <p className={styles.totalLabel}>{period === "jaar" ? "Totaal per jaar" : "Totaal per maand"}</p>
          <p className={styles.totalValue}>
            <span key={`${period}-${plan.id}`} className={styles.totalAmount}>
              {formatEuro(total)}
            </span>
            <span className={styles.excl}>excl. btw</span>
          </p>
          <p className={styles.vat}>
            {formatEuro(total * (1 + VAT_RATE))} inclusief {Math.round(VAT_RATE * 100)}% btw
          </p>
        </div>

        {period === "jaar" ? (
          <p className={styles.savings}>Je bespaart {formatEuro(yearlySavings)} per jaar ten opzichte van maandelijks.</p>
        ) : (
          <button type="button" className={styles.savingsLink} onClick={() => setPeriod("jaar")}>
            Bespaar {formatEuro(yearlySavings)} per jaar met jaarlijkse betaling
          </button>
        )}

        {billedSeats > seats && (
          <Alert variant="info" className={styles.alert}>
            {plan.name} start bij {formatNumber(plan.minSeats)} gebruikers. We rekenen daarom met{" "}
            {formatNumber(plan.minSeats)}.
          </Alert>
        )}
        {overMax &&
          (nextPlan ? (
            <Alert
              variant="warning"
              className={styles.alert}
              action={
                <Button size="sm" variant="secondary" onClick={() => setPlanId(nextPlan.id)}>
                  Reken met {nextPlan.name}
                </Button>
              }
            >
              {plan.name} is er voor maximaal {formatNumber(plan.maxSeats!)} gebruikers.
            </Alert>
          ) : (
            <Alert
              variant="info"
              className={styles.alert}
              action={
                enterprise && (
                  <Button size="sm" variant="secondary" href={enterprise.cta.href}>
                    {enterprise.name} bekijken
                  </Button>
                )
              }
            >
              Met meer dan {formatNumber(plan.maxSeats!)} gebruikers maken we graag een prijs op maat. Dit bedrag is
              een indicatie.
            </Alert>
          ))}

        <div className={styles.footer}>
          <Button href={`/demo?plan=${plan.id}`} iconRight={<ArrowRight />} fullWidth>
            Plan een demo voor {plan.name}
          </Button>
          <p className={styles.fine}>Betalen met iDEAL, creditcard, SEPA-incasso of op factuur.</p>
        </div>

        <p className="sr-only" aria-live="polite" aria-atomic="true">
          {announcement}
        </p>
      </div>
    </div>
  );
}
