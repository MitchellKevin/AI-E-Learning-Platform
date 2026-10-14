"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { Sparkles } from "lucide-react";
import type { TutorContext } from "@/lib/data/tutor";
import { Button } from "@/components/kit";
import { TutorDrawer } from "./tutor-drawer";
import { useTutorChat } from "./use-tutor-chat";
import styles from "./tutor-provider.module.scss";

type TutorApi = {
  /** Opent de tutor, eventueel met een voorgestelde vraag in het invoerveld. */
  openTutor: (prefill?: string) => void;
  /** De vaste knop in de hero; zodra die uit beeld is verschijnt de zwevende knop. */
  registerAnchor: (el: HTMLElement | null) => void;
};

const TutorApiContext = createContext<TutorApi | null>(null);

/** null buiten een TutorProvider, zodat onderdelen de tutor optioneel kunnen gebruiken. */
export function useTutor() {
  return useContext(TutorApiContext);
}

export function TutorProvider({ context, children }: { context: TutorContext; children: React.ReactNode }) {
  const chat = useTutorChat(context);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [anchorVisible, setAnchorVisible] = useState(true);

  useEffect(() => {
    if (!anchor) return;
    const observer = new IntersectionObserver(([entry]) => setAnchorVisible(entry.isIntersecting));
    observer.observe(anchor);
    return () => observer.disconnect();
  }, [anchor]);

  const openTutor = useCallback((prefill?: string) => {
    if (prefill) setDraft(prefill);
    setOpen(true);
  }, []);

  const api = useMemo(() => ({ openTutor, registerAnchor: setAnchor }), [openTutor]);
  const showFab = !anchorVisible && !open;

  return (
    <TutorApiContext.Provider value={api}>
      {children}

      {/* Wrapper animeert in/uit, de knop zelf heeft de hover-lift. */}
      <div className={clsx(styles.fab, showFab && styles.fabVisible)} inert={!showFab}>
        <button type="button" className={styles.fabButton} onClick={() => openTutor()} aria-haspopup="dialog">
          <Sparkles aria-hidden />
          <span className={styles.fabLabel}>Vraag de AI-tutor</span>
          {chat.busy && <span className={styles.fabPulse} aria-hidden />}
        </button>
      </div>

      <TutorDrawer
        open={open}
        onOpenChange={setOpen}
        context={context}
        chat={chat}
        draft={draft}
        onDraftChange={setDraft}
      />
    </TutorApiContext.Provider>
  );
}

// Vaste knop in de hero van het hoofdstuk.
export function TutorButton({ className }: { className?: string }) {
  const tutor = useTutor();
  if (!tutor) return null;
  return (
    <Button
      ref={tutor.registerAnchor}
      variant="secondary"
      size="sm"
      icon={<Sparkles />}
      className={clsx(styles.heroButton, className)}
      onClick={() => tutor.openTutor()}
      aria-haspopup="dialog"
    >
      Vraag de AI-tutor
    </Button>
  );
}
