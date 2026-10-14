"use client";

import clsx from "clsx";
import { ArrowRight, Check, Users } from "lucide-react";
import { Badge, Button, VisuallyHidden } from "@/components/kit";
import { formatEuro, seatPrice, type Plan } from "@/lib/data/marketing";
import { formatNumber } from "@/lib/format";
import { useBillingPeriod } from "./billing-period";
import styles from "./plan-cards.module.scss";

function seatRange(plan: Plan) {
  if (plan.maxSeats === null) return `Vanaf ${formatNumber(plan.minSeats)} gebruikers`;
  return `${formatNumber(plan.minSeats)} tot ${formatNumber(plan.maxSeats)} gebruikers`;
}

// Abonnementen naast elkaar; de prijs volgt de gekozen betaalperiode.
export function PlanCards({ plans }: { plans: Plan[] }) {
  const { period } = useBillingPeriod();

  return (
    <ul className={styles.grid}>
      {plans.map((plan) => {
        const price = seatPrice(plan, period);
        const yearly = period === "jaar" && price !== null;
        const headingId = `plan-${plan.id}`;

        return (
          <li key={plan.id} className={styles.item}>
            <article
              aria-labelledby={headingId}
              className={clsx(styles.card, plan.highlighted && styles.highlighted)}
            >
              <div className={styles.head}>
                <h3 id={headingId} className={styles.name}>
                  {plan.name}
                </h3>
                {plan.highlighted && (
                  <Badge variant="brand" size="sm">
                    Meest gekozen
                  </Badge>
                )}
              </div>
              <p className={styles.tagline}>{plan.tagline}</p>

              <div className={styles.price}>
                {price === null ? (
                  <>
                    <p className={styles.amountRow}>
                      <span className={styles.amount}>Op maat</span>
                    </p>
                    <p className={styles.billing}>Prijs per gebruiker op basis van een jaarcontract</p>
                  </>
                ) : (
                  <>
                    <p className={styles.amountRow}>
                      {/* key: bij een andere periode komt het bedrag opnieuw binnen. */}
                      <span key={period} className={styles.amount}>
                        {formatEuro(price)}
                      </span>
                      <span className={styles.unit}>
                        per gebruiker
                        <br />
                        per maand
                      </span>
                    </p>
                    <p className={styles.billing}>
                      {yearly ? (
                        <>
                          <s className={styles.was}>
                            <VisuallyHidden>Normaal </VisuallyHidden>
                            {formatEuro(plan.monthlyPrice!)}
                          </s>{" "}
                          · {formatEuro(price * 12)} per jaar, jaarlijks gefactureerd
                        </>
                      ) : (
                        "Maandelijks gefactureerd, maandelijks opzegbaar"
                      )}
                    </p>
                  </>
                )}
              </div>

              <p className={styles.seats}>
                <Users aria-hidden />
                {seatRange(plan)}
              </p>

              <Button
                href={plan.cta.href}
                variant={plan.highlighted ? "primary" : "secondary"}
                iconRight={<ArrowRight />}
                fullWidth
                className={styles.cta}
              >
                {plan.cta.label}
              </Button>

              <div className={styles.features}>
                <p className={styles.featuresIntro}>{plan.featuresIntro}</p>
                <ul className={styles.list}>
                  {plan.features.map((feature) => (
                    <li key={feature}>
                      <Check aria-hidden />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          </li>
        );
      })}
    </ul>
  );
}
