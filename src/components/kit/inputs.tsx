"use client";

import { useCallback, useLayoutEffect, useRef, type ComponentPropsWithRef, type ReactNode } from "react";
import clsx from "clsx";
import { ChevronDown } from "lucide-react";
import { useFieldProps } from "./field";
import { mergeRefs } from "./utils";
import styles from "./inputs.module.scss";

type ControlExtras = {
  /** Foutstatus zonder Field (binnen een Field volgt dit de `error`). */
  invalid?: boolean;
};

export type TextInputProps = Omit<ComponentPropsWithRef<"input">, "size"> &
  ControlExtras & {
    /** Icoon links in het veld, bv. `<Search />`. */
    icon?: ReactNode;
    /** Inhoud rechts in het veld: tekst ("min") of een kleine knop. */
    suffix?: ReactNode;
    /** Class op het `<input>` zelf; `className` gaat naar de omlijsting. */
    inputClassName?: string;
  };

export function TextInput({
  icon,
  suffix,
  invalid,
  className,
  inputClassName,
  id,
  required,
  "aria-describedby": describedBy,
  ...props
}: TextInputProps) {
  const field = useFieldProps({ id, describedBy, invalid, required });

  return (
    <div
      className={clsx(
        styles.control,
        field.invalid && styles.invalid,
        props.disabled && styles.disabled,
        className,
      )}
    >
      {icon && (
        <span className={styles.icon} aria-hidden>
          {icon}
        </span>
      )}
      <input
        {...props}
        id={field.id}
        required={field.required}
        aria-describedby={field["aria-describedby"]}
        aria-invalid={field["aria-invalid"]}
        className={clsx(styles.input, inputClassName)}
      />
      {suffix && <span className={styles.suffix}>{suffix}</span>}
    </div>
  );
}

export type TextareaProps = ComponentPropsWithRef<"textarea"> &
  ControlExtras & {
    /** Groeit mee met de inhoud. */
    autoResize?: boolean;
    /** Maximaal aantal regels bij autoResize; daarna scrollt het veld. */
    maxRows?: number;
  };

const LINE_HEIGHT = 21;
const PADDING_Y = 10;

export function Textarea({
  autoResize = false,
  maxRows,
  invalid,
  className,
  id,
  required,
  rows = 4,
  style,
  ref,
  onInput,
  "aria-describedby": describedBy,
  ...props
}: TextareaProps) {
  const field = useFieldProps({ id, describedBy, invalid, required });
  const inner = useRef<HTMLTextAreaElement>(null);

  const resize = useCallback(() => {
    const el = inner.current;
    if (!el || !autoResize) return;
    el.style.height = "auto";
    // scrollHeight is zonder rand; box-sizing is border-box.
    el.style.height = `${el.scrollHeight + 2}px`;
  }, [autoResize]);

  // Ook bij een gecontroleerde waarde die van buitenaf wijzigt (bv. leegmaken na verzenden).
  useLayoutEffect(resize, [resize, props.value]);

  return (
    <textarea
      {...props}
      ref={mergeRefs(inner, ref)}
      rows={rows}
      id={field.id}
      required={field.required}
      aria-describedby={field["aria-describedby"]}
      aria-invalid={field["aria-invalid"]}
      onInput={(e) => {
        resize();
        onInput?.(e);
      }}
      style={{
        ...(maxRows ? { maxHeight: maxRows * LINE_HEIGHT + PADDING_Y * 2 + 2 } : null),
        ...style,
      }}
      className={clsx(
        styles.control,
        styles.textarea,
        autoResize && styles.autoResize,
        field.invalid && styles.invalid,
        className,
      )}
    />
  );
}

export type SelectProps = ComponentPropsWithRef<"select"> &
  ControlExtras & {
    /** Lege, niet-kiesbare eerste optie, bv. "Kies een team". */
    placeholder?: string;
  };

export function Select({
  placeholder,
  invalid,
  className,
  id,
  required,
  children,
  defaultValue,
  "aria-describedby": describedBy,
  ...props
}: SelectProps) {
  const field = useFieldProps({ id, describedBy, invalid, required });
  // Zonder waarde staat de placeholder geselecteerd.
  const initial = placeholder && props.value === undefined && defaultValue === undefined ? "" : defaultValue;

  return (
    <div
      className={clsx(
        styles.control,
        styles.selectControl,
        field.invalid && styles.invalid,
        props.disabled && styles.disabled,
        className,
      )}
    >
      <select
        {...props}
        defaultValue={initial}
        id={field.id}
        required={field.required}
        aria-describedby={field["aria-describedby"]}
        aria-invalid={field["aria-invalid"]}
        className={styles.select}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {children}
      </select>
      <ChevronDown className={styles.chevron} aria-hidden />
    </div>
  );
}
