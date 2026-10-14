"use client";

import { Download, FileText } from "lucide-react";
import {
  Alert,
  Button,
  EmptyState,
  IconButton,
  StatusPill,
  TBody,
  THead,
  Table,
  Td,
  Th,
  Tr,
  useToast,
  VisuallyHidden,
} from "@/components/kit";
import { VAT_RATE, formatEuro, formatShortDate, type Invoice } from "@/lib/data/admin-org";
import { Panel } from "../panel";
import styles from "./invoices.module.scss";

const withVat = (amount: number) => amount * (1 + VAT_RATE);

export function Invoices({ invoices }: { invoices: Invoice[] }) {
  const { toast } = useToast();
  const open = invoices.filter((i) => i.status === "open");

  function download(invoice: Invoice) {
    // Straks: link naar de PDF in Stripe.
    toast({ title: "PDF volgt", description: `Factuur ${invoice.number} staat zo klaar in je downloads.` });
  }

  function pay(invoice: Invoice) {
    // Straks: doorsturen naar de gehoste factuurpagina van Stripe.
    toast({
      title: "Je gaat naar de betaalpagina",
      description: `Betaal factuur ${invoice.number} met iDEAL of creditcard.`,
    });
  }

  return (
    <Panel title="Facturen" description="Facturen worden ook gemaild naar je factuuradres." flush={invoices.length > 0}>
      {invoices.length === 0 ? (
        <EmptyState icon={<FileText />} title="Nog geen facturen">
          Je eerste factuur verschijnt hier zodra je abonnement start.
        </EmptyState>
      ) : (
        <>
          {open.map((invoice) => (
            <Alert
              key={invoice.number}
              variant="warning"
              title={`Factuur ${invoice.number} staat open`}
              action={
                <Button size="sm" variant="secondary" onClick={() => pay(invoice)}>
                  Nu betalen
                </Button>
              }
              className={styles.alert}
            >
              {formatEuro(withVat(invoice.amount))} incl. btw
              {invoice.dueAt && <>, te betalen vóór {formatShortDate(invoice.dueAt)}</>}. We schrijven het bedrag
              automatisch af als je niets doet.
            </Alert>
          ))}
          <Table label="Facturen" minWidth={620} bare containerClassName={styles.tableWrap}>
            <THead>
              <Tr>
                <Th>Factuur</Th>
                <Th>Datum</Th>
                <Th>Omschrijving</Th>
                <Th align="end">Bedrag</Th>
                <Th>Status</Th>
                <Th shrink>
                  <VisuallyHidden>Downloaden</VisuallyHidden>
                </Th>
              </Tr>
            </THead>
            <TBody>
              {invoices.map((invoice) => (
                <Tr key={invoice.number}>
                  <Td className={styles.number}>{invoice.number}</Td>
                  <Td muted className={styles.nowrap}>
                    {formatShortDate(invoice.date)}
                  </Td>
                  <Td muted className={styles.description}>
                    {invoice.description}
                  </Td>
                  <Td numeric>
                    <span className={styles.amount}>{formatEuro(withVat(invoice.amount))}</span>
                    <span className={styles.excl}>{formatEuro(invoice.amount)} excl.</span>
                  </Td>
                  <Td>
                    {invoice.status === "betaald" ? (
                      <StatusPill variant="success" size="sm">
                        Betaald
                      </StatusPill>
                    ) : (
                      <StatusPill variant="warning" size="sm">
                        Open
                      </StatusPill>
                    )}
                  </Td>
                  <Td shrink>
                    <IconButton
                      label={`Factuur ${invoice.number} downloaden (PDF)`}
                      icon={<Download />}
                      variant="ghost"
                      size="sm"
                      onClick={() => download(invoice)}
                    />
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        </>
      )}
    </Panel>
  );
}
