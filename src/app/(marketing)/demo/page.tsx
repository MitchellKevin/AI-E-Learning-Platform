import type { Metadata } from "next";
import { Check, Mail, ShieldCheck } from "lucide-react";
import { getDemoOptions, getPlans, getTestimonials } from "@/lib/data/marketing";
import { Avatar } from "@/components/kit";
import { DemoForm } from "@/components/marketing/demo-form";
import { SectionIntro } from "@/components/marketing/section-intro";
import styles from "./page.module.scss";

export const metadata: Metadata = {
  title: "Plan een demo · AI Academy",
  description:
    "Zie in 30 minuten hoe AI Academy werkt voor jouw designers en developers. Vraag een demo aan, dan nemen we binnen één werkdag contact op.",
};

const steps = [
  {
    title: "Binnen één werkdag reactie",
    text: "We mailen je een paar momenten om uit te kiezen. Geen verkooppraatje aan de telefoon.",
  },
  {
    title: "Een demo van 30 minuten",
    text: "Via Google Meet of Teams. We laten het platform zien met voorbeelden uit jullie vak en beantwoorden je vragen.",
  },
  {
    title: "14 dagen gratis proberen",
    text: "Daarna ga je met maximaal vijf collega's zelf aan de slag. Je hebt geen creditcard nodig.",
  },
];

const inDemo = [
  "Oefenen met echte AI en de feedback die je krijgt",
  "Het manageroverzicht en de rapportages",
  "Hoe certificaten en de verificatielink werken",
  "Single sign-on, hosting en de verwerkersovereenkomst",
];

type Props = { searchParams: Promise<{ plan?: string | string[] }> };

export default async function DemoPage({ searchParams }: Props) {
  const [{ plan }, options, plans, testimonials] = await Promise.all([
    searchParams,
    getDemoOptions(),
    getPlans(),
    getTestimonials(),
  ]);

  // ?plan=team vanaf de prijspagina vult "Interesse in" alvast in.
  const requested = typeof plan === "string" ? plan : undefined;
  const defaultPlan = plans.some((p) => p.id === requested) ? requested : undefined;
  const quote = testimonials.find((t) => t.quote.includes("AVG")) ?? testimonials[0];

  return (
    <main>
      <section aria-labelledby="demo-titel" className={styles.hero}>
        <div className={styles.heroPattern} aria-hidden />
        <div className={styles.heroInner}>
          <SectionIntro
            id="demo-titel"
            headingLevel={1}
            eyebrow="Demo"
            title="Zie hoe AI Academy werkt voor jouw team"
            lead="Vul het formulier in en we plannen een demo van een halfuur. We laten zien hoe je designers en developers leren werken met AI, en wat jij als manager ziet."
          />
        </div>
      </section>

      <div className={styles.layout}>
        <div className={styles.formCol}>
          <DemoForm
            options={options}
            plans={plans.map((p) => ({ value: p.id, label: p.name }))}
            defaultPlan={defaultPlan}
          />
        </div>

        <aside aria-label="Wat je kunt verwachten" className={styles.aside}>
          <section aria-labelledby="verwachten-titel" className={styles.panel}>
            <h2 id="verwachten-titel" className={styles.panelTitle}>
              Wat je kunt verwachten
            </h2>
            <ol className={styles.steps}>
              {steps.map((step, i) => (
                <li key={step.title} className={styles.step}>
                  <span className={styles.stepNumber} aria-hidden>
                    {i + 1}
                  </span>
                  <div>
                    <h3 className={styles.stepTitle}>{step.title}</h3>
                    <p className={styles.stepText}>{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>

            <h3 className={styles.listTitle}>In de demo zie je</h3>
            <ul className={styles.checks}>
              {inDemo.map((item) => (
                <li key={item}>
                  <Check aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          {quote && (
            <figure className={styles.quote}>
              <blockquote>
                <p>“{quote.quote}”</p>
              </blockquote>
              <figcaption className={styles.quotePerson}>
                <Avatar initials={quote.initials} size={32} />
                <span>
                  <span className={styles.quoteName}>{quote.name}</span>
                  <span className={styles.quoteRole}>
                    {quote.role} · {quote.company}
                  </span>
                </span>
              </figcaption>
            </figure>
          )}

          <div className={styles.contact}>
            <p className={styles.trust}>
              <ShieldCheck aria-hidden />
              Hosting in de EU · AVG-proof
            </p>
            <p className={styles.contactText}>
              Liever eerst even mailen?{" "}
              <a href="mailto:hallo@aiacademy.nl" className={styles.mail}>
                <Mail aria-hidden />
                hallo@aiacademy.nl
              </a>
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
