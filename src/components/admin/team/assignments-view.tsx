"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { BellRing, ClipboardList, MoreHorizontal, Plus, Trash2, Users } from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  ConfirmDialog,
  EmptyState,
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
  PageHeader,
  SegmentedControl,
  Stat,
  StatGroup,
  StatusPill,
  Table,
  TBody,
  Td,
  Th,
  THead,
  Tr,
  useToast,
  VisuallyHidden,
} from "@/components/kit";
import { errorMessage, unwrap } from "@/lib/action-result";
import type { AdminPath, Assignment, TeamName } from "@/lib/data/admin-team";
import { byStatusThenDeadline } from "@/components/admin/shell/assignments";
import { formatDaysLeft, formatLongDate, formatShortDate, plural } from "@/components/admin/shell/format";
import { NewAssignmentDialog, type MemberOption } from "./new-assignment-dialog";
import { reminderCopy } from "./remind-button";
import { assignmentStatusLabel, assignmentStatusVariant } from "./status";
import { deleteAssignmentAction, sendRemindersAction } from "@/server/actions/admin-team";
import styles from "./assignments-view.module.scss";

type View = "lopend" | "afgerond" | "alles";

type Props = {
  assignments: Assignment[];
  members: MemberOption[];
  paths: AdminPath[];
  teams: TeamName[];
  today: string;
  /** Open de dialoog direct, bv. vanaf het overzicht (?nieuw=1). */
  startOpen?: boolean;
};

export function AssignmentsView({ assignments: initial, members, paths, teams, today, startOpen = false }: Props) {
  const { toast } = useToast();
  const [assignments, setAssignments] = useState(initial);
  const [view, setView] = useState<View>("lopend");
  const [dialogOpen, setDialogOpen] = useState(startOpen);
  const [toDelete, setToDelete] = useState<Assignment | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [fresh, setFresh] = useState<string | null>(null);

  // ?nieuw=1 uit de URL halen zodra de dialoog openstaat, zodat terugnavigeren hem niet opnieuw opent.
  useEffect(() => {
    if (startOpen) window.history.replaceState(null, "", window.location.pathname);
  }, [startOpen]);

  const open = assignments.filter((a) => a.status !== "afgerond");
  const counts = {
    lopend: open.length,
    afgerond: assignments.length - open.length,
    alles: assignments.length,
  };
  const shown = view === "lopend" ? open : view === "afgerond" ? assignments.filter((a) => a.status === "afgerond") : assignments;

  const stats = {
    onTrack: assignments.filter((a) => a.status === "op-schema").length,
    risk: assignments.filter((a) => a.status === "risico").length,
    overdue: assignments.filter((a) => a.status === "verlopen").length,
    people: new Set(open.flatMap((a) => a.members.map((m) => m.id))).size,
  };

  const progressOf = (memberId: string, a: Assignment) =>
    members.find((m) => m.id === memberId)?.progress[a.pathSlug] ?? 0;

  function created(assignment: Assignment) {
    setAssignments((prev) => [assignment, ...prev].sort(byStatusThenDeadline));
    setView((v) => (v === "afgerond" ? "lopend" : v));
    setFresh(assignment.id);
  }

  async function remind(a: Assignment) {
    const pending = a.members.filter((m) => progressOf(m.id, a) < 100);
    if (pending.length === 0) return;
    try {
      unwrap(await sendRemindersAction(pending.map((m) => m.id), a.pathTitle));
    } catch (error) {
      toast({ variant: "error", title: "Versturen lukte niet", description: errorMessage(error, "Probeer het opnieuw.") });
      return;
    }
    toast({ variant: "success", ...reminderCopy(pending.map((m) => m.name), a.pathTitle) });
  }

  async function remove(a: Assignment) {
    try {
      unwrap(await deleteAssignmentAction(a.id));
    } catch (error) {
      toast({ variant: "error", title: "Verwijderen lukte niet", description: errorMessage(error, "Probeer het opnieuw.") });
      return;
    }
    setAssignments((prev) => prev.filter((x) => x.id !== a.id));
    toast({
      title: "Toewijzing verwijderd",
      description: `${a.pathTitle} voor ${a.targetLabel.replace(/^Team/, "team")}. Voortgang van collega's blijft bewaard.`,
      action: {
        label: "Ongedaan maken",
        onClick: () => {
          setAssignments((prev) => [...prev, a].sort(byStatusThenDeadline));
          // Lukt terugzetten niet, dan verdwijnt de toewijzing weer uit de lijst.
          deleteAssignmentAction(a.id, true)
            .then(unwrap)
            .catch((error) => {
              setAssignments((prev) => prev.filter((x) => x.id !== a.id));
              toast({ variant: "error", title: "Ongedaan maken lukte niet", description: errorMessage(error, "Probeer het opnieuw.") });
            });
        },
      },
    });
  }

  return (
    <>
      <PageHeader
        title="Toewijzingen"
        lead="Zet leerpaden klaar met een deadline en zie in één oogopslag wie op schema ligt."
        actions={
          <Button icon={<Plus />} onClick={() => setDialogOpen(true)}>
            Nieuwe toewijzing
          </Button>
        }
      />

      <StatGroup columns={4}>
        <Stat value={counts.lopend} label="Lopende toewijzingen" hint={`voor ${plural(stats.people, "collega", "collega's")}`} />
        <Stat value={stats.onTrack} label="Op schema" />
        <Stat value={stats.risk} label="Risico" hint={stats.risk > 0 ? "voortgang blijft achter op de planning" : undefined} />
        <Stat value={counts.afgerond} label="Afgerond" hint={stats.overdue > 0 ? `${stats.overdue} verlopen` : undefined} />
      </StatGroup>

      <section aria-labelledby="assignments-title" className={styles.list}>
        <div className={styles.listHead}>
          <h2 id="assignments-title" className={styles.listTitle}>
            Alle toewijzingen
          </h2>
          <SegmentedControl
            label="Toon toewijzingen"
            size="sm"
            value={view}
            onValueChange={setView}
            options={[
              { value: "lopend", label: `Lopend (${counts.lopend})` },
              { value: "afgerond", label: `Afgerond (${counts.afgerond})` },
              { value: "alles", label: "Alles" },
            ]}
          />
        </div>

        {shown.length === 0 ? (
          <EmptyState
            icon={<ClipboardList />}
            title={view === "afgerond" ? "Nog niets afgerond" : "Geen lopende toewijzingen"}
            action={
              view !== "afgerond" && (
                <Button icon={<Plus />} onClick={() => setDialogOpen(true)}>
                  Nieuwe toewijzing
                </Button>
              )
            }
          >
            {view === "afgerond"
              ? "Zodra iedereen in een toewijzing klaar is, verschijnt die hier."
              : "Wijs een leerpad toe aan een team of aan losse collega's, met een deadline erbij."}
          </EmptyState>
        ) : (
          <Table label="Toewijzingen" minWidth={860}>
            <THead>
              <Tr>
                <Th>Leerpad</Th>
                <Th>Voor wie</Th>
                <Th>Deadline</Th>
                <Th>Voortgang</Th>
                <Th>Status</Th>
                <Th shrink>
                  <VisuallyHidden>Acties</VisuallyHidden>
                </Th>
              </Tr>
            </THead>
            <TBody>
              {shown.map((a) => {
                const pending = a.members.filter((m) => progressOf(m.id, a) < 100).length;
                const teamLink =
                  a.target.kind === "team" && a.target.teams.length === 1
                    ? `/beheer/team?team=${a.target.teams[0].toLowerCase()}`
                    : "/beheer/team";
                return (
                  <Tr key={a.id} className={clsx(a.id === fresh && styles.fresh)}>
                    <Td>
                      <span className={styles.path}>{a.pathTitle}</span>
                      <span className={styles.pathMeta}>
                        {a.required ? (
                          <Badge variant="brand" size="sm">
                            Verplicht
                          </Badge>
                        ) : (
                          <Badge size="sm">Vrijwillig</Badge>
                        )}
                        <span>Sinds {formatShortDate(a.createdAt)}</span>
                      </span>
                      {a.message && (
                        <span className={styles.message} title={a.message}>
                          “{a.message}”
                        </span>
                      )}
                    </Td>
                    <Td>
                      <span className={styles.target}>{a.targetLabel}</span>
                      <span className={styles.avatars} aria-hidden>
                        {a.members.slice(0, 4).map((m) => (
                          <Avatar key={m.id} initials={m.initials} size={24} />
                        ))}
                        {a.members.length > 4 && <span className={styles.more}>+{a.members.length - 4}</span>}
                      </span>
                      <VisuallyHidden>{a.members.map((m) => m.name).join(", ")}</VisuallyHidden>
                    </Td>
                    <Td>
                      <time dateTime={a.deadline} className={styles.date}>
                        {formatLongDate(a.deadline)}
                      </time>
                      <span className={clsx(styles.left, a.status === "verlopen" && styles.overdue)}>
                        {a.status === "afgerond" ? "Iedereen klaar" : formatDaysLeft(a.daysLeft)}
                      </span>
                    </Td>
                    <Td>
                      <div className={styles.progress}>
                        <div className={styles.track} aria-hidden>
                          <span className={styles.fill} style={{ width: `${a.progress}%` }} />
                          {a.status !== "afgerond" && (
                            <span className={styles.expected} style={{ left: `${a.expected}%` }} title={`Verwacht: ${a.expected}%`} />
                          )}
                        </div>
                        <span className={styles.progressText}>
                          {a.completedCount}/{a.members.length} klaar · gem. {a.progress}%
                          {a.status !== "afgerond" && <VisuallyHidden>, verwacht {a.expected}%</VisuallyHidden>}
                        </span>
                      </div>
                    </Td>
                    <Td>
                      <StatusPill variant={assignmentStatusVariant[a.status]} size="sm">
                        {assignmentStatusLabel[a.status]}
                      </StatusPill>
                    </Td>
                    <Td shrink>
                      <Menu>
                        <MenuTrigger aria-label={`Acties voor ${a.pathTitle}, ${a.targetLabel}`} variant="ghost" size="sm" iconOnly>
                          <MoreHorizontal aria-hidden />
                        </MenuTrigger>
                        <MenuContent align="end" width={260}>
                          <MenuItem
                            icon={<BellRing />}
                            disabled={pending === 0}
                            description={pending > 0 ? `Aan ${plural(pending, "collega", "collega's")} die nog bezig ${pending === 1 ? "is" : "zijn"}` : "Iedereen is klaar"}
                            onSelect={() => remind(a)}
                          >
                            Herinnering sturen
                          </MenuItem>
                          <MenuItem icon={<Users />} href={teamLink}>
                            Bekijk in team
                          </MenuItem>
                          <MenuSeparator />
                          <MenuItem
                            icon={<Trash2 />}
                            danger
                            onSelect={() => {
                              setToDelete(a);
                              setDeleteOpen(true);
                            }}
                          >
                            Verwijderen
                          </MenuItem>
                        </MenuContent>
                      </Menu>
                    </Td>
                  </Tr>
                );
              })}
            </TBody>
          </Table>
        )}
        <p className={styles.legend}>
          <span className={styles.legendMarker} aria-hidden /> Het streepje in de balk is waar de groep nu zou moeten zijn,
          gerekend vanaf de start tot de deadline.
        </p>
      </section>

      <NewAssignmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        members={members}
        paths={paths}
        teams={teams}
        today={today}
        onCreated={created}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Toewijzing verwijderen?"
        description={
          toDelete
            ? `${toDelete.pathTitle} voor ${toDelete.targetLabel.replace(/^Team/, "team")} verdwijnt van hun dashboard en ze krijgen geen herinneringen meer. Hun voortgang blijft bewaard.`
            : undefined
        }
        confirmLabel="Verwijderen"
        variant="danger"
        onConfirm={() => (toDelete ? remove(toDelete) : undefined)}
      />
    </>
  );
}
