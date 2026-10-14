import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import { Lightbulb } from "lucide-react";
import type { HelpBlock } from "@/lib/data/help";
import styles from "./help-article-body.module.scss";

const inlinePattern = /\*\*(.+?)\*\*|\[(.+?)\]\((.+?)\)/g;

// Zet **vet** en [label](/pad) om. Alleen interne links en mailto, zodat CMS-tekst geen externe links kan injecteren.
export function HelpInline({ text }: { text: string }) {
  const parts: ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(inlinePattern)) {
    const [whole, bold, label, href] = match;
    const index = match.index ?? 0;
    if (index > last) parts.push(text.slice(last, index));
    if (bold) {
      parts.push(<strong key={index}>{bold}</strong>);
    } else if (href.startsWith("/")) {
      parts.push(
        <Link key={index} href={href}>
          {label}
        </Link>,
      );
    } else if (href.startsWith("mailto:")) {
      parts.push(
        <a key={index} href={href}>
          {label}
        </a>,
      );
    } else {
      parts.push(label);
    }
    last = index + whole.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts.map((p, i) => (typeof p === "string" ? <Fragment key={`t${i}`}>{p}</Fragment> : p))}</>;
}

export function HelpArticleBody({ blocks }: { blocks: HelpBlock[] }) {
  return (
    <div className={styles.prose}>
      {blocks.map((block, i) => {
        switch (block.type) {
          case "h2":
            return (
              <h2 key={i} id={block.id}>
                {block.text}
              </h2>
            );
          case "ul":
          case "ol": {
            const List = block.type;
            return (
              <List key={i}>
                {block.items.map((item) => (
                  <li key={item}>
                    <HelpInline text={item} />
                  </li>
                ))}
              </List>
            );
          }
          case "tip":
            return (
              <aside key={i} className={styles.tip} aria-label={block.title ?? "Tip"}>
                <span className={styles.tipIcon} aria-hidden>
                  <Lightbulb />
                </span>
                <div>
                  <p className={styles.tipTitle}>{block.title ?? "Tip"}</p>
                  <p>
                    <HelpInline text={block.text} />
                  </p>
                </div>
              </aside>
            );
          default:
            return (
              <p key={i}>
                <HelpInline text={block.text} />
              </p>
            );
        }
      })}
    </div>
  );
}
