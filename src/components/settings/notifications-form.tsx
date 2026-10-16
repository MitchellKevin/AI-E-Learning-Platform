"use client";

import { useId } from "react";
import { Bell, CalendarClock, Flame, Megaphone, Award } from "lucide-react";
import type { NotificationChannels, NotificationSettings, NotificationType } from "@/lib/data/profile";
import { Button, Switch } from "@/components/kit";
import { useSettingsForm } from "./settings-context";
import { SettingsForm, SettingsGroup } from "./settings-form";
import styles from "./notifications-form.module.scss";

const types: { key: NotificationType; title: string; description: string; icon: React.ReactNode }[] = [
  {
    key: "reminders",
    title: "Herinneringen",
    description: "Je dagelijkse seintje om verder te leren, op het tijdstip dat je bij Leren kiest.",
    icon: <Bell />,
  },
  {
    key: "streak",
    title: "Streak",
    description: "Als je streak vandaag dreigt te verlopen, en als je een nieuwe mijlpaal haalt.",
    icon: <Flame />,
  },
  {
    key: "deadlines",
    title: "Deadlines",
    description: "Leerpaden die je manager aan je toewijst, en een week, drie dagen en een dag voor de deadline.",
    icon: <CalendarClock />,
  },
  {
    key: "certificates",
    title: "Certificaten en badges",
    description: "Als je een certificaat of badge behaalt.",
    icon: <Award />,
  },
  {
    key: "productUpdates",
    title: "Nieuw in AI Academy",
    description: "Nieuwe leerpaden, hoofdstukken en functies. Hooguit één keer per maand.",
    icon: <Megaphone />,
  },
];

const channels: { key: keyof NotificationChannels; label: string }[] = [
  { key: "email", label: "E-mail" },
  { key: "inApp", label: "In de app" },
];

export function NotificationsForm({ initial, email }: { initial: NotificationSettings; email: string }) {
  const form = useSettingsForm("notifications", initial);
  const id = useId();

  function toggle(type: NotificationType, channel: keyof NotificationChannels, on: boolean) {
    form.setValues((current) => ({ ...current, [type]: { ...current[type], [channel]: on } }));
  }

  function setChannel(channel: keyof NotificationChannels, on: boolean) {
    form.setValues((current) => {
      const next = { ...current };
      for (const { key } of types) next[key] = { ...next[key], [channel]: on };
      return next;
    });
  }

  const allOff = (channel: keyof NotificationChannels) => types.every(({ key }) => !form.values[key][channel]);

  return (
    <SettingsForm
      title="Meldingen"
      description={
        <>
          Kies per soort melding hoe je hem wilt ontvangen. E-mail gaat naar <strong>{email}</strong>.
        </>
      }
      dirty={form.dirty}
      saving={form.saving}
      onSave={form.save}
      onReset={form.reset}
      savedMessage={{ title: "Meldingen opgeslagen" }}
    >
      <SettingsGroup>
        <div className={styles.bulk}>
          <p className={styles.bulkText}>Snel aanpassen</p>
          <div className={styles.bulkButtons}>
            {channels.map((channel) => {
              const off = allOff(channel.key);
              return (
                <Button key={channel.key} variant="secondary" size="sm" onClick={() => setChannel(channel.key, off)}>
                  {off ? `${channel.label}: alles aan` : `${channel.label}: alles uit`}
                </Button>
              );
            })}
          </div>
        </div>

        <ul className={styles.list}>
          {types.map((type) => {
            const titleId = `${id}-${type.key}`;
            const descriptionId = `${titleId}-description`;
            return (
              <li key={type.key}>
                <div
                  role="group"
                  aria-labelledby={titleId}
                  aria-describedby={descriptionId}
                  className={styles.row}
                >
                  <span className={styles.icon} aria-hidden>
                    {type.icon}
                  </span>
                  <div className={styles.text}>
                    <h3 id={titleId} className={styles.title}>
                      {type.title}
                    </h3>
                    <p id={descriptionId} className={styles.description}>
                      {type.description}
                    </p>
                  </div>
                  <div className={styles.switches}>
                    {channels.map((channel) => (
                      <Switch
                        key={channel.key}
                        size="sm"
                        label={channel.label}
                        checked={form.values[type.key][channel.key]}
                        onCheckedChange={(on) => toggle(type.key, channel.key, on)}
                        className={styles.switch}
                      />
                    ))}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <p className={styles.note}>
          Berichten over je account, zoals een uitnodiging of een wijziging in het abonnement van je organisatie,
          krijg je altijd per e-mail.
        </p>
      </SettingsGroup>
    </SettingsForm>
  );
}
