"use client";

import { useMemo, useState } from "react";
import { Download, UserPlus } from "lucide-react";
import { Button, PageHeader, useToast } from "@/components/kit";
import { ROLE_LABELS, STATUS_LABELS, seatUsage, type OrgRole, type OrgUser } from "@/lib/data/admin-org-shared";
import { Panel } from "../panel";
import { plural } from "../utils";
import { downloadCsv, csvFilename } from "@/components/admin/shell/csv";
import { errorMessage, unwrap } from "@/lib/action-result";
import { createInvitesAction, revokeInviteAction, setUserRoleAction, setUserStatusAction } from "@/server/actions/admin-org";
import { sendRemindersAction } from "@/server/actions/admin-team";
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

  // Elke wijziging gaat via een server action; het scherm werkt pas bij als de server akkoord is.
  function fail(error: unknown) {
    toast({ variant: "error", title: "Dat lukte niet", description: errorMessage(error, "Probeer het opnieuw.") });
  }

  async function changeRole(user: OrgUser, role: OrgRole) {
    try {
      unwrap(await setUserRoleAction(user.id, role));
    } catch (error) {
      return fail(error);
    }
    update(user.id, { role });
    toast({
      variant: "success",
      title: "Rol gewijzigd",
      description: `${displayName(user)} is nu ${ROLE_LABELS[role].toLowerCase()}.`,
      action: {
        label: "Ongedaan maken",
        onClick: () => setUserRoleAction(user.id, user.role).then(unwrap).then(() => restore(user), fail),
      },
    });
  }

  async function deactivate(user: OrgUser) {
    try {
      unwrap(await setUserStatusAction(user.id, "gedeactiveerd"));
    } catch (error) {
      return fail(error);
    }
    update(user.id, { status: "gedeactiveerd", lastActiveAt: new Date().toISOString() });
    toast({
      variant: "success",
      title: `${displayName(user)} is gedeactiveerd`,
      description: "De licentie is vrijgekomen.",
      action: {
        label: "Ongedaan maken",
        onClick: () => setUserStatusAction(user.id, "actief").then(unwrap).then(() => restore(user), fail),
      },
    });
  }

  async function reactivate(user: OrgUser) {
    if (freeSeats <= 0) {
      toast({ variant: "error", title: "Geen licentie vrij", description: "Breid eerst je abonnement uit." });
      return;
    }
    try {
      unwrap(await setUserStatusAction(user.id, "actief"));
    } catch (error) {
      return fail(error);
    }
    update(user.id, { status: "actief" });
    toast({
      variant: "success",
      title: `${displayName(user)} is weer actief`,
      description: "Er is een licentie toegewezen.",
    });
  }

  async function resend(user: OrgUser) {
    try {
      unwrap(await sendRemindersAction([user.id]));
    } catch (error) {
      return fail(error);
    }
    update(user.id, { invitedAt: new Date().toISOString() });
    toast({
      variant: "success",
      title: "Uitnodiging opnieuw verstuurd",
      description: `${user.email} krijgt een nieuwe link.`,
    });
  }

  async function revoke(user: OrgUser) {
    try {
      unwrap(await revokeInviteAction(user.id));
    } catch (error) {
      return fail(error);
    }
    const index = users.findIndex((u) => u.id === user.id);
    setUsers((list) => list.filter((u) => u.id !== user.id));
    toast({
      title: "Uitnodiging ingetrokken",
      description: `De link voor ${user.email} werkt niet meer.`,
      action: {
        label: "Ongedaan maken",
        onClick: () =>
          revokeInviteAction(user.id, true).then(unwrap).then(
            () =>
              setUsers((list) =>
                list.some((u) => u.id === user.id) ? list : [...list.slice(0, index), user, ...list.slice(index)],
              ),
            fail,
          ),
      },
    });
  }

  async function invite(newInvites: NewInvite[]) {
    let created: OrgUser[];
    try {
      created = unwrap(await createInvitesAction(newInvites));
    } catch (error) {
      fail(error);
      throw error;
    }
    if (created.length === 0) return;
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
    const filename = csvFilename("gebruikers", today);
    downloadCsv(
      filename,
      ["Naam", "E-mail", "Team", "Rol", "Status", "Laatst actief / uitgenodigd"],
      users.map((u) => [u.name ?? "", u.email, u.team, ROLE_LABELS[u.role], STATUS_LABELS[u.status], u.lastActiveAt ?? u.invitedAt ?? ""]),
    );
    toast({ variant: "success", title: "Export gedownload", description: filename });
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
