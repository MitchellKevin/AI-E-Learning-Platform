"use client";

import { useRef, useState } from "react";
import { Lock, Mail, Users } from "lucide-react";
import type { AccountSettings } from "@/lib/data/profile";
import { Avatar, Field, TextInput } from "@/components/kit";
import { useSettingsForm } from "./settings-context";
import { SettingsForm, SettingsGroup } from "./settings-form";
import styles from "./account-form.module.scss";

type Props = {
  initial: AccountSettings;
  email: string;
  loginProvider: string;
  team: string;
  organisation: string;
};

type Errors = Partial<Record<"firstName" | "lastName", string>>;

const toInitials = (first: string, last: string) => {
  // Bij "van der Berg" telt de eerste hoofdletter, anders de eerste letter.
  const lastInitial = last.trim().match(/\p{Lu}/u)?.[0] ?? last.trim().charAt(0);
  return `${first.trim().charAt(0)}${lastInitial}`.toUpperCase() || "?";
};

export function AccountForm({ initial, email, loginProvider, team, organisation }: Props) {
  const form = useSettingsForm("account", initial);
  const { firstName, lastName, jobTitle } = form.values;
  const [errors, setErrors] = useState<Errors>({});
  const firstRef = useRef<HTMLInputElement>(null);
  const lastRef = useRef<HTMLInputElement>(null);

  const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(" ") || "Je naam";

  function validate() {
    const next: Errors = {};
    if (!firstName.trim()) next.firstName = "Vul je voornaam in.";
    if (!lastName.trim()) next.lastName = "Vul je achternaam in.";
    setErrors(next);
    if (next.firstName) firstRef.current?.focus();
    else if (next.lastName) lastRef.current?.focus();
    return Object.keys(next).length === 0;
  }

  function update(field: keyof AccountSettings, value: string) {
    form.set(field, value);
    if (field in errors) setErrors((current) => ({ ...current, [field]: undefined }));
  }

  return (
    <SettingsForm
      title="Account"
      description="Zo zien collega's je in AI Academy, bijvoorbeeld op het leaderboard en in teamoverzichten."
      dirty={form.dirty}
      saving={form.saving}
      onSave={form.save}
      onReset={() => {
        form.reset();
        setErrors({});
      }}
      validate={validate}
      savedMessage={{ title: "Account bijgewerkt", description: "Je naam en functie zijn aangepast." }}
    >
      <SettingsGroup
        inline
        title="Avatar"
        description="AI Academy toont je initialen. Ze passen zich vanzelf aan als je je naam wijzigt."
      >
        <div className={styles.preview}>
          <span className={styles.avatar} key={toInitials(firstName, lastName)}>
            <Avatar initials={toInitials(firstName, lastName)} size={56} />
          </span>
          <div className={styles.previewText}>
            <p className={styles.previewName}>{fullName}</p>
            <p className={styles.previewMeta}>{[jobTitle.trim(), `Team ${team}`].filter(Boolean).join(" · ")}</p>
          </div>
        </div>
      </SettingsGroup>

      <SettingsGroup inline title="Naam en functie" description="Gebruik de naam waaronder je collega's je kennen.">
        <div className={styles.names}>
          <Field label="Voornaam" required error={errors.firstName}>
            <TextInput
              ref={firstRef}
              name="firstName"
              value={firstName}
              onChange={(e) => update("firstName", e.target.value)}
              autoComplete="given-name"
              maxLength={50}
            />
          </Field>
          <Field label="Achternaam" required error={errors.lastName}>
            <TextInput
              ref={lastRef}
              name="lastName"
              value={lastName}
              onChange={(e) => update("lastName", e.target.value)}
              autoComplete="family-name"
              maxLength={80}
            />
          </Field>
        </div>
        <Field label="Functie" optional description="Staat onder je naam op je profiel.">
          <TextInput
            name="jobTitle"
            value={jobTitle}
            onChange={(e) => update("jobTitle", e.target.value)}
            placeholder="Bijvoorbeeld Product designer"
            autoComplete="organization-title"
            maxLength={60}
          />
        </Field>
      </SettingsGroup>

      <SettingsGroup
        inline
        title="Inloggen en team"
        description={`${organisation} beheert je e-mailadres en je team. Klopt er iets niet? Vraag het je beheerder.`}
      >
        <Field
          label="E-mailadres"
          description={`Je logt in met je ${loginProvider}-account van ${organisation} (single sign-on).`}
        >
          <TextInput
            type="email"
            value={email}
            readOnly
            icon={<Mail />}
            suffix={
              <span className={styles.locked}>
                <Lock aria-hidden />
                {loginProvider}
              </span>
            }
            className={styles.readOnly}
          />
        </Field>
        <Field label="Team" description="Je manager deelt je in bij een team.">
          <TextInput value={team} readOnly icon={<Users />} className={styles.readOnly} />
        </Field>
      </SettingsGroup>
    </SettingsForm>
  );
}
