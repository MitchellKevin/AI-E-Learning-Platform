"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import clsx from "clsx";
import { CircleAlert, CircleCheck, Info, X } from "lucide-react";
import styles from "./toast.module.scss";

export type ToastVariant = "success" | "error" | "info";

export type ToastOptions = {
  title: ReactNode;
  description?: ReactNode;
  variant?: ToastVariant;
  /** In ms; standaard 5000 (fouten 8000). 0 = blijft staan tot hij gesloten wordt. */
  duration?: number;
  /** Eén actie in de toast, bv. "Ongedaan maken". */
  action?: { label: string; onClick: () => void };
};

type ToastItem = ToastOptions & { id: string; leaving: boolean };

type ToastContextValue = {
  toast: (options: ToastOptions) => string;
  dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const MAX_VISIBLE = 4;
const EXIT_MS = 200;

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast werkt alleen binnen <ToastProvider>.");
  return ctx;
}

const icons = { success: CircleCheck, error: CircleAlert, info: Info };

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counter = useRef(0);
  const region = useRef<HTMLElement>(null);

  const dismiss = useCallback((id: string) => {
    setToasts((all) => all.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    window.setTimeout(() => setToasts((all) => all.filter((t) => t.id !== id)), EXIT_MS);
  }, []);

  const toast = useCallback((options: ToastOptions) => {
    const id = `toast-${++counter.current}`;
    const item: ToastItem = { variant: "info", ...options, id, leaving: false };
    setToasts((all) => [...all, item].slice(-MAX_VISIBLE));
    return id;
  }, []);

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  // De regio staat als popover in de top layer, zodat toasts ook boven een open dialoog verschijnen.
  const count = toasts.length;
  useLayoutEffect(() => {
    const el = region.current;
    if (!el || typeof el.showPopover !== "function") return;
    try {
      if (el.matches(":popover-open")) el.hidePopover();
      if (count > 0) el.showPopover();
    } catch {
      // Popover niet ondersteund: de regio staat dan gewoon fixed in beeld.
    }
  }, [count]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <section ref={region} popover="manual" aria-label="Meldingen" className={styles.region}>
        <ol aria-live="polite" aria-relevant="additions text" className={styles.list}>
          {toasts.map((t) => (
            <ToastCard key={t.id} item={t} dismiss={dismiss} />
          ))}
        </ol>
      </section>
    </ToastContext.Provider>
  );
}

function ToastCard({ item, dismiss }: { item: ToastItem; dismiss: (id: string) => void }) {
  const { id } = item;
  const variant = item.variant ?? "info";
  const duration = item.duration ?? (variant === "error" ? 8000 : 5000);
  const [paused, setPaused] = useState(false);
  const Icon = icons[variant];

  // Timer pauzeert bij hover of focus, zodat je de melding rustig kunt lezen.
  useEffect(() => {
    if (!duration || paused || item.leaving) return;
    const timeout = window.setTimeout(() => dismiss(id), duration);
    return () => window.clearTimeout(timeout);
  }, [duration, paused, item.leaving, dismiss, id]);

  return (
    <li
      className={clsx(styles.toast, styles[variant], item.leaving && styles.leaving)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <Icon className={styles.icon} aria-hidden />
      <div className={styles.text}>
        <p className={styles.title}>{item.title}</p>
        {item.description && <p className={styles.description}>{item.description}</p>}
        {item.action && (
          <button
            type="button"
            className={styles.action}
            onClick={() => {
              item.action?.onClick();
              dismiss(id);
            }}
          >
            {item.action.label}
          </button>
        )}
      </div>
      <button type="button" className={styles.close} onClick={() => dismiss(id)} aria-label="Melding sluiten">
        <X aria-hidden />
      </button>
    </li>
  );
}
