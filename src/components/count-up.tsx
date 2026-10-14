"use client";

import { useLayoutEffect, useState } from "react";
import { formatNumber } from "@/lib/format";
import styles from "./count-up.module.scss";

type Props = { value: number; prefix?: string; suffix?: string; duration?: number };

// Telt bij binnenkomst op naar `value`. Server en no-JS tonen direct de eindwaarde.
export function CountUp({ value, prefix = "", suffix = "", duration = 700 }: Props) {
  const [current, setCurrent] = useState(value);
  const format = (n: number) => `${prefix}${formatNumber(n)}${suffix}`;

  useLayoutEffect(() => {
    if (value <= 0 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      setCurrent(Math.round(value * (1 - (1 - t) ** 3)));
      if (t < 1) frame = requestAnimationFrame(tick);
    };

    setCurrent(0);
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      setCurrent(value);
    };
  }, [value, duration]);

  return (
    <span className={styles.root}>
      {/* Onzichtbare eindwaarde: houdt de breedte vast en is wat screenreaders voorlezen. */}
      <span className={styles.final}>{format(value)}</span>
      <span aria-hidden="true">{format(current)}</span>
    </span>
  );
}
