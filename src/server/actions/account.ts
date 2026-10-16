"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { updateSession } from "@/auth";
import { getDataExport } from "@/lib/data/profile";
import { guarded } from "@/server/actions/result";
import { connectDb } from "@/server/db";
import { UserError } from "@/server/errors";
import { Notification, User } from "@/server/models";
import { assertRole } from "@/server/session";
import { notify } from "@/server/services/notifications";

// Instellingen, data-export, verwijderverzoek en meldingen van de ingelogde gebruiker.

const channels = z.object({ email: z.boolean(), inApp: z.boolean() });

const sections = {
  account: z.object({
    firstName: z.string().trim().min(1).max(60),
    lastName: z.string().trim().min(1).max(80),
    jobTitle: z.string().trim().max(80),
  }),
  learning: z.object({
    weekGoal: z.union([z.literal(60), z.literal(120), z.literal(180)]),
    focus: z.enum(["design", "development", "beide"]),
    dailyReminder: z.boolean(),
    reminderTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  }),
  notifications: z.object({
    reminders: channels,
    streak: channels,
    deadlines: channels,
    certificates: channels,
    productUpdates: channels,
  }),
  privacy: z.object({ showOnLeaderboard: z.boolean(), visibleToTeam: z.boolean() }),
  language: z.object({ locale: z.enum(["nl", "en"]) }),
};

export type SettingsSection = keyof typeof sections;

export async function saveSettingsAction(section: SettingsSection, values: unknown) {
  return guarded(async () => {
    const schema = sections[section];
    if (!schema) throw new UserError("Onbekende sectie");
    const data = schema.parse(values);
    const user = await assertRole("learner");
    await connectDb();

    const update =
      section === "account"
        ? data
        : Object.fromEntries(Object.entries(data).map(([field, value]) => [`settings.${section}.${field}`, value]));
    await User.updateOne({ _id: user._id }, update);

    // Naam en initialen staan ook in het sessietoken.
    if (section === "account") await updateSession({});
    revalidatePath("/", "layout");
  });
}

export async function exportMyDataAction() {
  return guarded(async () => {
    await assertRole("learner");
    return getDataExport();
  });
}

const GRACE_DAYS = 30;

export async function requestAccountDeletionAction() {
  return guarded(async () => {
    const user = await assertRole("learner");
    await connectDb();
    const requestedAt = new Date();
    await User.updateOne({ _id: user._id }, { deletionRequestedAt: requestedAt });

    // Beheerders van de organisatie op de hoogte brengen.
    const admins = await User.find({ orgId: user.orgId, role: "admin", status: "actief", _id: { $ne: user._id } }, { _id: 1 }).lean();
    await Promise.all(
      admins.map((admin) =>
        notify({
          userId: admin._id,
          orgId: user.orgId,
          type: "team",
          title: `${user.firstName} ${user.lastName} wil het account verwijderen`,
          body: `Het account wordt over ${GRACE_DAYS} dagen verwijderd, tenzij het verzoek wordt ingetrokken.`,
          href: "/beheer/gebruikers",
        }),
      ),
    );
    return new Date(requestedAt.getTime() + GRACE_DAYS * 24 * 60 * 60 * 1000).toISOString();
  });
}

export async function cancelAccountDeletionAction() {
  return guarded(async () => {
    const user = await assertRole("learner");
    await connectDb();
    await User.updateOne({ _id: user._id }, { $unset: { deletionRequestedAt: 1 } });
  });
}

export async function markNotificationsReadAction(ids: string[] | "all") {
  return guarded(async () => {
    const user = await assertRole("learner");
    await connectDb();
    const filter = ids === "all" ? { userId: user._id, readAt: null } : { userId: user._id, _id: { $in: z.array(z.string().regex(/^[a-f0-9]{24}$/)).max(200).parse(ids) } };
    await Notification.updateMany(filter, { readAt: new Date() });
  });
}
