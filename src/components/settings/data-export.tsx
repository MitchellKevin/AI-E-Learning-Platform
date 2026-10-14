"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button, useToast } from "@/components/kit";
import { SettingsCard, SettingsGroup } from "./settings-form";
import styles from "./data-export.module.scss";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type Props = {
  /** Wat er in de export komt; nu uit de mock-data. */
  data: Record<string, unknown>;
  fileName: string;
};

const contents = [
  "Je accountgegevens en instellingen",
  "Voortgang per leerpad en hoofdstuk",
  "Punten, badges en certificaten",
  "Je activiteit van de afgelopen twaalf maanden",
];

// Gegevens downloaden (AVG, recht op inzage).
export function DataExport({ data, fileName }: Props) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  // Later: server action die de volledige export in MongoDB samenstelt; nu bouwen we het bestand in de browser.
  async function download() {
    setBusy(true);
    await wait(1200);
    try {
      const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), ...data }, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast({ variant: "success", title: "Je gegevens zijn gedownload", description: fileName });
    } catch {
      toast({
        variant: "error",
        title: "Downloaden is niet gelukt",
        description: "Probeer het opnieuw of neem contact op met support.",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <SettingsCard
      title="Je gegevens"
      description="Download alles wat AI Academy over je bewaart, in een leesbaar JSON-bestand."
    >
      <SettingsGroup>
        <ul className={styles.list}>
          {contents.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <div className={styles.action}>
          <Button variant="secondary" icon={<Download />} loading={busy} onClick={download}>
            Download mijn gegevens
          </Button>
        </div>
      </SettingsGroup>
    </SettingsCard>
  );
}
