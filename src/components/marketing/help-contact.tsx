import clsx from "clsx";
import { Clock, LifeBuoy, Mail } from "lucide-react";
import { Button } from "@/components/kit";
import type { SupportInfo } from "@/lib/data/help";
import styles from "./help-contact.module.scss";

type Props = {
  support: SupportInfo;
  /** "compact" voor de zijbalk van een artikel. */
  variant?: "full" | "compact";
  headingLevel?: 2 | 3;
  className?: string;
};

export function HelpContact({ support, variant = "full", headingLevel = 2, className }: Props) {
  const Heading = `h${headingLevel}` as const;
  return (
    <section aria-labelledby={`support-${variant}`} className={clsx(styles.card, styles[variant], className)}>
      <span className={styles.icon} aria-hidden>
        <LifeBuoy />
      </span>
      <div className={styles.text}>
        <Heading id={`support-${variant}`} className={styles.title}>
          {variant === "full" ? "Kom je er niet uit?" : "Nog vragen?"}
        </Heading>
        <p className={styles.lead}>
          {variant === "full"
            ? "Ons supportteam helpt je graag verder. Vertel welke stap niet lukt, dan kijken we met je mee."
            : "Mail ons supportteam, we helpen je graag."}
        </p>
        <dl className={styles.meta}>
          <div>
            <dt>
              <Mail aria-hidden /> E-mail
            </dt>
            <dd>
              <a href={`mailto:${support.email}`}>{support.email}</a>
            </dd>
          </div>
          <div>
            <dt>
              <Clock aria-hidden /> Reactietijd
            </dt>
            <dd>
              {support.responseTime}
              {variant === "full" && <span className={styles.hours}>{support.hours}</span>}
            </dd>
          </div>
        </dl>
      </div>
      <div className={styles.actions}>
        <Button href={`mailto:${support.email}`} icon={<Mail />} fullWidth={variant === "compact"}>
          Mail support
        </Button>
        {variant === "full" && (
          <Button href="/demo" variant="secondary">
            Plan een demo
          </Button>
        )}
      </div>
    </section>
  );
}
