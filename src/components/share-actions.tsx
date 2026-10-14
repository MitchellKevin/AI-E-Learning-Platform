"use client";

import { useState } from "react";
import clsx from "clsx";
import { Check, Download, Link2, Share2 } from "lucide-react";
import styles from "./share-actions.module.scss";

export function ShareActions({
  certificateNumber,
  pathTitle,
  issuedAt,
}: {
  certificateNumber: string;
  pathTitle: string;
  issuedAt: string;
}) {
  const [copied, setCopied] = useState(false);

  // Verificatiepagina komt er zodra de database er is.
  const verifyUrl = () => `${window.location.origin}/verify/${certificateNumber}`;

  async function copy() {
    await navigator.clipboard.writeText(verifyUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function addToLinkedIn() {
    const date = new Date(issuedAt);
    const params = new URLSearchParams({
      startTask: "CERTIFICATION_NAME",
      name: `${pathTitle} – AI Academy`,
      issueYear: String(date.getFullYear()),
      issueMonth: String(date.getMonth() + 1),
      certId: certificateNumber,
      certUrl: verifyUrl(),
    });
    window.open(`https://www.linkedin.com/profile/add?${params}`, "_blank", "noopener");
  }

  return (
    <div className={styles.actions}>
      {/* Voorlopig via de printdialoog; later een echte PDF-generatie. */}
      <button className={styles.primary} onClick={() => window.print()}>
        <Download /> Download als PDF
      </button>
      <button className={styles.secondary} onClick={addToLinkedIn}>
        <Share2 /> Toevoegen aan LinkedIn
      </button>
      <button className={clsx(styles.secondary, copied && styles.copied)} onClick={copy}>
        {/* Key wisselt mee, zodat het nieuwe icoon opnieuw mount en binnenkomt. */}
        <span key={String(copied)} className={clsx(styles.icon, copied ? styles.iconPop : styles.iconIn)}>
          {copied ? <Check /> : <Link2 />}
        </span>
        {/* Beide teksten gestapeld: vaste breedte en een crossfade. */}
        <span className={styles.labels}>
          <span aria-hidden={copied} className={clsx(styles.label, !copied && styles.labelActive)}>
            Kopieer verificatielink
          </span>
          <span aria-hidden={!copied} className={clsx(styles.label, copied && styles.labelActive)}>
            Link gekopieerd
          </span>
        </span>
      </button>
      <p className={styles.note}>Met de verificatielink kan iedereen controleren dat dit certificaat echt is.</p>
    </div>
  );
}
