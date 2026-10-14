import clsx from "clsx";
import type { CSSProperties } from "react";
import styles from "./skeleton.module.scss";

export type SkeletonProps = {
  /** px-getal of CSS-waarde ("60%"). Standaard 100%. */
  width?: number | string;
  /** px-getal of CSS-waarde. Standaard 16px. */
  height?: number | string;
  radius?: "sm" | "md" | "pill" | "circle";
  className?: string;
};

// Placeholder met glans tijdens laden. Zet aria-busy op de omliggende regio.
export function Skeleton({ width = "100%", height = 16, radius = "sm", className }: SkeletonProps) {
  const style: CSSProperties = { width, height: radius === "circle" ? width : height };
  return <span aria-hidden className={clsx(styles.skeleton, styles[radius], className)} style={style} />;
}

export type SkeletonTextProps = { lines?: number; className?: string };

// Een paar tekstregels; de laatste is korter.
export function SkeletonText({ lines = 3, className }: SkeletonTextProps) {
  return (
    <span aria-hidden className={clsx(styles.text, className)}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} height={12} width={i === lines - 1 && lines > 1 ? "60%" : "100%"} />
      ))}
    </span>
  );
}
