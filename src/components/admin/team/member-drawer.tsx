"use client";

import Link from "next/link";
import clsx from "clsx";
import { Award, BookOpenCheck, CircleCheck, CircleX, ExternalLink, Mail, Send } from "lucide-react";
import { Avatar, Badge, Button, Drawer, ProgressBar, StatusPill } from "@/components/kit";
import type { ActivityItem, PathState, TeamMember } from "@/lib/data/admin-team";
import { formatDaysAgo, formatLongDate, formatShortDate } from "@/components/admin/shell/format";
import { formatNumber } from "@/lib/format";
import { RemindButton } from "./remind-button";
import { statusLabel, statusVariant } from "./status";
import styles from "./member-drawer.module.scss";

type Props = {
  member: TeamMember | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssign: (memberId: string) => void;
};

const pathStateLabel: Record<PathState, string> = { afgerond: "Afgerond", bezig: "Bezig", "niet-gestart": "Niet gestart" };
const pathStateVariant = { afgerond: "brand", bezig: "neutral", "niet-gestart": "neutral" } as const;

const activityIcon: Record<ActivityItem["kind"], React.ReactNode> = {
  chapter: <CircleCheck />,
  certificate: <Award />,
  exam: <CircleX />,
  invite: <Send />,
};

export function MemberDrawer({ member, open, onOpenChange, onAssign }: Props) {
  return (
    <Drawer
      open={open && member !== null}
      onOpenChange={onOpenChange}
      title={member?.name ?? "Collega"}
      description={member ? `${member.role} · Team ${member.team}` : undefined}
      size="md"
      footer={
        member && (
          <>
            <Button variant="secondary" icon={<BookOpenCheck />} onClick={() => onAssign(member.id)}>
              Leerpad toewijzen
            </Button>
            <RemindButton
              names={[member.name]}
              topic={member.currentPath.title}
              variant="primary"
              size="md"
              label={member.status === "uitgenodigd" ? "Uitnodiging opnieuw sturen" : "Stuur herinnering"}
            />
          </>
        )
      }
    >
      {member && <MemberDetail member={member} />}
    </Drawer>
  );
}

function MemberDetail({ member }: { member: TeamMember }) {
  const invited = member.status === "uitgenodigd";

  return (
    <div className={styles.detail}>
      <div className={styles.profile}>
        <Avatar initials={member.initials} size={56} />
        <div className={styles.profileText}>
          <StatusPill variant={statusVariant[member.status]} size="sm">
            {statusLabel[member.status]}
          </StatusPill>
          <a href={`mailto:${member.email}`} className={styles.email}>
            <Mail aria-hidden />
            {member.email}
          </a>
          <p className={styles.lastActive}>
            {invited
              ? `Uitgenodigd op ${formatLongDate(member.invitedAt ?? member.activity[0]?.date ?? "")}`
              : `Laatst actief: ${formatDaysAgo(member.daysInactive).toLowerCase()}`}
          </p>
        </div>
      </div>

      <dl className={styles.stats}>
        <div className={styles.stat}>
          <dt>Punten</dt>
          <dd>{formatNumber(member.points)}</dd>
        </div>
        <div className={styles.stat}>
          <dt>Streak</dt>
          <dd>{member.streak > 0 ? `${member.streak} dagen` : "–"}</dd>
        </div>
        <div className={styles.stat}>
          <dt>Per week</dt>
          <dd>{member.minutesPerWeek > 0 ? `${member.minutesPerWeek} min` : "–"}</dd>
        </div>
      </dl>

      <section aria-labelledby="drawer-paths" className={styles.section}>
        <h3 id="drawer-paths" className={styles.sectionTitle}>
          Voortgang per leerpad
        </h3>
        <ul className={styles.paths}>
          {member.paths.map((p) => (
            <li key={p.slug} className={styles.path}>
              <div className={styles.pathHead}>
                <span className={styles.pathTitle}>{p.title}</span>
                <Badge variant={pathStateVariant[p.state]} size="sm">
                  {pathStateLabel[p.state]}
                </Badge>
              </div>
              <ProgressBar value={p.progress} />
              <p className={styles.pathMeta}>
                <span>{p.progress}%</span>
                {p.state === "afgerond" && p.completedAt && <span>Afgerond op {formatShortDate(p.completedAt)}</span>}
                {p.state !== "afgerond" && p.deadline && (
                  <span className={clsx(p.atRisk && styles.risk)}>
                    {p.atRisk ? `Achter (verwacht ${p.expected}%) · ` : ""}deadline {formatShortDate(p.deadline)}
                    {p.required ? " · verplicht" : ""}
                  </span>
                )}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="drawer-activity" className={styles.section}>
        <h3 id="drawer-activity" className={styles.sectionTitle}>
          Recente activiteit
        </h3>
        {member.activity.length === 0 ? (
          <p className={styles.empty}>Nog geen activiteit.</p>
        ) : (
          <ol className={styles.timeline}>
            {member.activity.map((item) => (
              <li key={item.id} className={clsx(styles.event, styles[item.kind])}>
                <span className={styles.eventIcon} aria-hidden>
                  {activityIcon[item.kind]}
                </span>
                <div className={styles.eventText}>
                  <p className={styles.eventLabel}>{item.label}</p>
                  {item.detail && <p className={styles.eventDetail}>{item.detail}</p>}
                </div>
                <time dateTime={item.date} className={styles.eventDate}>
                  {formatShortDate(item.date)}
                </time>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section aria-labelledby="drawer-certificates" className={styles.section}>
        <h3 id="drawer-certificates" className={styles.sectionTitle}>
          Certificaten
        </h3>
        {member.certificates.length === 0 ? (
          <p className={styles.empty}>
            {invited ? "Nog niet begonnen." : `Nog geen certificaat. ${member.currentPath.title} staat op ${member.currentPath.progress}%.`}
          </p>
        ) : (
          <ul className={styles.certificates}>
            {member.certificates.map((c) => (
              <li key={c.number} className={styles.certificate}>
                <span className={styles.certificateIcon} aria-hidden>
                  <Award />
                </span>
                <div className={styles.certificateText}>
                  <p className={styles.certificateTitle}>{c.pathTitle}</p>
                  <p className={styles.certificateMeta}>
                    {formatShortDate(c.issuedAt)} · score {c.score}% · {c.number}
                  </p>
                </div>
                <Link href={`/verify/${c.number}`} className={styles.certificateLink} target="_blank">
                  Bekijk
                  <ExternalLink aria-hidden />
                  <span className="visually-hidden"> certificaat {c.pathTitle} (opent in nieuw tabblad)</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
