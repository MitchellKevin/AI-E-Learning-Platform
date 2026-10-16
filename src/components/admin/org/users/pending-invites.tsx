"use client";

import { useState } from "react";
import { MailCheck, Send, UserPlus } from "lucide-react";
import { Avatar, Badge, Button, EmptyState } from "@/components/kit";
import { ROLE_LABELS, formatShortDate, type OrgUser } from "@/lib/data/admin-org-shared";
import { expiryLabel, inviteDaysLeft } from "./user-status";
import styles from "./pending-invites.module.scss";

type Props = {
  invites: OrgUser[];
  today: string;
  onResend: (user: OrgUser) => Promise<void>;
  onRevoke: (user: OrgUser) => void;
  onInvite: () => void;
};

export function PendingInvites({ invites, today, onResend, onRevoke, onInvite }: Props) {
  if (invites.length === 0) {
    return (
      <EmptyState
        icon={<MailCheck />}
        title="Geen openstaande uitnodigingen"
        action={
          <Button variant="secondary" size="sm" icon={<UserPlus />} onClick={onInvite}>
            Gebruikers uitnodigen
          </Button>
        }
      >
        Iedereen die je hebt uitgenodigd, heeft een account aangemaakt.
      </EmptyState>
    );
  }

  // Wat het eerst verloopt bovenaan.
  const sorted = [...invites].sort((a, b) => Date.parse(a.invitedAt ?? "") - Date.parse(b.invitedAt ?? ""));

  return (
    <ul className={styles.list}>
      {sorted.map((invite) => (
        <Invite key={invite.id} invite={invite} today={today} onResend={onResend} onRevoke={onRevoke} />
      ))}
    </ul>
  );
}

function Invite({
  invite,
  today,
  onResend,
  onRevoke,
}: {
  invite: OrgUser;
  today: string;
  onResend: Props["onResend"];
  onRevoke: Props["onRevoke"];
}) {
  const [busy, setBusy] = useState(false);
  const daysLeft = invite.invitedAt ? inviteDaysLeft(invite.invitedAt, today) : 14;
  const variant = daysLeft < 0 ? "danger" : daysLeft <= 2 ? "warning" : "neutral";

  async function resend() {
    setBusy(true);
    await onResend(invite);
    setBusy(false);
  }

  return (
    <li className={styles.item}>
      <span className={styles.avatar}>
        <Avatar initials={invite.initials} size={32} />
      </span>
      <div className={styles.text}>
        <p className={styles.email}>{invite.email}</p>
        <p className={styles.meta}>
          {ROLE_LABELS[invite.role]} in {invite.team}
          {invite.invitedAt && (
            <>
              {" "}
              · {invite.invitedBy ? `door ${invite.invitedBy} ` : ""}op {formatShortDate(invite.invitedAt)}
            </>
          )}
        </p>
      </div>
      <Badge size="sm" variant={variant} className={styles.expiry}>
        {expiryLabel(daysLeft)}
      </Badge>
      <div className={styles.buttons}>
        <Button
          variant="secondary"
          size="sm"
          icon={<Send />}
          loading={busy}
          onClick={resend}
          aria-label={`Uitnodiging opnieuw versturen naar ${invite.email}`}
        >
          Opnieuw versturen
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRevoke(invite)}
          disabled={busy}
          aria-label={`Uitnodiging voor ${invite.email} intrekken`}
        >
          Intrekken
        </Button>
      </div>
    </li>
  );
}
