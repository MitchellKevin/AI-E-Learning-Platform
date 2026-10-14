import clsx from "clsx";
import type { ReactNode } from "react";
import styles from "./badge.module.scss";

export type BadgeVariant = "neutral" | "brand" | "success" | "warning" | "danger";

export type BadgeProps = {
  variant?: BadgeVariant;
  size?: "sm" | "md";
  /** Gekleurd bolletje voor de tekst (zoals een statuslampje). */
  dot?: boolean;
  icon?: ReactNode;
  className?: string;
  children: ReactNode;
};

export function Badge({ variant = "neutral", size = "md", dot, icon, className, children }: BadgeProps) {
  return (
    <span className={clsx(styles.badge, styles[variant], styles[size], className)}>
      {dot && <span className={styles.dot} aria-hidden />}
      {icon && (
        <span className={styles.icon} aria-hidden>
          {icon}
        </span>
      )}
      {children}
    </span>
  );
}

export type StatusPillProps = Omit<BadgeProps, "dot" | "icon">;

// Status in tabellen en lijsten: "Actief", "Uitgenodigd", "Verlopen".
export function StatusPill(props: StatusPillProps) {
  return <Badge {...props} dot />;
}
