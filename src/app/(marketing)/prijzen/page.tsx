import type { Metadata } from "next";
import { ArrowRight, CalendarCheck, CreditCard, ShieldCheck, Sparkles } from "lucide-react";
import { getBillingFaqs, getPlanComparison, getPlans, YEARLY_DISCOUNT } from "@/lib/data/marketing";
import { Button } from "@/components/kit";
import { BillingPeriodProvider, BillingPeriodToggle } from "@/components/marketing/billing-period";
import { CtaBand } from "@/components/marketing/cta-band";
import { FaqList } from "@/components/marketing/faq-list";
import { PlanCards } from "@/components/marketing/plan-cards";
import { PlanComparison } from "@/components/marketing/plan-comparison";
import { SeatCalculator } from "@/components/marketing/seat-calculator";
import { SectionIntro } from "@/components/marketing/section-intro";
import styles from "./page.module.scss";

export const metadata: Metadata = {
  title: "Prijzen · AI Academy",
  description:
    "Eén prijs per gebruiker per maand, met alle leerpaden inbegrepen. Bekijk de abonnementen Starter, Team en Enterprise en reken uit wat het kost voor jouw team.",
};

const assurances = [
  { icon: <Sparkles />, text: "14 dagen gratis proberen" },
  { icon: <CalendarCheck />, text: "Maandelijks opzegbaar" },
  { icon: <CreditCard />, text: "iDEAL, creditcard of factuur" },
  { icon: <ShieldCheck />, text: "Hosting in de EU · AVG-proof" },
];

export default async function PricingPage() {
  const [plans, comparison, faqs] = await Promise.all([getPlans(), getPlanComparison(), getBillingFaqs()]);
  const discount = Math.round(YEARLY_DISCOUNT * 100);

  return (
    <main>
      <BillingPeriodProvider>
        <section aria-labelledby="prijzen-titel" className={styles.hero}>
          <div className={styles.heroPattern} aria-hidden />
          <div className={styles.heroInner}>
            <SectionIntro
              id="prijzen-titel"
              headingLevel={1}
              align="center"
              eyebrow="Prijzen"
              title="Eén prijs per gebruiker, alle leerpaden inbegrepen"
              lead={`Je betaalt per gebruiker per maand en schaalt op of af wanneer je wilt. Betaal je per jaar, dan krijg je ${discount}% korting.`}
            />
            <div className={styles.toggle}>
              <BillingPeriodToggle />
            </div>
            <p className={styles.toggleNote}>Alle prijzen zijn exclusief 21% btw.</p>
          </div>
        </section>

        <section aria-labelledby="abonnementen-titel" className={styles.plans}>
          <h2 id="abonnementen-titel" className="visually-hidden">
            Abonnementen
          </h2>
          <PlanCards plans={plans} />
          <ul className={styles.assurances}>
            {assurances.map((item) => (
              <li key={item.text}>
                <span aria-hidden>{item.icon}</span>
                {item.text}
              </li>
            ))}
          </ul>
        </section>

        <section id="rekenhulp" aria-labelledby="rekenhulp-titel" className={styles.section}>
          <SectionIntro
            id="rekenhulp-titel"
            eyebrow="Rekenhulp"
            title="Wat kost het voor jouw team?"
            lead="Kies een abonnement en het aantal collega's dat meedoet. Je ziet direct wat je per maand of per jaar betaalt."
          />
          <SeatCalculator plans={plans} />
        </section>
      </BillingPeriodProvider>

      <section id="vergelijken" aria-labelledby="vergelijken-titel" className={styles.band}>
        <div className={styles.section}>
          <div className={styles.compareHead}>
            <SectionIntro
              id="vergelijken-titel"
              eyebrow="Vergelijken"
              title="Alle functies op een rij"
              lead="Elk abonnement heeft alle leerpaden, de eindtoets en certificaten. Het verschil zit in oefenen, beheer en koppelingen."
            />
            <Button href="/demo" variant="secondary" iconRight={<ArrowRight />} className={styles.compareAction}>
              Hulp bij kiezen
            </Button>
          </div>
          <div className={styles.compare}>
            <PlanComparison plans={plans} groups={comparison} />
          </div>
        </div>
      </section>

      <section id="facturatie" aria-labelledby="facturatie-titel" className={styles.section}>
        <div className={styles.faq}>
          <SectionIntro
            id="facturatie-titel"
            eyebrow="Facturatie"
            title="Vragen over betalen"
            lead="Over btw, facturen, betaalmethoden en opzeggen. Staat je vraag er niet bij? Mail ons op hallo@aiacademy.nl."
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

      <CtaBand
        id="prijzen-cta-titel"
        title="Twijfel je welk abonnement past?"
        text="In een demo van 30 minuten kijken we samen wat past bij de grootte en de wensen van je team."
        secondary={{ href: "/help", label: "Naar het helpcenter" }}
      />
    </main>
  );
}
