"use client";

import { useState } from "react";
import { Download, FileCheck2, MapPin } from "lucide-react";
import { Badge, Button, Field, Select, StatusPill, useToast } from "@/components/kit";
import { formatDate } from "@/lib/format";
import { RETENTION_OPTIONS, type PrivacySettings, type RetentionPeriod } from "@/lib/data/admin-org";
import { Panel } from "../panel";
import { wait } from "../utils";
import styles from "./data-privacy.module.scss";

export function DataPrivacy({ initial }: { initial: PrivacySettings }) {
  const [retention, setRetention] = useState(initial.retention);
  const [downloading, setDownloading] = useState(false);
  const { toast } = useToast();
  const { dpa } = initial;

  async function download() {
    setDownloading(true);
    // Straks: getekende PDF uit de documentopslag.
    await wait(700);
    setDownloading(false);
    toast({
      title: "PDF volgt",
      description: `Verwerkersovereenkomst versie ${dpa.version} staat zo in je downloads.`,
    });
  }

  function changeRetention(next: RetentionPeriod) {
    const previous = retention;
    setRetention(next);
    // Straks: server action; de opschoontaak gebruikt de nieuwe termijn vanaf de volgende nacht.
    toast({
      variant: "success",
      title: "Bewaartermijn opgeslagen",
      description: RETENTION_OPTIONS.find((o) => o.value === next)?.label,
      action: { label: "Ongedaan maken", onClick: () => setRetention(previous) },
    });
  }

  return (
    <Panel
      title="Gegevens en privacy"
      description="Waar jullie gegevens staan, welke afspraken we hebben en hoe lang we ze bewaren."
    >
      <dl className={styles.rows}>
        <div className={styles.row}>
          <dt className={styles.term}>
            <MapPin aria-hidden />
            Dataregio
          </dt>
          <dd className={styles.value}>
            <p className={styles.valueTitle}>
              {initial.region}
              <Badge size="sm" variant="success">
                AVG
              </Badge>
            </p>
            <p className={styles.valueText}>{initial.regionDetail}</p>
          </dd>
        </div>

        <div className={styles.row}>
          <dt className={styles.term}>
            <FileCheck2 aria-hidden />
            Verwerkersovereenkomst
          </dt>
          <dd className={styles.value}>
            <p className={styles.valueTitle}>
              Versie {dpa.version}
              {dpa.status === "getekend" ? (
                <StatusPill size="sm" variant="success">
                  Getekend
                </StatusPill>
              ) : (
                <StatusPill size="sm" variant="warning">
                  Nog niet getekend
                </StatusPill>
              )}
            </p>
            {dpa.signedAt && (
              <p className={styles.valueText}>
                Getekend door {dpa.signedBy} op {formatDate(dpa.signedAt)}.
              </p>
            )}
            <Button
              variant="secondary"
              size="sm"
              icon={<Download />}
              loading={downloading}
              onClick={download}
              className={styles.download}
            >
              Downloaden (PDF)
            </Button>
          </dd>
        </div>

        <div className={styles.row}>
          <dt className={styles.term}>Bewaartermijn</dt>
          <dd className={styles.value}>
            <Field
              label="Gegevens van gedeactiveerde gebruikers bewaren"
              description="Daarna verwijderen we voortgang en antwoorden. Certificaten blijven verifieerbaar, zonder persoonsgegevens."
            >
              <Select value={retention} onChange={(e) => changeRetention(e.target.value as RetentionPeriod)}>
                {RETENTION_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </Field>
          </dd>
        </div>
      </dl>
    </Panel>
  );
}
