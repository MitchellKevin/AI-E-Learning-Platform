import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Award, BookOpenCheck, Check, Route, ShieldCheck } from "lucide-react";
import { allChapters, getLearningPath, getLearningPaths } from "@/lib/content";
import { getCustomers, getLandingFaqs, getProofStats, getTeamPreview, getTestimonials } from "@/lib/data/marketing";
import { ArrowButton, Button } from "@/components/kit";
import { CtaBand } from "@/components/marketing/cta-band";
import { FaqList } from "@/components/marketing/faq-list";
import { FeatureGrid } from "@/components/marketing/feature-grid";
import { HeroVisual } from "@/components/marketing/hero-visual";
import { PathOverview } from "@/components/marketing/path-overview";
import { SectionIntro } from "@/components/marketing/section-intro";
import { TeamPreview } from "@/components/marketing/team-preview";
import { Testimonials } from "@/components/marketing/testimonials";
import styles from "./page.module.scss";

export const metadata: Metadata = {
  title: "AI Academy · Leer je team werken met AI",
  description:
    "Het leerplatform waarmee design- en developmentteams effectief en verantwoord leren werken met AI. Met oefenomgeving, AI-tutor en certificaten.",
};

const steps = [
  {
    icon: <BookOpenCheck />,
    title: "Iedereen start met AI 101",
    text: "Een gezamenlijke basis: hoe AI werkt, hoe je goed prompt en hoe je het verantwoord inzet. Zo spreekt het hele team dezelfde taal.",
  },
  {
    icon: <Route />,
    title: "Kies je specialisatie",
    text: "Designers verdiepen zich in UI/UX Design, developers in Software Development. Met oefeningen uit hun eigen praktijk.",
  },
  {
    icon: <Award />,
    title: "Behaal je certificaat",
    text: "Rond af met een eindtoets en ontvang een certificaat met een openbare verificatielink voor je profiel of je klanten.",
  },
];

const managerPoints = [
  "Wijs leerpaden toe aan een team, met een deadline",
  "Zie in één oogopslag wie op schema ligt en wie achterloopt",
  "Stuur een herinnering via e-mail, Slack of Teams",
  "Exporteer rapportages voor L&D en je jaarplan",
];

export default async function HomePage() {
  const [paths, ai101, customers, testimonials, proofStats, team, faqs] = await Promise.all([
    getLearningPaths(),
    getLearningPath("ai-101"),
    getCustomers(),
    getTestimonials(),
    getProofStats(),
    getTeamPreview(),
    getLandingFaqs(),
  ]);

  // Voorbeeldhoofdstuk voor het productbeeld: het iteratiehoofdstuk uit AI 101.
  const chapters = ai101 ? allChapters(ai101) : [];
  const example = chapters.find((c) => c.number === "3.3") ?? chapters[0];

  return (
    <main>
      {/* Hero */}
      <section aria-labelledby="hero-titel" className={styles.hero}>
        <div className={styles.heroPattern} aria-hidden />
        <div className={styles.heroInner}>
          <div className={styles.heroText}>
            <p className={styles.kicker}>
              <span className={styles.kickerBadge}>Nieuw</span>
              Oefenen met echte AI, met directe feedback
            </p>
            <h1 id="hero-titel" className={styles.heroTitle}>
              Leer je team effectief en verantwoord werken met AI
            </h1>
            <p className={styles.heroLead}>
              AI Academy is het leerplatform voor design- en developmentteams. Korte hoofdstukken, oefeningen
              met echte AI en certificaten, met voortgang die je als manager gewoon kunt volgen.
            </p>
            <div className={styles.heroActions}>
              <ArrowButton href="/demo">Plan een demo</ArrowButton>
              <Button href="/prijzen" variant="secondary">
                Bekijk prijzen
              </Button>
            </div>
            <ul className={styles.heroPoints}>
              <li>
                <Check aria-hidden />
                14 dagen gratis proberen
              </li>
              <li>
                <ShieldCheck aria-hidden />
                Hosting in de EU · AVG-proof
              </li>
            </ul>
          </div>

          {ai101 && example && (
            <HeroVisual
              pathTitle={ai101.title}
              chapter={{
                number: example.number,
                title: example.shortTitle,
                minutes: example.minutes,
                points: example.points,
                level: example.level,
              }}
              paths={paths.map((p) => ({ title: p.title, percent: p.slug === "ai-101" ? 46 : null }))}
            />
          )}
        </div>
      </section>

      {/* Klanten */}
      {/* <section aria-labelledby="klanten-titel" className={styles.customers}>
        <h2 id="klanten-titel" className={styles.customersTitle}>
          Teams van deze organisaties leren al met AI Academy
        </h2>
        <ul className={styles.logos}>
          {customers.map((name, i) => (
            <li key={name} className={styles[`logo${i % 6}`]}>
              {name}
            </li>
          ))}
        </ul>
      </section> */}

      {/* Hoe het werkt */}
      <section id="product" aria-labelledby="werkwijze-titel" className={styles.section}>
        <SectionIntro
          id="werkwijze-titel"
          eyebrow="Hoe het werkt"
          title="Van eerste prompt tot certificaat in drie stappen"
          lead="Een vaste leerlijn voor het hele team, met ruimte voor ieders vak. Een hoofdstuk duurt 20 tot 30 minuten, dus het past in een gewone werkweek."
        />
        <ol className={styles.steps}>
          {steps.map((step, i) => (
            <li key={step.title} className={styles.step}>
              <div className={styles.stepHead}>
                <span className={styles.stepIcon} aria-hidden>
                  {step.icon}
                </span>
                <span className={styles.stepNumber} aria-hidden>
                  0{i + 1}
                </span>
              </div>
              <h3 className={styles.stepTitle}>{step.title}</h3>
              <p className={styles.stepText}>{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Leerpaden */}
      <section id="leerpaden" aria-labelledby="leerpaden-titel" className={styles.band}>
        <div className={styles.section}>
          <SectionIntro
            id="leerpaden-titel"
            eyebrow="Leerpaden"
            title="Eén basis, twee specialisaties"
            lead="Geschreven door designers en developers die dagelijks met AI werken. We werken de inhoud elk kwartaal bij, want het vak verandert snel."
          />
          <PathOverview paths={paths} />
        </div>
      </section>

      {/* Functies */}
      <section aria-labelledby="functies-titel" className={styles.section}>
        <SectionIntro
          id="functies-titel"
          eyebrow="Functies"
          title="Alles om AI echt in het werk te krijgen"
          lead="Geen losse video's, maar een platform waarin je leest, oefent en laat zien wat je kunt."
        />
        <FeatureGrid />
      </section>

      {/* Voor managers */}
      <section aria-labelledby="managers-titel" className={styles.band}>
        <div className={styles.split}>
          <div className={styles.splitText}>
            <SectionIntro
              id="managers-titel"
              eyebrow="Voor managers en L&D"
              title="Zie hoe je team groeit, zonder spreadsheets"
              lead="Je ziet per team en per persoon hoe ver iedereen is. Zo weet je waar je kunt helpen, en kun je laten zien wat de training oplevert."
            />
            <ul className={styles.checks}>
              {managerPoints.map((point) => (
                <li key={point}>
                  <span className={styles.checkIcon} aria-hidden>
                    <Check />
                  </span>
                  {point}
                </li>
              ))}
            </ul>
            <Link href="/demo" className={styles.textLink}>
              Bekijk het manageroverzicht in een demo
              <ArrowRight aria-hidden />
            </Link>
          </div>
          <div className={styles.splitVisual}>
            <TeamPreview members={team} />
          </div>
        </div>
      </section>

      {/* Ervaringen */}
      {/* <section aria-labelledby="ervaringen-titel" className={styles.section}>
        <SectionIntro
          id="ervaringen-titel"
          eyebrow="Ervaringen"
          title="Wat teams zeggen"
          lead="Design- en developmentteams in heel Nederland leren met AI Academy. Dit merken ze in hun werk."
        />
        <Testimonials items={testimonials} stats={proofStats} />
      </section> */}

      {/* Veelgestelde vragen */}
      <section aria-labelledby="faq-titel" className={styles.section}>
        <div className={styles.faq}>
          <SectionIntro
            id="faq-titel"
            eyebrow="Veelgestelde vragen"
            title="Goed om te weten"
            lead="Staat je vraag er niet tussen? In het helpcenter vind je meer antwoorden, of mail ons gewoon."
          >
            <div className={styles.faqActions}>
              <Button href="/help" variant="secondary" iconRight={<ArrowRight />}>
                Naar het helpcenter
              </Button>
            </div>
          </SectionIntro>
          <FaqList faqs={faqs} openFirst />
        </div>
      </section>

      <CtaBand />
    </main>
  );
}
