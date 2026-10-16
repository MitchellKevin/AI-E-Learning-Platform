"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button, useToast } from "@/components/kit";
import { errorMessage, unwrap } from "@/lib/action-result";
import { SettingsCard, SettingsGroup } from "./settings-form";
import { exportMyDataAction } from "@/server/actions/account";
import styles from "./data-export.module.scss";


const contents = [
  "Je accountgegevens en instellingen",
  "Voortgang per leerpad en hoofdstuk",
  "Punten, badges en certificaten",
  "Je activiteit van de afgelopen twaalf maanden",
];

// Gegevens downloaden (AVG, recht op inzage).
export function DataExport() {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  // De server stelt de export samen uit de database; de browser maakt er een bestand van.
  async function download() {
    setBusy(true);
    try {
      const { data, fileName } = unwrap(await exportMyDataAction());
      const blob = new Blob([JSON.stringify(data, null, 2)], {
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
    } catch (error) {
      toast({
        variant: "error",
        title: "Downloaden is niet gelukt",
        description: errorMessage(error, "Probeer het opnieuw of neem contact op met support."),
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
