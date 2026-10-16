"use client";

import { useState, type ReactNode } from "react";
import { Alert, Button, PageHeader, useToast } from "@/components/kit";
import type { Plan } from "@/lib/data/marketing";
import { formatDate } from "@/lib/format";
import type { Subscription } from "@/lib/data/admin-org-shared";
import { CancelSubscription } from "./cancel-subscription";
import { PlanCard } from "./plan-card";
import { PlanCompare } from "./plan-compare";
import { SeatsStepper } from "./seats-stepper";
import styles from "./subscription-admin.module.scss";

type Props = {
  initial: Subscription;
  plans: Plan[];
  seatsUsed: number;
  today: string;
  /** Betaalmethode, naast de licenties. */
  payment: ReactNode;
  /** Factuurgegevens en facturen, tussen de abonnementen en het opzeggen in. */
  children: ReactNode;
};

// Abonnement: licenties, overstappen en opzeggen delen dezelfde state.
export function SubscriptionAdmin({ initial, plans, seatsUsed, today, payment, children }: Props) {
  const [sub, setSub] = useState(initial);
  const [scheduledSeats, setScheduledSeats] = useState<number | null>(null);
  const { toast } = useToast();

  function resume() {
    setSub((s) => ({ ...s, cancelAtPeriodEnd: false }));
    toast({
      variant: "success",
      title: "Opzegging ingetrokken",
      description: `Je abonnement verlengt op ${formatDate(sub.renewsAt)}.`,
    });
  }

  return (
    <>
      <PageHeader
        title="Abonnement"
        lead="Je abonnement, licenties, betaalmethode en facturen. Prijzen zijn exclusief btw."
        actions={
          <Button href="/prijzen" variant="secondary">
            Bekijk alle prijzen
          </Button>
        }
      />

      {sub.cancelAtPeriodEnd && (
        <Alert
          variant="warning"
          live
          title={`Je abonnement stopt op ${formatDate(sub.renewsAt)}`}
          action={
            <Button size="sm" variant="secondary" onClick={resume}>
              Opzegging intrekken
            </Button>
          }
        >
          Daarna heeft niemand van je organisatie nog toegang. Certificaten blijven geldig.
        </Alert>
      )}

      <PlanCard subscription={sub} seatsUsed={seatsUsed} scheduledSeats={scheduledSeats} />

      <div className={styles.grid}>
        <SeatsStepper
          subscription={sub}
          seatsUsed={seatsUsed}
          today={today}
          scheduledSeats={scheduledSeats}
          onChange={({ seats, immediate }) => {
            if (immediate) {
              setSub((s) => ({ ...s, seats }));
              setScheduledSeats(null);
            } else {
              setScheduledSeats(seats === sub.seats ? null : seats);
            }
          }}
        />
        {payment}
      </div>

      <PlanCompare
        plans={plans}
        currentPlanId={sub.planId}
        interval={sub.interval}
        seatsUsed={seatsUsed}
        renewsAt={sub.renewsAt}
        cancelled={sub.cancelAtPeriodEnd}
      />

      {children}

      <CancelSubscription
        renewsAt={sub.renewsAt}
        cancelled={sub.cancelAtPeriodEnd}
        onCancel={() => {
          setSub((s) => ({ ...s, cancelAtPeriodEnd: true }));
          setScheduledSeats(null);
          toast({
            variant: "success",
            title: "Abonnement opgezegd",
            description: `Het loopt door tot ${formatDate(sub.renewsAt)}. Bedankt voor je feedback.`,
          });
        }}
        onResume={resume}
      />
    </>
  );
}
