"use client";

import { useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { ArrowUpRight, Check } from "lucide-react";
import { Badge, Button, ConfirmDialog, useToast } from "@/components/kit";
import { seatPrice, type Plan } from "@/lib/data/marketing";
import { formatDate } from "@/lib/format";
import { formatEuro, type BillingInterval, type PlanId } from "@/lib/data/admin-org-shared";
import { Panel } from "../panel";
import { wait } from "../utils";
import styles from "./plan-compare.module.scss";

type Props = {
  plans: Plan[];
  currentPlanId: PlanId;
  interval: BillingInterval;
  seatsUsed: number;
  renewsAt: string;
  cancelled: boolean;
};

const ORDER: PlanId[] = ["starter", "team", "enterprise"];

export function PlanCompare({ plans, currentPlanId, interval, seatsUsed, renewsAt, cancelled }: Props) {
  const [target, setTarget] = useState<Plan | null>(null);
  const [scheduled, setScheduled] = useState<PlanId | null>(null);
  const { toast } = useToast();
  const currentIndex = ORDER.indexOf(currentPlanId);

  return (
    <Panel
      title="Ander abonnement"
      description={`Prijzen per gebruiker per maand bij ${interval === "jaar" ? "jaarlijkse" : "maandelijkse"} betaling, excl. btw.`}
      actions={
        <Link href="/prijzen" className={styles.link}>
          Vergelijk alle functies
          <ArrowUpRight aria-hidden />
        </Link>
      }
    >
      <ul className={styles.grid}>
        {plans.map((plan) => {
          const current = plan.id === currentPlanId;
          const price = seatPrice(plan, interval);
          const downgrade = ORDER.indexOf(plan.id) < currentIndex;
          const tooMany = plan.maxSeats !== null && seatsUsed > plan.maxSeats;

          return (
            <li key={plan.id} className={styles.cell}>
              <article className={clsx(styles.plan, current && styles.current)} aria-current={current || undefined}>
                <div className={styles.head}>
                  <h3 className={styles.name}>{plan.name}</h3>
                  {current && (
                    <Badge variant="brand" size="sm">
                      Huidig
                    </Badge>
                  )}
                  {scheduled === plan.id && (
                    <Badge variant="warning" size="sm">
                      Vanaf {formatDate(renewsAt)}
                    </Badge>
                  )}
                </div>
                <p className={styles.tagline}>{plan.tagline}</p>
                <p className={styles.price}>
                  {price === null ? (
                    "Op aanvraag"
                  ) : (
                    <>
                      {formatEuro(price)}
                      <span> / gebruiker / maand</span>
                    </>
                  )}
                </p>
                <p className={styles.seats}>
                  {plan.maxSeats
                    ? `${plan.minSeats} tot ${plan.maxSeats} gebruikers`
                    : `Vanaf ${plan.minSeats} gebruikers`}
                </p>
                <ul className={styles.features}>
                  {plan.features.slice(0, 4).map((f) => (
                    <li key={f}>
                      <Check aria-hidden />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className={styles.action}>
                  {current ? (
                    <Button variant="secondary" fullWidth disabled>
                      Je huidige abonnement
                    </Button>
                  ) : price === null ? (
                    <Button href={plan.cta.href} variant="dark" fullWidth>
                      Neem contact op
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant={downgrade ? "secondary" : "primary"}
                        fullWidth
                        disabled={tooMany || cancelled || scheduled === plan.id}
                        aria-describedby={tooMany ? `plan-${plan.id}-note` : undefined}
                        onClick={() => setTarget(plan)}
                      >
                        {scheduled === plan.id ? "Overstap ingepland" : `Overstappen naar ${plan.name}`}
                      </Button>
                      {tooMany && (
                        <p id={`plan-${plan.id}-note`} className={styles.note}>
                          Maximaal {plan.maxSeats} gebruikers. Je hebt er {seatsUsed} in gebruik.
                        </p>
                      )}
                    </>
                  )}
                </div>
              </article>
            </li>
          );
        })}
      </ul>

      <ConfirmDialog
        open={target !== null}
        onOpenChange={(open) => !open && setTarget(null)}
        title={target ? `Overstappen naar ${target.name}?` : "Overstappen?"}
        description={
          target && ORDER.indexOf(target.id) < currentIndex
            ? `De overstap gaat in op ${formatDate(renewsAt)}. Tot die tijd houd je alle functies van je huidige abonnement.`
            : `De overstap gaat direct in. Je betaalt het verschil naar rato tot ${formatDate(renewsAt)}.`
        }
        confirmLabel="Overstappen"
        onConfirm={async () => {
          if (!target) return;
          // Straks: server action die het abonnement in Stripe wijzigt.
          await wait(900);
          setScheduled(target.id);
          toast({
            variant: "success",
            title: "Overstap ingepland",
            description: `Je stapt op ${formatDate(renewsAt)} over naar ${target.name}.`,
          });
        }}
      />
    </Panel>
  );
}
