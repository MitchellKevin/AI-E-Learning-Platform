"use client";

import { useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import clsx from "clsx";
import styles from "./segmented-control.module.scss";

export type SegmentedOption<T extends string = string> = {
  value: T;
  label: ReactNode;
  /** Klein label achter de tekst, bv. "−20%". */
  badge?: ReactNode;
  disabled?: boolean;
};

export type SegmentedControlProps<T extends string = string> = {
  options: SegmentedOption<T>[];
  value?: T;
  defaultValue?: T;
  onValueChange?: (value: T) => void;
  /** Toegankelijke naam van de groep, bv. "Betaalperiode". */
  label: string;
  name?: string;
  size?: "sm" | "md";
  fullWidth?: boolean;
  className?: string;
};

// Pilvormige schakelaar tussen een paar opties, met een meeschuivende achtergrond.
export function SegmentedControl<T extends string = string>({
  options,
  value,
  defaultValue,
  onValueChange,
  label,
  name,
  size = "md",
  fullWidth,
  className,
}: SegmentedControlProps<T>) {
  const autoName = `segmented${useId().replace(/:/g, "")}`;
  const [internal, setInternal] = useState<T | undefined>(defaultValue ?? options[0]?.value);
  const current = value ?? internal;
  const root = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(null);

  // Meet de gekozen optie, zodat de achtergrond ernaartoe kan schuiven.
  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const measure = () => {
      const active = el.querySelector<HTMLElement>(`[data-value="${CSS.escape(String(current))}"]`);
      setIndicator(active ? { left: active.offsetLeft, width: active.offsetWidth } : null);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [current]);

  function select(next: T) {
    if (value === undefined) setInternal(next);
    onValueChange?.(next);
  }

  return (
    <div
      ref={root}
      role="radiogroup"
      aria-label={label}
      className={clsx(styles.root, styles[size], fullWidth && styles.fullWidth, indicator && styles.measured, className)}
    >
      {indicator && (
        <span
          aria-hidden
          className={styles.indicator}
          style={{ transform: `translateX(${indicator.left}px)`, width: indicator.width }}
        />
      )}
      {options.map((option) => {
        const checked = option.value === current;
        return (
          <label
            key={option.value}
            data-value={option.value}
            className={clsx(styles.option, checked && styles.checked, option.disabled && styles.disabled)}
          >
            <input
              type="radio"
              name={name ?? autoName}
              value={option.value}
              checked={checked}
              disabled={option.disabled}
              onChange={() => select(option.value)}
              className={styles.input}
            />
            <span>{option.label}</span>
            {option.badge && <span className={styles.badge}>{option.badge}</span>}
          </label>
        );
      })}
    </div>
  );
}
