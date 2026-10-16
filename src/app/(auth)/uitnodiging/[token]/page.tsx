import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarClock, Link2Off, TimerReset, UserCheck } from "lucide-react";
import { Avatar, Button, Tag, Tags } from "@/components/kit";
import { AuthCard, AuthDivider, AuthNote } from "@/components/auth/auth-card";
import { SsoButtons } from "@/components/auth/sso-buttons";
import { InviteEmailButton } from "@/components/auth/invite-email-button";
import { SignedInAs } from "@/components/auth/signed-in-as";
import { initialsOf } from "@/server/models/user";
import { getSessionUser } from "@/server/session";
import { ssoEnabled } from "@/server/env";
import type { SsoProvider } from "@/lib/data/auth";
import { getInvite, type Invite } from "@/lib/data/auth";
import { formatDate } from "@/lib/format";
import styles from "./page.module.scss";

export const metadata: Metadata = {
  title: "Uitnodiging – AI Academy",
  // Uitnodigingslinks zijn persoonlijk.
  robots: { index: false },
};

export const dynamic = "force-dynamic";

const providerLabel = { microsoft: "Microsoft", google: "Google" };

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const [invite, current] = await Promise.all([getInvite(token), getSessionUser()]);

  // Ongeldige links krijgen een vriendelijke uitleg in plaats van een kale 404.
  if (!invite) return <InviteNotFound />;
  if (invite.status === "expired") return <InviteExpired invite={invite} />;
  if (invite.status === "accepted") return <InviteAccepted invite={invite} />;

  const { organisation, inviter } = invite;
  const provider = organisation.ssoProvider;

  return (
    <AuthCard
      size="md"
      eyebrow="Uitnodiging"
      title={
        <>
          {inviter.name} nodigt je uit voor {organisation.name}
        </>
      }
      lead={`${organisation.name} gebruikt AI Academy om het team te leren werken met AI. Maak je account aan en begin direct met je eerste leerpad.`}
      after={
        <p>
          Heb je al een account? <Link href="/inloggen">Log in</Link>
        </p>
      }
    >
      <div className={styles.org}>
        <span className={styles.orgMark} aria-hidden>
          {organisation.initials}
        </span>
        <div className={styles.orgText}>
          <p className={styles.orgName}>{organisation.name}</p>
          <p className={styles.orgMeta}>{organisation.memberCount} collega&apos;s leren al mee</p>
        </div>
      </div>

      <dl className={styles.details}>
        <div className={styles.detail}>
          <dt>Uitgenodigd door</dt>
          <dd className={styles.person}>
            <Avatar initials={inviter.initials} size={24} />
            <span>
              {inviter.name}, <span className={styles.muted}>{inviter.title}</span>
            </span>
          </dd>
        </div>
        <div className={styles.detail}>
          <dt>Je rol</dt>
          <dd>
            {invite.role} in team {invite.team}
          </dd>
        </div>
        <div className={styles.detail}>
          <dt>E-mailadres</dt>
          <dd className={styles.email}>{invite.email}</dd>
        </div>
        <div className={styles.detail}>
          <dt>Leerpad</dt>
          <dd>
            <Tags>
              {invite.paths.map((path) => (
                <Tag key={path} variant="brand">
                  {path}
                </Tag>
              ))}
            </Tags>
            {invite.deadline && (
              <span className={styles.deadline}>
                <CalendarClock aria-hidden />
                Afronden vóór {formatDate(invite.deadline)}
              </span>
            )}
          </dd>
        </div>
      </dl>

      <div className={styles.actions}>
        {provider && (
          <p className={styles.providerHint}>
            {organisation.name} logt in via {providerLabel[provider]}. Gebruik het account van {invite.email}.
          </p>
        )}
        {current ? (
          // Iemand anders is al ingelogd in deze browser: eerst uitloggen, zodat de uitnodiging bij het juiste account komt.
          <>
            <p className={styles.providerHint}>
              {current.email === invite.email
                ? "Je bent al ingelogd met dit e-mailadres."
                : `Deze uitnodiging is voor ${invite.email}. Log eerst uit om hem te accepteren.`}
            </p>
            <SignedInAs
              name={`${current.firstName} ${current.lastName}`.trim()}
              email={current.email}
              initials={initialsOf(current.firstName, current.lastName, current.email)}
            />
          </>
        ) : (
          <>
            <SsoButtons
              next="/welkom"
              recommended={provider}
              enabled={(["microsoft", "google"] as SsoProvider[]).filter((p) => ssoEnabled[p]())}
            />
            <AuthDivider>of</AuthDivider>
            <InviteEmailButton email={invite.email} />
          </>
        )}
      </div>

      <AuthNote>
        Door verder te gaan ga je akkoord met de <Link href="/voorwaarden">voorwaarden</Link> en het{" "}
        <Link href="/privacy">privacybeleid</Link>. Deze uitnodiging is geldig tot {formatDate(invite.expiresAt)}.
      </AuthNote>
    </AuthCard>
  );
}

function InviteNotFound() {
  return (
    <AuthCard
      icon={<Link2Off />}
      tone="danger"
      title="Deze uitnodiging kunnen we niet vinden"
      lead="Misschien is de link niet helemaal gekopieerd of is de uitnodiging ingetrokken. Open de link opnieuw vanuit de e-mail, of vraag de persoon die je uitnodigde om een nieuwe."
      after={
        <p>
          Hulp nodig? <Link href="/help">Bekijk het helpcenter</Link>
        </p>
      }
    >
      <Button href="/inloggen" size="lg" fullWidth iconRight={<ArrowRight />}>
        Naar inloggen
      </Button>
    </AuthCard>
  );
}

function InviteExpired({ invite }: { invite: Invite }) {
  return (
    <AuthCard
      icon={<TimerReset />}
      tone="warning"
      title="Deze uitnodiging is verlopen"
      lead={
        <>
          De uitnodiging van {invite.inviter.name} voor {invite.organisation.name} was geldig tot{" "}
          {formatDate(invite.expiresAt)}. Vraag {invite.inviter.name.split(" ")[0]} om je opnieuw uit te nodigen; je
          krijgt dan meteen een nieuwe link.
        </>
      }
      after={
        <p>
          Heb je al een account? <Link href="/inloggen">Log in</Link>
        </p>
      }
    >
      <AuthNote>Uitnodigingen zijn twee weken geldig, zodat een oude link niet in verkeerde handen valt.</AuthNote>
    </AuthCard>
  );
}

function InviteAccepted({ invite }: { invite: Invite }) {
  return (
    <AuthCard
      icon={<UserCheck />}
      tone="success"
      title="Je hebt deze uitnodiging al geaccepteerd"
      lead={
        <>
          Je account bij {invite.organisation.name} staat klaar. Log in met <strong>{invite.email}</strong> om verder
          te gaan waar je gebleven was.
        </>
      }
    >
      <Button href="/inloggen" size="lg" fullWidth iconRight={<ArrowRight />}>
        Naar inloggen
      </Button>
    </AuthCard>
  );
}
