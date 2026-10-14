"use client";

import { createContext, useContext, useId, useState, type ReactNode } from "react";
import clsx from "clsx";
import { Check, CircleAlert } from "lucide-react";
import styles from "./radio.module.scss";

type RadioContextValue = {
  name: string;
  value: string | undefined;
  select: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  invalid: boolean;
};

const RadioContext = createContext<RadioContextValue | null>(null);

function useRadioGroup() {
  const ctx = useContext(RadioContext);
  if (!ctx) throw new Error("Radio en RadioCard horen binnen een RadioGroup.");
  return ctx;
}

export type RadioGroupProps = {
  /** Groepslabel (legend). */
  label: ReactNode;
  hideLabel?: boolean;
  description?: ReactNode;
  error?: ReactNode;
  /** Naam voor form-submit; anders gegenereerd. */
  name?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  /** Kolommen vanaf tablet; op mobiel altijd één kolom. */
  columns?: 1 | 2 | 3;
  className?: string;
  children: ReactNode;
};

// Native radioknoppen: pijltjestoetsen en formulieren werken vanzelf.
export function RadioGroup({
  label,
  hideLabel,
  description,
  error,
  name,
  value,
  defaultValue,
  onValueChange,
  required,
  disabled,
  columns = 1,
  className,
  children,
}: RadioGroupProps) {
  const autoId = useId().replace(/:/g, "");
  const [internal, setInternal] = useState(defaultValue);
  const current = value ?? internal;
  const descriptionId = description ? `radio${autoId}-description` : undefined;
  const errorId = error ? `radio${autoId}-error` : undefined;

  function select(next: string) {
    if (value === undefined) setInternal(next);
    onValueChange?.(next);
  }

  return (
    <fieldset
      className={clsx(styles.group, className)}
      disabled={disabled}
      aria-describedby={[descriptionId, errorId].filter(Boolean).join(" ") || undefined}
    >
      <legend className={clsx(styles.legend, hideLabel && "visually-hidden")}>{label}</legend>
      {description && (
        <p id={descriptionId} className={styles.description}>
          {description}
        </p>
      )}
      <RadioContext.Provider
        value={{ name: name ?? `radio${autoId}`, value: current, select, disabled, required, invalid: Boolean(error) }}
      >
        <div className={clsx(styles.options, styles[`columns${columns}`])}>{children}</div>
      </RadioContext.Provider>
      {error && (
        <p id={errorId} className={styles.error}>
          <CircleAlert aria-hidden />
          <span>{error}</span>
        </p>
      )}
    </fieldset>
  );
}

function RadioInput({ value, disabled, describedBy }: { value: string; disabled?: boolean; describedBy?: string }) {
  const ctx = useRadioGroup();
  return (
    <input
      type="radio"
      name={ctx.name}
      value={value}
      checked={ctx.value === value}
      onChange={() => ctx.select(value)}
      disabled={disabled || ctx.disabled}
      required={ctx.required}
      aria-describedby={describedBy}
      className={styles.input}
    />
  );
}

export type RadioCardProps = {
  value: string;
  title: ReactNode;
  description?: ReactNode;
  /** Icoon of kleine afbeelding links van de titel. */
  icon?: ReactNode;
  /** Kleine regel boven de titel, zoals een eyebrow ("Voor designers"). */
  eyebrow?: ReactNode;
  disabled?: boolean;
  /** Extra inhoud onder de beschrijving (tags, lijstje, prijs). */
  children?: ReactNode;
  className?: string;
};

// Selecteerbare kaart, zoals de specialisatiekeuze.
export function RadioCard({ value, title, description, icon, eyebrow, disabled, children, className }: RadioCardProps) {
  const ctx = useRadioGroup();
  const descriptionId = `${ctx.name}-${value}-description`;
  const selected = ctx.value === value;

  return (
    <label
      className={clsx(
        styles.card,
        selected && styles.selected,
        ctx.invalid && !ctx.value && styles.invalid,
        disabled && styles.disabled,
        className,
      )}
    >
      <RadioInput value={value} disabled={disabled} describedBy={description ? descriptionId : undefined} />
      <span className={styles.cardHead}>
        {icon && (
          <span className={styles.cardIcon} aria-hidden>
            {icon}
          </span>
        )}
        <span className={styles.cardTitles}>
          {eyebrow && <span className={styles.eyebrow}>{eyebrow}</span>}
          <span className={styles.cardTitle}>{title}</span>
        </span>
        <span className={styles.indicator} aria-hidden>
          {selected && <Check />}
        </span>
      </span>
      {description && (
        <span id={descriptionId} className={styles.cardText}>
          {description}
        </span>
      )}
      {children && <span className={styles.cardExtra}>{children}</span>}
    </label>
  );
}

export type RadioProps = {
  value: string;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
  className?: string;
};

// Gewone radioknop met label, voor eenvoudige keuzes in instellingen.
export function Radio({ value, label, description, disabled, className }: RadioProps) {
  const ctx = useRadioGroup();
  const descriptionId = `${ctx.name}-${value}-description`;

  return (
    <label className={clsx(styles.radio, disabled && styles.disabled, className)}>
      <span className={styles.radioControl}>
        <RadioInput value={value} disabled={disabled} describedBy={description ? descriptionId : undefined} />
        <span className={styles.dot} aria-hidden />
      </span>
      <span className={styles.radioText}>
        <span className={styles.radioLabel}>{label}</span>
        {description && (
          <span id={descriptionId} className={styles.radioDescription}>
            {description}
          </span>
        )}
      </span>
    </label>
  );
}
