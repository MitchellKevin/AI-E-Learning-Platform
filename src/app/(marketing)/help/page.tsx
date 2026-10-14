import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ChevronRight } from "lucide-react";
import { Section } from "@/components/kit";
import { HelpSearch } from "@/components/marketing/help-search";
import { HelpCategoryIcon } from "@/components/marketing/help-category-icon";
import { HelpFaq } from "@/components/marketing/help-faq";
import { HelpContact } from "@/components/marketing/help-contact";
import {
  getHelpArticles,
  getHelpCategories,
  getHelpFaqs,
  getHelpSearchIndex,
  getPopularHelpArticles,
  getSupportInfo,
} from "@/lib/data/help";
import styles from "./page.module.scss";

export const metadata: Metadata = {
  title: "Helpcentrum · AI Academy",
  description: "Antwoorden op vragen over je account, leerpaden, certificaten, teambeheer en facturen.",
};

const suggestions = ["certificaat", "uitnodiging", "factuur", "leaderboard"];

export default async function HelpPage() {
  const [categories, articles, popular, faqs, support, index] = await Promise.all([
    getHelpCategories(),
    getHelpArticles(),
    getPopularHelpArticles(),
    getHelpFaqs(),
    getSupportInfo(),
    getHelpSearchIndex(),
  ]);

  const categoryTitle = (slug: string) => categories.find((c) => c.slug === slug)?.title;

  return (
    <main>
      <section className={styles.hero} aria-labelledby="help-title">
        <div className={styles.heroInner}>
          <p className={styles.eyebrow}>Helpcentrum</p>
          <h1 id="help-title" className={styles.title}>
            Waarmee kunnen we je helpen?
          </h1>
          <p className={styles.lead}>
            Antwoorden op vragen over je account, leerpaden en certificaten, en over het beheer van je team.
          </p>
          <div className={styles.searchWrap}>
            <HelpSearch items={index} suggestions={suggestions} supportEmail={support.email} />
          </div>
        </div>
      </section>

      <div className={styles.content}>
        <Section
          id="onderwerpen"
          title="Bekijk per onderwerp"
          description={`${articles.length} artikelen in ${categories.length} onderwerpen`}
        >
          <ul className={styles.categories}>
            {categories.map((category) => {
              const items = articles.filter((a) => a.category === category.slug);
              return (
                <li key={category.slug} id={`categorie-${category.slug}`} className={styles.categoryItem}>
                  <article className={styles.category} aria-labelledby={`categorie-${category.slug}-title`}>
                    <div className={styles.categoryHead}>
                      <span className={styles.categoryIcon}>
                        <HelpCategoryIcon name={category.icon} />
                      </span>
                      <span className={styles.categoryCount}>
                        {items.length} {items.length === 1 ? "artikel" : "artikelen"}
                      </span>
                    </div>
                    <h3 id={`categorie-${category.slug}-title`} className={styles.categoryTitle}>
                      {category.title}
                    </h3>
                    <p className={styles.categoryText}>{category.description}</p>
                    <ul className={styles.categoryArticles}>
                      {items.map((article) => (
                        <li key={article.slug}>
                          <Link href={`/help/${article.slug}`} className={styles.categoryLink}>
                            <span>{article.title}</span>
                            <ChevronRight aria-hidden />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </article>
                </li>
              );
            })}
          </ul>
        </Section>

        <div className={styles.split}>
          <Section id="veelgestelde-vragen" title="Veelgestelde vragen" className={styles.faq}>
            <HelpFaq items={faqs} />
          </Section>

          <Section id="populair" title="Populaire artikelen" className={styles.popular}>
            <ol className={styles.popularList}>
              {popular.map((article, i) => (
                <li key={article.slug}>
                  <Link href={`/help/${article.slug}`} className={styles.popularLink}>
                    <span className={styles.popularRank} aria-hidden>
                      {i + 1}
                    </span>
                    <span className={styles.popularText}>
                      <span className={styles.popularTitle}>{article.title}</span>
                      <span className={styles.popularMeta}>
                        {categoryTitle(article.category)} · {article.readingMinutes} min lezen
                      </span>
                    </span>
                    <ArrowRight className={styles.popularArrow} aria-hidden />
                  </Link>
                </li>
              ))}
            </ol>
          </Section>
        </div>

        <div className={styles.contact}>
          <HelpContact support={support} />
        </div>
      </div>
    </main>
  );
}
