import Link from "next/link";
import { ArrowRight, BookOpen, LayoutDashboard, LifeBuoy, Sparkles } from "lucide-react";
import { getSearchIndex } from "@/lib/data/shell";
import { ArrowButton, Button } from "@/components/kit";
import { CommandPalette } from "@/components/shell/command-palette";
import styles from "./not-found.module.scss";

const destinations = [
  {
    href: "/dashboard",
    title: "Dashboard",
    text: "Ga verder waar je gebleven was.",
    icon: <LayoutDashboard />,
  },
  {
    href: "/leerpaden",
    title: "Leerpaden",
    text: "AI 101 en de specialisaties voor design en development.",
    icon: <BookOpen />,
  },
  {
    href: "/oefenen",
    title: "Oefenen",
    text: "Schrijf prompts en krijg direct feedback.",
    icon: <Sparkles />,
  },
  {
    href: "/help",
    title: "Helpcentrum",
    text: "Antwoorden op veelgestelde vragen.",
    icon: <LifeBuoy />,
  },
];

// Vriendelijke 404 voor alle routes; staat buiten de app-layout, dus met een eigen kleine kop.
export default async function NotFound() {
  const index = await getSearchIndex();

  return (
    <div className={styles.page}>
      <header className={styles.top}>
        <Link href="/dashboard" className={styles.logo} aria-label="AI Academy, naar je dashboard">
          <span className={styles.logoMark} aria-hidden>
            AI
          </span>
          <span aria-hidden>Academy</span>
        </Link>
      </header>

      <main className={styles.main}>
        <div className={styles.intro}>
          <p className={styles.code}>Foutcode 404</p>
          <h1 className={styles.title}>Deze pagina konden we niet vinden</h1>
          <p className={styles.lead}>
            Misschien is de link verouderd of zit er een typfout in het adres. Zoek wat je nodig hebt, of ga terug
            naar je dashboard.
          </p>
        </div>

        <div className={styles.search}>
          <CommandPalette index={index} variant="field" />
        </div>

        <div className={styles.actions}>
          <ArrowButton href="/dashboard">Naar je dashboard</ArrowButton>
          <Button href="/help" variant="secondary" size="lg">
            Naar het helpcentrum
          </Button>
        </div>

        <section aria-labelledby="nf-destinations" className={styles.destinations}>
          <h2 id="nf-destinations" className={styles.destinationsTitle}>
            Of kies een van deze plekken
          </h2>
          <ul className={styles.grid}>
            {destinations.map((d) => (
              <li key={d.href}>
                <Link href={d.href} className={styles.card}>
                  <span className={styles.cardIcon} aria-hidden>
                    {d.icon}
                  </span>
                  <span className={styles.cardText}>
                    <span className={styles.cardTitle}>{d.title}</span>
                    <span className={styles.cardBody}>{d.text}</span>
                  </span>
                  <ArrowRight aria-hidden className={styles.cardArrow} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
