"use client";

import { Code2, Layers, Palette } from "lucide-react";
import type { Focus, LearningSettings, WeekGoal } from "@/lib/data/profile";
import { Field, RadioCard, RadioGroup, Switch, TextInput } from "@/components/kit";
import { useSettingsForm } from "./settings-context";
import { SettingsForm, SettingsGroup } from "./settings-form";
import styles from "./learning-form.module.scss";

const weekGoals: { value: WeekGoal; eyebrow: string; description: string }[] = [
  { value: 60, eyebrow: "Rustig aan", description: "Een kwartiertje, vier dagen per week." },
  { value: 120, eyebrow: "Gemiddeld", description: "Ongeveer een hoofdstuk per week." },
  { value: 180, eyebrow: "Intensief", description: "Elke werkdag ruim een half uur." },
];

const focusOptions: { value: Focus; title: string; description: string; icon: React.ReactNode }[] = [
  {
    value: "design",
    title: "Design",
    description: "Voorbeelden en oefeningen uit UI/UX Design komen eerst.",
    icon: <Palette />,
  },
  {
    value: "development",
    title: "Development",
    description: "Voorbeelden en oefeningen uit Software Development komen eerst.",
    icon: <Code2 />,
  },
  {
    value: "beide",
    title: "Beide",
    description: "Een mix, handig als je tussen design en development in zit.",
    icon: <Layers />,
  },
];

export function LearningForm({ initial }: { initial: LearningSettings }) {
  const form = useSettingsForm("learning", initial);
  const { weekGoal, focus, dailyReminder, reminderTime } = form.values;

  return (
    <SettingsForm
      title="Leren"
      description="Stel een doel dat bij je week past. Je voortgang op het dashboard rekent hiermee."
      dirty={form.dirty}
      saving={form.saving}
      onSave={form.save}
      onReset={form.reset}
      savedMessage={{ title: "Leervoorkeuren opgeslagen", description: `Je weekdoel is ${weekGoal} minuten.` }}
    >
      <SettingsGroup>
        <RadioGroup
          label="Weekdoel"
          description="Hoeveel tijd wil je per week aan AI Academy besteden?"
          name="weekGoal"
          value={String(weekGoal)}
          onValueChange={(v) => form.set("weekGoal", Number(v) as WeekGoal)}
          columns={3}
        >
          {weekGoals.map((goal) => (
            <RadioCard
              key={goal.value}
              value={String(goal.value)}
              eyebrow={goal.eyebrow}
              title={`${goal.value} min per week`}
              description={goal.description}
            />
          ))}
        </RadioGroup>
      </SettingsGroup>

      <SettingsGroup>
        <RadioGroup
          label="Specialisatie"
          description="Bepaalt welke voorbeelden, oefeningen en vervolgleerpaden we je als eerste laten zien."
          name="focus"
          value={focus}
          onValueChange={(v) => form.set("focus", v as Focus)}
          columns={3}
        >
          {focusOptions.map((option) => (
            <RadioCard
              key={option.value}
              value={option.value}
              title={option.title}
              description={option.description}
              icon={option.icon}
            />
          ))}
        </RadioGroup>
      </SettingsGroup>

      <SettingsGroup
        inline
        title="Dagelijkse herinnering"
        description="Een seintje om je streak vast te houden. Bij Meldingen kies je of hij per e-mail of in de app komt."
      >
        <Switch
          label="Herinner me elke dag"
          description="Alleen op dagen dat je nog niet hebt geleerd."
          checked={dailyReminder}
          onCheckedChange={(checked) => form.set("dailyReminder", checked)}
        />
        <Field
          label="Tijdstip"
          description={dailyReminder ? "Nederlandse tijd." : "Zet de herinnering aan om een tijd te kiezen."}
          className={styles.time}
        >
          <TextInput
            type="time"
            name="reminderTime"
            step={900}
            value={reminderTime}
            onChange={(e) => form.set("reminderTime", e.target.value || "09:00")}
            disabled={!dailyReminder}
          />
        </Field>
      </SettingsGroup>
    </SettingsForm>
  );
}
