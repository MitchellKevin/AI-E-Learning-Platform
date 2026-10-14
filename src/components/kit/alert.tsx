import clsx from "clsx";
import type { ReactNode } from "react";
import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";
import styles from "./alert.module.scss";

export type AlertVariant = "info" | "success" | "warning" | "danger";

export type AlertProps = {
  variant?: AlertVariant;
  title?: ReactNode;
  children?: ReactNode;
  /** Eigen icoon, of `false` voor geen icoon. */
  icon?: ReactNode | false;
  /** Knop of link rechts (op mobiel eronder). */
  action?: ReactNode;
  /** Voor meldingen die na een actie verschijnen: leest ze direct voor. */
  live?: boolean;
  className?: string;
};

const icons = { info: Info, success: CircleCheck, warning: TriangleAlert, danger: CircleAlert };

// Rustige melding in de pagina, bv. "Je proefperiode loopt over 5 dagen af".
export function Alert({ variant = "info", title, children, icon, action, live, className }: AlertProps) {
  const Icon = icons[variant];
  return (
    <div
      role={live ? (variant === "danger" ? "alert" : "status") : undefined}
      className={clsx(styles.alert, styles[variant], className)}
    >
      {icon !== false && (
        <span className={styles.icon} aria-hidden>
          {icon ?? <Icon />}
        </span>
      )}
      <div className={styles.text}>
        {title && <p className={styles.title}>{title}</p>}
        {children && <div className={styles.body}>{children}</div>}
      </div>
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
