import {
  companyInfo,
  cookieList,
  helpArticles,
  helpCategories,
  helpFaqs,
  legalDates,
  processors,
  retentionPeriods,
  supportInfo,
} from "@/lib/mock/help";

// Helpcentrum. Komt straks uit Storyblok (artikelen, FAQ) en de CMS-instellingen (support).

export type HelpCategorySlug =
  | "aan-de-slag"
  | "leerpaden-en-certificaten"
  | "voor-managers"
  | "account-en-privacy"
  | "abonnement-en-facturen";

export type HelpIconName = "rocket" | "route" | "users" | "shield" | "receipt";

export type HelpCategory = {
  slug: HelpCategorySlug;
  title: string;
  description: string;
  icon: HelpIconName;
};

// Inline tekst ondersteunt **vet** en [label](/pad) voor interne links en mailto.
export type HelpBlock =
  | { type: "p"; text: string }
  | { type: "h2"; id: string; text: string }
  | { type: "ul" | "ol"; items: string[] }
  | { type: "tip"; title?: string; text: string };

export type HelpArticle = {
  slug: string;
  title: string;
  summary: string;
  category: HelpCategorySlug;
  updatedAt: string;
  popular?: boolean;
  keywords?: string[];
  body: HelpBlock[];
  related?: string[];
};

export type HelpArticleWithMeta = HelpArticle & { readingMinutes: number };

export type HelpFaq = {
  id: string;
  question: string;
  answer: string;
};

export type SupportInfo = {
  email: string;
  responseTime: string;
  hours: string;
  salesEmail: string;
  privacyEmail: string;
};

export type CookieCategory = "noodzakelijk" | "analytisch" | "marketing";

export type CookieInfo = {
  name: string;
  provider: string;
  purpose: string;
  retention: string;
  category: CookieCategory;
  /** Echte cookie of opslag in de browser (localStorage). */
  kind: "cookie" | "opslag";
};

export type CompanyInfo = {
  name: string;
  address: string;
  kvk: string;
  vat: string;
  /** Functionaris gegevensbescherming. */
  dpo: string;
  privacyEmail: string;
  accessibilityEmail: string;
  legalEmail: string;
};

/** ISO-datums van de laatste inhoudelijke wijziging per document. */
export type LegalDates = {
  privacy: string;
  voorwaarden: string;
  cookies: string;
  toegankelijkheid: string;
  accessibilityAudit: string;
};

export type Processor = {
  name: string;
  purpose: string;
  location: string;
  /** Doorgifte buiten de EU, en op welke grondslag. */
  transfer: string;
};

export type RetentionPeriod = { data: string; period: string };

// Licht zoekitem voor de client: alleen wat nodig is om te filteren en te tonen.
export type HelpSearchItem = {
  slug: string;
  title: string;
  summary: string;
  categoryTitle: string;
  text: string;
};

const stripInline = (text: string) => text.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\[(.+?)\]\((.+?)\)/g, "$1");

function blockText(block: HelpBlock) {
  if ("items" in block) return block.items.map(stripInline).join(" ");
  return stripInline(block.text);
}

function withMeta(article: HelpArticle): HelpArticleWithMeta {
  const words = article.body.map(blockText).join(" ").split(/\s+/).length;
  return { ...article, readingMinutes: Math.max(1, Math.round(words / 200)) };
}

export async function getHelpCategories(): Promise<HelpCategory[]> {
  return helpCategories;
}

export async function getHelpCategory(slug: string) {
  return helpCategories.find((c) => c.slug === slug);
}

export async function getHelpArticles(): Promise<HelpArticleWithMeta[]> {
  return helpArticles.map(withMeta);
}

export async function getHelpArticle(slug: string) {
  const article = helpArticles.find((a) => a.slug === slug);
  return article ? withMeta(article) : undefined;
}

export async function getPopularHelpArticles() {
  return helpArticles.filter((a) => a.popular).map(withMeta);
}

// Eerst de handmatig gekoppelde artikelen, daarna aanvullen uit dezelfde categorie.
export async function getRelatedHelpArticles(slug: string, limit = 3) {
  const article = helpArticles.find((a) => a.slug === slug);
  if (!article) return [];
  const linked = (article.related ?? [])
    .map((s) => helpArticles.find((a) => a.slug === s))
    .filter((a): a is HelpArticle => Boolean(a));
  const sameCategory = helpArticles.filter(
    (a) => a.category === article.category && a.slug !== slug && !linked.includes(a),
  );
  return [...linked, ...sameCategory].slice(0, limit).map(withMeta);
}

export async function getHelpSearchIndex(): Promise<HelpSearchItem[]> {
  return helpArticles.map((a) => ({
    slug: a.slug,
    title: a.title,
    summary: a.summary,
    categoryTitle: helpCategories.find((c) => c.slug === a.category)?.title ?? "",
    text: [...(a.keywords ?? []), ...a.body.map(blockText)].join(" "),
  }));
}

export async function getHelpFaqs(): Promise<HelpFaq[]> {
  return helpFaqs;
}

export async function getSupportInfo(): Promise<SupportInfo> {
  return supportInfo;
}

// Cookie-overzicht voor /cookies. Komt straks uit de CMP-/Storyblok-configuratie.
export async function getCookieList(): Promise<CookieInfo[]> {
  return cookieList;
}

// Juridische pagina's. Komen straks uit Storyblok, zodat juridische wijzigingen geen deploy nodig hebben.
export async function getCompanyInfo(): Promise<CompanyInfo> {
  return companyInfo;
}

export async function getLegalDates(): Promise<LegalDates> {
  return legalDates;
}

export async function getProcessors(): Promise<Processor[]> {
  return processors;
}

export async function getRetentionPeriods(): Promise<RetentionPeriod[]> {
  return retentionPeriods;
}
