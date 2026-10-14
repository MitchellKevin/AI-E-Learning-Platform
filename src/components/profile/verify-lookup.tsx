"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Button, Field, TextInput } from "@/components/kit";
import styles from "./verify-lookup.module.scss";

// Certificaatnummer opzoeken; de verificatie zelf gebeurt op /verify/[nummer].
export function VerifyLookup({ defaultValue = "", autoFocus }: { defaultValue?: string; autoFocus?: boolean }) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function submit(e: FormEvent) {
    e.preventDefault();
    const number = value.trim().toUpperCase().replace(/\s+/g, "");
    if (!number) {
      setError("Vul een certificaatnummer in.");
      return;
    }
    setError(undefined);
    startTransition(() => router.push(`/verify/${encodeURIComponent(number)}`));
  }

  return (
    <form onSubmit={submit} className={styles.form} noValidate>
      <Field
        label="Certificaatnummer"
        description="Staat rechtsonder op het certificaat, bijvoorbeeld AIA-101-2026-0482."
        error={error}
        className={styles.field}
      >
        <TextInput
          name="nummer"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (error) setError(undefined);
          }}
          placeholder="AIA-101-2026-0000"
          autoComplete="off"
          spellCheck={false}
          autoCapitalize="characters"
          autoFocus={autoFocus}
          icon={<Search />}
          inputClassName={styles.input}
        />
      </Field>
      <Button type="submit" loading={pending} className={styles.button}>
        Controleren
      </Button>
    </form>
  );
}
