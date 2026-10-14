import type { Metadata } from "next";
import Link from "next/link";
import { Contrast, Keyboard, MonitorSmartphone, ScanEye, TextCursorInput, ZoomIn } from "lucide-react";
import { StatusPill } from "@/components/kit";
import { LegalCards, LegalFacts, LegalLayout, type LegalSection } from "@/components/marketing/legal-layout";
import { getCompanyInfo, getLegalDates } from "@/lib/data/help";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Toegankelijkheidsverklaring · AI Academy",
  description:
    "Hoe toegankelijk AI Academy is, welke onderdelen nog niet voldoen aan WCAG 2.1 niveau AA en hoe je een probleem meldt.",
};

export default async function ToegankelijkheidPage() {
  const [company, dates] = await Promise.all([getCompanyInfo(), getLegalDates()]);

  const sections: LegalSection[] = [
    {
      id: "ambitie",
      title: "Onze ambitie",
      content: (
        <>
          <p>
            Iedereen in een team moet kunnen leren werken met AI, ook als je slechtziend bent, alleen een toetsenbord
            gebruikt of met een screenreader werkt. Daarom bouwen we AI Academy volgens de{" "}
            <strong>Web Content Accessibility Guidelines (WCAG) 2.1, niveau AA</strong>. Dat is ook de norm uit de
            Europese toegankelijkheidswet (European Accessibility Act).
          </p>
          <p>
            Deze verklaring geldt voor de publieke website en de leeromgeving, inclusief de oefenomgeving, de
            eindtoetsen en het beheergedeelte voor managers.
          </p>
        </>
      ),
    },
    {
      id: "status",
      title: "Status",
      content: (
        <>
          <p>
            <StatusPill variant="warning">Voldoet gedeeltelijk</StatusPill>
          </p>
          <p>
            AI Academy voldoet grotendeels aan WCAG 2.1 niveau AA. Een paar onderdelen voldoen nog niet; die staan
            hieronder bij de bekende beperkingen, met de datum waarop we ze willen oplossen.
          </p>
          <LegalFacts
            items={[
              { label: "Norm", value: "WCAG 2.1, niveau AA" },
              { label: "Status", value: "Voldoet gedeeltelijk" },
              {
                label: "Laatste onderzoek",
                value: <time dateTime={dates.accessibilityAudit}>{formatDate(dates.accessibilityAudit)}</time>,
              },
              { label: "Bereik", value: "Website, leeromgeving en beheer" },
            ]}
          />
        </>
      ),
    },
    {
      id: "wat-we-doen",
      title: "Wat we al doen",
      content: (
        <LegalCards
          items={[
            {
              icon: <Keyboard />,
              title: "Volledig met het toetsenbord",
              text: "Elke les, quiz en toets is te bedienen zonder muis, met een duidelijk zichtbare focus.",
            },
            {
              icon: <ScanEye />,
              title: "Getest met screenreaders",
              text: "We testen met NVDA, VoiceOver op macOS en iOS en TalkBack op Android.",
            },
            {
              icon: <Contrast />,
              title: "Voldoende contrast",
              text: "Tekst en knoppen hebben minstens de contrastverhouding die WCAG voorschrijft.",
            },
            {
              icon: <ZoomIn />,
              title: "Inzoomen tot 400%",
              text: "De pagina's passen zich aan, zonder dat je horizontaal hoeft te scrollen.",
            },
            {
              icon: <MonitorSmartphone />,
              title: "Minder beweging",
              text: "Staat ‘minder beweging’ aan op je apparaat, dan zetten we animaties uit.",
            },
            {
              icon: <TextCursorInput />,
              title: "Duidelijke formulieren",
              text: "Elk veld heeft een label, en foutmeldingen zeggen wat er mis is en hoe je het oplost.",
            },
          ]}
        />
      ),
    },
    {
      id: "beperkingen",
      title: "Bekende beperkingen",
      content: (
        <>
          <p>Deze onderdelen voldoen nog niet volledig. We werken eraan:</p>
          <ul>
            <li>
              <strong>Video&apos;s in hoofdstukken.</strong> Alle video&apos;s hebben ondertiteling, maar nog niet
              allemaal een audiodescriptie (succescriterium 1.2.5). Gepland: eerste kwartaal 2027.
            </li>
            <li>
              <strong>Certificaat als pdf.</strong> Het gedownloade certificaat is nog niet volledig getagd voor
              screenreaders (1.3.1). De certificaatpagina zelf is wel toegankelijk. Gepland: december 2026.
            </li>
            <li>
              <strong>Grafieken in rapportages.</strong> Voor managers zijn sommige grafieken nog niet als tabel
              beschikbaar (1.1.1). Gepland: december 2026.
            </li>
            <li>
              <strong>Antwoorden van de AI-tutor.</strong> Lange antwoorden worden in delen voorgelezen terwijl ze
              binnenkomen, wat met sommige screenreaders onrustig is (4.1.3). We onderzoeken een rustigere aanpak.
            </li>
          </ul>
        </>
      ),
    },
    {
      id: "onderzoek",
      title: "Hoe we toetsen",
      content: (
        <>
          <p>We combineren automatische controles met handmatig onderzoek:</p>
          <ul>
            <li>bij elke wijziging automatische tests met axe-core;</li>
            <li>elk kwartaal een handmatige controle van de belangrijkste taken, zoals een hoofdstuk afronden en een toets maken;</li>
            <li>één keer per jaar een volledig onderzoek door een onafhankelijke, gespecialiseerde partij;</li>
            <li>gebruikerstests met mensen die een hulpmiddel gebruiken, zoals een screenreader of vergroting.</li>
          </ul>
        </>
      ),
    },
    {
      id: "melden",
      title: "Een probleem melden",
      content: (
        <>
          <p>
            Loop je ergens tegenaan, of heb je een onderdeel in een andere vorm nodig? Laat het ons weten. Vertel op
            welke pagina het was en welk hulpmiddel je gebruikt, dan lossen we het zo snel mogelijk op of zoeken we
            samen een alternatief.
          </p>
          <LegalFacts
            items={[
              {
                label: "E-mail",
                value: <a href={`mailto:${company.accessibilityEmail}`}>{company.accessibilityEmail}</a>,
              },
              { label: "Reactietijd", value: "Binnen 5 werkdagen" },
            ]}
          />
          <p>
            Antwoorden op veelgestelde vragen vind je in het <Link href="/help">helpcentrum</Link>.
          </p>
        </>
      ),
    },
  ];

  return (
    <LegalLayout
      title="Toegankelijkheidsverklaring"
      lead="We willen dat iedereen in je team met AI Academy kan leren, met of zonder hulpmiddelen. Hier lees je hoe ver we zijn en wat nog beter moet."
      updatedAt={dates.toegankelijkheid}
      current="/toegankelijkheid"
      sections={sections}
    />
  );
}
