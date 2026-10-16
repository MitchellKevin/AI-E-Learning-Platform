import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import type { Provider } from "next-auth/providers";
import { authConfig, type AppToken } from "@/auth.config";
import { mongooseAdapter } from "@/server/auth-adapter";
import { connectDb } from "@/server/db";
import { sendMail } from "@/server/mailer";
import { User, initialsOf } from "@/server/models";
import { canSignIn, ssoRequiredFor, ssoSignInAllowed } from "@/server/services/membership";
import { MINUTE, clientIp, magicLinkLimit, rateLimit } from "@/server/services/rate-limit";
import { demoLoginEnabled, ssoEnabled } from "@/server/env";

// Volledige Auth.js-config (Node): providers, adapter en het verrijken van het token met organisatie en rol.

const providers: Provider[] = [
  {
    id: "email",
    type: "email",
    name: "E-mail",
    from: "AI Academy <noreply@aiacademy.nl>",
    // Gelijk aan wat het inlogscherm belooft.
    maxAge: 15 * 60,
    options: {},
    async sendVerificationRequest({ identifier, url, request }) {
      // Ook voor directe POSTs naar /api/auth/signin/email, die de server action overslaan. Eerst per IP, dan per adres
      // (dezelfde teller waar de action vooraf naar kijkt). Limiet bereikt: stil geen mail; gooien geeft alleen een foutpagina.
      await connectDb();
      const byIp = await rateLimit({ key: `inlogmail:ip:${clientIp(request.headers)}`, limit: 100, windowMs: 15 * MINUTE });
      if (!byIp.ok || !(await rateLimit(magicLinkLimit(identifier))).ok) return;
      await sendMail({
        to: identifier,
        subject: "Je inloglink voor AI Academy",
        text: "Klik op de link hieronder om in te loggen. De link is 15 minuten geldig en werkt één keer.",
        url,
      });
    },
  },
];

if (ssoEnabled.microsoft()) providers.push(MicrosoftEntraID({ allowDangerousEmailAccountLinking: true }));
if (ssoEnabled.google()) providers.push(Google({ allowDangerousEmailAccountLinking: true }));

// Demo-login voor de ontwikkelomgeving en presentaties: alleen voor de demo-accounts (DEMO_ACCOUNTS overschrijft de lijst).
const demoAccounts = (process.env.DEMO_ACCOUNTS ?? "sanne@studionoord.nl,lotte@studionoord.nl,tim@studionoord.nl")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

if (demoLoginEnabled()) {
  providers.push(
    Credentials({
      id: "demo",
      name: "Demo",
      credentials: { email: { label: "E-mail", type: "email" } },
      async authorize(credentials) {
        if (!demoLoginEnabled()) return null;
        const email = String(credentials?.email ?? "").toLowerCase();
        if (!demoAccounts.includes(email)) return null;
        await connectDb();
        const user = await User.findOne({ email, status: "actief" }).lean();
        return user ? { id: String(user._id), email: user.email, name: `${user.firstName} ${user.lastName}` } : null;
      },
    }),
  );
}

export const { handlers, auth, signIn, signOut, unstable_update: updateSession } = NextAuth({
  ...authConfig,
  adapter: mongooseAdapter(),
  providers,
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account, profile }) {
      if (account?.provider === "demo") return true;
      if (!user.email) return false;
      await connectDb();
      // SSO: tenant en domein moeten bij de organisatie horen (zie ssoSignInAllowed).
      if (account?.provider === "microsoft-entra-id") {
        if (!(await ssoSignInAllowed(user.email, "microsoft", profile?.tid))) return "/inloggen?fout=sso";
      }
      if (account?.provider === "google") {
        if (profile?.email_verified !== true || !(await ssoSignInAllowed(user.email, "google", profile?.hd))) {
          return "/inloggen?fout=sso";
        }
      }
      // Organisatie met "alleen via SSO": geen inloglink per e-mail voor adressen op haar domeinen.
      if (account?.provider === "email" && (await ssoRequiredFor(user.email))) return "/inloggen?fout=sso-verplicht";
      return (await canSignIn(user.email)) || "/inloggen?fout=geen-toegang";
    },
    // Claims alleen bij inloggen en bij updateSession() verversen. Auth.js kan het cookie vanuit server components
    // niet herschrijven, dus een periodieke verversing zou toch niet blijven staan. De server leest rol en
    // onboarding daarom altijd uit de database (src/server/session.ts).
    async jwt({ token: rawToken, user, trigger }) {
      const token = rawToken as typeof rawToken & AppToken;
      if (!user && trigger !== "update") return token;

      await connectDb();
      const id = user?.id ?? token.sub;
      let dbUser;
      try {
        dbUser = id ? await User.findById(id).lean() : null;
      } catch (error) {
        // Bij een update liever de oude claims houden dan iemand uitloggen om een tijdelijke databasefout.
        if (trigger === "update") return token;
        throw error;
      }
      // Gedeactiveerd of verwijderd: sessie ongeldig maken.
      if (!dbUser || dbUser.status !== "actief" || !dbUser.orgId) return null;

      token.sub = String(dbUser._id);
      token.email = dbUser.email;
      token.name = `${dbUser.firstName} ${dbUser.lastName}`.trim() || dbUser.email;
      token.initials = initialsOf(dbUser.firstName, dbUser.lastName, dbUser.email);
      token.orgId = String(dbUser.orgId);
      token.role = dbUser.role;
      token.onboarded = Boolean(dbUser.onboarding?.completedAt);
      return token;
    },
  },
});
