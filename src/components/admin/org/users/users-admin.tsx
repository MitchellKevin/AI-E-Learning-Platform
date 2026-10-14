"use client";

import { useMemo, useState } from "react";
import { Download, UserPlus } from "lucide-react";
import { Button, PageHeader, useToast } from "@/components/kit";
import { ROLE_LABELS, initialsFromEmail, seatUsage, type OrgRole, type OrgUser } from "@/lib/data/admin-org";
import { Panel } from "../panel";
import { plural, wait } from "../utils";
import { InviteDialog, type NewInvite } from "./invite-dialog";
import { PendingInvites } from "./pending-invites";
import { SeatsMeter } from "./seats-meter";
import { UsersTable } from "./users-table";
import { displayName } from "./user-status";
import styles from "./users-admin.module.scss";

type Props = {
  initialUsers: OrgUser[];
  teams: string[];
  seatTotal: number;
  today: string;
};

// Gebruikersbeheer: één bron van waarheid voor tabel, licentiemeter en uitnodigingen.
export function UsersAdmin({ initialUsers, teams, seatTotal, today }: Props) {
  const [users, setUsers] = useState(initialUsers);
  const [inviteOpen, setInviteOpen] = useState(false);
  const { toast } = useToast();

  const usage = seatUsage(users, seatTotal);
  const freeSeats = Math.max(0, usage.total - usage.active - usage.invited);
  const invites = users.filter((u) => u.status === "uitgenodigd");

  const existing = useMemo(
    () =>
      new Map(
        users
          .filter((u) => u.status !== "gedeactiveerd")
          .map((u) => [u.email.toLowerCase(), u.status === "uitgenodigd" ? "invited" : "member"] as const),
      ),
    [users],
  );

  // Vervangt één gebruiker; geeft de vorige versie terug voor "Ongedaan maken".
  function update(id: string, patch: Partial<OrgUser>) {
    setUsers((list) => list.map((u) => (u.id === id ? { ...u, ...patch } : u)));
  }

  function restore(previous: OrgUser) {
    setUsers((list) => list.map((u) => (u.id === previous.id ? previous : u)));
  }

  // Straks: elke handler hieronder roept een server action aan; nu werken we de lijst optimistisch bij.

  function changeRole(user: OrgUser, role: OrgRole) {
    update(user.id, { role });
    toast({
      variant: "success",
      title: "Rol gewijzigd",
      description: `${displayName(user)} is nu ${ROLE_LABELS[role].toLowerCase()}.`,
      action: { label: "Ongedaan maken", onClick: () => restore(user) },
    });
  }

  function deactivate(user: OrgUser) {
    update(user.id, { status: "gedeactiveerd", lastActiveAt: new Date().toISOString() });
    toast({
      variant: "success",
      title: `${displayName(user)} is gedeactiveerd`,
      description: "De licentie is vrijgekomen.",
      action: { label: "Ongedaan maken", onClick: () => restore(user) },
    });
  }

  function reactivate(user: OrgUser) {
    if (freeSeats <= 0) {
      toast({ variant: "error", title: "Geen licentie vrij", description: "Breid eerst je abonnement uit." });
      return;
    }
    update(user.id, { status: "actief" });
    toast({
      variant: "success",
      title: `${displayName(user)} is weer actief`,
      description: "Er is een licentie toegewezen.",
    });
  }

  async function resend(user: OrgUser) {
    await wait(700);
    update(user.id, { invitedAt: new Date().toISOString(), invitedBy: "Sanne Visser" });
    toast({
      variant: "success",
      title: "Uitnodiging opnieuw verstuurd",
      description: `${user.email} krijgt een nieuwe link.`,
    });
  }

  function revoke(user: OrgUser) {
    const index = users.findIndex((u) => u.id === user.id);
    setUsers((list) => list.filter((u) => u.id !== user.id));
    toast({
      title: "Uitnodiging ingetrokken",
      description: `De link voor ${user.email} werkt niet meer.`,
      action: {
        label: "Ongedaan maken",
        onClick: () =>
          setUsers((list) =>
            list.some((u) => u.id === user.id) ? list : [...list.slice(0, index), user, ...list.slice(index)],
          ),
      },
    });
  }

  function invite(newInvites: NewInvite[]) {
    const now = new Date().toISOString();
    const created: OrgUser[] = newInvites.map((inv, i) => ({
      id: `inv_${Date.now()}_${i}`,
      name: null,
      initials: initialsFromEmail(inv.email),
      email: inv.email,
      team: inv.team,
      role: inv.role,
      status: "uitgenodigd",
      invitedAt: now,
      invitedBy: "Sanne Visser",
    }));
    setUsers((list) => [...list, ...created]);
    toast({
      variant: "success",
      title: created.length === 1 ? "Uitnodiging verstuurd" : `${created.length} uitnodigingen verstuurd`,
      description:
        created.length === 1
          ? `${created[0].email} krijgt een e-mail met een persoonlijke link.`
          : "Je collega's krijgen een e-mail met een persoonlijke link.",
    });
  }

  function exportCsv() {
    // Straks: export via de API; nu een melding.
    toast({ title: "Export wordt voorbereid", description: "Je krijgt de CSV binnen een paar minuten per e-mail." });
  }

  return (
    <>
      <PageHeader
        title="Gebruikers"
        lead="Nodig collega's uit, bepaal wat ze mogen en houd zicht op je licenties."
        actions={
          <>
            <Button variant="secondary" icon={<Download />} onClick={exportCsv}>
              Exporteren
            </Button>
            <Button icon={<UserPlus />} onClick={() => setInviteOpen(true)}>
              Gebruikers uitnodigen
            </Button>
          </>
        }
      />

      <SeatsMeter usage={usage} />

      <Panel
        title="Alle gebruikers"
        description="Actieve en uitgenodigde collega's bezetten een licentie. Gedeactiveerde collega's niet."
        flush
        className={styles.tablePanel}
      >
        <UsersTable
          users={users}
          teams={teams}
          today={today}
          freeSeats={freeSeats}
          onRoleChange={changeRole}
          onDeactivate={deactivate}
          onReactivate={reactivate}
          onResend={resend}
          onRevoke={revoke}
        />
      </Panel>

      <Panel
        title="Openstaande uitnodigingen"
        description={
          invites.length
            ? `${plural(invites.length, "collega heeft", "collega's hebben")} nog geen account aangemaakt. Een link is 14 dagen geldig.`
            : undefined
        }
        flush={invites.length > 0}
      >
        <PendingInvites
          invites={invites}
          today={today}
          onResend={resend}
          onRevoke={revoke}
          onInvite={() => setInviteOpen(true)}
        />
      </Panel>

      <InviteDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        teams={teams}
        existing={existing}
        freeSeats={freeSeats}
        onInvite={invite}
      />
    </>
  );
}
