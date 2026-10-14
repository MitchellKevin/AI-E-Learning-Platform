import { AppHeader } from "@/components/app-header";
import { MainRegion, SkipLink } from "@/components/shell/skip-link";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SkipLink />
      <AppHeader />
      <MainRegion>{children}</MainRegion>
    </>
  );
}
