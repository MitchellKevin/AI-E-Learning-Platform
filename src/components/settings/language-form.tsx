"use client";

import type { LanguageSettings, Locale } from "@/lib/data/profile";
import { Alert, Field, Select } from "@/components/kit";
import { useSettingsForm } from "./settings-context";
import { SettingsForm, SettingsGroup } from "./settings-form";
import styles from "./language-form.module.scss";

export function LanguageForm({ initial }: { initial: LanguageSettings }) {
  const form = useSettingsForm("language", initial);
  const { locale } = form.values;

  return (
    <SettingsForm
      title="Taal"
      description="De taal van menu's, knoppen en e-mails. De lesstof zelf is in het Nederlands."
      dirty={form.dirty}
      saving={form.saving}
      onSave={form.save}
      onReset={form.reset}
      savedMessage={
        locale === "en"
          ? { title: "Voorkeur opgeslagen", description: "We zetten de app om naar het Engels zodra die versie klaar is." }
          : { title: "Taal opgeslagen", description: "AI Academy blijft in het Nederlands." }
      }
    >
      <SettingsGroup>
        <Field label="Taal van de app" className={styles.field}>
          <Select name="locale" value={locale} onChange={(e) => form.set("locale", e.target.value as Locale)}>
            <option value="nl">Nederlands</option>
            <option value="en" lang="en">
              English (binnenkort)
            </option>
          </Select>
        </Field>
        {locale === "en" && (
          <Alert variant="info" title="De Engelse versie volgt" live>
            <span lang="en">We&apos;re translating AI Academy into English.</span> Tot die tijd blijft alles in het
            Nederlands. Je voorkeur bewaren we, zodat de app vanzelf omschakelt zodra de vertaling klaar is.
          </Alert>
        )}
      </SettingsGroup>
    </SettingsForm>
  );
}
