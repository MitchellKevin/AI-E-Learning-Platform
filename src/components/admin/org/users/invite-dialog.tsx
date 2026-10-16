"use client";

import { useMemo, useRef, useState, type ClipboardEvent, type KeyboardEvent } from "react";
import Link from "next/link";
import clsx from "clsx";
import { CircleAlert, X } from "lucide-react";
import { Alert, Button, Dialog, Field, Select, Textarea, useFieldProps } from "@/components/kit";
import { INVITE_VALID_DAYS, ROLE_DESCRIPTIONS, ROLE_LABELS, isValidEmail, type OrgRole } from "@/lib/data/admin-org-shared";
import { plural } from "../utils";
import styles from "./invite-dialog.module.scss";

export type NewInvite = { email: string; role: OrgRole; team: string; message: string };

type ChipState = "valid" | "invalid" | "member" | "invited";
type Chip = { email: string; state: ChipState };

const REASONS: Record<Exclude<ChipState, "valid">, string> = {
  invalid: "ongeldig adres",
  member: "is al lid",
  invited: "is al uitgenodigd",
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teams: string[];
  /** Bestaande adressen (kleine letters) met hun status, om dubbele uitnodigingen te voorkomen. */
  existing: Map<string, "member" | "invited">;
  freeSeats: number;
  onInvite: (invites: NewInvite[]) => Promise<void>;
};

const MESSAGE_MAX = 400;

// Losse adressen uit getypte tekst of een geplakte lijst. Bij "Naam <adres>" (Outlook) alleen de adressen.
const tokenize = (text: string) =>
  text.includes("<") ? (text.match(/[^\s<>,;"']+@[^\s<>,;"']+/g) ?? []) : text.split(/[\s,;]+/).filter(Boolean);

export function InviteDialog({ open, onOpenChange, teams, existing, freeSeats, onInvite }: Props) {
  const [chips, setChips] = useState<Chip[]>([]);
  const [draft, setDraft] = useState("");
  const [role, setRole] = useState<OrgRole>("cursist");
  const [team, setTeam] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<{ emails?: string; team?: string }>({});
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const teamRef = useRef<HTMLSelectElement>(null);

  // Bij openen opnieuw beginnen (de inhoud van Dialog mount opnieuw, de state hier niet).
  const [lastOpen, setLastOpen] = useState(open);
  if (open !== lastOpen) {
    setLastOpen(open);
    if (open) {
      setChips([]);
      setDraft("");
      setRole("cursist");
      setTeam("");
      setMessage("");
      setErrors({});
    }
  }

  const valid = chips.filter((c) => c.state === "valid");
  const problems = chips.length - valid.length;
  const overSeats = valid.length > freeSeats;

  function classify(email: string): ChipState {
    if (!isValidEmail(email)) return "invalid";
    return existing.get(email.toLowerCase()) ?? "valid";
  }

  // Voegt getypte of geplakte adressen toe; dubbele worden overgeslagen.
  function merge(current: Chip[], text: string) {
    const seen = new Set(current.map((c) => c.email.toLowerCase()));
    const next = [...current];
    for (const email of tokenize(text)) {
      if (seen.has(email.toLowerCase())) continue;
      seen.add(email.toLowerCase());
      next.push({ email, state: classify(email) });
    }
    return next;
  }

  function commit(text: string) {
    if (!tokenize(text).length) return;
    setChips((current) => merge(current, text));
    setErrors((e) => ({ ...e, emails: undefined }));
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (["Enter", ",", ";", " ", "Tab"].includes(e.key) && draft.trim()) {
      // Tab mag gewoon verder naar het volgende veld, na het omzetten.
      if (e.key !== "Tab") e.preventDefault();
      commit(draft);
      setDraft("");
    } else if (e.key === "Enter") {
      e.preventDefault();
    } else if (e.key === "Backspace" && !draft && chips.length) {
      setChips((c) => c.slice(0, -1));
    }
  }

  function onPaste(e: ClipboardEvent<HTMLTextAreaElement>) {
    const text = e.clipboardData.getData("text");
    if (!/[\s,;]/.test(text)) return;
    e.preventDefault();
    commit(draft + text);
    setDraft("");
  }

  function remove(email: string) {
    setChips((c) => c.filter((chip) => chip.email !== email));
    setErrors((e) => ({ ...e, emails: undefined }));
    inputRef.current?.focus();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    // Wat nog in het veld staat telt ook mee.
    const all = merge(chips, draft);
    if (draft.trim()) {
      setChips(all);
      setDraft("");
    }

    const next: typeof errors = {};
    const ok = all.filter((c) => c.state === "valid");
    if (!all.length) next.emails = "Vul minimaal één e-mailadres in.";
    else if (ok.length !== all.length) next.emails = "Verwijder of verbeter de gemarkeerde adressen.";
    else if (ok.length > freeSeats) next.emails = `Je hebt nog ${plural(freeSeats, "licentie", "licenties")} vrij.`;
    if (!team) next.team = "Kies een team.";
    setErrors(next);
    if (next.emails) return inputRef.current?.focus();
    if (next.team) return teamRef.current?.focus();

    setBusy(true);
    try {
      await onInvite(ok.map((c) => ({ email: c.email, role, team, message: message.trim() })));
    } catch {
      // De melding komt van de ouder; het venster blijft open zodat je het opnieuw kunt proberen.
      setBusy(false);
      return;
    }
    setBusy(false);
    onOpenChange(false);
  }

  const summary = useMemo(() => {
    if (!chips.length) return "";
    const parts = [plural(valid.length, "geldig adres", "geldige adressen")];
    if (problems) parts.push(`${problems} met een probleem`);
    return parts.join(", ");
  }, [chips.length, valid.length, problems]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !busy && onOpenChange(next)}
      title="Gebruikers uitnodigen"
      description={`Collega's krijgen een e-mail met een persoonlijke link. Die is ${INVITE_VALID_DAYS} dagen geldig.`}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={busy}>
            Annuleren
          </Button>
          <Button type="submit" form="invite-form" loading={busy}>
            {valid.length > 1 ? `${valid.length} uitnodigingen versturen` : "Uitnodiging versturen"}
          </Button>
        </>
      }
    >
      <form id="invite-form" className={styles.form} onSubmit={submit} noValidate>
        <Field
          label="E-mailadressen"
          required
          description="Typ of plak adressen, gescheiden door een komma, spatie of nieuwe regel."
          error={errors.emails}
        >
          <ChipInput
            chips={chips}
            draft={draft}
            onDraftChange={setDraft}
            onKeyDown={onKeyDown}
            onPaste={onPaste}
            onBlur={() => {
              commit(draft);
              setDraft("");
            }}
            onRemove={remove}
            inputRef={inputRef}
          />
        </Field>

        <p className="sr-only" aria-live="polite">
          {summary}
        </p>
        {chips.length > 0 && (
          <div className={styles.summaryRow}>
            {/* Visueel; screenreaders horen de live-regel hierboven. */}
            <p className={styles.summary} aria-hidden>
              {summary}
            </p>
            {problems > 0 && (
              <button
                type="button"
                className={styles.textButton}
                onClick={() => {
                  setChips((c) => c.filter((chip) => chip.state === "valid"));
                  setErrors((e) => ({ ...e, emails: undefined }));
                }}
              >
                Gemarkeerde verwijderen
              </button>
            )}
          </div>
        )}

        {overSeats && (
          <Alert variant="warning" title="Niet genoeg licenties vrij">
            Je nodigt {valid.length} collega&apos;s uit, maar er {freeSeats === 1 ? "is" : "zijn"} nog{" "}
            {plural(freeSeats, "licentie", "licenties")} vrij. <Link href="/beheer/abonnement">Licenties bijkopen</Link>
          </Alert>
        )}

        <div className={styles.row}>
          <Field label="Rol" description={ROLE_DESCRIPTIONS[role]}>
            <Select name="role" value={role} onChange={(e) => setRole(e.target.value as OrgRole)}>
              {(Object.keys(ROLE_LABELS) as OrgRole[]).map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Team" required error={errors.team}>
            <Select
              ref={teamRef}
              name="team"
              placeholder="Kies een team"
              value={team}
              onChange={(e) => {
                setTeam(e.target.value);
                setErrors((er) => ({ ...er, team: undefined }));
              }}
            >
              {teams.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field
          label="Persoonlijk bericht"
          optional
          description="Komt boven de uitnodiging te staan."
          action={
            <span className={styles.counter} aria-hidden>
              {message.length}/{MESSAGE_MAX}
            </span>
          }
        >
          <Textarea
            name="message"
            rows={3}
            autoResize
            maxRows={8}
            maxLength={MESSAGE_MAX}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Hoi! We gaan als team aan de slag met AI. Begin met AI 101, dat kost je zo'n twintig minuten per hoofdstuk."
          />
        </Field>
      </form>
    </Dialog>
  );
}

type ChipInputProps = {
  chips: Chip[];
  draft: string;
  onDraftChange: (value: string) => void;
  onKeyDown: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
  onPaste: (e: ClipboardEvent<HTMLTextAreaElement>) => void;
  onBlur: () => void;
  onRemove: (email: string) => void;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
};

// Adressen als losse chips, met een tekstveld erachter. Label en foutmelding komen van de Field.
function ChipInput({ chips, draft, onDraftChange, onKeyDown, onPaste, onBlur, onRemove, inputRef }: ChipInputProps) {
  const field = useFieldProps({});

  return (
    // Klik ergens in het vak zet de cursor in het tekstveld.
    <div
      className={clsx(styles.box, field.invalid && styles.invalid)}
      onClick={(e) => {
        if (e.target === e.currentTarget) inputRef.current?.focus();
      }}
    >
      {chips.length > 0 && (
        <ul className={styles.chips} aria-label="Toegevoegde adressen">
          {chips.map((chip) => (
            <li key={chip.email} className={clsx(styles.chip, chip.state !== "valid" && styles.chipError)}>
              {chip.state !== "valid" && <CircleAlert aria-hidden className={styles.chipIcon} />}
              <span className={styles.chipText} title={chip.state !== "valid" ? REASONS[chip.state] : undefined}>
                {chip.email}
                {chip.state !== "valid" && <span className={styles.reason}> · {REASONS[chip.state]}</span>}
              </span>
              <button
                type="button"
                className={styles.chipRemove}
                onClick={() => onRemove(chip.email)}
                aria-label={`${chip.email} verwijderen`}
              >
                <X aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
      <textarea
        ref={inputRef}
        id={field.id}
        aria-describedby={field["aria-describedby"]}
        aria-invalid={field["aria-invalid"]}
        aria-required
        rows={1}
        value={draft}
        onChange={(e) => onDraftChange(e.target.value)}
        onKeyDown={onKeyDown}
        onPaste={onPaste}
        onBlur={onBlur}
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
        placeholder={chips.length ? "Nog een adres…" : "naam@studionoord.nl, collega@studionoord.nl"}
        className={styles.input}
      />
    </div>
  );
}
