"use client";

import { useId, useState, type ReactNode } from "react";
import clsx from "clsx";
import styles from "./switch.module.scss";

export type SwitchProps = {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  /** Zichtbaar label links; de schakelaar staat rechts (zoals in instellingen). */
  label: ReactNode;
  description?: ReactNode;
  /** Label alleen voor screenreaders. */
  hideLabel?: boolean;
  disabled?: boolean;
  /** Met een naam gaat de waarde mee in een gewone form-submit ("on" of leeg). */
  name?: string;
  value?: string;
  id?: string;
  size?: "sm" | "md";
  className?: string;
};

export function Switch({
  checked,
  defaultChecked = false,
  onCheckedChange,
  label,
  description,
  hideLabel,
  disabled,
  name,
  value = "on",
  id,
  size = "md",
  className,
}: SwitchProps) {
  const autoId = useId();
  const switchId = id ?? `switch${autoId.replace(/:/g, "")}`;
  const descriptionId = description ? `${switchId}-description` : undefined;
  const [internal, setInternal] = useState(defaultChecked);
  const isOn = checked ?? internal;

  function toggle() {
    const next = !isOn;
    if (checked === undefined) setInternal(next);
    onCheckedChange?.(next);
  }

  return (
    <div className={clsx(styles.row, hideLabel && styles.bare, disabled && styles.disabled, className)}>
      <span className={clsx(styles.text, hideLabel && "visually-hidden")}>
        <label htmlFor={switchId} className={styles.label}>
          {label}
        </label>
        {description && (
          <span id={descriptionId} className={styles.description}>
            {description}
          </span>
        )}
      </span>
      <button
        type="button"
        role="switch"
        id={switchId}
        aria-checked={isOn}
        aria-describedby={descriptionId}
        disabled={disabled}
        onClick={toggle}
        className={clsx(styles.switch, styles[size])}
      >
        <span className={styles.thumb} />
      </button>
      {name && <input type="hidden" name={name} value={isOn ? value : ""} />}
    </div>
  );
}
