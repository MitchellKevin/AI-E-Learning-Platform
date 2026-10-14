import type { Metadata } from "next";
import Link from "next/link";
import { BarChart3, Lock, Megaphone } from "lucide-react";
import { Badge, Table, TBody, THead, Td, Th, Tr, type BadgeVariant } from "@/components/kit";
import { CookiePreferencesCard } from "@/components/marketing/cookie-banner";
import { LegalCards, LegalLayout, type LegalSection } from "@/components/marketing/legal-layout";
import { getCompanyInfo, getCookieList, getLegalDates, type CookieCategory } from "@/lib/data/help";
import styles from "./page.module.scss";

export const metadata: Metadata = {
  title: "Cookiebeleid · AI Academy",
  description: "Welke cookies AI Academy gebruikt, waarvoor, hoe lang ze blijven staan en hoe je je keuze aanpast.",
};

const categoryMeta: Record<CookieCategory, { label: string; variant: BadgeVariant }> = {
  noodzakelijk: { label: "Noodzakelijk", variant: "brand" },
  analytisch: { label: "Analytisch", variant: "neutral" },
  marketing: { label: "Marketing", variant: "warning" },
};

const order: CookieCategory[] = ["noodzakelijk", "analytisch", "marketing"];

export default async function CookiesPage() {
  const [cookies, dates, company] = await Promise.all([getCookieList(), getLegalDates(), getCompanyInfo()]);
  const sorted = [...cookies].sort((a, b) => order.indexOf(a.category) - order.indexOf(b.category));
  const count = (category: CookieCategory) => cookies.filter((c) => c.category === category).length;

  const sections: LegalSection[] = [
    {
      id: "wat-zijn-cookies",
      title: "Wat zijn cookies?",
      content: (
        <>
          <p>
            Cookies zijn kleine tekstbestanden die een website in je browser opslaat. Daarnaast gebruiken we soms de
            lokale opslag van je browser (localStorage), bijvoorbeeld om je cookiekeuze te onthouden. Voor het gemak
            noemen we dat hier allemaal cookies.
          </p>
          <p>
            We houden het aantal bewust klein. In de leeromgeving zelf gebruiken we alleen noodzakelijke cookies; de
            meetcookies staan alleen op de publieke website.
          </p>
        </>
      ),
    },
    {
      id: "categorieen",
      title: "Drie categorieën",
      content: (
        <LegalCards
          items={[
            {
              icon: <Lock />,
              title: `Noodzakelijk (${count("noodzakelijk")})`,
              text: "Om in te loggen, je voortgang te bewaren en formulieren te beveiligen. Hiervoor is geen toestemming nodig.",
            },
            {
              icon: <BarChart3 />,
              title: `Analytisch (${count("analytisch")})`,
              text: "Anonieme statistieken via onze eigen Matomo-server in de EU. Alleen met je toestemming.",
            },
            {
              icon: <Megaphone />,
              title: `Marketing (${count("marketing")})`,
              text: "Meten of LinkedIn-advertenties tot een demo-aanvraag leiden. Alleen met je toestemming.",
            },
          ]}
        />
      ),
    },
    {
      id: "overzicht",
      title: "Overzicht van alle cookies",
      content: (
        <>
          <p>Dit zijn alle cookies en opslagitems die AI Academy kan plaatsen.</p>
          <Table label="Cookies van AI Academy" minWidth={680}>
            <THead>
              <Tr>
                <Th>Naam</Th>
                <Th>Doel</Th>
                <Th>Bewaartermijn</Th>
                <Th>Categorie</Th>
              </Tr>
            </THead>
            <TBody>
              {sorted.map((cookie) => (
                <Tr key={cookie.name}>
                  <Td>
                    <code className={styles.name}>{cookie.name}</code>
                    <span className={styles.provider}>
                      {cookie.provider} · {cookie.kind === "cookie" ? "Cookie" : "Lokale opslag"}
                    </span>
                  </Td>
                  <Td className={styles.purpose}>{cookie.purpose}</Td>
                  <Td muted>{cookie.retention}</Td>
                  <Td>
                    <Badge size="sm" variant={categoryMeta[cookie.category].variant}>
                      {categoryMeta[cookie.category].label}
                    </Badge>
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        </>
      ),
    },
    {
      id: "je-keuze",
      title: "Je keuze aanpassen",
      content: (
        <>
          <p>
            Bij je eerste bezoek vragen we welke cookies je toestaat. Je keuze geldt 12 maanden; daarna vragen we het
            opnieuw. Je kunt hem hier altijd wijzigen.
          </p>
          <CookiePreferencesCard />
          <p>
            Trek je je toestemming in, dan plaatsen we geen nieuwe analytische of marketingcookies meer. Cookies die al
            zijn geplaatst, verwijder je via je browser.
          </p>
        </>
      ),
    },
    {
      id: "verwijderen",
      title: "Cookies verwijderen via je browser",
      content: (
        <>
          <p>
            In elke browser kun je cookies bekijken en verwijderen. Je vindt dit meestal onder{" "}
            <strong>Instellingen → Privacy en beveiliging</strong>. Let op: verwijder je ook de noodzakelijke cookies,
            dan word je uitgelogd en vragen we opnieuw om je cookiekeuze.
          </p>
          <p>
            Je kunt je browser ook zo instellen dat hij cookies van andere partijen standaard blokkeert. AI Academy
            blijft dan gewoon werken.
          </p>
        </>
      ),
    },
    {
      id: "contact",
      title: "Vragen en wijzigingen",
      content: (
        <p>
          Voegen we cookies toe of verandert een doel, dan passen we dit overzicht aan en vragen we zo nodig opnieuw om
          toestemming. Vragen? Mail <a href={`mailto:${company.privacyEmail}`}>{company.privacyEmail}</a> of lees onze{" "}
          <Link href="/privacy">privacyverklaring</Link>.
        </p>
      ),
    },
  ];

  return (
    <LegalLayout
      title="Cookiebeleid"
      lead="Welke cookies we gebruiken, waarvoor ze dienen en hoe lang ze blijven staan. Meetcookies plaatsen we alleen als jij dat goedvindt."
      updatedAt={dates.cookies}
      current="/cookies"
      sections={sections}
    />
  );
}
