"use client";

import { createContext, useContext, useId, type ReactNode } from "react";
import clsx from "clsx";
import { CircleAlert } from "lucide-react";
import styles from "./field.module.scss";

type FieldContextValue = { id: string; describedBy?: string; invalid: boolean; required?: boolean };

const FieldContext = createContext<FieldContextValue | null>(null);

// Koppelt een invoerveld aan het label, de uitleg en de foutmelding van de omliggende Field.
export function useFieldProps(own: { id?: string; describedBy?: string; invalid?: boolean; required?: boolean }) {
  const field = useContext(FieldContext);
  const describedBy = [field?.describedBy, own.describedBy].filter(Boolean).join(" ") || undefined;
  const invalid = Boolean(own.invalid ?? field?.invalid);
  return {
    id: own.id ?? field?.id,
    "aria-describedby": describedBy,
    "aria-invalid": invalid || undefined,
    required: own.required ?? field?.required,
    invalid,
  };
}

export type FieldProps = {
  label: ReactNode;
  /** Korte uitleg onder het label. */
  description?: ReactNode;
  /** Foutmelding; zet ook aria-invalid op het veld. */
  error?: ReactNode;
  /** Zet `required` op het veld. */
  required?: boolean;
  /** Toont "(optioneel)" achter het label. */
  optional?: boolean;
  /** Label alleen voor screenreaders. */
  hideLabel?: boolean;
  /** Eigen id voor het veld; anders wordt er een gegenereerd. */
  id?: string;
  /** Rechts naast het label, bv. een link "Wachtwoord vergeten?". */
  action?: ReactNode;
  className?: string;
  children: ReactNode;
};

export function Field({
  label,
  description,
  error,
  required,
  optional,
  hideLabel,
  id,
  action,
  className,
  children,
}: FieldProps) {
  const autoId = useId();
  const controlId = id ?? `field${autoId.replace(/:/g, "")}`;
  const descriptionId = description ? `${controlId}-description` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;
  const describedBy = [descriptionId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={clsx(styles.field, className)}>
      <div className={clsx(styles.labelRow, hideLabel && !action && "visually-hidden")}>
        <label htmlFor={controlId} className={clsx(styles.label, hideLabel && "visually-hidden")}>
          {label}
          {optional && <span className={styles.optional}> (optioneel)</span>}
        </label>
        {action && <span className={styles.action}>{action}</span>}
      </div>
      {description && (
        <p id={descriptionId} className={styles.description}>
          {description}
        </p>
      )}
      <FieldContext.Provider value={{ id: controlId, describedBy, invalid: Boolean(error), required }}>
        {children}
      </FieldContext.Provider>
      {error && (
        <p id={errorId} className={styles.error}>
          <CircleAlert aria-hidden />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
