"use client";

import { useState } from "react";
import { Download, ScrollText } from "lucide-react";
import { Avatar, Badge, Button, EmptyState, Select, TBody, THead, Table, Td, Th, Tr, useToast } from "@/components/kit";
import { AUDIT_LABELS, formatDateTime, type AuditCategory, type AuditEntry } from "@/lib/data/admin-org-shared";
import { Panel } from "../panel";
import { plural } from "../utils";
import styles from "./audit-log.module.scss";

const PAGE_SIZE = 8;

export function AuditLog({ entries }: { entries: AuditEntry[] }) {
  const [category, setCategory] = useState<AuditCategory | "">("");
  const [limit, setLimit] = useState(PAGE_SIZE);
  const { toast } = useToast();

  const filtered = category ? entries.filter((e) => e.category === category) : entries;
  const visible = filtered.slice(0, limit);

  return (
    <Panel
      title="Auditlog"
      description="Alle beheeracties in je organisatie. We bewaren het log 24 maanden."
      actions={
        <>
          <div className={styles.filter}>
            <Select
              aria-label="Filter op onderdeel"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value as AuditCategory | "");
                setLimit(PAGE_SIZE);
              }}
            >
              <option value="">Alle onderdelen</option>
              {(Object.keys(AUDIT_LABELS) as AuditCategory[]).map((c) => (
                <option key={c} value={c}>
                  {AUDIT_LABELS[c]}
                </option>
              ))}
            </Select>
          </div>
          <Button
            variant="secondary"
            icon={<Download />}
            onClick={() =>
              // Straks: CSV-export via de API.
              toast({
                title: "Export wordt voorbereid",
                description: "Je krijgt de CSV binnen een paar minuten per e-mail.",
              })
            }
          >
            CSV
          </Button>
        </>
      }
      flush
    >
      <p className="sr-only" aria-live="polite">
        {plural(filtered.length, "actie", "acties")}
      </p>
      {filtered.length === 0 ? (
        <div className={styles.empty}>
          <EmptyState icon={<ScrollText />} title="Geen acties gevonden" variant="plain">
            In dit onderdeel is nog niets gewijzigd.
          </EmptyState>
        </div>
      ) : (
        <Table label="Auditlog" minWidth={640} bare containerClassName={styles.tableWrap}>
          <THead>
            <Tr>
              <Th>Tijdstip</Th>
              <Th>Door</Th>
              <Th>Actie</Th>
              <Th>Onderdeel</Th>
            </Tr>
          </THead>
          <TBody>
            {visible.map((entry) => (
              <Tr key={entry.id}>
                <Td muted className={styles.time}>
                  <time dateTime={entry.at}>{formatDateTime(entry.at)}</time>
                </Td>
                <Td>
                  <span className={styles.actor}>
                    <Avatar initials={entry.actorInitials} size={24} />
                    {entry.actor}
                  </span>
                </Td>
                <Td>
                  <span className={styles.action}>{entry.action}</span>
                  {entry.target && <span className={styles.target}>{entry.target}</span>}
                </Td>
                <Td>
                  <Badge size="sm" variant={entry.category === "beveiliging" ? "brand" : "neutral"}>
                    {AUDIT_LABELS[entry.category]}
                  </Badge>
                </Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      )}
      {filtered.length > limit && (
        <div className={styles.more}>
          <Button variant="secondary" size="sm" onClick={() => setLimit((l) => l + PAGE_SIZE)}>
            Oudere acties tonen ({filtered.length - limit})
          </Button>
        </div>
      )}
    </Panel>
  );
}
