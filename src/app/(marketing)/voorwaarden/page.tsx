import type { Metadata } from "next";
import Link from "next/link";
import { LegalFacts, LegalLayout, type LegalSection } from "@/components/marketing/legal-layout";
import { getCompanyInfo, getLegalDates } from "@/lib/data/help";

export const metadata: Metadata = {
  title: "Algemene voorwaarden · AI Academy",
  description:
    "De afspraken tussen AI Academy en organisaties die het platform gebruiken: licenties, betaling, opzegging, gebruik en aansprakelijkheid.",
};

export default async function VoorwaardenPage() {
  const [company, dates] = await Promise.all([getCompanyInfo(), getLegalDates()]);

  const sections: LegalSection[] = [
    {
      id: "toepassing",
      title: "Toepassing en begrippen",
      content: (
        <>
          <p>
            Deze voorwaarden gelden voor elk abonnement op AI Academy en voor elk gebruik van het platform. Dit is een
            leesbare samenvatting. Bij een verschil met de getekende overeenkomst gaat de overeenkomst voor.
          </p>
          <ul>
            <li>
              <strong>Wij</strong>: {company.name}, gevestigd in Amsterdam.
            </li>
            <li>
              <strong>Klant</strong>: de organisatie die een abonnement afsluit.
            </li>
            <li>
              <strong>Gebruiker</strong>: een medewerker van de klant met een eigen account.
            </li>
            <li>
              <strong>Licentie</strong>: het recht van één gebruiker om het platform te gebruiken.
            </li>
          </ul>
          <p>
            AI Academy is bedoeld voor zakelijk gebruik. Algemene voorwaarden van de klant gelden alleen als we daar
            schriftelijk mee hebben ingestemd.
          </p>
        </>
      ),
    },
    {
      id: "abonnement",
      title: "Abonnement en licenties",
      content: (
        <>
          <p>
            Een abonnement loopt per maand of per jaar. Je betaalt per actieve licentie: een licentie telt zodra een
            collega de uitnodiging heeft geaccepteerd.
          </p>
          <ul>
            <li>Licenties voeg je op elk moment toe. Je betaalt naar rato voor de rest van de lopende periode.</li>
            <li>Een licentie is persoonlijk. Je mag een account niet delen met collega&apos;s.</li>
            <li>
              Een licentie overzetten naar een nieuwe collega kan altijd. De voortgang van de vorige gebruiker gaat
              daarbij niet mee.
            </li>
          </ul>
          <p>
            Na een demo krijgt je team 14 dagen gratis toegang tot AI 101. De proefperiode stopt automatisch; je zit
            nergens aan vast.
          </p>
        </>
      ),
    },
    {
      id: "prijzen-en-betaling",
      title: "Prijzen en betaling",
      content: (
        <>
          <p>
            De actuele prijzen staan op <Link href="/prijzen">Prijzen</Link>. Alle bedragen zijn exclusief btw.
          </p>
          <ul>
            <li>Maandabonnementen betaal je vooraf per maand, jaarabonnementen vooraf per jaar.</li>
            <li>Bij jaarlijks betalen krijg je 20% korting ten opzichte van maandelijks.</li>
            <li>We factureren via Stripe. De betaaltermijn voor betaling op factuur is 30 dagen.</li>
            <li>
              Prijswijzigingen kondigen we minstens 60 dagen van tevoren aan. Ze gaan pas in bij de volgende
              verlenging.
            </li>
          </ul>
          <p>
            Wordt een factuur na een herinnering niet betaald, dan mogen we de toegang tijdelijk beperken. Behaalde
            certificaten blijven wel geldig.
          </p>
        </>
      ),
    },
    {
      id: "looptijd-en-opzeggen",
      title: "Looptijd en opzeggen",
      content: (
        <>
          <p>Een abonnement wordt automatisch verlengd met dezelfde periode, tenzij je het opzegt.</p>
          <ul>
            <li>Een maandabonnement zeg je op tot het einde van de lopende maand.</li>
            <li>Een jaarabonnement zeg je op tot het einde van het contractjaar.</li>
            <li>
              Opzeggen doet een beheerder zelf via <Link href="/beheer/abonnement">Beheer → Abonnement</Link>.
            </li>
          </ul>
          <p>
            Tot de einddatum houdt iedereen toegang. Daarna kunnen gebruikers 30 dagen lang hun gegevens en
            certificaten downloaden, waarna we de gegevens verwijderen zoals beschreven in onze{" "}
            <Link href="/privacy">privacyverklaring</Link>.
          </p>
        </>
      ),
    },
    {
      id: "gebruik",
      title: "Gebruik van het platform",
      content: (
        <>
          <p>We vragen gebruikers om het platform verantwoord te gebruiken. Dat betekent onder meer:</p>
          <ul>
            <li>
              geen vertrouwelijke klantgegevens, persoonsgegevens of bedrijfsgeheimen invoeren in de oefenomgeving of
              bij de AI-tutor;
            </li>
            <li>de eindtoets zelf maken, zonder hulp van anderen;</li>
            <li>lesmateriaal niet kopiëren, doorverkopen of openbaar delen;</li>
            <li>het platform niet gebruiken om de AI-modellen te misbruiken of beveiliging te omzeilen.</li>
          </ul>
          <p>
            Bij misbruik mogen we een account tijdelijk blokkeren. We overleggen dan eerst met de beheerder van de
            klant, behalve als direct ingrijpen nodig is.
          </p>
        </>
      ),
    },
    {
      id: "ai-uitvoer",
      title: "Antwoorden van AI",
      content: (
        <p>
          De oefenomgeving en de AI-tutor gebruiken een AI-model. De antwoorden zijn bedoeld om van te leren en kunnen
          onjuist of onvolledig zijn. Controleer ze altijd voordat je ze in je werk gebruikt. Wat je met AI maakt, blijft
          van jou of je organisatie; we gebruiken je prompts niet om modellen te trainen.
        </p>
      ),
    },
    {
      id: "intellectueel-eigendom",
      title: "Intellectueel eigendom",
      content: (
        <p>
          Alle lesinhoud, oefeningen, toetsen en de software van AI Academy zijn van ons of onze licentiegevers. De klant
          krijgt voor de duur van het abonnement een niet-overdraagbaar recht om het platform te gebruiken voor de eigen
          medewerkers. Eigen leerpaden die een Enterprise-klant laat maken, blijven van die klant.
        </p>
      ),
    },
    {
      id: "certificaten",
      title: "Certificaten",
      content: (
        <p>
          Een certificaat krijg je als je alle hoofdstukken van een leerpad hebt afgerond en de eindtoets hebt gehaald.
          Elk certificaat heeft een uniek nummer en is openbaar te controleren via een verificatielink. Blijkt een
          toets niet zelfstandig te zijn gemaakt, dan mogen we het certificaat intrekken.
        </p>
      ),
    },
    {
      id: "beschikbaarheid",
      title: "Beschikbaarheid en onderhoud",
      content: (
        <>
          <p>
            We streven naar een beschikbaarheid van 99,5% per maand. Gepland onderhoud doen we buiten kantooruren en
            kondigen we minstens 48 uur van tevoren aan.
          </p>
          <p>
            We verbeteren het platform voortdurend. Wijzigen we iets wezenlijks aan de werking, dan informeren we de
            beheerders van tevoren.
          </p>
        </>
      ),
    },
    {
      id: "aansprakelijkheid",
      title: "Aansprakelijkheid",
      content: (
        <p>
          Onze aansprakelijkheid is beperkt tot directe schade en tot maximaal het bedrag dat de klant in de twaalf
          maanden voor de schade aan ons heeft betaald. We zijn niet aansprakelijk voor indirecte schade, zoals gemiste
          omzet, of voor schade door het gebruik van antwoorden van AI zonder controle. Deze beperking geldt niet bij
          opzet of bewuste roekeloosheid.
        </p>
      ),
    },
    {
      id: "privacy",
      title: "Privacy en gegevens",
      content: (
        <p>
          Voor de gegevens van gebruikers sluiten we met de klant een verwerkersovereenkomst. Daarin staat wat we met de
          gegevens doen, waar ze worden opgeslagen en hoe we ze beveiligen. Lees ook onze{" "}
          <Link href="/privacy">privacyverklaring</Link>.
        </p>
      ),
    },
    {
      id: "recht-en-geschillen",
      title: "Toepasselijk recht en geschillen",
      content: (
        <>
          <p>
            Op deze voorwaarden is Nederlands recht van toepassing. Komen we er samen niet uit, dan legt de meest
            gerede partij het geschil voor aan de bevoegde rechter in Amsterdam.
          </p>
          <LegalFacts
            items={[
              { label: "Bedrijf", value: company.name },
              { label: "Adres", value: company.address },
              { label: "KvK-nummer", value: company.kvk },
              { label: "Btw-nummer", value: company.vat },
              { label: "Juridische vragen", value: <a href={`mailto:${company.legalEmail}`}>{company.legalEmail}</a> },
              { label: "Volledige voorwaarden", value: "Op aanvraag als pdf, of als bijlage bij je offerte" },
            ]}
          />
        </>
      ),
    },
  ];

  return (
    <LegalLayout
      title="Algemene voorwaarden"
      lead="De belangrijkste afspraken tussen AI Academy en je organisatie, in gewone taal: over licenties, betalen, opzeggen en verantwoord gebruik."
      updatedAt={dates.voorwaarden}
      current="/voorwaarden"
      sections={sections}
    />
  );
}
