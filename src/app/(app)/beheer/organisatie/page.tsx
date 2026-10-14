import type { Metadata } from "next";
import { getAuditLog, getOrgProfile, getOrgUsers, getPrivacySettings } from "@/lib/data/admin-org";
import { formatDate } from "@/lib/format";
import { AdminPage } from "@/components/admin/org/admin-page";
import { PageHeader } from "@/components/kit";
import { OrgProfileForm } from "@/components/admin/org/organisation/org-profile-form";
import { DataPrivacy } from "@/components/admin/org/organisation/data-privacy";
import { AuditLog } from "@/components/admin/org/organisation/audit-log";
import { DangerZone } from "@/components/admin/org/organisation/danger-zone";

export const metadata: Metadata = { title: "Organisatie · Beheer · AI Academy" };

export default async function OrganisationPage() {
  const [profile, privacy, auditLog, users] = await Promise.all([
    getOrgProfile(),
    getPrivacySettings(),
    getAuditLog(),
    getOrgUsers(),
  ]);

  return (
    <AdminPage>
      <PageHeader
        title="Organisatie"
        lead={`Profiel, privacy-afspraken en het logboek van ${profile.legalName}. Klant sinds ${formatDate(profile.memberSince)}.`}
      />
      <OrgProfileForm initial={profile} />
      <DataPrivacy initial={privacy} />
      <AuditLog entries={auditLog} />
      <DangerZone orgName={profile.name} userCount={users.filter((u) => u.status !== "uitgenodigd").length} />
    </AdminPage>
  );
}
