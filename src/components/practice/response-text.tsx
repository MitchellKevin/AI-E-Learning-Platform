import { Fragment, type ReactNode } from "react";
import styles from "./response-text.module.scss";

type Block =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "quote"; text: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "code"; text: string };

// Mini-markdown voor AI-antwoorden: kopjes, lijsten, citaten, codeblokken, **vet** en `code`.
// Werkt ook op half binnengekomen tekst tijdens het streamen (een open codeblok blijft code).
function parse(source: string): Block[] {
  const blocks: Block[] = [];
  const lines = source.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("```")) {
      const code: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) code.push(lines[i++]);
      i++;
      blocks.push({ type: "code", text: code.join("\n") });
      continue;
    }

    if (!line.trim()) {
      i++;
      continue;
    }

    if (line.startsWith("## ")) {
      blocks.push({ type: "heading", text: line.slice(3) });
      i++;
      continue;
    }

    const listMatch = /^(\d+\.|[-*])\s+/.exec(line);
    if (listMatch) {
      const ordered = /\d/.test(listMatch[1]);
      const items: string[] = [];
      while (i < lines.length && /^(\d+\.|[-*])\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^(\d+\.|[-*])\s+/, ""));
        i++;
      }
      blocks.push({ type: "list", ordered, items });
      continue;
    }

    if (line.startsWith("> ")) {
      const quote: string[] = [];
      while (i < lines.length && lines[i].startsWith("> ")) quote.push(lines[i++].slice(2));
      blocks.push({ type: "quote", text: quote.join(" ") });
      continue;
    }

    const paragraph: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^(```|## |> |\d+\.\s|[-*]\s)/.test(lines[i])) {
      paragraph.push(lines[i++]);
    }
    blocks.push({ type: "paragraph", text: paragraph.join("\n") });
  }

  return blocks;
}

function inline(text: string): ReactNode {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) return <code key={i}>{part.slice(1, -1)}</code>;
    return <Fragment key={i}>{part}</Fragment>;
  });
}

// Tijdens het streamen kan een **vet** stuk nog open staan; sluit het tijdelijk, zodat je geen sterretjes ziet.
function closeDangling(text: string) {
  return (text.match(/\*\*/g)?.length ?? 0) % 2 === 1 ? `${text}**` : text;
}

export function ResponseText({ text, caret }: { text: string; caret?: boolean }) {
  const blocks = parse(caret ? closeDangling(text) : text);
  const last = blocks.length - 1;
  // De knipperende cursor staat achter het laatste stukje tekst, ook midden in een lijst of codeblok.
  const tail = (i: number) => (caret && i === last ? <span className={styles.caret} aria-hidden /> : null);

  return (
    <div className={styles.root}>
      {blocks.map((block, i) => {
        switch (block.type) {
          case "heading":
            return (
              <p key={i} className={styles.heading}>
                {inline(block.text)}
                {tail(i)}
              </p>
            );
          case "paragraph":
            return (
              <p key={i} className={styles.paragraph}>
                {inline(block.text)}
                {tail(i)}
              </p>
            );
          case "quote":
            return (
              <blockquote key={i} className={styles.quote}>
                {inline(block.text)}
                {tail(i)}
              </blockquote>
            );
          case "list": {
            const List = block.ordered ? "ol" : "ul";
            return (
              <List key={i} className={styles.list}>
                {block.items.map((item, j) => (
                  <li key={j}>
                    {inline(item)}
                    {j === block.items.length - 1 && tail(i)}
                  </li>
                ))}
              </List>
            );
          }
          case "code":
            return (
              <pre key={i} className={styles.code}>
                <code>{block.text}</code>
                {tail(i)}
              </pre>
            );
        }
      })}
      {caret && blocks.length === 0 && <span className={styles.caret} aria-hidden />}
    </div>
  );
}
