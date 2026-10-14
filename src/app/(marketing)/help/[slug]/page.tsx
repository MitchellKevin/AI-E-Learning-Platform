import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CalendarDays, Clock } from "lucide-react";
import { PageHeader, Section } from "@/components/kit";
import { HelpArticleBody } from "@/components/marketing/help-article-body";
import { HelpContact } from "@/components/marketing/help-contact";
import { HelpFeedback } from "@/components/marketing/help-feedback";
import { LegalToc } from "@/components/marketing/legal-toc";
import {
  getHelpArticle,
  getHelpArticles,
  getHelpCategories,
  getHelpCategory,
  getRelatedHelpArticles,
  getSupportInfo,
} from "@/lib/data/help";
import { formatDate } from "@/lib/format";
import styles from "./page.module.scss";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await getHelpArticles()).map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = await getHelpArticle((await params).slug);
  if (!article) return { title: "Artikel niet gevonden · AI Academy" };
  return { title: `${article.title} · Helpcentrum · AI Academy`, description: article.summary };
}

export default async function HelpArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await getHelpArticle(slug);
  if (!article) notFound();

  const [category, related, support, categories] = await Promise.all([
    getHelpCategory(article.category),
    getRelatedHelpArticles(slug),
    getSupportInfo(),
    getHelpCategories(),
  ]);

  const headings = article.body.flatMap((b) => (b.type === "h2" ? [{ id: b.id, title: b.text }] : []));
  const categoryTitle = (s: string) => categories.find((c) => c.slug === s)?.title;

  return (
    <main>
      <PageHeader
        band
        size="lg"
        breadcrumbs={[
          { label: "Helpcentrum", href: "/help" },
          ...(category ? [{ label: category.title, href: `/help#categorie-${category.slug}` }] : []),
          { label: article.title },
        ]}
        title={article.title}
        lead={article.summary}
      >
        <ul className={styles.meta}>
          <li>
            <CalendarDays aria-hidden />
            Bijgewerkt op <time dateTime={article.updatedAt}>{formatDate(article.updatedAt)}</time>
          </li>
          <li>
            <Clock aria-hidden />
            {article.readingMinutes} min lezen
          </li>
        </ul>
      </PageHeader>

      <div className={styles.content}>
        <div className={styles.layout}>
          <article className={styles.article} aria-label={article.title}>
            <HelpArticleBody blocks={article.body} />
            <div className={styles.feedback}>
              <HelpFeedback slug={article.slug} />
            </div>
          </article>

          <aside className={styles.aside} aria-label="Bij dit artikel">
            {headings.length > 1 && <LegalToc items={headings} title="In dit artikel" />}
            <HelpContact support={support} variant="compact" headingLevel={2} />
          </aside>
        </div>

        {related.length > 0 && (
          <Section title="Gerelateerde artikelen" link={{ href: "/help", label: "Naar het helpcentrum" }}>
            <ul className={styles.related}>
              {related.map((r) => (
                <li key={r.slug}>
                  <Link href={`/help/${r.slug}`} className={styles.relatedCard}>
                    <span className={styles.relatedCategory}>{categoryTitle(r.category)}</span>
                    <span className={styles.relatedTitle}>{r.title}</span>
                    <span className={styles.relatedSummary}>{r.summary}</span>
                    <span className={styles.relatedMore}>
                      Lees artikel <ArrowRight aria-hidden />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Section>
        )}
      </div>
    </main>
  );
}
