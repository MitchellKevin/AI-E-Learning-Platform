import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { Logo } from "./marketing-header";
import styles from "./marketing-footer.module.scss";

const columns = [
  {
    title: "Product",
    links: [
      { href: "/#product", label: "Functies" },
      { href: "/#leerpaden", label: "Leerpaden" },
      { href: "/prijzen", label: "Prijzen" },
      { href: "/demo", label: "Plan een demo" },
    ],
  },
  {
    title: "Help",
    links: [
      { href: "/help", label: "Helpcenter" },
      { href: "/prijzen#facturatie", label: "Vragen over facturatie" },
      { href: "/inloggen", label: "Inloggen" },
      { href: "mailto:hallo@aiacademy.nl", label: "hallo@aiacademy.nl" },
    ],
  },
  {
    title: "Juridisch",
    links: [
      { href: "/privacy", label: "Privacyverklaring" },
      { href: "/voorwaarden", label: "Algemene voorwaarden" },
      { href: "/cookies", label: "Cookies" },
      { href: "/toegankelijkheid", label: "Toegankelijkheid" },
    ],
  },
];

export function MarketingFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.top}>
          <div className={styles.brand}>
            <Logo className={styles.logo} />
            <p className={styles.pitch}>
              Het leerplatform waarmee design- en developmentteams effectief en verantwoord leren werken met AI.
            </p>
            <p className={styles.note}>
              <ShieldCheck aria-hidden />
              Hosting in de EU · AVG-proof
            </p>
          </div>

          {columns.map((column) => (
            <nav key={column.title} aria-labelledby={`footer-${column.title}`} className={styles.column}>
              <h2 id={`footer-${column.title}`} className={styles.columnTitle}>
                {column.title}
              </h2>
              <ul className={styles.links}>
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className={styles.link}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className={styles.bottom}>
          <p>© {new Date().getFullYear()} AI Academy</p>
          <p>Gemaakt in Amsterdam</p>
        </div>
      </div>
    </footer>
  );
}
