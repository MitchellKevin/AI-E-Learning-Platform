import clsx from "clsx";
import { BadgeCheck, BarChart3, Bot, KeyRound, ServerCog, ShieldCheck, Sparkles, TerminalSquare } from "lucide-react";
import type { ReactNode } from "react";
import { PracticePreview } from "./practice-preview";
import styles from "./feature-grid.module.scss";

type Feature = {
  icon: ReactNode;
  title: string;
  text: string;
  visual?: ReactNode;
  wide?: boolean;
};

const features: Feature[] = [
  {
    icon: <TerminalSquare />,
    title: "Oefenomgeving met echte AI",
    text: "Schrijf prompts voor situaties uit je eigen werk en krijg direct feedback op wat beter kan. Oefenen zonder risico, met dezelfde AI die je straks in je werk gebruikt.",
    visual: <PracticePreview />,
    wide: true,
  },
  {
    icon: <Bot />,
    title: "AI-tutor in elk hoofdstuk",
    text: "Iets niet helemaal duidelijk? Stel je vraag aan de tutor. Die kent de stof van het hoofdstuk en legt het uit met voorbeelden uit jouw vak.",
    visual: <TutorVisual />,
  },
  {
    icon: <BarChart3 />,
    title: "Voortgang voor managers",
    text: "Per team en per persoon zie je wie waar staat. Wijs leerpaden toe met een deadline en exporteer rapportages.",
    visual: <ProgressVisual />,
  },
  {
    icon: <BadgeCheck />,
    title: "Certificaten met verificatie",
    text: "Na de eindtoets krijg je een certificaat met een uniek nummer. Iedereen kan het controleren via een openbare link.",
    visual: <CertificateVisual />,
  },
  {
    icon: <KeyRound />,
    title: "Single sign-on",
    text: "Collega's loggen in met hun werkaccount. Wie uit dienst gaat, verliest automatisch de toegang.",
    visual: <SsoVisual />,
  },
];

const privacyPoints = ["Servers in de EU", "Verwerkersovereenkomst", "Geen training op jullie data", "Versleuteld opgeslagen"];

// Functieoverzicht als bento-raster, met kleine productbeelden in HTML/CSS.
export function FeatureGrid() {
  return (
    <ul className={styles.grid}>
      {features.map((feature) => (
        <li key={feature.title} className={clsx(styles.item, feature.wide && styles.wide)}>
          <article className={styles.card}>
            <span className={styles.icon} aria-hidden>
              {feature.icon}
            </span>
            <h3 className={styles.title}>{feature.title}</h3>
            <p className={styles.text}>{feature.text}</p>
            {feature.visual && <div className={styles.visual}>{feature.visual}</div>}
          </article>
        </li>
      ))}

      <li className={clsx(styles.item, styles.full)}>
        <article className={clsx(styles.card, styles.privacy)}>
          <div>
            <span className={clsx(styles.icon, styles.success)} aria-hidden>
              <ShieldCheck />
            </span>
            <h3 className={styles.title}>Hosting in de EU, AVG-proof</h3>
            <p className={styles.text}>
              Alle data blijft in de EU en we verwerken alleen wat nodig is om te leren. Jullie privacy officer krijgt
              van ons alles wat nodig is om ja te zeggen.
            </p>
          </div>
          <ul className={styles.privacyList}>
            {privacyPoints.map((point) => (
              <li key={point}>
                <ServerCog aria-hidden />
                {point}
              </li>
            ))}
          </ul>
        </article>
      </li>
    </ul>
  );
}

function TutorVisual() {
  return (
    <div className={styles.chat} aria-hidden>
      <span className={clsx(styles.bubble, styles.me)}>Wat is het verschil tussen context en geheugen?</span>
      <span className={styles.bubble}>
        <Sparkles />
        Context is alles wat het model nu ziet. Geheugen bestaat eigenlijk niet: elk gesprek begint opnieuw…
      </span>
    </div>
  );
}

function ProgressVisual() {
  const rows = [
    { team: "Design", value: 72 },
    { team: "Frontend", value: 54 },
    { team: "Backend", value: 38 },
  ];
  return (
    <div className={styles.bars} aria-hidden>
      {rows.map((row) => (
        <span key={row.team} className={styles.barRow}>
          <span className={styles.barLabel}>{row.team}</span>
          <span className={styles.barTrack}>
            <span className={styles.barFill} style={{ width: `${row.value}%` }} />
          </span>
          <span className={styles.barValue}>{row.value}%</span>
        </span>
      ))}
    </div>
  );
}

function CertificateVisual() {
  return (
    <div className={styles.verify} aria-hidden>
      <span className={styles.verifyIcon}>
        <BadgeCheck />
      </span>
      <span className={styles.verifyText}>
        <span className={styles.verifyTitle}>Echt certificaat</span>
        <span className={styles.verifyMeta}>AI 101 · AIA-101-2026-0127</span>
      </span>
    </div>
  );
}

function SsoVisual() {
  return (
    <div className={styles.sso} aria-hidden>
      <span className={styles.ssoPill}>
        <span className={clsx(styles.ssoMark, styles.google)}>G</span>
        Google Workspace
      </span>
      <span className={styles.ssoPill}>
        <span className={clsx(styles.ssoMark, styles.microsoft)} />
        Microsoft Entra ID
      </span>
    </div>
  );
}
