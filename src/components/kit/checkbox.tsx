"use client";

import { useEffect, useId, useRef, type ComponentPropsWithRef, type ReactNode } from "react";
import clsx from "clsx";
import { Check, Minus } from "lucide-react";
import { mergeRefs } from "./utils";
import styles from "./checkbox.module.scss";

export type CheckboxProps = Omit<ComponentPropsWithRef<"input">, "type" | "size"> & {
  label: ReactNode;
  description?: ReactNode;
  /** Half aangevinkt, bv. "alles selecteren" in een tabel. */
  indeterminate?: boolean;
  invalid?: boolean;
  /** Label alleen voor screenreaders (bv. in een tabelrij). */
  hideLabel?: boolean;
};

export function Checkbox({
  label,
  description,
  indeterminate = false,
  invalid,
  hideLabel,
  className,
  id,
  ref,
  "aria-describedby": describedBy,
  ...props
}: CheckboxProps) {
  const autoId = useId();
  const inputId = id ?? `checkbox${autoId.replace(/:/g, "")}`;
  const descriptionId = description ? `${inputId}-description` : undefined;
  const inner = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inner.current) inner.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <div className={clsx(styles.checkbox, props.disabled && styles.disabled, className)}>
      <span className={styles.control}>
        <input
          {...props}
          ref={mergeRefs(inner, ref)}
          type="checkbox"
          id={inputId}
          aria-invalid={invalid || undefined}
          aria-describedby={[descriptionId, describedBy].filter(Boolean).join(" ") || undefined}
          className={clsx(styles.input, invalid && styles.invalid)}
        />
        <span className={styles.box} aria-hidden>
          {indeterminate ? <Minus className={styles.mark} /> : <Check className={styles.mark} />}
        </span>
      </span>
      <span className={clsx(styles.text, hideLabel && "visually-hidden")}>
        <label htmlFor={inputId} className={styles.label}>
          {label}
        </label>
        {description && (
          <span id={descriptionId} className={styles.description}>
            {description}
          </span>
        )}
      </span>
    </div>
  );
}
