"use client";

import { createContext, useContext, useId, useState, type KeyboardEvent, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import styles from "./tabs.module.scss";

export type TabsVariant = "underline" | "pill";

type TabsContextValue = {
  value: string | undefined;
  select: (value: string) => void;
  variant: TabsVariant;
  baseId: string;
};

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabs() {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error("TabList, Tab en TabPanel horen binnen <Tabs>.");
  return ctx;
}

const slug = (value: string) => value.replace(/[^a-zA-Z0-9_-]/g, "-");

export type TabsProps = {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  variant?: TabsVariant;
  className?: string;
  children: ReactNode;
};

export function Tabs({ value, defaultValue, onValueChange, variant = "underline", className, children }: TabsProps) {
  const baseId = `tabs${useId().replace(/:/g, "")}`;
  const [internal, setInternal] = useState(defaultValue);
  const current = value ?? internal;

  function select(next: string) {
    if (value === undefined) setInternal(next);
    onValueChange?.(next);
  }

  return (
    <TabsContext.Provider value={{ value: current, select, variant, baseId }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

// Pijltjes, Home en End verplaatsen focus én selectie (automatische activatie).
function onArrowKeys(e: KeyboardEvent<HTMLElement>, selector: string, activate: boolean) {
  const items = Array.from(e.currentTarget.querySelectorAll<HTMLElement>(selector));
  const index = items.indexOf(document.activeElement as HTMLElement);
  if (index === -1) return;
  let next = -1;
  if (e.key === "ArrowRight") next = (index + 1) % items.length;
  else if (e.key === "ArrowLeft") next = (index - 1 + items.length) % items.length;
  else if (e.key === "Home") next = 0;
  else if (e.key === "End") next = items.length - 1;
  if (next === -1) return;
  e.preventDefault();
  items[next].focus();
  if (activate) items[next].click();
}

export type TabListProps = {
  /** Toegankelijke naam, bv. "Onderdelen van de toets". */
  "aria-label": string;
  /** Tabs verdelen de volle breedte. */
  fullWidth?: boolean;
  className?: string;
  children: ReactNode;
};

export function TabList({ "aria-label": label, fullWidth, className, children }: TabListProps) {
  const { variant } = useTabs();
  return (
    <div className={clsx(styles.scroller, styles[variant])}>
      <div
        role="tablist"
        aria-label={label}
        aria-orientation="horizontal"
        onKeyDown={(e) => onArrowKeys(e, '[role="tab"]:not([disabled])', true)}
        className={clsx(styles.list, fullWidth && styles.fullWidth, className)}
      >
        {children}
      </div>
    </div>
  );
}

export type TabProps = {
  value: string;
  icon?: ReactNode;
  /** Klein getal achter het label, bv. aantal open uitnodigingen. */
  count?: number;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
};

export function Tab({ value, icon, count, disabled, className, children }: TabProps) {
  const ctx = useTabs();
  const selected = ctx.value === value;
  return (
    <button
      type="button"
      role="tab"
      id={`${ctx.baseId}-tab-${slug(value)}`}
      aria-selected={selected}
      aria-controls={`${ctx.baseId}-panel-${slug(value)}`}
      tabIndex={selected ? 0 : -1}
      disabled={disabled}
      onClick={() => ctx.select(value)}
      className={clsx(styles.tab, selected && styles.active, className)}
    >
      {icon && (
        <span className={styles.icon} aria-hidden>
          {icon}
        </span>
      )}
      {children}
      {count !== undefined && <span className={styles.count}>{count}</span>}
    </button>
  );
}

export type TabPanelProps = {
  value: string;
  /** Inhoud blijft in de DOM (verborgen) als de tab niet actief is, bv. om formulierstate te bewaren. */
  keepMounted?: boolean;
  className?: string;
  children: ReactNode;
};

export function TabPanel({ value, keepMounted, className, children }: TabPanelProps) {
  const ctx = useTabs();
  const selected = ctx.value === value;
  if (!selected && !keepMounted) return null;
  return (
    <div
      role="tabpanel"
      id={`${ctx.baseId}-panel-${slug(value)}`}
      aria-labelledby={`${ctx.baseId}-tab-${slug(value)}`}
      tabIndex={0}
      hidden={!selected}
      className={clsx(styles.panel, className)}
    >
      {children}
    </div>
  );
}

export type TabLinkItem = {
  href: string;
  label: ReactNode;
  icon?: ReactNode;
  count?: number;
  /** Alleen actief bij exact dit pad (standaard ook op subpagina's). */
  exact?: boolean;
};

export type TabLinksProps = {
  items: TabLinkItem[];
  /** Naam van de navigatie, bv. "Instellingen". */
  "aria-label": string;
  variant?: TabsVariant;
  className?: string;
};

// Subnavigatie met links in tab-stijl (instellingen, beheer); actief via de huidige URL.
export function TabLinks({ items, "aria-label": label, variant = "underline", className }: TabLinksProps) {
  const pathname = usePathname();
  // Het langste passende pad wint, zodat /beheer niet ook actief is op /beheer/team.
  const active = items
    .filter((item) => (item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`)))
    .sort((a, b) => b.href.length - a.href.length)[0];

  return (
    <nav aria-label={label} className={clsx(styles.scroller, styles[variant], className)}>
      <ul className={styles.list}>
        {items.map((item) => {
          const isActive = item === active;
          return (
            <li key={item.href} className={styles.linkItem}>
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={clsx(styles.tab, isActive && styles.active)}
              >
                {item.icon && (
                  <span className={styles.icon} aria-hidden>
                    {item.icon}
                  </span>
                )}
                {item.label}
                {item.count !== undefined && <span className={styles.count}>{item.count}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
