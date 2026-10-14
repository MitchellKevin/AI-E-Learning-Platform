import type { Metadata } from "next";
import { getDomainSettings, getOrgUsers, getSeatTotal, getSso, getTeams } from "@/lib/data/admin-org";
import { UsersAdmin } from "@/components/admin/org/users/users-admin";
import { DomainSettings } from "@/components/admin/org/users/domain-settings";
import { SsoCard } from "@/components/admin/org/users/sso-card";
import { AdminPage } from "@/components/admin/org/admin-page";
import styles from "./page.module.scss";

export const metadata: Metadata = { title: "Gebruikers · Beheer · AI Academy" };

// Vervaldatums van uitnodigingen hangen af van vandaag.
export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const [users, teams, seatTotal, domains, sso] = await Promise.all([
    getOrgUsers(),
    getTeams(),
    getSeatTotal(),
    getDomainSettings(),
    getSso(),
  ]);

  return (
    <AdminPage>
      <UsersAdmin initialUsers={users} teams={teams} seatTotal={seatTotal} today={new Date().toISOString()} />
      <div className={styles.grid}>
        <DomainSettings initial={domains} teams={teams} />
        <SsoCard initial={sso} />
      </div>
    </AdminPage>
  );
}
