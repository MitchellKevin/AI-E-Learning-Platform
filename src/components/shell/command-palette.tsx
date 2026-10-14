"use client";

import {
  useDeferredValue,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import {
  ArrowRight,
  BookOpen,
  Check,
  Clock,
  CornerDownLeft,
  FileText,
  LifeBuoy,
  Route,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import type { SearchGroup, SearchIndex, SearchItem } from "@/lib/data/shell";
import { Badge, Button, Dialog, EmptyState, Kbd } from "@/components/kit";
import btn from "./header-button.module.scss";
import styles from "./command-palette.module.scss";

const GROUPS: { key: SearchGroup; label: string; limit: number; icon: ReactNode }[] = [
  { key: "pages", label: "Pagina's", limit: 4, icon: <FileText /> },
  { key: "paths", label: "Leerpaden", limit: 4, icon: <Route /> },
  { key: "chapters", label: "Hoofdstukken", limit: 6, icon: <BookOpen /> },
  { key: "exercises", label: "Oefeningen", limit: 4, icon: <Sparkles /> },
  { key: "help", label: "Helpartikelen", limit: 4, icon: <LifeBuoy /> },
];

const groupIcon = Object.fromEntries(GROUPS.map((g) => [g.key, g.icon])) as Record<SearchGroup, ReactNode>;

const RECENT_KEY = "aia:recente-zoekopdrachten";
const RECENT_MAX = 5;

// Zoeken zonder hoofdletters, accenten of krullende apostroffen.
function normalizeChar(c: string) {
  const n = c.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[’‘]/g, "'");
  return n.length === 1 ? n : c.toLowerCase().charAt(0) || c;
}

function normalize(text: string) {
  return text.split("").map(normalizeChar).join("");
}

function tokenize(query: string) {
  return normalize(query.trim()).split(/\s+/).filter(Boolean);
}

// Markeert de gevonden zoektermen in een tekst.
function Highlight({ text, tokens }: { text: string; tokens: string[] }) {
  if (!tokens.length) return text;
  const norm = normalize(text);
  const ranges: [number, number][] = [];
  for (const token of tokens) {
    let from = norm.indexOf(token);
    while (from !== -1) {
      ranges.push([from, from + token.length]);
      from = norm.indexOf(token, from + token.length);
    }
  }
  if (!ranges.length) return text;
  ranges.sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];
  for (const r of ranges) {
    const last = merged[merged.length - 1];
    if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]);
    else merged.push([...r]);
  }
  const parts: ReactNode[] = [];
  let cursor = 0;
  merged.forEach(([start, end], i) => {
    if (start > cursor) parts.push(text.slice(cursor, start));
    parts.push(<mark key={i}>{text.slice(start, end)}</mark>);
    cursor = end;
  });
  if (cursor < text.length) parts.push(text.slice(cursor));
  return <>{parts}</>;
}

type Prepared = { item: SearchItem; title: string; context: string; haystack: string };

function score(entry: Prepared, query: string, tokens: string[]) {
  if (!tokens.every((t) => entry.haystack.includes(t))) return 0;
  const { title, context } = entry;
  if (title === query) return 100;
  if (title.startsWith(query)) return 80;
  if (title.includes(` ${query}`)) return 65;
  if (title.includes(query)) return 55;
  if (context.includes(query)) return 45;
  return 10 + (tokens.filter((t) => title.includes(t)).length / tokens.length) * 30;
}

type Entry =
  | { kind: "item"; key: string; item: SearchItem }
  | { kind: "recent"; key: string; value: string }
  | { kind: "clear"; key: string };

type Section = { key: string; label: string; entries: Entry[] };

function readRecent(): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string").slice(0, RECENT_MAX) : [];
  } catch {
    return [];
  }
}

function writeRecent(list: string[]) {
  try {
    if (list.length) localStorage.setItem(RECENT_KEY, JSON.stringify(list));
    else localStorage.removeItem(RECENT_KEY);
  } catch {
    // Opslag niet beschikbaar (privévenster): dan onthouden we niets.
  }
}

function isEditable(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  return !!el && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName));
}

function useShortcutLabel() {
  const [mac, setMac] = useState(true);
  useEffect(() => {
    setMac(/mac|iphone|ipad/i.test(navigator.userAgent));
  }, []);
  return mac ? "⌘K" : "Ctrl K";
}

export type CommandPaletteProps = {
  index: SearchIndex;
  /** "icon" = ronde knop in de header, "field" = breed zoekveld (bv. op de 404-pagina). */
  variant?: "icon" | "field";
  className?: string;
};

export function CommandPalette({ index, variant = "icon", className }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const openRef = useRef(open);
  useEffect(() => {
    openRef.current = open;
  }, [open]);
  const shortcut = useShortcutLabel();

  // ⌘K / Ctrl+K overal, en "/" als je niet aan het typen bent. Niet bovenop een andere dialoog.
  useEffect(() => {
    function onKeyDown(e: globalThis.KeyboardEvent) {
      const otherDialog = !openRef.current && document.querySelector("dialog[open]");
      if ((e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === "k") {
        if (otherDialog) return;
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "/" && !e.metaKey && !e.ctrlKey && !otherDialog && !openRef.current && !isEditable(e.target)) {
        e.preventDefault();
        setOpen(true);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      {variant === "icon" ? (
        <button
          type="button"
          className={clsx(btn.iconButton, className)}
          aria-label="Zoeken"
          aria-haspopup="dialog"
          aria-keyshortcuts="Meta+K Control+K"
          title={`Zoeken (${shortcut})`}
          onClick={() => setOpen(true)}
        >
          <Search aria-hidden />
        </button>
      ) : (
        <button
          type="button"
          className={clsx(styles.field, className)}
          aria-haspopup="dialog"
          aria-keyshortcuts="Meta+K Control+K"
          onClick={() => setOpen(true)}
        >
          <Search aria-hidden className={styles.fieldIcon} />
          <span className={styles.fieldText}>Zoek een leerpad, hoofdstuk of helpartikel</span>
          <span className={styles.fieldKbd} aria-hidden>
            <Kbd>{shortcut}</Kbd>
          </span>
        </button>
      )}

      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Zoeken in AI Academy"
        hideTitle
        className={styles.palette}
        bodyClassName={styles.body}
      >
        <PaletteBody index={index} onClose={() => setOpen(false)} />
      </Dialog>
    </>
  );
}

// Inhoud wordt bij elke keer openen opnieuw gemount, dus de zoekopdracht begint leeg.
function PaletteBody({ index, onClose }: { index: SearchIndex; onClose: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const id = useId().replace(/:/g, "");
  const listId = `palette${id}-list`;
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [recent, setRecent] = useState<string[]>([]);
  const [active, setActive] = useState(0);
  const [cleared, setCleared] = useState(false);
  const deferred = useDeferredValue(query);

  useEffect(() => setRecent(readRecent()), []);

  const prepared = useMemo<Prepared[]>(
    () =>
      index.items.map((item) => {
        const title = normalize(item.title);
        const context = normalize(item.context ?? "");
        return { item, title, context, haystack: `${title} ${context} ${normalize(item.keywords ?? "")}` };
      }),
    [index],
  );

  const tokens = useMemo(() => tokenize(deferred), [deferred]);

  const sections = useMemo<Section[]>(() => {
    if (!tokens.length) {
      const result: Section[] = [];
      if (recent.length) {
        result.push({
          key: "recent",
          label: "Recent gezocht",
          entries: [
            ...recent.map((value): Entry => ({ kind: "recent", key: `recent:${value}`, value })),
            { kind: "clear", key: "clear" },
          ],
        });
      }
      const suggested = index.suggested
        .map((sid) => index.items.find((i) => i.id === sid))
        .filter((i): i is SearchItem => Boolean(i));
      result.push({
        key: "suggested",
        label: "Snel naar",
        entries: suggested.map((item) => ({ kind: "item", key: item.id, item })),
      });
      return result;
    }

    const q = tokens.join(" ");
    const scored = prepared
      .map((p) => ({ p, s: score(p, q, tokens) }))
      .filter((r) => r.s > 0);

    // Groep met de beste treffer eerst; binnen een groep op score.
    return GROUPS.map((g) => {
      const hits = scored.filter((r) => r.p.item.group === g.key).sort((a, b) => b.s - a.s);
      return { g, best: hits[0]?.s ?? 0, hits: hits.slice(0, g.limit) };
    })
      .filter((r) => r.hits.length)
      .sort((a, b) => b.best - a.best)
      .map(({ g, hits }) => ({
        key: g.key,
        label: g.label,
        entries: hits.map(({ p }): Entry => ({ kind: "item", key: p.item.id, item: p.item })),
      }));
  }, [tokens, prepared, recent, index]);

  const flat = useMemo(() => sections.flatMap((s) => s.entries), [sections]);
  const optionId = (i: number) => `${listId}-${i}`;
  const activeIndex = Math.min(active, Math.max(flat.length - 1, 0));

  // Nieuwe zoekopdracht: weer bovenaan beginnen.
  useEffect(() => setActive(0), [deferred]);

  useEffect(() => {
    document.getElementById(optionId(activeIndex))?.scrollIntoView({ block: "nearest" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex]);

  function remember(value: string) {
    const v = value.trim();
    if (!v) return;
    const next = [v, ...recent.filter((r) => r.toLowerCase() !== v.toLowerCase())].slice(0, RECENT_MAX);
    writeRecent(next);
  }

  function choose(entry: Entry | undefined) {
    if (!entry) return;
    if (entry.kind === "recent") {
      setQuery(entry.value);
      inputRef.current?.focus();
    } else if (entry.kind === "clear") {
      setRecent([]);
      writeRecent([]);
      setCleared(true);
      inputRef.current?.focus();
    } else {
      remember(query);
      onClose();
      if (entry.item.href !== pathname) router.push(entry.item.href);
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.nativeEvent.isComposing) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!flat.length) return;
      const step = e.key === "ArrowDown" ? 1 : -1;
      setActive((activeIndex + step + flat.length) % flat.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      choose(flat[activeIndex]);
    }
  }

  const resultCount = tokens.length ? flat.length : 0;
  const status = tokens.length
    ? resultCount
      ? `${resultCount} ${resultCount === 1 ? "resultaat" : "resultaten"} voor ${deferred.trim()}`
      : `Geen resultaten voor ${deferred.trim()}`
    : cleared
      ? "Recente zoekopdrachten gewist"
      : "";

  let position = -1;

  return (
    <>
      <div className={styles.inputRow}>
        <Search aria-hidden className={styles.inputIcon} />
        <input
          ref={inputRef}
          className={styles.input}
          type="text"
          role="combobox"
          aria-label="Zoek in AI Academy"
          aria-autocomplete="list"
          aria-expanded={flat.length > 0}
          aria-controls={listId}
          aria-activedescendant={flat.length ? optionId(activeIndex) : undefined}
          placeholder="Zoek leerpaden, hoofdstukken, oefeningen…"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="go"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setCleared(false);
          }}
          onKeyDown={onKeyDown}
        />
        {query && (
          <button
            type="button"
            className={styles.clear}
            aria-label="Zoekopdracht wissen"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
          >
            <X aria-hidden />
          </button>
        )}
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {status}
      </p>

      <div className={styles.results}>
        {flat.length > 0 && (
          <div role="listbox" id={listId} aria-label="Zoekresultaten" className={styles.list}>
            {sections.map((section) => (
              <div key={section.key} role="group" aria-labelledby={`${listId}-${section.key}`} className={styles.group}>
                <div id={`${listId}-${section.key}`} className={styles.groupLabel}>
                  {section.label}
                </div>
                {section.entries.map((entry) => {
                  position += 1;
                  const i = position;
                  const selected = i === activeIndex;
                  return (
                    <div
                      key={entry.key}
                      id={optionId(i)}
                      role="option"
                      aria-selected={selected}
                      className={clsx(styles.option, selected && styles.active, entry.kind === "clear" && styles.muted)}
                      onPointerMove={() => i !== activeIndex && setActive(i)}
                      // Focus blijft in het zoekveld.
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => choose(entry)}
                    >
                      <OptionContent entry={entry} tokens={tokens} />
                      <span className={styles.enter} aria-hidden>
                        {entry.kind === "recent" ? <ArrowRight /> : <CornerDownLeft />}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {tokens.length > 0 && flat.length === 0 && (
          <EmptyState
            variant="plain"
            icon={<Search />}
            title={<>Niets gevonden voor “{deferred.trim()}”</>}
            action={
              <Button href="/help" variant="secondary" size="sm" onClick={onClose}>
                Naar het helpcentrum
              </Button>
            }
            className={styles.empty}
          >
            Probeer een ander woord of een hoofdstuknummer, zoals 3.3. Staat je vraag er niet bij? Het helpcentrum
            helpt je verder.
          </EmptyState>
        )}
      </div>

      <div className={styles.footer} aria-hidden>
        <span>
          <Kbd>↑</Kbd>
          <Kbd>↓</Kbd> navigeren
        </span>
        <span>
          <Kbd>↵</Kbd> openen
        </span>
        <span>
          <Kbd>esc</Kbd> sluiten
        </span>
      </div>
    </>
  );
}

function OptionContent({ entry, tokens }: { entry: Entry; tokens: string[] }) {
  if (entry.kind === "clear") {
    return (
      <>
        <span className={styles.optionIcon} aria-hidden>
          <X />
        </span>
        <span className={styles.optionText}>
          <span className={styles.optionTitle}>Recente zoekopdrachten wissen</span>
        </span>
      </>
    );
  }

  if (entry.kind === "recent") {
    return (
      <>
        <span className={styles.optionIcon} aria-hidden>
          <Clock />
        </span>
        <span className={styles.optionText}>
          <span className={styles.optionTitle}>{entry.value}</span>
        </span>
      </>
    );
  }

  const { item } = entry;
  return (
    <>
      <span className={clsx(styles.optionIcon, item.status === "done" && styles.done)} aria-hidden>
        {item.status === "done" ? <Check /> : groupIcon[item.group]}
      </span>
      <span className={styles.optionText}>
        <span className={styles.optionTitle}>
          <Highlight text={item.title} tokens={tokens} />
        </span>
        {item.context && (
          <span className={styles.optionContext}>
            <Highlight text={item.context} tokens={tokens} />
          </span>
        )}
      </span>
      {item.status && (
        <Badge size="sm" variant={item.status === "done" ? "success" : "brand"} className={styles.status}>
          {item.status === "done" ? "Afgerond" : "Bezig"}
        </Badge>
      )}
    </>
  );
}
