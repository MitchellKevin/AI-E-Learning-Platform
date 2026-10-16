import { NextRequest } from "next/server";
import { handlers } from "@/auth";

// SSO-callbacks altijd als nieuwe login behandelen: zonder bestaand sessiecookie koppelt Auth.js het
// Microsoft- of Google-account nooit aan een andere (al ingelogde) gebruiker. We kennen geen "account koppelen".
const SSO_CALLBACK = /\/api\/auth\/callback\/(google|microsoft-entra-id)$/;
const SESSION_COOKIE = /^(__Secure-)?authjs\.session-token(\.\d+)?=/;

export async function GET(request: NextRequest) {
  if (!SSO_CALLBACK.test(request.nextUrl.pathname)) return handlers.GET(request);
  const headers = new Headers(request.headers);
  const cookies = (headers.get("cookie") ?? "").split(/;\s*/).filter((c) => c && !SESSION_COOKIE.test(c));
  headers.set("cookie", cookies.join("; "));
  return handlers.GET(new NextRequest(request.url, { headers }));
}

export const { POST } = handlers;
