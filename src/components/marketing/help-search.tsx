"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { ArrowRight, Mail, Search, SearchX, X } from "lucide-react";
import { Button, EmptyState, Field, IconButton, Kbd, TextInput } from "@/components/kit";
import type { HelpSearchItem } from "@/lib/data/help";
import styles from "./help-search.module.scss";

type Props = {
  items: HelpSearchItem[];
  suggestions: string[];
  supportEmail: string;
};

// Kleine letters en zonder accenten, zodat "categorie" ook "catégorie" vindt.
const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function search(items: HelpSearchItem[], query: string) {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];
  return items
    .map((item) => {
      const title = normalize(item.title);
      const summary = normalize(item.summary);
      const category = normalize(item.categoryTitle);
      const text = normalize(item.text);
      let score = 0;
      for (const term of terms) {
        if (title.includes(term)) score += 4;
        else if (summary.includes(term)) score += 2;
        else if (category.includes(term)) score += 1.5;
        else if (text.includes(term)) score += 1;
        else return null; // Elk woord moet ergens voorkomen.
      }
      return { item, score };
    })
    .filter((r): r is { item: HelpSearchItem; score: number } => r !== null)
    .sort((a, b) => b.score - a.score)
    .map((r) => r.item);
}

function Highlight({ text, query }: { text: string; query: string }) {
  const terms = query.split(/\s+/).filter((t) => t.length > 1);
  if (terms.length === 0) return <>{text}</>;
  const pattern = new RegExp(`(${terms.map(escapeRegExp).join("|")})`, "gi");
  return (
    <>
      {text.split(pattern).map((part, i) =>
        i % 2 === 1 ? (
          <mark key={i} className={styles.mark}>
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
}

export function HelpSearch({ items, suggestions, supportEmail }: Props) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLOListElement>(null);
  const trimmed = query.trim();
  const active = trimmed.length >= 2;
  const results = useMemo(() => (active ? search(items, trimmed) : []), [items, trimmed, active]);

  // "/" springt naar het zoekveld, zoals op veel helpcentra.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable='true']")) return;
      e.preventDefault();
      inputRef.current?.focus();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  // Enter brengt je naar het eerste resultaat, zodat je met pijltjes/Tab verder kunt.
  function onSubmit(e: FormEvent) {
    e.preventDefault();
    resultsRef.current?.querySelector("a")?.focus();
  }

  function clear() {
    setQuery("");
    inputRef.current?.focus();
  }

  const status = !active
    ? ""
    : results.length === 0
      ? `Geen artikelen gevonden voor ${trimmed}`
      : `${results.length} ${results.length === 1 ? "artikel" : "artikelen"} gevonden voor ${trimmed}`;

  return (
    <div className={styles.search}>
      <form role="search" onSubmit={onSubmit} className={styles.form}>
        <Field label="Zoek in het helpcentrum" hideLabel>
          <TextInput
            ref={inputRef}
            type="search"
            name="q"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape" && query) {
                e.preventDefault();
                setQuery("");
              }
            }}
            placeholder="Zoek op bijvoorbeeld certificaat, factuur of uitnodiging"
            autoComplete="off"
            enterKeyHint="search"
            icon={<Search />}
            className={styles.control}
            inputClassName={styles.input}
            suffix={
              query ? (
                <IconButton label="Zoekopdracht wissen" icon={<X />} variant="ghost" size="sm" onClick={clear} />
              ) : (
                <span className={styles.shortcut} aria-hidden>
                  <Kbd>/</Kbd>
                </span>
              )
            }
          />
        </Field>
      </form>

      {!active && suggestions.length > 0 && (
        <div className={styles.suggestions}>
          <span id="help-suggestions-label" className={styles.suggestionsLabel}>
            Veel gezocht
          </span>
          <ul aria-labelledby="help-suggestions-label" className={styles.suggestionList}>
            {suggestions.map((s) => (
              <li key={s}>
                <button
                  type="button"
                  className={styles.suggestion}
                  onClick={() => {
                    setQuery(s);
                    inputRef.current?.focus();
                  }}
                >
                  {s}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="sr-only" role="status" aria-live="polite">
        {status}
      </p>

      {active && (
        <div className={styles.results}>
          {results.length > 0 ? (
            <>
              <p className={styles.count} aria-hidden>
                {results.length} {results.length === 1 ? "artikel" : "artikelen"}
              </p>
              <ol ref={resultsRef} className={styles.list} aria-label="Zoekresultaten">
                {results.map((r) => (
                  <li key={r.slug} className={styles.result}>
                    <Link href={`/help/${r.slug}`} className={styles.resultLink}>
                      <span className={styles.resultCategory}>{r.categoryTitle}</span>
                      <span className={styles.resultTitle}>
                        <Highlight text={r.title} query={trimmed} />
                      </span>
                      <span className={styles.resultSummary}>
                        <Highlight text={r.summary} query={trimmed} />
                      </span>
                      <ArrowRight className={styles.resultArrow} aria-hidden />
                    </Link>
                  </li>
                ))}
              </ol>
            </>
          ) : (
            <EmptyState
              icon={<SearchX />}
              title={`Geen artikelen gevonden voor “${trimmed}”`}
              variant="plain"
              headingLevel={2}
              action={
                <Button href={`mailto:${supportEmail}`} variant="secondary" icon={<Mail />}>
                  Stel je vraag aan support
                </Button>
              }
            >
              Probeer een ander of korter zoekwoord. Staat je vraag er echt niet bij, dan helpen we je graag per e-mail.
            </EmptyState>
          )}
        </div>
      )}
    </div>
  );
}
