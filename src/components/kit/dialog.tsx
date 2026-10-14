"use client";

import { useEffect, useId, useRef, useState, type ReactNode, type RefObject } from "react";
import clsx from "clsx";
import { X } from "lucide-react";
import { Button, type ButtonVariant } from "./button";
import styles from "./dialog.module.scss";

type ModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  /** Knoppen onderaan, rechts uitgelijnd (op mobiel onder elkaar). */
  footer?: ReactNode;
  /** Titel alleen voor screenreaders. */
  hideTitle?: boolean;
  /** Sluiten via Esc, de sluitknop en klikken op de achtergrond. Standaard aan. */
  dismissible?: boolean;
  /** Krijgt focus bij openen; anders het eerste focusbare element. */
  initialFocusRef?: RefObject<HTMLElement | null>;
  role?: "dialog" | "alertdialog";
  className?: string;
  /** Class op het scrollende middendeel. */
  bodyClassName?: string;
};

export type DialogProps = ModalProps & { size?: "sm" | "md" | "lg" };
export type DrawerProps = ModalProps & { size?: "md" | "lg" };

// Gedeelde logica: native <dialog> met showModal geeft focus-trap, Esc en top-layer cadeau.
function useModal({ open, onOpenChange, dismissible = true, initialFocusRef }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const [rendered, setRendered] = useState(open);
  const [closing, setClosing] = useState(false);
  const pointerDownOnBackdrop = useRef(false);

  // Inhoud staat al in de DOM vóór showModal, zodat de focus meteen goed landt.
  if (open && !rendered) setRendered(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open) {
      setClosing(false);
      if (!el.open) el.showModal();
      initialFocusRef?.current?.focus();
    } else if (el.open) {
      setClosing(true);
      // Vangnet als animationend niet komt.
      const timeout = window.setTimeout(finishClose, 400);
      return () => window.clearTimeout(timeout);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function finishClose() {
    const el = ref.current;
    if (el?.open) el.close();
    setClosing(false);
    setRendered(false);
  }

  const dialogProps = {
    ref,
    "data-closing": closing || undefined,
    onCancel: (e: React.SyntheticEvent) => {
      // Esc: zelf afhandelen zodat de open-state leidend blijft.
      e.preventDefault();
      if (dismissible) onOpenChange(false);
    },
    // Toch dicht via de browser (bv. tweede Esc): state bijwerken.
    onClose: () => {
      if (open) onOpenChange(false);
      setClosing(false);
      setRendered(false);
    },
    onPointerDown: (e: React.PointerEvent) => {
      pointerDownOnBackdrop.current = e.target === ref.current;
    },
    onClick: (e: React.MouseEvent) => {
      // Alleen een klik die op de achtergrond begon én eindigde sluit.
      if (dismissible && pointerDownOnBackdrop.current && e.target === ref.current) onOpenChange(false);
      pointerDownOnBackdrop.current = false;
    },
    onAnimationEnd: (e: React.AnimationEvent) => {
      if (closing && e.target === ref.current) finishClose();
    },
  };

  return { dialogProps, rendered };
}

function ModalShell({
  kind,
  size,
  props,
}: {
  kind: "dialog" | "drawer";
  size: string;
  props: ModalProps;
}) {
  const { title, description, children, footer, hideTitle, dismissible = true, role = "dialog", className, bodyClassName } =
    props;
  const { dialogProps, rendered } = useModal(props);
  const id = useId().replace(/:/g, "");
  const titleId = `dialog${id}-title`;
  const descriptionId = description ? `dialog${id}-description` : undefined;

  return (
    <dialog
      {...dialogProps}
      role={role === "alertdialog" ? "alertdialog" : undefined}
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      className={clsx(styles.dialog, styles[kind], styles[size], className)}
    >
      {rendered && (
        <div className={styles.panel}>
          <header className={clsx(styles.header, hideTitle && !description && styles.headerHidden)}>
            <h2 id={titleId} className={clsx(styles.title, hideTitle && "visually-hidden")}>
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className={styles.description}>
                {description}
              </p>
            )}
          </header>
          {children && <div className={clsx(styles.body, bodyClassName)}>{children}</div>}
          {footer && <footer className={styles.footer}>{footer}</footer>}
          {/* Als laatste in de DOM, zodat de focus eerst op de inhoud valt. */}
          {dismissible && (
            <button type="button" className={styles.close} onClick={() => props.onOpenChange(false)} aria-label="Sluiten">
              <X aria-hidden />
            </button>
          )}
        </div>
      )}
    </dialog>
  );
}

export function Dialog({ size = "md", ...props }: DialogProps) {
  return <ModalShell kind="dialog" size={size} props={props} />;
}

// Paneel dat van rechts inschuift, bv. voor de AI-tutor.
export function Drawer({ size = "md", ...props }: DrawerProps) {
  return <ModalShell kind="drawer" size={size} props={props} />;
}

export type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** "danger" voor onomkeerbare acties zoals verwijderen. */
  variant?: Extract<ButtonVariant, "primary" | "danger">;
  /** Mag async zijn: de knop toont dan een spinner tot de belofte klaar is; daarna sluit de dialoog. */
  onConfirm: () => void | Promise<void>;
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  confirmLabel = "Bevestigen",
  cancelLabel = "Annuleren",
  variant = "primary",
  onConfirm,
}: ConfirmDialogProps) {
  const [busy, setBusy] = useState(false);

  async function confirm() {
    setBusy(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !busy && onOpenChange(next)}
      title={title}
      description={description}
      size="sm"
      role="alertdialog"
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button variant={variant} onClick={confirm} loading={busy}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children}
    </Dialog>
  );
}
