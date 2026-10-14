import { CalendarClock, Users } from "lucide-react";
import { Badge, StatusPill } from "@/components/kit";
import { formatDate } from "@/lib/format";
import { formatEuro, type Subscription } from "@/lib/data/admin-org";
import styles from "./plan-card.module.scss";

type Props = { subscription: Subscription; seatsUsed: number; scheduledSeats?: number | null };

// Samenvatting van het huidige abonnement.
export function PlanCard({ subscription: sub, seatsUsed, scheduledSeats }: Props) {
  const months = sub.interval === "jaar" ? 12 : 1;
  const periodTotal = sub.pricePerSeat * sub.seats * months;

  return (
    <section className={styles.card} aria-labelledby="plan-title">
      <div className={styles.main}>
        <div className={styles.titles}>
          <p className={styles.eyebrow}>Huidig abonnement</p>
          <div className={styles.nameRow}>
            <h2 id="plan-title" className={styles.name}>
              {sub.planName}
            </h2>
            <Badge variant="brand" size="sm">
              {sub.interval === "jaar" ? "Jaarlijks" : "Maandelijks"}
            </Badge>
            {sub.cancelAtPeriodEnd ? (
              <StatusPill variant="warning" size="sm">
                Opgezegd
              </StatusPill>
            ) : (
              <StatusPill variant="success" size="sm">
                Actief
              </StatusPill>
            )}
          </div>
        </div>
        <div className={styles.price}>
          <p className={styles.amount}>
            {formatEuro(sub.pricePerSeat)}
            <span> per gebruiker per maand</span>
          </p>
          <p className={styles.priceNote}>
            {formatEuro(periodTotal)} per {sub.interval} · excl. btw
            {sub.interval === "jaar" && " · 20% jaarkorting"}
          </p>
        </div>
      </div>

      <dl className={styles.facts}>
        <div className={styles.fact}>
          <dt>
            <Users aria-hidden /> Licenties
          </dt>
          <dd>
            {sub.seats} <span>· {seatsUsed} in gebruik</span>
          </dd>
          {scheduledSeats != null && (
            <dd className={styles.factNote}>
              Vanaf {formatDate(sub.renewsAt)}: {scheduledSeats}
            </dd>
          )}
        </div>
        <div className={styles.fact}>
          <dt>
            <CalendarClock aria-hidden /> {sub.cancelAtPeriodEnd ? "Loopt af op" : "Volgende factuur"}
          </dt>
          <dd>{formatDate(sub.renewsAt)}</dd>
          {!sub.cancelAtPeriodEnd && (
            <dd className={styles.factNote}>
              {formatEuro(sub.pricePerSeat * (scheduledSeats ?? sub.seats) * months)} excl. btw
            </dd>
          )}
        </div>
        <div className={styles.fact}>
          <dt>Klant sinds</dt>
          <dd>{formatDate(sub.startedAt)}</dd>
        </div>
      </dl>
    </section>
  );
}
