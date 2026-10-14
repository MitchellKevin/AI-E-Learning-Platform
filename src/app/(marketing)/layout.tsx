import { CookieBanner } from "@/components/marketing/cookie-banner";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import styles from "./layout.module.scss";

// Publieke site: eigen header en footer, geen app-header.
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <MarketingHeader />
      <div id="inhoud" tabIndex={-1} className={styles.content}>
        {children}
      </div>
      <MarketingFooter />
      <CookieBanner />
    </>
  );
}
