"use client";

import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from "react";
import clsx from "clsx";
import { CircleAlert, Search } from "lucide-react";
import {
  Alert,
  Button,
  Checkbox,
  Dialog,
  Field,
  RadioCard,
  RadioGroup,
  SegmentedControl,
  Switch,
  Textarea,
  TextInput,
  useToast,
} from "@/components/kit";
import { errorMessage, unwrap } from "@/lib/action-result";
import type { AdminPath, Assignment, PathSlug, TeamName } from "@/lib/data/admin-team";
import { summarizeAssignment } from "@/components/admin/shell/assignments";
import { addDays, formatLongDate, plural } from "@/components/admin/shell/format";
import { createAssignmentAction } from "@/server/actions/admin-team";
import styles from "./new-assignment-dialog.module.scss";

export type MemberOption = {
  id: string;
  name: string;
  initials: string;
  team: TeamName;
  role: string;
  progress: Partial<Record<PathSlug, number>>;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: MemberOption[];
  paths: AdminPath[];
  teams: TeamName[];
  today: string;
  /** Vooraf gekozen collega's, bv. vanuit de selectie in de teamtabel. */
  initialMemberIds?: string[];
  onCreated?: (assignment: Assignment) => void;
};

type Errors = Partial<Record<"path" | "target" | "deadline" | "message", string>>;

const MESSAGE_MAX = 400;
const QUICK_DEADLINES = [4, 8, 12];

export function NewAssignmentDialog({ open, onOpenChange, ...props }: Props) {
  const formId = useId().replace(/:/g, "");
  const [busy, setBusy] = useState(false);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !busy && onOpenChange(next)}
      title="Nieuwe toewijzing"
      description="Zet een leerpad klaar voor een team of voor losse collega's. Zij krijgen een e-mail en zien het bovenaan hun dashboard."
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={busy}>
            Annuleren
          </Button>
          <Button type="submit" form={`assign${formId}`} loading={busy}>
            Toewijzing maken
          </Button>
        </>
      }
    >
      <AssignmentForm
        {...props}
        formId={`assign${formId}`}
        busy={busy}
        setBusy={setBusy}
        onDone={() => onOpenChange(false)}
      />
    </Dialog>
  );
}

// Los component: wordt bij elke keer openen opnieuw gemount, dus het formulier begint altijd leeg.
function AssignmentForm({
  members,
  paths,
  teams,
  today,
  initialMemberIds,
  onCreated,
  formId,
  busy,
  setBusy,
  onDone,
}: Omit<Props, "open" | "onOpenChange"> & {
  formId: string;
  busy: boolean;
  setBusy: (busy: boolean) => void;
  onDone: () => void;
}) {
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const preselected = initialMemberIds && initialMemberIds.length > 0;

  const [pathSlug, setPathSlug] = useState<PathSlug | "">("");
  const [mode, setMode] = useState<"team" | "people">(preselected ? "people" : "team");
  const [selectedTeams, setSelectedTeams] = useState<Set<TeamName>>(new Set());
  const [people, setPeople] = useState<Set<string>>(new Set(initialMemberIds));
  const [query, setQuery] = useState("");
  const [deadline, setDeadline] = useState("");
  const [message, setMessage] = useState("");
  const [required, setRequired] = useState(true);
  const [errors, setErrors] = useState<Errors>({});
  const [attempt, setAttempt] = useState(0);

  const path = paths.find((p) => p.slug === pathSlug);
  const teamCounts = useMemo(
    () => Object.fromEntries(teams.map((t) => [t, members.filter((m) => m.team === t).length])) as Record<TeamName, number>,
    [members, teams],
  );

  const targetIds = useMemo(
    () => (mode === "team" ? members.filter((m) => selectedTeams.has(m.team)).map((m) => m.id) : [...people]),
    [mode, members, selectedTeams, people],
  );
  const alreadyDone = path ? members.filter((m) => targetIds.includes(m.id) && (m.progress[path.slug] ?? 0) >= 100) : [];

  const visiblePeople = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? members.filter((m) => `${m.name} ${m.team} ${m.role}`.toLowerCase().includes(q)) : members;
  }, [members, query]);

  // Na een mislukte poging de focus naar het eerste foute veld.
  useEffect(() => {
    if (attempt === 0) return;
    formRef.current?.querySelector<HTMLElement>('[data-invalid="true"] input, [aria-invalid="true"]')?.focus();
  }, [attempt]);

  function validate(): Errors {
    const next: Errors = {};
    if (!path) next.path = "Kies een leerpad.";
    if (targetIds.length === 0) next.target = mode === "team" ? "Kies minstens één team." : "Kies minstens één collega.";
    if (!deadline) next.deadline = "Kies een deadline.";
    else if (deadline <= today) next.deadline = "Kies een datum na vandaag.";
    else if (deadline > addDays(today, 730)) next.deadline = "Kies een datum binnen twee jaar.";
    if (message.length > MESSAGE_MAX) next.message = `Houd het bericht korter dan ${MESSAGE_MAX} tekens.`;
    return next;
  }

  // Fouten verdwijnen zodra het veld klopt, maar verschijnen pas na de eerste poging.
  function revalidate<K extends keyof Errors>(key: K) {
    if (attempt === 0) return;
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    const found = validate();
    setErrors(found);
    setAttempt((n) => n + 1);
    if (Object.keys(found).length > 0 || !path) return;

    setBusy(true);
    let id: string;
    try {
      ({ id } = unwrap(
        await createAssignmentAction({
          pathSlug: path.slug,
          teams: mode === "team" ? teams.filter((t) => selectedTeams.has(t)) : [],
          memberIds: mode === "team" ? [] : targetIds,
          deadline,
          required,
          message: message.trim() || undefined,
        }),
      ));
    } catch (error) {
      setBusy(false);
      toast({ variant: "error", title: "Toewijzing niet opgeslagen", description: errorMessage(error, "Probeer het opnieuw.") });
      return;
    }
    const assigned = members.filter((m) => targetIds.includes(m.id));
    const assignment = summarizeAssignment(
      {
        id,
        pathSlug: path.slug,
        target: mode === "team" ? { kind: "team", teams: teams.filter((t) => selectedTeams.has(t)) } : { kind: "people" },
        memberIds: targetIds,
        createdAt: today,
        deadline,
        required,
        message: message.trim() || undefined,
      },
      assigned,
      (id) => members.find((m) => m.id === id)?.progress[path.slug] ?? 0,
      path.title,
      today,
    );
    setBusy(false);
    onCreated?.(assignment);
    toast({
      variant: "success",
      title: "Toewijzing gemaakt",
      description: `${path.title} staat klaar voor ${assignment.targetLabel.replace(/^Team/, "team")}, met deadline ${formatLongDate(deadline)}.`,
    });
    onDone();
  }

  const targetErrorId = `${formId}-target-error`;

  return (
    <form id={formId} ref={formRef} noValidate onSubmit={submit} className={styles.form} aria-busy={busy}>
      <div data-invalid={errors.path ? "true" : undefined}>
        <RadioGroup
          label="Leerpad"
          value={pathSlug}
          onValueChange={(v) => {
            setPathSlug(v as PathSlug);
            revalidate("path");
          }}
          error={errors.path}
          required
          columns={3}
        >
          {paths.map((p) => (
            <RadioCard
              key={p.slug}
              value={p.slug}
              eyebrow={`${p.chapters} hoofdstukken · ${p.hours} uur`}
              title={p.title}
              description={p.shortDescription}
            />
          ))}
        </RadioGroup>
      </div>

      <fieldset
        className={styles.fieldset}
        aria-describedby={errors.target ? targetErrorId : undefined}
        data-invalid={errors.target ? "true" : undefined}
      >
        <legend className={styles.legend}>Voor wie?</legend>
        <div className={styles.modeRow}>
          <SegmentedControl
            label="Kies op team of op persoon"
            size="sm"
            value={mode}
            onValueChange={(v) => {
              setMode(v);
              revalidate("target");
            }}
            options={[
              { value: "team", label: "Teams" },
              { value: "people", label: "Personen" },
            ]}
          />
        </div>

        {mode === "team" ? (
          <div className={styles.teams}>
            {teams.map((team) => (
              <Checkbox
                key={team}
                label={`Team ${team}`}
                description={plural(teamCounts[team], "collega", "collega's")}
                checked={selectedTeams.has(team)}
                invalid={Boolean(errors.target)}
                onChange={(e) => {
                  const next = new Set(selectedTeams);
                  if (e.target.checked) next.add(team);
                  else next.delete(team);
                  setSelectedTeams(next);
                  revalidate("target");
                }}
                className={styles.teamOption}
              />
            ))}
          </div>
        ) : (
          <div className={styles.people}>
            <div className={styles.peopleHead}>
              <TextInput
                type="search"
                aria-label="Zoek collega"
                placeholder="Zoek op naam, team of rol"
                icon={<Search />}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className={styles.peopleSearch}
              />
              <p className={styles.peopleCount} aria-live="polite">
                {plural(people.size, "collega", "collega's")} gekozen
              </p>
            </div>
            <ul className={styles.peopleList} aria-label="Collega's">
              {visiblePeople.map((m) => (
                <li key={m.id}>
                  <Checkbox
                    label={m.name}
                    description={`${m.team} · ${m.role}`}
                    checked={people.has(m.id)}
                    invalid={Boolean(errors.target)}
                    onChange={(e) => {
                      const next = new Set(people);
                      if (e.target.checked) next.add(m.id);
                      else next.delete(m.id);
                      setPeople(next);
                      revalidate("target");
                    }}
                    className={styles.person}
                  />
                </li>
              ))}
              {visiblePeople.length === 0 && <li className={styles.noResults}>Geen collega&apos;s gevonden voor “{query}”.</li>}
            </ul>
          </div>
        )}

        {errors.target && (
          <p id={targetErrorId} className={styles.error}>
            <CircleAlert aria-hidden />
            <span>{errors.target}</span>
          </p>
        )}
      </fieldset>

      {path && alreadyDone.length > 0 && (
        <Alert variant="info" live>
          {alreadyDone.length === 1 ? alreadyDone[0].name : plural(alreadyDone.length, "collega", "collega's")} rondde{" "}
          {path.title} al af. {alreadyDone.length === 1 ? "Die krijgt" : "Zij krijgen"} geen nieuwe taak, wel het bericht.
        </Alert>
      )}

      <div className={styles.row}>
        <Field
          label="Deadline"
          required
          error={errors.deadline}
          description={
            path
              ? `${path.title} kost ongeveer ${path.hours} uur: met een uur per week is dat zo'n ${path.hours} weken.`
              : "Tot wanneer heeft iedereen de tijd?"
          }
        >
          <TextInput
            type="date"
            name="deadline"
            min={addDays(today, 1)}
            value={deadline}
            onChange={(e) => {
              setDeadline(e.target.value);
              revalidate("deadline");
            }}
          />
        </Field>
        <div className={styles.quick} role="group" aria-label="Snel een deadline kiezen">
          {QUICK_DEADLINES.map((weeks) => {
            const value = addDays(today, weeks * 7);
            return (
              <button
                key={weeks}
                type="button"
                aria-pressed={deadline === value}
                className={clsx(styles.chip, deadline === value && styles.chipActive)}
                onClick={() => {
                  setDeadline(value);
                  revalidate("deadline");
                }}
              >
                Over {weeks} weken
              </button>
            );
          })}
        </div>
      </div>

      <Field
        label="Bericht"
        optional
        error={errors.message}
        description="Vertel waarom dit leerpad nu belangrijk is. Komt mee in de e-mail."
        action={
          <span className={clsx(styles.counter, message.length > MESSAGE_MAX && styles.counterOver)}>
            {message.length}/{MESSAGE_MAX}
          </span>
        }
      >
        <Textarea
          rows={3}
          autoResize
          maxRows={8}
          value={message}
          placeholder="Bijvoorbeeld: we willen in Q1 met AI in klantprojecten aan de slag. Rond AI 101 af voor de kick-off."
          onChange={(e) => {
            setMessage(e.target.value);
            revalidate("message");
          }}
        />
      </Field>

      <Switch
        label="Verplicht"
        description="Collega's krijgen wekelijks een herinnering tot ze klaar zijn, en het pad telt mee in je rapportages."
        checked={required}
        onCheckedChange={setRequired}
        className={styles.switch}
      />
    </form>
  );
}
