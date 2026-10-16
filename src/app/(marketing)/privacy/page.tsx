import type { Metadata } from "next";
import Link from "next/link";
import { Ban, Download, Eye, Hand, PencilLine, Trash2 } from "lucide-react";
import { Table, TBody, THead, Td, Th, Tr } from "@/components/kit";
import { LegalCards, LegalFacts, LegalLayout, type LegalSection } from "@/components/marketing/legal-layout";
import { getCompanyInfo, getLegalDates, getProcessors, getRetentionPeriods, getSupportInfo } from "@/lib/data/help";

export const metadata: Metadata = {
  title: "Privacyverklaring · AI Academy",
  description:
    "Welke persoonsgegevens AI Academy verwerkt, waarom, hoe lang we ze bewaren, waar ze staan en welke rechten je hebt onder de AVG.",
};

const data = [
  {
    title: "Accountgegevens",
    text: "Naam, zakelijk e-mailadres, organisatie, team, rol (bijvoorbeeld designer of developer) en je taalvoorkeur.",
  },
  {
    title: "Leergegevens",
    text: "Welke hoofdstukken je hebt afgerond, je quizscores, toetsresultaten, behaalde certificaten, punten, je reeks en je plek op het leaderboard.",
  },
  {
    title: "Oefenomgeving en AI-tutor",
    text: "De prompts die je schrijft en de antwoorden van het AI-model. Deze zijn alleen voor jou zichtbaar, niet voor je manager.",
  },
  {
    title: "Betaalgegevens",
    text: "Alleen van beheerders: factuuradres, btw-nummer en de laatste vier cijfers van de betaalmethode. Volledige kaartgegevens ziet alleen Stripe.",
  },
  {
    title: "Technische gegevens",
    text: "IP-adres, browser, apparaat en tijdstippen van inloggen, voor de beveiliging. Bezoekstatistieken alleen met je toestemming.",
  },
  {
    title: "Contact en demo-aanvragen",
    text: "Wat je invult als je een demo aanvraagt of support mailt: naam, e-mailadres, bedrijf en je vraag.",
  },
];

const purposes = [
  {
    purpose: "Je account aanmaken en je laten inloggen",
    basis: "Uitvoering van de overeenkomst met je organisatie",
  },
  {
    purpose: "Lessen, quizzen en toetsen aanbieden en je voortgang bewaren",
    basis: "Uitvoering van de overeenkomst",
  },
  {
    purpose: "Certificaten uitgeven en de echtheid ervan laten controleren",
    basis: "Uitvoering van de overeenkomst en gerechtvaardigd belang (fraude voorkomen)",
  },
  {
    purpose: "Je manager de voortgang van het team laten zien",
    basis: "Gerechtvaardigd belang van je werkgever, binnen de afspraken in de verwerkersovereenkomst",
  },
  {
    purpose: "Het leaderboard tonen",
    basis: "Gerechtvaardigd belang; je kunt je zichtbaarheid zelf uitzetten",
  },
  {
    purpose: "Facturen versturen en de administratie bijhouden",
    basis: "Wettelijke verplichting (fiscale bewaarplicht)",
  },
  {
    purpose: "Bezoekstatistieken en advertentiemeting",
    basis: "Toestemming, die je altijd kunt intrekken",
  },
  {
    purpose: "Het platform beveiligen en misbruik voorkomen",
    basis: "Gerechtvaardigd belang",
  },
];

export default async function PrivacyPage() {
  const [company, dates, processors, retention, support] = await Promise.all([
    getCompanyInfo(),
    getLegalDates(),
    getProcessors(),
    getRetentionPeriods(),
    getSupportInfo(),
  ]);

  const sections: LegalSection[] = [
    {
      id: "wie-wij-zijn",
      title: "Wie wij zijn",
      content: (
        <>
          <p>
            AI Academy is een leerplatform waarmee teams leren werken met AI. Het platform wordt aangeboden door{" "}
            {company.name}. In deze verklaring lees je welke persoonsgegevens we verwerken, waarom we dat doen en wat
            je rechten zijn.
          </p>
          <h3>Twee rollen</h3>
          <p>
            Leer je via je werkgever, dan is je <strong>organisatie verantwoordelijk</strong> voor je gegevens en
            verwerken wij ze in opdracht, op basis van een verwerkersovereenkomst. Voor onze website, demo-aanvragen
            en de facturatie aan organisaties zijn <strong>wij zelf verantwoordelijk</strong>.
          </p>
          <LegalFacts
            items={[
              { label: "Naam", value: company.name },
              { label: "Adres", value: company.address },
              { label: "KvK-nummer", value: company.kvk },
              { label: "Functionaris gegevensbescherming", value: company.dpo },
            ]}
          />
        </>
      ),
    },
    {
      id: "welke-gegevens",
      title: "Welke gegevens we verwerken",
      content: (
        <>
          <p>We verwerken niet meer gegevens dan nodig. Het gaat om deze soorten gegevens:</p>
          <ul>
            {data.map((item) => (
              <li key={item.title}>
                <strong>{item.title}.</strong> {item.text}
              </li>
            ))}
          </ul>
          <p>
            We vragen nooit om bijzondere persoonsgegevens, zoals gegevens over je gezondheid. Zet daarom ook geen
            vertrouwelijke klant- of persoonsgegevens in je prompts in de oefenomgeving.
          </p>
        </>
      ),
    },
    {
      id: "doelen-en-grondslagen",
      title: "Doelen en grondslagen",
      content: (
        <>
          <p>
            Voor elke verwerking hebben we een doel en een wettelijke grondslag uit de Algemene verordening
            gegevensbescherming (AVG).
          </p>
          <Table label="Doelen en grondslagen" minWidth={560}>
            <THead>
              <Tr>
                <Th>Doel</Th>
                <Th>Grondslag</Th>
              </Tr>
            </THead>
            <TBody>
              {purposes.map((row) => (
                <Tr key={row.purpose}>
                  <Td>{row.purpose}</Td>
                  <Td muted>{row.basis}</Td>
                </Tr>
              ))}
            </TBody>
          </Table>
          <p>
            We nemen geen besluiten over je die alleen op geautomatiseerde verwerking zijn gebaseerd. De AI-tutor geeft
            uitleg en feedback, maar beoordeelt je toets niet.
          </p>
        </>
      ),
    },
    {
      id: "bewaartermijnen",
      title: "Bewaartermijnen",
      content: (
        <>
          <p>We bewaren gegevens niet langer dan nodig. Daarna verwijderen of anonimiseren we ze.</p>
          <Table label="Bewaartermijnen" minWidth={480}>
            <THead>
              <Tr>
                <Th>Gegevens</Th>
                <Th>Bewaartermijn</Th>
              </Tr>
            </THead>
            <TBody>
              {retention.map((row) => (
                <Tr key={row.data}>
                  <Td>{row.data}</Td>
                  <Td muted>{row.period}</Td>
                </Tr>
              ))}
            </TBody>
          </Table>
          <p>
            Verlaat je je organisatie, dan sluit je beheerder je account. Na de bewaartermijn die je organisatie heeft
            gekozen, verwijderen we je gegevens. Je certificaten blijven dan controleerbaar via de verificatielink. Vraag
            je zelf om je account te verwijderen, dan verwijderen we na 30 dagen alles, ook je certificaten.
          </p>
        </>
      ),
    },
    {
      id: "verwerkers",
      title: "Verwerkers en opslag in de EU",
      content: (
        <>
          <p>
            We bewaren je gegevens in datacenters binnen de Europese Unie. Voor een paar onderdelen schakelen we
            andere partijen in. Met elk van hen hebben we een verwerkersovereenkomst gesloten.
          </p>
          <Table label="Verwerkers" minWidth={720}>
            <THead>
              <Tr>
                <Th>Partij</Th>
                <Th>Waarvoor</Th>
                <Th>Locatie</Th>
                <Th>Doorgifte buiten de EU</Th>
              </Tr>
            </THead>
            <TBody>
              {processors.map((p) => (
                <Tr key={p.name}>
                  <Td>
                    <strong>{p.name}</strong>
                  </Td>
                  <Td>{p.purpose}</Td>
                  <Td muted>{p.location}</Td>
                  <Td muted>{p.transfer}</Td>
                </Tr>
              ))}
            </TBody>
          </Table>
          <p>
            We verkopen je gegevens nooit en delen ze niet met adverteerders. Prompts en gesprekken met de AI-tutor
            worden niet gebruikt om AI-modellen te trainen.
          </p>
        </>
      ),
    },
    {
      id: "werkgever",
      title: "Wat je werkgever ziet",
      content: (
        <>
          <p>Je manager en de beheerders van je organisatie zien:</p>
          <ul>
            <li>je naam, team en rol;</li>
            <li>per leerpad hoe ver je bent en wanneer je voor het laatst actief was;</li>
            <li>of je de eindtoets hebt gehaald en welke certificaten je hebt.</li>
          </ul>
          <p>
            Je antwoorden op quizvragen, je prompts in de oefenomgeving en je gesprekken met de AI-tutor zijn{" "}
            <strong>alleen voor jou</strong> zichtbaar. Meer hierover lees je in{" "}
            <Link href="/help/voortgang-team-bekijken">De voortgang van je team bekijken</Link>.
          </p>
        </>
      ),
    },
    {
      id: "beveiliging",
      title: "Beveiliging",
      content: (
        <>
          <p>We beveiligen je gegevens met passende technische en organisatorische maatregelen, waaronder:</p>
          <ul>
            <li>versleutelde verbindingen (TLS) en versleutelde opslag;</li>
            <li>inloggen zonder wachtwoord via een eenmalige e-maillink, of via de login van je organisatie;</li>
            <li>toegang voor medewerkers alleen als dat nodig is, met logging;</li>
            <li>dagelijkse back-ups binnen de EU en een jaarlijkse onafhankelijke beveiligingstest.</li>
          </ul>
          <p>
            Merk je iets op dat niet klopt? Meld het via <a href={`mailto:${company.privacyEmail}`}>{company.privacyEmail}</a>.
            Bij een datalek informeren we je organisatie binnen 24 uur.
          </p>
        </>
      ),
    },
    {
      id: "je-rechten",
      title: "Je rechten",
      content: (
        <>
          <p>
            Onder de AVG heb je de volgende rechten. Veel ervan regel je zelf in je{" "}
            <Link href="/instellingen">instellingen</Link>, voor de rest kun je ons mailen.
          </p>
          <LegalCards
            items={[
              {
                icon: <Eye />,
                title: "Inzage",
                text: "Bekijken welke gegevens we van je hebben en waarvoor we ze gebruiken.",
              },
              {
                icon: <Download />,
                title: "Export",
                text: "Je gegevens downloaden in een gangbaar bestand (JSON), om mee te nemen naar een andere dienst.",
              },
              {
                icon: <PencilLine />,
                title: "Correctie",
                text: "Onjuiste gegevens laten aanpassen. Je naam en rol wijzig je zelf.",
              },
              {
                icon: <Trash2 />,
                title: "Verwijderen",
                text: "Je account en gegevens laten verwijderen, behalve wat we wettelijk moeten bewaren.",
              },
              {
                icon: <Hand />,
                title: "Bezwaar en beperking",
                text: "Bezwaar maken tegen een verwerking op basis van gerechtvaardigd belang, of die laten beperken.",
              },
              {
                icon: <Ban />,
                title: "Toestemming intrekken",
                text: "Analytische en marketingcookies kun je altijd uitzetten via de cookie-instellingen.",
              },
            ]}
          />
          <p>
            Leer je via je werkgever, dan sturen we je verzoek in overleg door naar je organisatie. We reageren
            binnen een maand. Hoe het in de praktijk werkt, lees je in{" "}
            <Link href="/help/gegevens-inzien-en-verwijderen">Je gegevens inzien, downloaden of laten verwijderen</Link>.
          </p>
          <p>
            Ben je het niet eens met hoe we met je gegevens omgaan, dan kun je een klacht indienen bij de{" "}
            <a href="https://autoriteitpersoonsgegevens.nl" target="_blank" rel="noopener noreferrer">
              Autoriteit Persoonsgegevens
            </a>
            . We horen het natuurlijk liever eerst zelf.
          </p>
        </>
      ),
    },
    {
      id: "cookies",
      title: "Cookies",
      content: (
        <p>
          We gebruiken noodzakelijke cookies om het platform te laten werken. Analytische en marketingcookies plaatsen
          we alleen met je toestemming. Welke cookies dat zijn, lees je in ons <Link href="/cookies">cookiebeleid</Link>.
        </p>
      ),
    },
    {
      id: "wijzigingen",
      title: "Wijzigingen",
      content: (
        <p>
          We passen deze verklaring aan als ons platform of de wet verandert. Bij belangrijke wijzigingen informeren we
          de beheerders van je organisatie minstens 30 dagen van tevoren. Bovenaan deze pagina zie je wanneer de
          verklaring voor het laatst is bijgewerkt.
        </p>
      ),
    },
    {
      id: "contact",
      title: "Contact",
      content: (
        <>
          <p>Vragen over je privacy of een verzoek over je gegevens? Neem contact op met onze functionaris gegevensbescherming.</p>
          <LegalFacts
            items={[
              { label: "Privacyvragen", value: <a href={`mailto:${company.privacyEmail}`}>{company.privacyEmail}</a> },
              { label: "Overige vragen", value: <a href={`mailto:${support.email}`}>{support.email}</a> },
              { label: "Post", value: `${company.name}, t.a.v. privacy, ${company.address}` },
              { label: "Reactietermijn", value: "Binnen een maand, meestal sneller" },
            ]}
          />
        </>
      ),
    },
  ];

  return (
    <LegalLayout
      title="Privacyverklaring"
      lead="Je leert bij ons met je eigen naam en voortgang. Hier lees je precies wat we met die gegevens doen, waar ze staan en wat je zelf kunt regelen."
      updatedAt={dates.privacy}
      current="/privacy"
      sections={sections}
    />
  );
}
