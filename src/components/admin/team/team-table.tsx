"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { BellRing, BookOpenCheck, Download, Eye, MoreHorizontal, Search, SearchX, X } from "lucide-react";
import {
  Avatar,
  Button,
  Checkbox,
  EmptyState,
  Field,
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
  ProgressBar,
  Select,
  StatusPill,
  Table,
  TBody,
  Td,
  Th,
  THead,
  TextInput,
  Tr,
  useToast,
  VisuallyHidden,
  type SortDirection,
} from "@/components/kit";
import { errorMessage, unwrap } from "@/lib/action-result";
import type { AdminPath, MemberStatus, TeamMember, TeamName } from "@/lib/data/admin-team";
import { csvFilename, downloadCsv } from "@/components/admin/shell/csv";
import { formatDaysAgo, formatShortDate, plural } from "@/components/admin/shell/format";
import { MemberDrawer } from "./member-drawer";
import { NewAssignmentDialog, type MemberOption } from "./new-assignment-dialog";
import { reminderCopy } from "./remind-button";
import { statusLabel, statusVariant } from "./status";
import { sendRemindersAction } from "@/server/actions/admin-team";
import styles from "./team-table.module.scss";

type SortKey = "name" | "team" | "progress" | "lastActive" | "status";
type Sort = { key: SortKey; dir: Exclude<SortDirection, false> };

// Eerste klik op een kolom: logisch startpunt per kolom.
const defaultDir: Record<SortKey, Sort["dir"]> = {
  name: "asc",
  team: "asc",
  progress: "desc",
  lastActive: "desc",
  status: "asc",
};

const statusOrder: Record<MemberStatus, number> = { inactief: 0, achter: 1, uitgenodigd: 2, actief: 3 };

type Props = {
  members: TeamMember[];
  paths: AdminPath[];
  teams: TeamName[];
  today: string;
  initialTeam?: TeamName;
  initialStatus?: MemberStatus;
};

export function TeamTable({ members, paths, teams, today, initialTeam, initialStatus }: Props) {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [team, setTeam] = useState<TeamName | "">(initialTeam ?? "");
  const [status, setStatus] = useState<MemberStatus | "">(initialStatus ?? "");
  const [sort, setSort] = useState<Sort>({ key: "name", dir: "asc" });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  // Open-state los van de inhoud, zodat de inhoud blijft staan tijdens de sluitanimatie.
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [assignIds, setAssignIds] = useState<string[]>([]);
  const [assignOpen, setAssignOpen] = useState(false);
  const [reminding, setReminding] = useState(false);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = members.filter(
      (m) =>
        (!team || m.team === team) &&
        (!status || m.status === status) &&
        (!q || `${m.name} ${m.email} ${m.role}`.toLowerCase().includes(q)),
    );
    const value = (m: TeamMember): string | number => {
      switch (sort.key) {
        case "name":
          return m.name;
        case "team":
          return `${m.team} ${m.name}`;
        case "progress":
          return m.currentPath.progress;
        case "lastActive":
          // Nooit actief komt altijd onderaan bij "meest recent eerst".
          return m.daysInactive === null ? -Infinity : -m.daysInactive;
        case "status":
          return statusOrder[m.status];
      }
    };
    const factor = sort.dir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const va = value(a);
      const vb = value(b);
      const diff = typeof va === "string" ? va.localeCompare(vb as string, "nl") : va - (vb as number);
      return diff * factor || a.name.localeCompare(b.name, "nl");
    });
  }, [members, query, team, status, sort]);

  const filtersActive = Boolean(query || team || status);
  const visibleIds = visible.map((m) => m.id);
  const selectedVisible = visibleIds.filter((id) => selected.has(id)).length;
  const allVisibleSelected = visible.length > 0 && selectedVisible === visible.length;
  const hiddenSelected = selected.size - selectedVisible;

  const memberOptions: MemberOption[] = useMemo(
    () =>
      members.map((m) => ({
        id: m.id,
        name: m.name,
        initials: m.initials,
        team: m.team,
        role: m.role,
        progress: Object.fromEntries(m.paths.map((p) => [p.slug, p.progress])),
      })),
    [members],
  );

  const detail = members.find((m) => m.id === detailId) ?? null;

  function openDetail(id: string) {
    setDetailId(id);
    setDetailOpen(true);
  }

  function openAssign(ids: string[]) {
    setAssignIds(ids);
    setAssignOpen(true);
  }

  function toggleSort(key: SortKey) {
    setSort((prev) => (prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: defaultDir[key] }));
  }

  const sortFor = (key: SortKey): SortDirection => (sort.key === key ? sort.dir : false);

  function toggleAllVisible(checked: boolean) {
    const next = new Set(selected);
    visibleIds.forEach((id) => (checked ? next.add(id) : next.delete(id)));
    setSelected(next);
  }

  function toggleOne(id: string, checked: boolean) {
    const next = new Set(selected);
    if (checked) next.add(id);
    else next.delete(id);
    setSelected(next);
  }

  function clearFilters() {
    setQuery("");
    setTeam("");
    setStatus("");
  }

  async function remindSelected() {
    const names = members.filter((m) => selected.has(m.id)).map((m) => m.name);
    setReminding(true);
    try {
      unwrap(await sendRemindersAction([...selected]));
    } catch (error) {
      setReminding(false);
      toast({ variant: "error", title: "Versturen lukte niet", description: errorMessage(error, "Probeer het opnieuw.") });
      return;
    }
    setReminding(false);
    toast({
      variant: "success",
      ...reminderCopy(names),
      action: { label: "Selectie wissen", onClick: () => setSelected(new Set()) },
    });
  }

  async function remindOne(member: TeamMember) {
    try {
      unwrap(await sendRemindersAction([member.id], member.currentPath.title));
    } catch (error) {
      toast({ variant: "error", title: "Versturen lukte niet", description: errorMessage(error, "Probeer het opnieuw.") });
      return;
    }
    toast({ variant: "success", ...reminderCopy([member.name], member.currentPath.title) });
  }

  function exportCsv() {
    const filename = csvFilename("team", today);
    downloadCsv(
      filename,
      ["Naam", "E-mail", "Team", "Rol", "Leerpad", "Voortgang (%)", "Deadline", "Laatst actief", "Status", "Punten"],
      visible.map((m) => [
        m.name,
        m.email,
        m.team,
        m.role,
        m.currentPath.title,
        m.currentPath.progress,
        m.currentPath.deadline ?? "",
        m.lastActiveAt ?? "",
        statusLabel[m.status],
        m.points,
      ]),
    );
    toast({
      variant: "success",
      title: "Export gedownload",
      description: `${plural(visible.length, "collega", "collega's")} in ${filename}.`,
    });
  }

  const countFor = (key: "team" | "status", value: string) =>
    members.filter((m) => (key === "team" ? m.team === value : m.status === value)).length;

  return (
    <div className={styles.wrap}>
      <div className={styles.toolbar}>
        <Field label="Zoek collega" hideLabel className={styles.search}>
          <TextInput
            type="search"
            icon={<Search />}
            placeholder="Zoek op naam, e-mail of rol"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </Field>
        <Field label="Team" hideLabel className={styles.filter}>
          <Select value={team} onChange={(e) => setTeam(e.target.value as TeamName | "")}>
            <option value="">Alle teams</option>
            {teams.map((t) => (
              <option key={t} value={t}>
                {t} ({countFor("team", t)})
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Status" hideLabel className={styles.filter}>
          <Select value={status} onChange={(e) => setStatus(e.target.value as MemberStatus | "")}>
            <option value="">Alle statussen</option>
            {(Object.keys(statusLabel) as MemberStatus[]).map((s) => (
              <option key={s} value={s}>
                {statusLabel[s]} ({countFor("status", s)})
              </option>
            ))}
          </Select>
        </Field>
        <Button
          variant="secondary"
          icon={<Download />}
          onClick={exportCsv}
          disabled={visible.length === 0}
          className={styles.export}
        >
          Exporteer CSV
        </Button>
      </div>

      <div className={styles.meta}>
        <p aria-live="polite" className={styles.count}>
          {filtersActive
            ? `${visible.length} van ${plural(members.length, "collega", "collega's")}`
            : plural(members.length, "collega", "collega's")}
          {selected.size > 0 && <VisuallyHidden>, {selected.size} geselecteerd</VisuallyHidden>}
        </p>
        {filtersActive && (
          <Button variant="ghost" size="sm" icon={<X />} onClick={clearFilters}>
            Filters wissen
          </Button>
        )}
      </div>

      {selected.size > 0 && (
        <div className={styles.bulk} role="region" aria-label="Acties voor selectie">
          <p className={styles.bulkCount}>
            <strong>{selected.size}</strong> geselecteerd
            {hiddenSelected > 0 && <span className={styles.bulkHidden}> ({hiddenSelected} buiten je filter)</span>}
          </p>
          <div className={styles.bulkActions}>
            <Button size="sm" variant="dark" icon={<BellRing />} loading={reminding} onClick={remindSelected}>
              Herinnering sturen
            </Button>
            <Button size="sm" variant="secondary" icon={<BookOpenCheck />} onClick={() => openAssign([...selected])}>
              Leerpad toewijzen
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
              Selectie wissen
            </Button>
          </div>
        </div>
      )}

      {visible.length === 0 ? (
        <EmptyState
          icon={<SearchX />}
          title="Geen collega's gevonden"
          action={
            <Button variant="secondary" onClick={clearFilters}>
              Filters wissen
            </Button>
          }
        >
          Niemand past bij deze combinatie van zoekterm en filters.
        </EmptyState>
      ) : (
        <Table label="Teamleden" minWidth={920}>
          <THead>
            <Tr>
              <Th shrink>
                <Checkbox
                  label="Selecteer alle zichtbare collega's"
                  hideLabel
                  checked={allVisibleSelected}
                  indeterminate={selectedVisible > 0 && !allVisibleSelected}
                  onChange={(e) => toggleAllVisible(e.target.checked)}
                />
              </Th>
              <Th sort={sortFor("name")} onSort={() => toggleSort("name")}>
                Naam
              </Th>
              <Th sort={sortFor("team")} onSort={() => toggleSort("team")}>
                Team
              </Th>
              <Th>Leerpad</Th>
              <Th sort={sortFor("progress")} onSort={() => toggleSort("progress")}>
                Voortgang
              </Th>
              <Th sort={sortFor("lastActive")} onSort={() => toggleSort("lastActive")}>
                Laatst actief
              </Th>
              <Th sort={sortFor("status")} onSort={() => toggleSort("status")}>
                Status
              </Th>
              <Th shrink>
                <VisuallyHidden>Acties</VisuallyHidden>
              </Th>
            </Tr>
          </THead>
          <TBody>
            {visible.map((m) => {
              const isSelected = selected.has(m.id);
              const path = m.currentPath;
              return (
                <Tr key={m.id} selected={isSelected}>
                  <Td shrink>
                    <Checkbox
                      label={`Selecteer ${m.name}`}
                      hideLabel
                      checked={isSelected}
                      onChange={(e) => toggleOne(m.id, e.target.checked)}
                    />
                  </Td>
                  <Td>
                    <div className={styles.person}>
                      <Avatar initials={m.initials} size={32} />
                      <div className={styles.personText}>
                        <button type="button" className={styles.name} onClick={() => openDetail(m.id)}>
                          {m.name}
                        </button>
                        <span className={styles.role}>{m.role}</span>
                      </div>
                    </div>
                  </Td>
                  <Td muted>{m.team}</Td>
                  <Td>
                    <span className={styles.path}>{path.title}</span>
                    {path.deadline && path.state !== "afgerond" && (
                      <span className={clsx(styles.deadline, path.atRisk && styles.atRisk)}>
                        Deadline {formatShortDate(path.deadline)}
                      </span>
                    )}
                  </Td>
                  <Td>
                    <div className={styles.progress}>
                      <ProgressBar value={path.progress} className={styles.progressBar} />
                      <span className={styles.percent}>{path.progress}%</span>
                    </div>
                  </Td>
                  <Td muted>
                    <span className={clsx(m.status === "inactief" && styles.stale)}>{formatDaysAgo(m.daysInactive)}</span>
                  </Td>
                  <Td>
                    <StatusPill variant={statusVariant[m.status]} size="sm">
                      {statusLabel[m.status]}
                    </StatusPill>
                  </Td>
                  <Td shrink>
                    <Menu>
                      <MenuTrigger
                        aria-label={`Acties voor ${m.name}`}
                        variant="ghost"
                        size="sm"
                        iconOnly
                      >
                        <MoreHorizontal aria-hidden />
                      </MenuTrigger>
                      <MenuContent align="end" width={220}>
                        <MenuItem icon={<Eye />} onSelect={() => openDetail(m.id)}>
                          Bekijk details
                        </MenuItem>
                        <MenuItem icon={<BellRing />} onSelect={() => remindOne(m)}>
                          {m.status === "uitgenodigd" ? "Uitnodiging opnieuw sturen" : "Stuur herinnering"}
                        </MenuItem>
                        <MenuItem icon={<BookOpenCheck />} onSelect={() => openAssign([m.id])}>
                          Leerpad toewijzen
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

      <MemberDrawer
        member={detail}
        open={detailOpen && detail !== null}
        onOpenChange={setDetailOpen}
        onAssign={(id) => {
          setDetailOpen(false);
          openAssign([id]);
        }}
      />

      <NewAssignmentDialog
        open={assignOpen}
        onOpenChange={setAssignOpen}
        members={memberOptions}
        paths={paths}
        teams={teams}
        today={today}
        initialMemberIds={assignIds}
      />
    </div>
  );
}
