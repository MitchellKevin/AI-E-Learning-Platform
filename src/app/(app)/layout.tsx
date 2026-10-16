import { AppHeader } from "@/components/app-header";
import { MainRegion, SkipLink } from "@/components/shell/skip-link";
import { requireOnboardedUser } from "@/server/session";

// Alles in de app hangt af van de ingelogde gebruiker.
export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Niet ingelogd: naar inloggen. Intake nog niet afgerond: naar /welkom (uit de database, niet uit het token).
  await requireOnboardedUser();

  return (
    <>
      <SkipLink />
      <AppHeader />
      <MainRegion>{children}</MainRegion>
    </>
  );
}
