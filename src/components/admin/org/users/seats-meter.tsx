import { Settings2 } from "lucide-react";
import { Button } from "@/components/kit";
import type { SeatUsage } from "@/lib/data/admin-org-shared";
import styles from "./seats-meter.module.scss";

// Licentiegebruik: actief + uitgenodigd bezet een licentie.
export function SeatsMeter({ usage }: { usage: SeatUsage }) {
  const used = usage.active + usage.invited;
  const free = Math.max(0, usage.total - used);
  const pct = (n: number) => `${Math.min(100, (n / usage.total) * 100)}%`;
  const almostFull = free <= Math.max(2, Math.round(usage.total * 0.1));

  return (
    <section className={styles.card} aria-labelledby="seats-title">
      <div className={styles.top}>
        <div>
          <h2 id="seats-title" className={styles.eyebrow}>
            Licenties
          </h2>
          <p className={styles.count}>
            <strong>{used}</strong> van {usage.total} in gebruik
          </p>
        </div>
        <Button href="/beheer/abonnement" variant="secondary" size="sm" icon={<Settings2 />}>
          Licenties aanpassen
        </Button>
      </div>

      <div
        role="meter"
        aria-label="Licentiegebruik"
        aria-valuemin={0}
        aria-valuemax={usage.total}
        aria-valuenow={used}
        aria-valuetext={`${used} van ${usage.total} licenties in gebruik, ${free} vrij`}
        className={styles.bar}
      >
        <span className={styles.active} style={{ width: pct(usage.active) }} />
        <span className={styles.invited} style={{ width: pct(usage.invited) }} />
      </div>

      <ul className={styles.legend}>
        <li>
          <span className={styles.swatch} data-kind="active" aria-hidden />
          Actief <strong>{usage.active}</strong>
        </li>
        <li>
          <span className={styles.swatch} data-kind="invited" aria-hidden />
          Uitgenodigd <strong>{usage.invited}</strong>
        </li>
        <li>
          <span className={styles.swatch} data-kind="free" aria-hidden />
          Vrij <strong>{free}</strong>
        </li>
      </ul>

      {almostFull && (
        <p className={styles.note}>
          {free === 0
            ? "Alle licenties zijn bezet. Breid je abonnement uit om meer collega's uit te nodigen."
            : `Nog maar ${free} ${free === 1 ? "licentie" : "licenties"} vrij. Breid op tijd uit, dan kan iedereen meteen starten.`}
        </p>
      )}
    </section>
  );
}
