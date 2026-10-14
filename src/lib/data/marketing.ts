import {
  mockBillingFaqs,
  mockComparison,
  mockCustomers,
  mockDemoOptions,
  mockLandingFaqs,
  mockProofStats,
  mockPlans,
  mockTeamPreview,
  mockTestimonials,
} from "@/lib/mock/marketing";

// Marketingdata. Nu op mock-data; plannen en prijzen komen later uit Stripe, teksten uit Storyblok.

export type PlanId = "starter" | "team" | "enterprise";

export type Plan = {
  id: PlanId;
  name: string;
  tagline: string;
  /** Prijs per gebruiker per maand bij maandelijkse betaling; null = op aanvraag. */
  monthlyPrice: number | null;
  minSeats: number;
  maxSeats: number | null;
  highlighted?: boolean;
  cta: { label: string; href: string };
  featuresIntro: string;
  features: string[];
};

export type ComparisonValue = boolean | string;

export type ComparisonGroup = {
  title: string;
  rows: { label: string; values: Record<PlanId, ComparisonValue> }[];
};

export type Faq = { question: string; answer: string };

export type Testimonial = {
  quote: string;
  name: string;
  initials: string;
  role: string;
  company: string;
};

export type TeamPreviewMember = {
  name: string;
  initials: string;
  path: string;
  percent: number;
  status: "Afgerond" | "Op schema" | "Achter";
};

export type DemoOptions = {
  teamSizes: { value: string; label: string }[];
  roles: { value: string; label: string }[];
};

export type ProofStat = { value: string; label: string };

export type BillingPeriod = "maand" | "jaar";

/** Korting bij jaarlijkse betaling. */
export const YEARLY_DISCOUNT = 0.2;

/** Btw-tarief voor de indicatie incl. btw. */
export const VAT_RATE = 0.21;

/** Prijs per gebruiker per maand voor de gekozen betaalperiode; null = op aanvraag. */
export function seatPrice(plan: Plan, period: BillingPeriod): number | null {
  if (plan.monthlyPrice === null) return null;
  const price = period === "jaar" ? plan.monthlyPrice * (1 - YEARLY_DISCOUNT) : plan.monthlyPrice;
  return Math.round(price * 100) / 100;
}

const euro = new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" });
const euroRounded = new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

/** Euro's in nl-NL; hele bedragen zonder ",00". */
export function formatEuro(amount: number) {
  const cents = Math.round(amount * 100) / 100;
  return Number.isInteger(cents) ? euroRounded.format(cents) : euro.format(cents);
}

export async function getPlans(): Promise<Plan[]> {
  return mockPlans;
}

export async function getPlanComparison(): Promise<ComparisonGroup[]> {
  return mockComparison;
}

export async function getBillingFaqs(): Promise<Faq[]> {
  return mockBillingFaqs;
}

export async function getLandingFaqs(): Promise<Faq[]> {
  return mockLandingFaqs;
}

export async function getTestimonials(): Promise<Testimonial[]> {
  return mockTestimonials;
}

export async function getCustomers(): Promise<string[]> {
  return mockCustomers;
}

export async function getTeamPreview(): Promise<TeamPreviewMember[]> {
  return mockTeamPreview;
}

export async function getProofStats(): Promise<ProofStat[]> {
  return mockProofStats;
}

export async function getDemoOptions(): Promise<DemoOptions> {
  return mockDemoOptions;
}
