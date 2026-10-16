import type { NextAuthConfig } from "next-auth";
import type { UserRole } from "@/server/models/user";

/** Eigen velden in het JWT (Auth.js laat het interface hier niet uitbreiden). */
export type AppToken = {
  sub?: string;
  orgId: string;
  role: UserRole;
  onboarded: boolean;
  initials: string;
};

// Edge-veilige deel van de Auth.js-config (gebruikt door de middleware): geen database.
// De middleware kijkt alleen óf er een sessie is. Rol en onboarding controleert de server tegen de database
// (requireUser/requireRole en de layouts): de claims in het token kunnen verouderd zijn, en zo kunnen
// middleware en server elkaar nooit heen en weer sturen.

// Alleen de app (en de intake) vereist een sessie. Al het andere is publiek of een gewone 404.
const protectedPrefixes = ["/dashboard", "/leerpaden", "/oefenen", "/leaderboard", "/profiel", "/instellingen", "/beheer", "/welkom"];

function isProtected(pathname: string) {
  return protectedPrefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export const authConfig = {
  pages: { signIn: "/inloggen", verifyRequest: "/inloggen/check-je-mail", error: "/inloggen" },
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  trustHost: true,
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const { pathname, search } = request.nextUrl;
      if (!isProtected(pathname) || auth?.user) return true;

      const url = new URL("/inloggen", request.nextUrl);
      url.searchParams.set("next", pathname + search);
      return Response.redirect(url);
    },
    session({ session, token }) {
      const t = token as unknown as AppToken;
      session.user = {
        ...session.user,
        id: t.sub!,
        orgId: t.orgId,
        role: t.role,
        onboarded: t.onboarded,
        initials: t.initials,
      };
      return session;
    },
  },
} satisfies NextAuthConfig;
