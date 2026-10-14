"use client";

import { useEffect, useId, useState } from "react";
import clsx from "clsx";
import styles from "./legal-toc.module.scss";

type Props = {
  items: { id: string; title: string }[];
  title?: string;
  /** Toont 01, 02… voor de titels, gelijk aan de genummerde secties. */
  numbered?: boolean;
  className?: string;
};

// Afstand tot de bovenkant waarop een kop als "actief" telt (vaste header + wat lucht).
const OFFSET = 120;

// Inhoudsopgave met ankers. Markeert de sectie die je aan het lezen bent.
export function LegalToc({ items, title = "Op deze pagina", numbered, className }: Props) {
  const [active, setActive] = useState(items[0]?.id);
  const titleId = `toc${useId().replace(/:/g, "")}`;

  useEffect(() => {
    let frame = 0;
    function update() {
      frame = 0;
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      if (atBottom) {
        setActive(items[items.length - 1]?.id);
        return;
      }
      let current = items[0]?.id;
      for (const item of items) {
        const el = document.getElementById(item.id);
        if (el && el.getBoundingClientRect().top - OFFSET <= 0) current = item.id;
      }
      setActive(current);
    }
    function onScroll() {
      if (!frame) frame = window.requestAnimationFrame(update);
    }
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [items]);

  return (
    <nav aria-labelledby={titleId} className={clsx(styles.toc, className)}>
      <p id={titleId} className={styles.title}>
        {title}
      </p>
      <ol className={clsx(styles.list, numbered && styles.numbered)}>
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              aria-current={active === item.id ? "location" : undefined}
              className={styles.link}
              onClick={() => setActive(item.id)}
            >
              {item.title}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
