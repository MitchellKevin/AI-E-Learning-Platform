"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import {
  MoreHorizontal,
  RotateCcw,
  Search,
  Send,
  ShieldCheck,
  UserCheck,
  UserMinus,
  UserX,
  Users as UsersIcon,
} from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  ConfirmDialog,
  Dialog,
  EmptyState,
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
  Radio,
  RadioGroup,
  Select,
  TBody,
  THead,
  Table,
  Td,
  TextInput,
  Th,
  Tr,
  VisuallyHidden,
  type SortDirection,
} from "@/components/kit";
import {
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
  STATUS_LABELS,
  formatShortDate,
  type OrgRole,
  type OrgUser,
  type UserStatus as Status,
} from "@/lib/data/admin-org-shared";
import { plural } from "../utils";
import { UserStatus, displayName } from "./user-status";
import styles from "./users-table.module.scss";

const PAGE_SIZE = 12;
const ROLES = Object.keys(ROLE_LABELS) as OrgRole[];

type SortKey = "name" | "lastActive";

export type UserActions = {
  onRoleChange: (user: OrgUser, role: OrgRole) => Promise<void>;
  onDeactivate: (user: OrgUser) => Promise<void>;
  onReactivate: (user: OrgUser) => Promise<void>;
  onResend: (user: OrgUser) => Promise<void>;
  onRevoke: (user: OrgUser) => Promise<void>;
};

type Props = UserActions & {
  users: OrgUser[];
  teams: string[];
  today: string;
  freeSeats: number;
};

export function UsersTable({ users, teams, today, freeSeats, ...actions }: Props) {
  const [query, setQuery] = useState("");
  const [team, setTeam] = useState("");
  const [status, setStatus] = useState<Status | "">("");
  const [sort, setSort] = useState<{ key: SortKey; dir: Exclude<SortDirection, false> } | null>(null);
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [roleTarget, setRoleTarget] = useState<OrgUser | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<OrgUser | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = users.filter(
      (u) =>
        (!q || u.email.toLowerCase().includes(q) || u.name?.toLowerCase().includes(q)) &&
        (!team || u.team === team) &&
        (!status || u.status === status),
    );
    if (!sort) return list;
    const factor = sort.dir === "asc" ? 1 : -1;
    return [...list].sort((a, b) => {
      if (sort.key === "name") return displayName(a).localeCompare(displayName(b), "nl") * factor;
      const at = (u: OrgUser) => Date.parse(u.lastActiveAt ?? u.invitedAt ?? "1970-01-01");
      return (at(a) - at(b)) * factor;
    });
  }, [users, query, team, status, sort]);

  const visible = filtered.slice(0, limit);
  const filtering = Boolean(query || team || status);

  function toggleSort(key: SortKey) {
    setSort((s) => (s?.key !== key ? { key, dir: "asc" } : s.dir === "asc" ? { key, dir: "desc" } : null));
  }

  function resetFilters() {
    setQuery("");
    setTeam("");
    setStatus("");
    setLimit(PAGE_SIZE);
  }

  const countFor = (s: Status) => users.filter((u) => u.status === s).length;

  return (
    <>
      <div className={styles.toolbar}>
        <TextInput
          type="search"
          aria-label="Zoek op naam of e-mailadres"
          placeholder="Zoek op naam of e-mail"
          icon={<Search />}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setLimit(PAGE_SIZE);
          }}
          className={styles.search}
        />
        <div className={styles.filters}>
          <Select
            aria-label="Filter op team"
            value={team}
            onChange={(e) => {
              setTeam(e.target.value);
              setLimit(PAGE_SIZE);
            }}
          >
            <option value="">Alle teams</option>
            {teams.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
          <Select
            aria-label="Filter op status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as Status | "");
              setLimit(PAGE_SIZE);
            }}
          >
            <option value="">Alle statussen</option>
            {(Object.keys(STATUS_LABELS) as Status[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]} ({countFor(s)})
              </option>
            ))}
          </Select>
        </div>
      </div>

      <p className={styles.resultCount} aria-live="polite">
        {filtering
          ? `${plural(filtered.length, "gebruiker", "gebruikers")} gevonden`
          : plural(users.length, "gebruiker", "gebruikers")}
      </p>

      {filtered.length === 0 ? (
        <div className={styles.empty}>
          <EmptyState
            icon={<UsersIcon />}
            title="Geen gebruikers gevonden"
            variant="plain"
            action={
              <Button variant="secondary" size="sm" onClick={resetFilters}>
                Filters wissen
              </Button>
            }
          >
            Pas je zoekterm of filters aan, of nodig deze collega uit.
          </EmptyState>
        </div>
      ) : (
        <Table label="Gebruikers" minWidth={0} bare containerClassName={styles.tableWrap} className={styles.table}>
          <THead>
            <Tr>
              <Th
                className={styles.userCell}
                sort={sort?.key === "name" ? sort.dir : false}
                onSort={() => toggleSort("name")}
              >
                Gebruiker
              </Th>
              <Th className={styles.fromMd}>Team</Th>
              <Th className={styles.fromSm}>Rol</Th>
              <Th className={styles.fromSm}>Status</Th>
              <Th
                className={styles.fromLg}
                sort={sort?.key === "lastActive" ? sort.dir : false}
                onSort={() => toggleSort("lastActive")}
              >
                Laatst actief
              </Th>
              <Th shrink>
                <VisuallyHidden>Acties</VisuallyHidden>
              </Th>
            </Tr>
          </THead>
          <TBody>
            {visible.map((user, i) => (
              <Row
                key={user.id}
                user={user}
                index={i}
                today={today}
                freeSeats={freeSeats}
                actions={actions}
                onOpenRole={() => setRoleTarget(user)}
                onOpenDeactivate={() => setDeactivateTarget(user)}
              />
            ))}
          </TBody>
        </Table>
      )}

      {filtered.length > limit && (
        <div className={styles.more}>
          <Button variant="secondary" size="sm" onClick={() => setLimit((l) => l + PAGE_SIZE)}>
            Toon meer ({filtered.length - limit})
          </Button>
        </div>
      )}

      <RoleDialog
        user={roleTarget}
        onClose={() => setRoleTarget(null)}
        onSave={(user, role) => actions.onRoleChange(user, role)}
      />

      <ConfirmDialog
        open={deactivateTarget !== null}
        onOpenChange={(open) => !open && setDeactivateTarget(null)}
        variant="danger"
        title={deactivateTarget ? `${displayName(deactivateTarget)} deactiveren?` : "Gebruiker deactiveren?"}
        description="Deze collega kan direct niet meer inloggen en de licentie komt vrij. Voortgang, punten en certificaten blijven bewaard, dus je kunt later weer heractiveren."
        confirmLabel="Deactiveren"
        onConfirm={async () => {
          if (!deactivateTarget) return;
          await actions.onDeactivate(deactivateTarget);
        }}
      />
    </>
  );
}

type RowProps = {
  user: OrgUser;
  index: number;
  today: string;
  freeSeats: number;
  actions: UserActions;
  onOpenRole: () => void;
  onOpenDeactivate: () => void;
};

function Row({ user, index, today, freeSeats, actions, onOpenRole, onOpenDeactivate }: RowProps) {
  const [resending, setResending] = useState(false);
  const name = displayName(user);
  const inactive = user.status === "gedeactiveerd";

  const activity =
    user.status === "uitgenodigd"
      ? `Uitgenodigd ${formatShortDate(user.invitedAt!)}`
      : inactive
        ? `Gedeactiveerd ${formatShortDate(user.lastActiveAt!)}`
        : user.lastActiveAt
          ? formatShortDate(user.lastActiveAt)
          : "Nog niet ingelogd";

  async function resend() {
    setResending(true);
    await actions.onResend(user);
    setResending(false);
  }

  return (
    <Tr
      selected={user.isMe}
      className={clsx(styles.row, inactive && styles.inactive)}
      style={{ "--i": Math.min(index, 12) } as React.CSSProperties}
    >
      <Td className={styles.userCell}>
        <div className={styles.user}>
          <span className={styles.avatar}>
            <Avatar initials={user.initials} size={32} />
          </span>
          <div className={styles.userText}>
            <p className={styles.name}>
              <span className={styles.nameText}>{user.name ?? user.email}</span>
              {user.isMe && (
                <Badge size="sm" variant="brand">
                  Jij
                </Badge>
              )}
            </p>
            <p className={styles.email}>{user.name ? user.email : "Nog niet ingelogd"}</p>
            {/* Op mobiel staan team, rol en status hier, omdat die kolommen dan verborgen zijn. */}
            <div className={styles.compactMeta}>
              <UserStatus user={user} today={today} />
              <span>
                {ROLE_LABELS[user.role]} · {user.team}
              </span>
            </div>
          </div>
        </div>
      </Td>
      <Td muted className={styles.fromMd}>
        {user.team}
      </Td>
      <Td className={styles.fromSm}>
        <Select
          aria-label={`Rol van ${name}`}
          value={user.role}
          disabled={user.isMe || inactive}
          title={user.isMe ? "Je kunt je eigen rol niet wijzigen" : undefined}
          onChange={(e) => actions.onRoleChange(user, e.target.value as OrgRole)}
          className={styles.roleSelect}
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </Select>
      </Td>
      <Td className={styles.fromSm}>
        <UserStatus user={user} today={today} />
      </Td>
      <Td muted className={clsx(styles.fromLg, styles.activity)}>
        {activity}
      </Td>
      <Td shrink>
        <Menu>
          <MenuTrigger
            variant="ghost"
            size="sm"
            iconOnly
            aria-label={`Acties voor ${name}`}
            className={clsx(styles.menuTrigger, resending && styles.busyTrigger)}
          >
            <MoreHorizontal aria-hidden />
          </MenuTrigger>
          <MenuContent width={240}>
            {user.status !== "gedeactiveerd" && (
              <MenuItem
                icon={<ShieldCheck />}
                onSelect={onOpenRole}
                disabled={user.isMe}
                description={user.isMe ? "Dit kan een andere beheerder doen" : ROLE_LABELS[user.role]}
              >
                Rol wijzigen
              </MenuItem>
            )}
            {user.status === "uitgenodigd" && (
              <>
                <MenuItem icon={<Send />} onSelect={resend} disabled={resending}>
                  Opnieuw uitnodigen
                </MenuItem>
                <MenuSeparator />
                <MenuItem icon={<UserX />} danger onSelect={() => actions.onRevoke(user)}>
                  Uitnodiging intrekken
                </MenuItem>
              </>
            )}
            {user.status === "actief" && (
              <>
                <MenuSeparator />
                <MenuItem
                  icon={<UserMinus />}
                  danger
                  disabled={user.isMe}
                  description={user.isMe ? "Je kunt jezelf niet deactiveren" : undefined}
                  onSelect={onOpenDeactivate}
                >
                  Deactiveren
                </MenuItem>
              </>
            )}
            {inactive && (
              <MenuItem
                icon={freeSeats > 0 ? <UserCheck /> : <RotateCcw />}
                disabled={freeSeats <= 0}
                description={freeSeats > 0 ? "Bezet weer een licentie" : "Geen licentie vrij"}
                onSelect={() => actions.onReactivate(user)}
              >
                Heractiveren
              </MenuItem>
            )}
          </MenuContent>
        </Menu>
      </Td>
    </Tr>
  );
}

function RoleDialog({
  user,
  onClose,
  onSave,
}: {
  user: OrgUser | null;
  onClose: () => void;
  onSave: (user: OrgUser, role: OrgRole) => Promise<void>;
}) {
  const [role, setRole] = useState<OrgRole>("cursist");
  const [busy, setBusy] = useState(false);
  const [seen, setSeen] = useState<OrgUser | null>(null);
  const [current, setCurrent] = useState<OrgUser | null>(null);

  // Bij elk openen beginnen bij de huidige rol. `current` blijft staan tijdens de sluitanimatie.
  if (user !== seen) {
    setSeen(user);
    if (user) {
      setCurrent(user);
      setRole(user.role);
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!current) return;
    if (role === current.role) return onClose();
    setBusy(true);
    await onSave(current, role);
    setBusy(false);
    onClose();
  }

  return (
    <Dialog
      open={user !== null}
      onOpenChange={(open) => !open && !busy && onClose()}
      title="Rol wijzigen"
      description={current ? `Wat mag ${displayName(current)} in AI Academy?` : undefined}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Annuleren
          </Button>
          <Button type="submit" form="role-form" loading={busy}>
            Opslaan
          </Button>
        </>
      }
    >
      <form id="role-form" onSubmit={save}>
        <RadioGroup label="Rol" hideLabel value={role} onValueChange={(v) => setRole(v as OrgRole)}>
          {ROLES.map((r) => (
            <Radio key={r} value={r} label={ROLE_LABELS[r]} description={ROLE_DESCRIPTIONS[r]} />
          ))}
        </RadioGroup>
      </form>
    </Dialog>
  );
}
