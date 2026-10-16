import {
  BarChart3,
  Building2,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  UserCog,
  Users,
} from "lucide-react";
import { getOrganization } from "@/lib/data/admin-team";
import { requireRole } from "@/server/session";
import { Badge, TabLinks, type TabLinkItem } from "@/components/kit";
import styles from "./layout.module.scss";

// Gebruikers, abonnement en organisatie zijn alleen voor beheerders.
const adminOnly = new Set(["/beheer/gebruikers", "/beheer/abonnement", "/beheer/organisatie"]);

const navItems: TabLinkItem[] = [
  { href: "/beheer", label: "Overzicht", icon: <LayoutDashboard />, exact: true },
  { href: "/beheer/team", label: "Team", icon: <Users /> },
  { href: "/beheer/toewijzingen", label: "Toewijzingen", icon: <ClipboardList /> },
  { href: "/beheer/rapportages", label: "Rapportages", icon: <BarChart3 /> },
  { href: "/beheer/gebruikers", label: "Gebruikers", icon: <UserCog /> },
  { href: "/beheer/abonnement", label: "Abonnement", icon: <CreditCard /> },
  { href: "/beheer/organisatie", label: "Organisatie", icon: <Building2 /> },
];

// Schil voor het hele beheergedeelte: organisatiekop, subnavigatie en de paginacontainer.
// Pagina's hieronder renderen zelf geen <main> en geen container.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const [org, user] = await Promise.all([getOrganization(), requireRole("manager")]);
  const items = user.role === "admin" ? navItems : navItems.filter((item) => !adminOnly.has(item.href));
  const seatsLeft = org.seats - org.seatsUsed;

  return (
    <main className={styles.main}>
      <div className={styles.band}>
        <div className={styles.bandInner}>
          <div className={styles.org}>
            <span className={styles.orgMark} aria-hidden>
              {org.name
                .split(" ")
                .map((w) => w[0])
                .join("")}
            </span>
            <div className={styles.orgText}>
              <p className={styles.eyebrow}>Beheer</p>
              <p className={styles.orgName}>{org.name}</p>
            </div>
          </div>
          <div className={styles.orgMeta}>
            <Badge variant="brand" size="sm">
              {org.plan}abonnement
            </Badge>
            <span>
              {org.seatsUsed} van {org.seats} licenties in gebruik
              {seatsLeft > 0 && <span className={styles.seatsLeft}> · nog {seatsLeft} vrij</span>}
            </span>
          </div>
        </div>
        <div className={styles.navWrap}>
          <TabLinks aria-label="Beheer" items={items} className={styles.nav} />
        </div>
      </div>
      <div className={styles.content}>{children}</div>
    </main>
  );
}
