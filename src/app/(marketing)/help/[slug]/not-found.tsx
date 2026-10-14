import { FileQuestion, Mail } from "lucide-react";
import { Button, EmptyState } from "@/components/kit";
import { getSupportInfo } from "@/lib/data/help";
import styles from "./page.module.scss";

// Onbekend of verwijderd artikel: terug naar het helpcentrum, of direct support mailen.
export default async function HelpArticleNotFound() {
  const support = await getSupportInfo();

  return (
    <main className={styles.content}>
      <h1 className="sr-only">Artikel niet gevonden</h1>
      <EmptyState
        icon={<FileQuestion />}
        title="Dit artikel bestaat niet (meer)"
        headingLevel={2}
        action={
          <div className={styles.notFoundActions}>
            <Button href="/help">Naar het helpcentrum</Button>
            <Button href={`mailto:${support.email}`} variant="secondary" icon={<Mail />}>
              Mail support
            </Button>
          </div>
        }
      >
        Misschien is het artikel verplaatst of heeft het een nieuwe titel gekregen. Zoek in het helpcentrum, of stel je
        vraag direct aan ons supportteam.
      </EmptyState>
    </main>
  );
}
