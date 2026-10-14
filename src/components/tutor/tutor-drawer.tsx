"use client";

import { Fragment, useEffect, useLayoutEffect, useRef } from "react";
import Link from "next/link";
import clsx from "clsx";
import { ArrowUp, BookOpen, RotateCcw, Sparkles, Square } from "lucide-react";
import type { TutorContext } from "@/lib/data/tutor";
import { Button, Drawer, IconButton, Kbd, Textarea, VisuallyHidden } from "@/components/kit";
import type { ChatMessage, TutorChat } from "./use-tutor-chat";
import styles from "./tutor-drawer.module.scss";

export function TutorDrawer({
  open,
  onOpenChange,
  context,
  chat,
  draft,
  onDraftChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context: TutorContext;
  chat: TutorChat;
  draft: string;
  onDraftChange: (value: string) => void;
}) {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Een voorgestelde vraag staat al in het veld: cursor erachter, zodat je meteen kunt aanvullen.
  useEffect(() => {
    const el = inputRef.current;
    if (!open || !el) return;
    el.setSelectionRange(el.value.length, el.value.length);
  }, [open]);

  function send(text: string) {
    if (!chat.send(text)) return;
    onDraftChange("");
    // Na een klik op een suggestie verdwijnt die knop; de focus gaat terug naar het invoerveld.
    inputRef.current?.focus();
  }

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      title={
        <span className={styles.title}>
          <span className={styles.titleIcon} aria-hidden>
            <Sparkles />
          </span>
          AI-tutor
        </span>
      }
      description={`${context.pathTitle} · hoofdstuk ${context.chapterNumber}`}
      initialFocusRef={inputRef}
      bodyClassName={styles.body}
      footer={
        <Composer
          inputRef={inputRef}
          value={draft}
          onChange={onDraftChange}
          busy={chat.busy}
          onSend={() => send(draft)}
          onStop={() => {
            chat.stop();
            inputRef.current?.focus();
          }}
        />
      }
    >
      <Conversation context={context} chat={chat} onSuggestion={send} />
      <VisuallyHidden>
        <span aria-live="polite" aria-atomic="true">
          {chat.announcement}
        </span>
      </VisuallyHidden>
    </Drawer>
  );
}

function Conversation({
  context,
  chat,
  onSuggestion,
}: {
  context: TutorContext;
  chat: TutorChat;
  onSuggestion: (text: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  const { messages, busy } = chat;
  const last = messages[messages.length - 1];
  const fresh = messages.length === 1;

  // Volg het gesprek naar beneden, tenzij je zelf omhoog hebt gescrold.
  useLayoutEffect(() => {
    const scroller = ref.current?.parentElement;
    if (scroller && stickToBottom.current) scroller.scrollTop = scroller.scrollHeight;
  }, [messages]);

  useEffect(() => {
    const scroller = ref.current?.parentElement;
    if (!scroller) return;
    const onScroll = () => {
      stickToBottom.current = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight < 48;
    };
    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => scroller.removeEventListener("scroll", onScroll);
  }, []);

  // Een nieuwe vraag scrolt altijd mee.
  const userCount = messages.filter((m) => m.role === "user").length;
  useLayoutEffect(() => {
    stickToBottom.current = true;
  }, [userCount]);

  // Na een antwoord de vervolgvragen; zonder passend antwoord weer de startsuggesties.
  const suggestions = fresh
    ? context.suggestions
    : last.status === "done" && !busy
      ? last.fallback
        ? context.suggestions
        : (last.followUps ?? [])
      : [];

  return (
    <div ref={ref} className={styles.conversation}>
      <div className={styles.toolbar}>
        <p className={styles.context}>
          <BookOpen aria-hidden />
          <span className={styles.contextText}>{context.chapterTitle}</span>
        </p>
        <Button
          variant="ghost"
          size="sm"
          icon={<RotateCcw />}
          onClick={chat.reset}
          disabled={fresh}
          className={styles.reset}
        >
          Nieuw gesprek
        </Button>
      </div>

      {/* aria-live staat uit: tokens zouden anders één voor één worden voorgelezen. De samenvatting gaat via de live-regio. */}
      <ol className={styles.messages} role="log" aria-live="off" aria-label="Gesprek met de AI-tutor">
        {messages.map((message) => (
          <Message key={message.id} message={message} />
        ))}
      </ol>

      {suggestions.length > 0 && (
        <div className={styles.suggestions} key={fresh ? "start" : last.id}>
          <p className={styles.suggestionsLabel} id="tutor-suggesties">
            {fresh ? "Probeer bijvoorbeeld" : "Verder vragen"}
          </p>
          <ul className={styles.chips} aria-labelledby="tutor-suggesties">
            {suggestions.map((s) => (
              <li key={s}>
                <button type="button" className={styles.chip} onClick={() => onSuggestion(s)}>
                  {s}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Message({ message }: { message: ChatMessage }) {
  if (message.role === "user") {
    return (
      <li className={clsx(styles.message, styles.user)}>
        <VisuallyHidden>Jij: </VisuallyHidden>
        <div className={styles.bubble}>{message.text}</div>
      </li>
    );
  }

  const { status, text, source, fallback } = message;
  return (
    <li className={clsx(styles.message, styles.assistant)}>
      <span className={styles.avatar} aria-hidden>
        <Sparkles />
      </span>
      <div className={styles.answer}>
        <VisuallyHidden>AI-tutor: </VisuallyHidden>
        {status === "thinking" ? (
          <span className={styles.thinking}>
            <span className={styles.dots} aria-hidden>
              <span />
              <span />
              <span />
            </span>
            Denkt na…
          </span>
        ) : (
          <div className={clsx(styles.text, status === "streaming" && styles.streaming)}>
            <RichText text={text} />
          </div>
        )}

        {status === "stopped" && <p className={styles.stopped}>{text ? "Gestopt." : "Antwoord gestopt."}</p>}

        {status === "done" && source && (
          <p className={styles.source}>
            <BookOpen aria-hidden />
            Gebaseerd op: {source}
          </p>
        )}
        {status === "done" && fallback && (
          <p className={styles.source}>
            <Link href="/help">Naar het helpcentrum</Link>
          </p>
        )}
      </div>
    </li>
  );
}

// Minimale opmaak: alinea's en lijstjes met "- ". Later rendert dit de markdown van de Claude API.
function RichText({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/).filter(Boolean);
  return (
    <>
      {blocks.map((block, i) => {
        const lines = block.split("\n");
        if (lines.every((l) => l.trimStart().startsWith("- "))) {
          return (
            <ul key={i}>
              {lines.map((l, j) => (
                <li key={j}>{l.trimStart().slice(2)}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i}>
            {lines.map((l, j) => (
              <Fragment key={j}>
                {j > 0 && <br />}
                {l}
              </Fragment>
            ))}
          </p>
        );
      })}
    </>
  );
}

function Composer({
  inputRef,
  value,
  onChange,
  busy,
  onSend,
  onStop,
}: {
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  value: string;
  onChange: (value: string) => void;
  busy: boolean;
  onSend: () => void;
  onStop: () => void;
}) {
  return (
    <form
      className={styles.composer}
      onSubmit={(e) => {
        e.preventDefault();
        onSend();
      }}
    >
      <div className={styles.inputRow}>
        <label htmlFor="tutor-vraag" className="visually-hidden">
          Stel een vraag aan de AI-tutor
        </label>
        <Textarea
          ref={inputRef}
          id="tutor-vraag"
          rows={1}
          autoResize
          maxRows={5}
          value={value}
          placeholder="Stel een vraag over dit hoofdstuk…"
          aria-describedby="tutor-uitleg"
          className={styles.input}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            // Enter verstuurt, Shift+Enter maakt een nieuwe regel.
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              if (!busy) onSend();
            }
          }}
        />
        {busy ? (
          <IconButton label="Stop antwoord" icon={<Square />} variant="dark" onClick={onStop} className={styles.send} />
        ) : (
          <IconButton
            type="submit"
            label="Versturen"
            icon={<ArrowUp />}
            variant="primary"
            disabled={!value.trim()}
            className={styles.send}
          />
        )}
      </div>
      <p className={styles.disclaimer} id="tutor-uitleg">
        <span className={styles.keys}>
          <Kbd>Enter</Kbd> versturen · <Kbd>Shift</Kbd>+<Kbd>Enter</Kbd> nieuwe regel.{" "}
        </span>
        De AI-tutor kan fouten maken. Controleer belangrijke informatie in de lesstof.
      </p>
    </form>
  );
}
