"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from "react";
import Link from "next/link";
import clsx from "clsx";
import { buttonClassName, type ButtonSize, type ButtonVariant } from "./button";
import { FOCUSABLE } from "./utils";
import styles from "./menu.module.scss";

// Gedeelde logica voor Menu en Popover

type FloatingContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  close: (focusTrigger?: boolean) => void;
  rootRef: RefObject<HTMLDivElement | null>;
  triggerRef: RefObject<HTMLButtonElement | null>;
  triggerId: string;
  contentId: string;
  /** Welk item focus krijgt bij openen (pijl omhoog opent op het laatste). */
  focusTarget: RefObject<"first" | "last">;
};

const FloatingContext = createContext<FloatingContextValue | null>(null);

function useFloatingContext() {
  const ctx = useContext(FloatingContext);
  if (!ctx) throw new Error("Trigger en inhoud horen binnen <Menu> of <Popover>.");
  return ctx;
}

type RootProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  children: ReactNode;
};

function FloatingRoot({ open: controlled, onOpenChange, className, children }: RootProps) {
  const [internal, setInternal] = useState(false);
  const open = controlled ?? internal;
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const focusTarget = useRef<"first" | "last">("first");
  const id = useId().replace(/:/g, "");

  const setOpen = useCallback(
    (next: boolean) => {
      if (controlled === undefined) setInternal(next);
      onOpenChange?.(next);
    },
    [controlled, onOpenChange],
  );

  const close = useCallback(
    (focusTrigger = true) => {
      setOpen(false);
      if (focusTrigger) triggerRef.current?.focus();
    },
    [setOpen],
  );

  // Klik of tik buiten het menu sluit het.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open, close]);

  return (
    <FloatingContext.Provider
      value={{
        open,
        setOpen,
        close,
        rootRef,
        triggerRef,
        triggerId: `menu${id}-trigger`,
        contentId: `menu${id}-content`,
        focusTarget,
      }}
    >
      <div ref={rootRef} className={clsx(styles.root, className)}>
        {children}
      </div>
    </FloatingContext.Provider>
  );
}

export type TriggerProps = Omit<ComponentPropsWithoutRef<"button">, "type"> & {
  /** Met een variant ziet de trigger eruit als een Button; zonder is hij kaal (eigen styling). */
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconOnly?: boolean;
};

function FloatingTrigger({
  kind,
  variant,
  size,
  iconOnly,
  className,
  onClick,
  onKeyDown,
  ...props
}: TriggerProps & { kind: "menu" | "dialog" }) {
  const ctx = useFloatingContext();
  return (
    <button
      {...props}
      ref={ctx.triggerRef}
      type="button"
      id={ctx.triggerId}
      aria-haspopup={kind}
      aria-expanded={ctx.open}
      aria-controls={ctx.open ? ctx.contentId : undefined}
      className={clsx(variant ? buttonClassName({ variant, size, iconOnly }) : styles.bareTrigger, className)}
      onClick={(e) => {
        onClick?.(e);
        ctx.focusTarget.current = "first";
        ctx.setOpen(!ctx.open);
      }}
      onKeyDown={(e) => {
        onKeyDown?.(e);
        if (kind === "menu" && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
          e.preventDefault();
          ctx.focusTarget.current = e.key === "ArrowUp" ? "last" : "first";
          ctx.setOpen(true);
        }
      }}
    />
  );
}

type ContentProps = {
  /** Uitlijning t.o.v. de trigger. Standaard "end" (rechts), handig in de header. */
  align?: "start" | "end";
  /** Breedte in px; standaard past hij zich aan de inhoud aan (min. 200). */
  width?: number;
  className?: string;
  children: ReactNode;
};

// Menu

export type MenuProps = RootProps;

export function Menu(props: MenuProps) {
  return <FloatingRoot {...props} />;
}

export function MenuTrigger(props: TriggerProps) {
  return <FloatingTrigger {...props} kind="menu" />;
}

const ITEM_SELECTOR = '[role="menuitem"]:not([aria-disabled="true"])';

export function MenuContent({ align = "end", width, className, children }: ContentProps) {
  const ctx = useFloatingContext();
  const ref = useRef<HTMLDivElement>(null);
  const { open, focusTarget } = ctx;

  useEffect(() => {
    if (!open) return;
    const items = ref.current?.querySelectorAll<HTMLElement>(ITEM_SELECTOR);
    if (!items?.length) return;
    (focusTarget.current === "last" ? items[items.length - 1] : items[0]).focus();
  }, [open, focusTarget]);

  if (!open) return null;

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const items = Array.from(e.currentTarget.querySelectorAll<HTMLElement>(ITEM_SELECTOR));
    const index = items.indexOf(document.activeElement as HTMLElement);
    let next = -1;
    if (e.key === "ArrowDown") next = (index + 1) % items.length;
    else if (e.key === "ArrowUp") next = index <= 0 ? items.length - 1 : index - 1;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = items.length - 1;
    else if (e.key === "Escape") {
      e.preventDefault();
      ctx.close(true);
      return;
    } else if (e.key === "Tab") {
      ctx.close(false);
      return;
    }
    if (next === -1 || !items.length) return;
    e.preventDefault();
    items[next].focus();
  }

  return (
    <div
      ref={ref}
      role="menu"
      id={ctx.contentId}
      aria-labelledby={ctx.triggerId}
      onKeyDown={onKeyDown}
      style={width ? { width } : undefined}
      className={clsx(styles.content, styles[align], className)}
    >
      {children}
    </div>
  );
}

type MenuItemBase = {
  icon?: ReactNode;
  /** Tweede regel onder het label. */
  description?: ReactNode;
  /** Rechts in het item, bv. een tijd of <Kbd>. */
  trailing?: ReactNode;
  /** Rode tekst voor destructieve acties (uitloggen, verwijderen). */
  danger?: boolean;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
};

export type MenuItemProps = MenuItemBase &
  (
    | { href: string; onSelect?: () => void; closeOnSelect?: never }
    | {
        href?: undefined;
        onSelect?: () => void;
        /** Standaard sluit het menu na een keuze. */
        closeOnSelect?: boolean;
      }
  );

export function MenuItem({
  icon,
  description,
  trailing,
  danger,
  disabled,
  className,
  children,
  href,
  onSelect,
  closeOnSelect = true,
}: MenuItemProps) {
  const ctx = useFloatingContext();
  const classes = clsx(styles.item, danger && styles.danger, disabled && styles.disabled, className);
  const content = (
    <>
      {icon && (
        <span className={styles.itemIcon} aria-hidden>
          {icon}
        </span>
      )}
      <span className={styles.itemText}>
        <span className={styles.itemLabel}>{children}</span>
        {description && <span className={styles.itemDescription}>{description}</span>}
      </span>
      {trailing && <span className={styles.trailing}>{trailing}</span>}
    </>
  );

  // Muis en toetsenbord delen dezelfde markering.
  const focusOnHover = (e: React.PointerEvent<HTMLElement>) => {
    if (!disabled && document.activeElement !== e.currentTarget) e.currentTarget.focus();
  };

  if (href && !disabled) {
    return (
      <Link
        href={href}
        role="menuitem"
        tabIndex={-1}
        className={classes}
        onPointerMove={focusOnHover}
        onClick={() => {
          onSelect?.();
          ctx.close(false);
        }}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      role="menuitem"
      tabIndex={-1}
      aria-disabled={disabled || undefined}
      className={classes}
      onPointerMove={focusOnHover}
      onClick={() => {
        if (disabled) return;
        onSelect?.();
        if (closeOnSelect) ctx.close(true);
      }}
    >
      {content}
    </button>
  );
}

export function MenuSeparator() {
  return <div role="separator" className={styles.separator} />;
}

// Kopje boven een groep items.
export function MenuLabel({ children }: { children: ReactNode }) {
  return (
    <div role="presentation" className={styles.label}>
      {children}
    </div>
  );
}

// Popover: vrije inhoud (bv. meldingenpaneel), niet-modaal.

export type PopoverProps = RootProps;

export function Popover(props: PopoverProps) {
  return <FloatingRoot {...props} />;
}

export function PopoverTrigger(props: TriggerProps) {
  return <FloatingTrigger {...props} kind="dialog" />;
}

export type PopoverContentProps = ContentProps & {
  /** Toegankelijke naam, bv. "Meldingen". */
  label: string;
};

export function PopoverContent({ align = "end", width, label, className, children }: PopoverContentProps) {
  const ctx = useFloatingContext();
  const ref = useRef<HTMLDivElement>(null);
  const { open } = ctx;

  // Focus naar het eerste focusbare element, anders naar het paneel zelf.
  useEffect(() => {
    if (!open || !ref.current) return;
    (ref.current.querySelector<HTMLElement>(FOCUSABLE) ?? ref.current).focus();
  }, [open]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label={label}
      id={ctx.contentId}
      tabIndex={-1}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          ctx.close(true);
        }
      }}
      onBlur={(e) => {
        // Focus die het paneel verlaat (Tab) sluit het.
        const next = e.relatedTarget as Node | null;
        if (next && !ctx.rootRef.current?.contains(next)) ctx.close(false);
      }}
      style={width ? { width } : undefined}
      className={clsx(styles.content, styles.popover, styles[align], className)}
    >
      {children}
    </div>
  );
}

// Om het menu of paneel van binnenuit te sluiten, bv. na "Alles als gelezen markeren".
export function usePopover() {
  const { open, close, setOpen } = useFloatingContext();
  return { open, close: () => close(true), setOpen };
}
