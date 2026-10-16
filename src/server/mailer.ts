import { appendFile } from "node:fs/promises";

// E-mail versturen. Nog geen mailprovider: in development (en tests) naar de console, in development ook
// naar .dev-mail.log; later Resend.
// In productie loggen we nooit de inhoud of de link: die bevat inlog- en uitnodigingstokens.

export type Mail = { to: string; subject: string; text: string; url?: string };

export async function sendMail(mail: Mail) {
  if (process.env.NODE_ENV === "production") {
    const domain = mail.to.split("@")[1] ?? "onbekend";
    console.warn(`[mail] Geen mailprovider ingesteld; niet verstuurd: "${mail.subject}" naar een adres op ${domain}`);
    return;
  }
  const line = "─".repeat(60);
  const body = `\n${line}\n✉  Aan: ${mail.to}\n   Onderwerp: ${mail.subject}\n   ${new Date().toISOString()}\n\n${mail.text}${mail.url ? `\n\n   ${mail.url}` : ""}\n${line}\n`;
  console.info(body);
  if (process.env.NODE_ENV === "development") await appendFile(".dev-mail.log", body).catch(() => {});
}
