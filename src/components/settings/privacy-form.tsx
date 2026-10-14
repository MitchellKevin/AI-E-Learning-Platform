"use client";

import type { PrivacySettings } from "@/lib/data/profile";
import { Alert, Switch } from "@/components/kit";
import { useSettingsForm } from "./settings-context";
import { SettingsForm, SettingsGroup } from "./settings-form";

export function PrivacyForm({ initial, team }: { initial: PrivacySettings; team: string }) {
  const form = useSettingsForm("privacy", initial);
  const { showOnLeaderboard, visibleToTeam } = form.values;

  return (
    <SettingsForm
      title="Zichtbaarheid"
      description="Bepaal wat je collega's van je zien. Je voortgang telt altijd gewoon mee."
      dirty={form.dirty}
      saving={form.saving}
      onSave={form.save}
      onReset={form.reset}
      savedMessage={{
        title: "Privacy-instellingen opgeslagen",
        description: showOnLeaderboard
          ? `Je staat op het leaderboard van team ${team}.`
          : "Je staat niet meer op het leaderboard.",
      }}
    >
      <SettingsGroup>
        <Switch
          label="Verschijnen op het leaderboard"
          description={
            showOnLeaderboard
              ? `Je naam, avatar en punten staan in de ranglijst van team ${team}.`
              : "Je naam en punten verdwijnen uit de ranglijst. Je verzamelt wel gewoon punten, badges en streaks, en ziet zelf nog je eigen plek."
          }
          checked={showOnLeaderboard}
          onCheckedChange={(on) => form.set("showOnLeaderboard", on)}
        />
        <Switch
          label="Profiel zichtbaar voor je team"
          description={
            visibleToTeam
              ? "Teamgenoten zien je functie, badges en behaalde certificaten."
              : "Teamgenoten zien alleen je naam. Je badges en certificaten blijven voor jezelf."
          }
          checked={visibleToTeam}
          onCheckedChange={(on) => form.set("visibleToTeam", on)}
        />
        <Alert variant="info" title="Wat je manager altijd ziet">
          Je manager ziet voor de teamrapportage welke toegewezen leerpaden je hebt afgerond en wanneer. Je antwoorden
          op quizzen en oefeningen zijn nooit zichtbaar voor anderen.
        </Alert>
      </SettingsGroup>
    </SettingsForm>
  );
}
