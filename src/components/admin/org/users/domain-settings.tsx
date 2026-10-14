"use client";

import { useRef, useState } from "react";
import { AtSign, Copy, Globe, Plus, Trash2 } from "lucide-react";
import { Button, Field, IconButton, Select, StatusPill, Switch, TextInput, useToast } from "@/components/kit";
import {
  PUBLIC_EMAIL_DOMAINS,
  isValidDomain,
  type AutoJoinDomain,
  type DomainSettings as Settings,
} from "@/lib/data/admin-org";
import { Panel } from "../panel";
import { wait } from "../utils";
import styles from "./domain-settings.module.scss";

// "https://www.Studionoord.nl/" of "@studionoord.nl" -> "studionoord.nl"
const normalize = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/^@/, "")
    .replace(/\/.*$/, "");

const txtRecord = (domain: string) => `ai-academy-verificatie=${domain.replace(/\./g, "-")}-7f3k2q`;

export function DomainSettings({ initial, teams }: { initial: Settings; teams: string[] }) {
  const [autoJoin, setAutoJoin] = useState(initial.autoJoin);
  const [team, setTeam] = useState(initial.defaultTeam);
  const [domains, setDomains] = useState(initial.domains);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string>();
  const [adding, setAdding] = useState(false);
  const [checking, setChecking] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Straks: deze instellingen worden via een server action opgeslagen; nu direct bijwerken.

  function toggle(next: boolean) {
    setAutoJoin(next);
    toast({
      variant: "success",
      title: next ? "Automatisch toetreden staat aan" : "Automatisch toetreden staat uit",
      description: next
        ? "Collega's met een geverifieerd domein kunnen zelf een account aanmaken."
        : "Nieuwe collega's hebben weer een uitnodiging nodig.",
    });
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const domain = normalize(draft);
    let message: string | undefined;
    if (!domain) message = "Vul een domein in.";
    else if (!isValidDomain(domain)) message = "Dit is geen geldig domein. Gebruik bijvoorbeeld studionoord.nl.";
    else if (PUBLIC_EMAIL_DOMAINS.includes(domain))
      message = "Publieke maildomeinen kun je niet toevoegen, anders kan iedereen toetreden.";
    else if (domains.some((d) => d.domain === domain)) message = "Dit domein staat al in de lijst.";
    setError(message);
    if (message) return inputRef.current?.focus();

    setAdding(true);
    await wait(600);
    setAdding(false);
    setDomains((list) => [...list, { domain, verified: false, addedAt: new Date().toISOString() }]);
    setDraft("");
    toast({
      variant: "success",
      title: `${domain} toegevoegd`,
      description: "Voeg het TXT-record toe bij je DNS-provider om het domein te verifiëren.",
    });
  }

  function remove(domain: AutoJoinDomain) {
    const index = domains.indexOf(domain);
    setDomains((list) => list.filter((d) => d.domain !== domain.domain));
    toast({
      title: `${domain.domain} verwijderd`,
      description: "Collega's met dit domein hebben weer een uitnodiging nodig.",
      action: {
        label: "Ongedaan maken",
        onClick: () =>
          setDomains((list) =>
            list.some((d) => d.domain === domain.domain)
              ? list
              : [...list.slice(0, index), domain, ...list.slice(index)],
          ),
      },
    });
    inputRef.current?.focus();
  }

  async function verify(domain: AutoJoinDomain) {
    setChecking(domain.domain);
    // Straks: DNS-controle op de server.
    await wait(1200);
    setChecking(null);
    setDomains((list) => list.map((d) => (d.domain === domain.domain ? { ...d, verified: true } : d)));
    toast({ variant: "success", title: `${domain.domain} is geverifieerd` });
  }

  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast({ title: "TXT-record gekopieerd" });
    } catch {
      toast({
        variant: "error",
        title: "Kopiëren lukte niet",
        description: "Selecteer de tekst en kopieer hem handmatig.",
      });
    }
  }

  const verifiedCount = domains.filter((d) => d.verified).length;

  return (
    <Panel
      title="Automatisch toetreden"
      description="Collega's met een e-mailadres op een geverifieerd domein maken zelf een account aan, zonder uitnodiging."
      headingLevel={2}
    >
      <div className={styles.stack}>
        <Switch
          label="Toetreden via domein toestaan"
          description={
            verifiedCount
              ? "Nieuwe accounts starten als cursist en bezetten een licentie."
              : "Verifieer eerst een domein om dit aan te zetten."
          }
          checked={autoJoin && verifiedCount > 0}
          disabled={verifiedCount === 0}
          onCheckedChange={toggle}
        />

        <Field
          label="Standaardteam"
          description="Hier komen nieuwe collega's terecht. Een teammanager kan ze later verplaatsen."
        >
          <Select
            value={team}
            disabled={!autoJoin}
            onChange={(e) => {
              setTeam(e.target.value);
              toast({
                variant: "success",
                title: "Standaardteam opgeslagen",
                description: `Nieuwe collega's komen in ${e.target.value}.`,
              });
            }}
          >
            {teams.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </Field>

        <div>
          <h3 className={styles.subTitle}>Domeinen</h3>
          {domains.length === 0 ? (
            <p className={styles.empty}>Nog geen domeinen. Voeg het domein van jullie e-mailadressen toe.</p>
          ) : (
            <ul className={styles.domains}>
              {domains.map((d) => (
                <li key={d.domain} className={styles.domain}>
                  <div className={styles.domainRow}>
                    <Globe aria-hidden className={styles.globe} />
                    <span className={styles.domainName}>{d.domain}</span>
                    {d.verified ? (
                      <StatusPill variant="success" size="sm">
                        Geverifieerd
                      </StatusPill>
                    ) : (
                      <StatusPill variant="warning" size="sm">
                        Niet geverifieerd
                      </StatusPill>
                    )}
                    <IconButton
                      label={`${d.domain} verwijderen`}
                      icon={<Trash2 />}
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(d)}
                      className={styles.remove}
                    />
                  </div>
                  {!d.verified && (
                    <div className={styles.verify}>
                      <p>Voeg dit TXT-record toe aan de DNS van {d.domain}:</p>
                      <div className={styles.record}>
                        <code>{txtRecord(d.domain)}</code>
                        <IconButton
                          label="TXT-record kopiëren"
                          icon={<Copy />}
                          variant="ghost"
                          size="sm"
                          onClick={() => copy(txtRecord(d.domain))}
                        />
                      </div>
                      <Button variant="secondary" size="sm" loading={checking === d.domain} onClick={() => verify(d)}>
                        Nu controleren
                      </Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <form className={styles.addForm} onSubmit={add} noValidate>
          <Field label="Domein toevoegen" error={error} className={styles.addField}>
            <TextInput
              ref={inputRef}
              name="domain"
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                if (error) setError(undefined);
              }}
              placeholder="bijvoorbeeld studionoord.nl"
              icon={<AtSign />}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
            />
          </Field>
          <Button type="submit" variant="secondary" icon={<Plus />} loading={adding} className={styles.addButton}>
            Toevoegen
          </Button>
        </form>
      </div>
    </Panel>
  );
}
