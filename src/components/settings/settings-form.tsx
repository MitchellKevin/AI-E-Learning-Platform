"use client";

import { useId, useState, type FormEvent, type ReactNode } from "react";
import clsx from "clsx";
import { Check } from "lucide-react";
import { Button, useToast } from "@/components/kit";
import { errorMessage } from "@/lib/action-result";
import styles from "./settings-form.module.scss";

type SettingsFormProps = {
  title: string;
  description?: ReactNode;
  dirty: boolean;
  saving: boolean;
  onSave: () => Promise<void>;
  onReset: () => void;
  /** Geeft false terug als er nog fouten zijn; het formulier wordt dan niet opgeslagen. */
  validate?: () => boolean;
  /** Tekst in de toast na opslaan. */
  savedMessage?: { title: string; description?: string };
  children: ReactNode;
};

// Kaart met één instellingenformulier, een vaste opslaan-balk en een indicatie van niet-opgeslagen wijzigingen.
export function SettingsForm({
  title,
  description,
  dirty,
  saving,
  onSave,
  onReset,
  validate,
  savedMessage = { title: "Instellingen opgeslagen" },
  children,
}: SettingsFormProps) {
  const id = useId();
  const titleId = `${id}-title`;
  const { toast } = useToast();
  const [justSaved, setJustSaved] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!dirty || saving) return;
    if (validate && !validate()) return;
    try {
      await onSave();
    } catch (error) {
      toast({ variant: "error", title: "Opslaan lukte niet", description: errorMessage(error, "Controleer je invoer en probeer het opnieuw.") });
      return;
    }
    setJustSaved(true);
    toast({ variant: "success", ...savedMessage });
  }

  function reset() {
    onReset();
    setJustSaved(false);
  }

  return (
    <form className={styles.card} onSubmit={submit} aria-labelledby={titleId} noValidate>
      <header className={styles.head}>
        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>
        {description && <p className={styles.description}>{description}</p>}
      </header>

      <div className={styles.body}>{children}</div>

      <footer className={clsx(styles.footer, dirty && styles.footerDirty)}>
        <p className={styles.status} aria-live="polite">
          {dirty ? (
            <>
              <span className={styles.dot} aria-hidden />
              Niet-opgeslagen wijzigingen
            </>
          ) : justSaved ? (
            <span className={styles.saved}>
              <Check aria-hidden />
              Opgeslagen
            </span>
          ) : (
            <span className={styles.idle}>Geen wijzigingen</span>
          )}
        </p>
        <div className={styles.buttons}>
          {dirty && (
            <Button variant="ghost" onClick={reset} disabled={saving} className={styles.resetButton}>
              Herstellen
            </Button>
          )}
          <Button type="submit" loading={saving} disabled={!dirty}>
            Opslaan
          </Button>
        </div>
      </footer>
    </form>
  );
}

type GroupProps = {
  title?: string;
  description?: ReactNode;
  /** Titel en uitleg links, het veld rechts (op desktop). */
  inline?: boolean;
  className?: string;
  children: ReactNode;
};

// Eén blok binnen een instellingenkaart, gescheiden door een lijn.
export function SettingsGroup({ title, description, inline, className, children }: GroupProps) {
  return (
    <div className={clsx(styles.group, inline && styles.inline, className)}>
      {(title || description) && (
        <div className={styles.groupText}>
          {title && <h3 className={styles.groupTitle}>{title}</h3>}
          {description && <p className={styles.groupDescription}>{description}</p>}
        </div>
      )}
      <div className={styles.groupBody}>{children}</div>
    </div>
  );
}

type CardProps = {
  title: string;
  description?: ReactNode;
  tone?: "default" | "danger";
  className?: string;
  children: ReactNode;
};

// Instellingenkaart zonder formulier, bv. voor gegevens downloaden of je account verwijderen.
export function SettingsCard({ title, description, tone = "default", className, children }: CardProps) {
  const id = useId();
  return (
    <section className={clsx(styles.card, tone === "danger" && styles.danger, className)} aria-labelledby={`${id}-title`}>
      <header className={styles.head}>
        <h2 id={`${id}-title`} className={styles.title}>
          {title}
        </h2>
        {description && <p className={styles.description}>{description}</p>}
      </header>
      <div className={styles.body}>{children}</div>
    </section>
  );
}
