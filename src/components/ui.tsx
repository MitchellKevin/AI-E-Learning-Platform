import Link from "next/link";
import clsx from "clsx";
import { ArrowRight } from "lucide-react";
import styles from "./ui.module.scss";

type WithClass = { className?: string; children: React.ReactNode };

export function Card({ className, children }: WithClass) {
  return <div className={clsx(styles.card, className)}>{children}</div>;
}

export function Eyebrow({ className, children }: WithClass) {
  return <p className={clsx(styles.eyebrow, className)}>{children}</p>;
}

export function Tags({ children }: { children: React.ReactNode }) {
  return <div className={styles.tags}>{children}</div>;
}

export function Tag({ variant = "outline", children }: { variant?: "brand" | "outline"; children: React.ReactNode }) {
  return <span className={clsx(styles.tag, variant === "brand" && styles.brand)}>{children}</span>;
}

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={clsx(styles.progress, className)}
    >
      <div className={styles.progressFill} style={{ width: `${value}%` }} />
    </div>
  );
}

// Primaire knop met losse donkere pijl-cirkel, zoals in het ontwerp.
export function ArrowButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className={styles.arrowButton}>
      <span className={styles.arrowLabel}>{children}</span>
      <span className={styles.arrowIcon}>
        <ArrowRight />
      </span>
    </Link>
  );
}

export function Avatar({ initials, size = 32 }: { initials: string; size?: number }) {
  return (
    <span className={styles.avatar} style={{ "--size": `${size}px` } as React.CSSProperties}>
      {initials}
    </span>
  );
}

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Kruimelpad" className={styles.breadcrumbs}>
      {items.map((item, i) => (
        <span key={item.label}>
          {i > 0 && <span className={styles.crumbSeparator}>/</span>}
          {item.href ? <Link href={item.href}>{item.label}</Link> : item.label}
        </span>
      ))}
    </nav>
  );
}
