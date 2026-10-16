"use client";

import { useState, type ReactNode } from "react";
import { Building2, Trophy, Users } from "lucide-react";
import { Button, EmptyState, SegmentedControl, Tab, TabList, TabPanel, Tabs } from "@/components/kit";
import { leaderboardPeriods, leaderboardScopes } from "@/lib/data/leaderboard-shared";
import type { LeaderboardBoard, LeaderboardOverview, LeaderboardPeriod, LeaderboardScope } from "@/lib/data/leaderboard";
import { MyPosition } from "./my-position";
import { Podium } from "./podium";
import { RankList } from "./rank-list";
import { TeamComparison } from "./team-comparison";
import { periodLabels, periodPhrases, scopeLabels } from "./labels";
import styles from "./leaderboard-view.module.scss";

// Onder dit aantal teamleden is een ranglijst weinig zinvol (en snel herleidbaar).
const MIN_TEAM_SIZE = 3;

type Props = {
  overview: LeaderboardOverview;
  /** Vaste inhoud onder de teamvergelijking (puntenuitleg, privacy). */
  aside: ReactNode;
};

// Wisselen tussen team/organisatie en periode gebeurt direct op de client; alle ranglijsten zijn al geladen.
export function LeaderboardView({ overview, aside }: Props) {
  const [scope, setScope] = useState<LeaderboardScope>("team");
  const [period, setPeriod] = useState<LeaderboardPeriod>("maand");
  const [announcement, setAnnouncement] = useState("");

  const board = (s: LeaderboardScope, p: LeaderboardPeriod) => overview.boards[`${s}-${p}`];

  function change(nextScope: LeaderboardScope, nextPeriod: LeaderboardPeriod) {
    setScope(nextScope);
    setPeriod(nextPeriod);
    const next = board(nextScope, nextPeriod);
    const where = nextScope === "team" ? `Team ${overview.myTeam}` : "Organisatie";
    setAnnouncement(
      next.me
        ? `${where}, ${periodPhrases[nextPeriod]}: je staat op plek ${next.me.rank} van ${next.entries.length}.`
        : `${where}, ${periodPhrases[nextPeriod]}: je hebt nog geen punten.`,
    );
  }

  return (
    <div className={styles.layout}>
      <Tabs
        value={scope}
        onValueChange={(v) => change(v as LeaderboardScope, period)}
        variant="pill"
        className={styles.main}
      >
        <div className={styles.toolbar}>
          <TabList aria-label="Ranglijst">
            {leaderboardScopes.map((s) => (
              <Tab
                key={s}
                value={s}
                icon={s === "team" ? <Users /> : <Building2 />}
                count={board(s, period).memberCount}
              >
                {scopeLabels[s]}
              </Tab>
            ))}
          </TabList>
          <div className={styles.period}>
            <SegmentedControl
              label="Periode"
              size="sm"
              fullWidth
              value={period}
              onValueChange={(p) => change(scope, p)}
              options={leaderboardPeriods.map((p) => ({ value: p, label: periodLabels[p] }))}
            />
          </div>
        </div>

        {leaderboardScopes.map((s) => (
          <TabPanel key={s} value={s}>
            {/* Nieuwe key per periode, zodat podium en lijst opnieuw binnenkomen. */}
            <Board
              key={period}
              board={board(s, period)}
              myTeam={overview.myTeam}
              onShowOrganisation={() => change("organisatie", period)}
            />
          </TabPanel>
        ))}
      </Tabs>

      <aside className={styles.aside} aria-label="Teams en punten">
        <TeamComparison teams={overview.teams[period]} period={period} />
        {aside}
      </aside>

      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
    </div>
  );
}

function Board({
  board,
  myTeam,
  onShowOrganisation,
}: {
  board: LeaderboardBoard;
  myTeam: string;
  onShowOrganisation: () => void;
}) {
  if (board.scope === "team" && board.memberCount < MIN_TEAM_SIZE) {
    return (
      <EmptyState
        icon={<Users />}
        title="Je team is nog wat klein"
        headingLevel={2}
        variant="card"
        action={
          <Button variant="secondary" icon={<Building2 />} onClick={onShowOrganisation}>
            Bekijk de organisatie
          </Button>
        }
      >
        Een teamranglijst verschijnt vanaf {MIN_TEAM_SIZE} collega&apos;s, zodat niemand herleidbaar is. Bekijk tot die tijd
        hoe je ervoor staat in de hele organisatie.
      </EmptyState>
    );
  }

  if (board.entries.length === 0) {
    return (
      <EmptyState
        icon={<Trophy />}
        title={`Nog geen punten ${periodPhrases[board.period]}`}
        headingLevel={2}
        variant="card"
        action={<Button href="/dashboard">Verder leren</Button>}
      >
        Zodra iemand een hoofdstuk, oefening of kennischeck afrondt, verschijnt hier de ranglijst. Misschien sta jij straks
        bovenaan.
      </EmptyState>
    );
  }

  const showPodium = board.entries.length >= 3;
  const isTeam = board.scope === "team";
  const withoutPoints = board.memberCount - board.entries.length;

  return (
    <div className={styles.board}>
      <MyPosition board={board} />

      <section className={styles.rankCard} aria-labelledby="ranking-title">
        <div className={styles.rankHead}>
          <h2 id="ranking-title" className={styles.rankTitle}>
            {isTeam ? `Team ${myTeam}` : "Hele organisatie"}
            <span className={styles.rankPeriod}> · {periodPhrases[board.period]}</span>
          </h2>
          <p className={styles.rankMeta}>
            {withoutPoints > 0
              ? `${board.entries.length} van ${board.memberCount} ${isTeam ? "teamleden" : "collega's"} verdienden punten`
              : `Alle ${board.memberCount} ${isTeam ? "teamleden" : "collega's"} verdienden punten`}
          </p>
        </div>

        {showPodium && (
          <div className={styles.podium}>
            <Podium entries={board.entries} showTeam={!isTeam} />
          </div>
        )}

        <RankList entries={board.entries} start={showPodium ? 3 : 0} showTeam={!isTeam} />
      </section>
    </div>
  );
}
