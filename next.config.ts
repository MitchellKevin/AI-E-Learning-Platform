import path from "node:path";
import type { NextConfig } from "next";

const dev = process.env.NODE_ENV === "development";

// Content Security Policy. Next.js zet inline scripts in de pagina, dus 'unsafe-inline' blijft nodig (nonces later).
// In development gebruiken React en hot reload eval en een websocket.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  // blob: voor de logo-voorvertoning bij het organisatieprofiel.
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self'${dev ? " ws: wss:" : ""}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
  // Inloggen via SSO stuurt het formulier door naar Microsoft of Google.
  "form-action 'self' https://login.microsoftonline.com https://accounts.google.com",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "X-Frame-Options", value: "DENY" },
  ...(process.env.NODE_ENV === "production" ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }] : []),
];

const nextConfig: NextConfig = {
  // Aparte map voor controle-builds naast een draaiende dev-server (NEXT_DIST_DIR=.next-check).
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  sassOptions: {
    includePaths: [path.join(process.cwd(), "src/styles")],
  },
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
