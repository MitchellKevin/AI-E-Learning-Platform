import type { Adapter, AdapterAccount, AdapterUser } from "next-auth/adapters";
import { connectDb } from "@/server/db";
import { Account, Invite, User, VerificationToken, fullName, type UserDoc } from "@/server/models";
import { resolveMembership } from "@/server/services/membership";

// Eigen Auth.js-adapter op onze Mongoose-modellen, zodat nieuwe gebruikers direct aan hun organisatie hangen.

function toAdapterUser(user: Pick<UserDoc, "_id" | "email" | "emailVerified" | "firstName" | "lastName" | "image">): AdapterUser {
  return {
    id: String(user._id),
    email: user.email,
    emailVerified: user.emailVerified ?? null,
    name: fullName(user),
    image: user.image ?? null,
  };
}

function splitName(name?: string | null) {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  return { firstName: parts[0] ?? "", lastName: parts.slice(1).join(" ") };
}

export function mongooseAdapter(): Adapter {
  return {
    async createUser(data) {
      await connectDb();
      const membership = await resolveMembership(data.email);
      const user = await User.create({
        email: data.email,
        emailVerified: data.emailVerified,
        image: data.image,
        ...splitName(data.name),
        orgId: membership?.orgId,
        teamId: membership?.teamId,
        role: membership?.role ?? "learner",
      });
      if (membership?.inviteId) await Invite.updateOne({ _id: membership.inviteId }, { acceptedAt: new Date() });
      return toAdapterUser(user);
    },
    async getUser(id) {
      await connectDb();
      const user = await User.findById(id).lean().catch(() => null);
      return user ? toAdapterUser(user) : null;
    },
    async getUserByEmail(email) {
      await connectDb();
      const user = await User.findOne({ email: email.toLowerCase() }).lean();
      return user ? toAdapterUser(user) : null;
    },
    async getUserByAccount({ provider, providerAccountId }) {
      await connectDb();
      const account = await Account.findOne({ provider, providerAccountId }).lean();
      if (!account) return null;
      const user = await User.findById(account.userId).lean();
      return user ? toAdapterUser(user) : null;
    },
    async updateUser({ id, ...data }) {
      await connectDb();
      const update: Record<string, unknown> = {};
      if (data.emailVerified !== undefined) update.emailVerified = data.emailVerified;
      if (data.image !== undefined) update.image = data.image;
      const user = await User.findByIdAndUpdate(id, update, { new: true }).lean();
      if (!user) throw new Error("Gebruiker niet gevonden");
      return toAdapterUser(user);
    },
    async linkAccount(account: AdapterAccount) {
      await connectDb();
      await Account.create(account);
      const provider = account.provider === "microsoft-entra-id" ? "Microsoft Entra ID" : account.provider === "google" ? "Google" : null;
      if (provider) await User.updateOne({ _id: account.userId }, { loginProvider: provider });
    },
    async createVerificationToken(token) {
      await connectDb();
      await VerificationToken.create(token);
      return token;
    },
    async useVerificationToken({ identifier, token }) {
      await connectDb();
      const found = await VerificationToken.findOneAndDelete({ identifier, token }).lean();
      return found ? { identifier: found.identifier, token: found.token, expires: found.expires } : null;
    },
  };
}
