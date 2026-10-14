"use client";

import { useId, type ReactNode } from "react";
import clsx from "clsx";
import { Check, CircleAlert } from "lucide-react";
import styles from "./goal-chips.module.scss";

export type GoalChipsProps = {
  label: ReactNode;
  options: { value: string; label: string }[];
  value: string[];
  onValueChange: (value: string[]) => void;
  /** Maximaal aantal keuzes; daarna zijn de overige chips even niet te kiezen. */
  max?: number;
  error?: ReactNode;
};

// Meerkeuze als pillen. Native checkboxes, dus Tab en spatie werken zoals verwacht.
export function GoalChips({ label, options, value, onValueChange, max, error }: GoalChipsProps) {
  const id = `goals${useId().replace(/:/g, "")}`;
  const full = max !== undefined && value.length >= max;

  function toggle(option: string, checked: boolean) {
    onValueChange(checked ? [...value, option] : value.filter((v) => v !== option));
  }

  return (
    <fieldset
      className={styles.group}
      aria-describedby={[`${id}-count`, error ? `${id}-error` : ""].filter(Boolean).join(" ")}
    >
      <legend className="visually-hidden">{label}</legend>
      <div className={styles.list}>
        {options.map((option) => {
          const checked = value.includes(option.value);
          const disabled = full && !checked;
          return (
            <label
              key={option.value}
              className={clsx(styles.chip, checked && styles.checked, disabled && styles.disabled, error && styles.invalid)}
            >
              <input
                type="checkbox"
                name="doelen"
                value={option.value}
                checked={checked}
                disabled={disabled}
                onChange={(e) => toggle(option.value, e.target.checked)}
                className={styles.input}
              />
              <span className={styles.check} aria-hidden>
                <Check />
              </span>
              {option.label}
            </label>
          );
        })}
      </div>

      <p id={`${id}-count`} className={styles.count} aria-live="polite">
        {max !== undefined ? (
          <>
            <span className={styles.countValue}>{value.length}</span> van {max} gekozen
            {full && " – haal er een weg om iets anders te kiezen"}
          </>
        ) : (
          `${value.length} gekozen`
        )}
      </p>

      {error && (
        <p id={`${id}-error`} className={styles.error}>
          <CircleAlert aria-hidden />
          <span>{error}</span>
        </p>
      )}
    </fieldset>
  );
}
