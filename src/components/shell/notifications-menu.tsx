"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { Award, Bell, CalendarClock, CheckCheck, Flame, GraduationCap, Settings, Users } from "lucide-react";
import type { ShellNotification, ShellNotificationType } from "@/lib/data/shell";
import { EmptyState, Popover, PopoverContent, PopoverTrigger, SegmentedControl, usePopover } from "@/components/kit";
import btn from "./header-button.module.scss";
import styles from "./notifications-menu.module.scss";

const READ_KEY = "aia:gelezen-meldingen";

const typeIcon: Record<ShellNotificationType, React.ReactNode> = {
  streak: <Flame />,
  assignment: <CalendarClock />,
  badge: <Award />,
  certificate: <GraduationCap />,
  team: <Users />,
};

type Filter = "alles" | "ongelezen";

export function NotificationsMenu({ notifications }: { notifications: ShellNotification[] }) {
  const [items, setItems] = useState(notifications);
  const unread = items.filter((n) => !n.read).length;

  // Gelezen-status per browser onthouden tot er een echte backend is.
  useEffect(() => {
    try {
      const stored: unknown = JSON.parse(localStorage.getItem(READ_KEY) ?? "[]");
      if (Array.isArray(stored) && stored.length) {
        setItems((list) => list.map((n) => (stored.includes(n.id) ? { ...n, read: true } : n)));
      }
    } catch {
      // Geen opslag beschikbaar: alles blijft zoals de server het aanlevert.
    }
  }, []);

  function update(next: ShellNotification[]) {
    setItems(next);
    // Later: server action markNotificationsRead(ids) in MongoDB.
    try {
      localStorage.setItem(READ_KEY, JSON.stringify(next.filter((n) => n.read).map((n) => n.id)));
    } catch {
      // Negeren: de status geldt dan alleen voor deze sessie.
    }
  }

  return (
    <Popover>
      <PopoverTrigger
        className={btn.iconButton}
        aria-label={unread ? `Meldingen (${unread} nieuw)` : "Meldingen"}
        title="Meldingen"
      >
        <Bell aria-hidden />
        {unread > 0 && <span className={btn.dot} aria-hidden />}
      </PopoverTrigger>
      <PopoverContent label="Meldingen" align="end" className={styles.panel}>
        <Panel
          items={items}
          unread={unread}
          onMarkAll={() => update(items.map((n) => ({ ...n, read: true })))}
          onRead={(id) => update(items.map((n) => (n.id === id ? { ...n, read: true } : n)))}
        />
      </PopoverContent>
    </Popover>
  );
}

function Panel({
  items,
  unread,
  onMarkAll,
  onRead,
}: {
  items: ShellNotification[];
  unread: number;
  onMarkAll: () => void;
  onRead: (id: string) => void;
}) {
  const { close } = usePopover();
  const [filter, setFilter] = useState<Filter>("alles");
  const [announcement, setAnnouncement] = useState("");
  const visible = filter === "ongelezen" ? items.filter((n) => !n.read) : items;

  return (
    <>
      <div className={styles.head}>
        <div className={styles.headRow}>
          <h2 className={styles.title}>
            Meldingen
            {unread > 0 && <span className={styles.count}>{unread} nieuw</span>}
          </h2>
          <button
            type="button"
            className={styles.markAll}
            // aria-disabled i.p.v. disabled, zodat de focus niet wegvalt na het klikken.
            aria-disabled={unread === 0}
            onClick={() => {
              if (unread === 0) return;
              onMarkAll();
              setAnnouncement("Alle meldingen zijn als gelezen gemarkeerd.");
            }}
          >
            <CheckCheck aria-hidden />
            Alles als gelezen markeren
          </button>
        </div>
        <SegmentedControl<Filter>
          label="Toon meldingen"
          size="sm"
          fullWidth
          value={filter}
          onValueChange={setFilter}
          options={[
            { value: "alles", label: "Alles" },
            { value: "ongelezen", label: unread ? `Ongelezen (${unread})` : "Ongelezen" },
          ]}
        />
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>

      {visible.length ? (
        <ul className={styles.list}>
          {visible.map((n) => (
            <li key={n.id}>
              <Link
                href={n.href}
                className={clsx(styles.item, !n.read && styles.unread)}
                onClick={() => {
                  onRead(n.id);
                  close();
                }}
              >
                <span className={clsx(styles.icon, styles[n.type])} aria-hidden>
                  {typeIcon[n.type]}
                </span>
                <span className={styles.text}>
                  <span className={styles.itemTitle}>
                    {!n.read && <span className="sr-only">Nieuw: </span>}
                    {n.title}
                  </span>
                  <span className={styles.body}>{n.body}</span>
                  <time className={styles.time} dateTime={n.at}>
                    {n.timeLabel}
                  </time>
                </span>
                {!n.read && <span className={styles.unreadDot} aria-hidden />}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          variant="plain"
          icon={<CheckCheck />}
          title="Je bent helemaal bij"
          className={styles.empty}
        >
          {filter === "ongelezen"
            ? "Geen ongelezen meldingen. Nieuwe updates over je streak, toewijzingen en badges verschijnen hier."
            : "Nog geen meldingen. Updates over je streak, toewijzingen en badges verschijnen hier."}
        </EmptyState>
      )}

      <div className={styles.foot}>
        <Link href="/instellingen/meldingen" className={styles.footLink} onClick={() => close()}>
          <Settings aria-hidden />
          Meldingsvoorkeuren
        </Link>
      </div>
    </>
  );
}
