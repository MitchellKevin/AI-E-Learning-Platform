import { StatusPill } from "@/components/kit";
import { INVITE_VALID_DAYS, STATUS_LABELS, daysBetween, type OrgUser } from "@/lib/data/admin-org-shared";

/** Dagen tot een uitnodiging verloopt; negatief = verlopen. */
export const inviteDaysLeft = (invitedAt: string, today: string) => INVITE_VALID_DAYS - daysBetween(invitedAt, today);

export function expiryLabel(daysLeft: number) {
  if (daysLeft < 0) return "Verlopen";
  if (daysLeft === 0) return "Verloopt vandaag";
  if (daysLeft === 1) return "Verloopt morgen";
  return `Nog ${daysLeft} dagen geldig`;
}

export const displayName = (user: OrgUser) => user.name ?? user.email;

export function UserStatus({ user, today }: { user: OrgUser; today: string }) {
  if (user.status === "actief")
    return (
      <StatusPill variant="success" size="sm">
        Actief
      </StatusPill>
    );
  if (user.status === "gedeactiveerd") return <StatusPill size="sm">Gedeactiveerd</StatusPill>;
  const expired = user.invitedAt ? inviteDaysLeft(user.invitedAt, today) < 0 : false;
  return (
    <StatusPill variant={expired ? "danger" : "warning"} size="sm">
      {expired ? "Uitnodiging verlopen" : STATUS_LABELS.uitgenodigd}
    </StatusPill>
  );
}
