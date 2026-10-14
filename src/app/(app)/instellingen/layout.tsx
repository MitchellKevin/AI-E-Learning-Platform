import { PageHeader } from "@/components/kit";
import { SettingsProvider } from "@/components/settings/settings-context";
import { SettingsNav } from "@/components/settings/settings-nav";
import styles from "./layout.module.scss";

// Gedeelde schil voor alle instellingen: kop, sectienavigatie en de status van niet-opgeslagen wijzigingen.
export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <main>
      <PageHeader
        band
        breadcrumbs={[{ label: "Profiel", href: "/profiel" }, { label: "Instellingen" }]}
        title="Instellingen"
        lead="Bepaal hoe je leert, welke meldingen je krijgt en wat je collega's van je zien."
      />
      <SettingsProvider>
        <div className={styles.content}>
          <aside className={styles.aside}>
            <SettingsNav />
          </aside>
          <div className={styles.panel}>{children}</div>
        </div>
      </SettingsProvider>
    </main>
  );
}
