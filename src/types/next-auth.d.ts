import type { DefaultSession } from "next-auth";
import type { UserRole } from "@/server/models/user";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      orgId: string;
      role: UserRole;
      onboarded: boolean;
      initials: string;
    } & DefaultSession["user"];
  }
}
