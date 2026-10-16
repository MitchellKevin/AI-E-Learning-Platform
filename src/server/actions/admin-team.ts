"use server";

import { revalidatePath } from "next/cache";
import { Types } from "mongoose";
import { z } from "zod";
import { getLearningPath } from "@/lib/content";
import { guarded } from "@/server/actions/result";
import { connectDb } from "@/server/db";
import { UserError } from "@/server/errors";
import { sendMail } from "@/server/mailer";
import { Assignment, Invite, Organization, Team, User } from "@/server/models";
import { assertRole } from "@/server/session";
import { audit } from "@/server/services/audit";
import { notify } from "@/server/services/notifications";
import { HOUR, assertRateLimit } from "@/server/services/rate-limit";
import { endOfAmsterdamDay } from "@/server/services/dates";

// Acties van teammanagers: toewijzingen en herinneringen. Alles binnen de eigen organisatie.

const objectId = z.string().regex(/^[a-f0-9]{24}$/);
const formatDate = (d: Date) => d.toLocaleDateString("nl-NL", { day: "numeric", month: "long", timeZone: "Europe/Amsterdam" });

const assignmentInput = z.object({
  pathSlug: z.string().regex(/^[a-z0-9-]+$/),
  teams: z.array(z.string().max(80)).max(20).default([]),
  memberIds: z.array(z.string().max(40)).max(500).default([]),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  required: z.boolean(),
  message: z.string().trim().max(1000).optional(),
});

export async function createAssignmentAction(input: z.input<typeof assignmentInput>) {
  return guarded(async () => {
    const data = assignmentInput.parse(input);
    const manager = await assertRole("manager");
    const path = await getLearningPath(data.pathSlug);
    if (!path) throw new UserError("Onbekend leerpad");
    await connectDb();
    await assertRateLimit({ key: `toewijzing:user:${manager._id}`, limit: 30, windowMs: HOUR });

    const teams = data.teams.length ? await Team.find({ orgId: manager.orgId, name: { $in: data.teams } }).lean() : [];
    // Alleen echte gebruikers van de eigen organisatie; open uitnodigingen ("inv_…") vallen af.
    const userIds = data.teams.length ? [] : data.memberIds.filter((id) => objectId.safeParse(id).success);
    const users = await User.find({
      orgId: manager.orgId,
      status: "actief",
      $or: [{ _id: { $in: userIds } }, { teamId: { $in: teams.map((t) => t._id) } }],
    }).lean();
    if (users.length === 0) throw new UserError("Kies minstens één collega of team");

    const deadline = endOfAmsterdamDay(data.deadline);
    const assignment = await Assignment.create({
      orgId: manager.orgId,
      pathSlug: path.slug,
      teamIds: teams.map((t) => t._id),
      userIds: data.teams.length ? [] : users.map((u) => u._id),
      deadline,
      required: data.required,
      message: data.message || undefined,
      createdBy: manager._id,
    });

    await Promise.all(
      users.map((u) =>
        notify({
          userId: u._id,
          orgId: manager.orgId,
          type: "assignment",
          title: `Nieuwe toewijzing: ${path.title}`,
          body: `${manager.firstName} ${manager.lastName} heeft ${path.title} aan je toegewezen. Deadline: ${formatDate(deadline)}.${data.message ? ` “${data.message}”` : ""}`,
          href: `/leerpaden/${path.slug}`,
        }),
      ),
    );
    await audit({
      orgId: manager.orgId,
      actor: manager,
      category: "leren",
      action: `Leerpad ${path.title} toegewezen`,
      target: teams.length ? teams.map((t) => `Team ${t.name}`).join(", ") : `${users.length} collega's`,
    });
    revalidatePath("/beheer", "layout");
    return { id: String(assignment._id) };
  });
}

export async function deleteAssignmentAction(id: string, restore = false) {
  return guarded(async () => {
    const manager = await assertRole("manager");
    await connectDb();
    const assignment = await Assignment.findOneAndUpdate(
      { _id: objectId.parse(id), orgId: manager.orgId },
      restore ? { $unset: { deletedAt: 1 } } : { deletedAt: new Date() },
    ).lean();
    if (!assignment) throw new UserError("Toewijzing niet gevonden");
    const path = await getLearningPath(assignment.pathSlug);
    await audit({
      orgId: manager.orgId,
      actor: manager,
      category: "leren",
      action: restore ? `Toewijzing ${path?.title} teruggezet` : `Toewijzing ${path?.title} verwijderd`,
    });
    revalidatePath("/beheer", "layout");
  });
}

// Herinnering sturen. Voor een open uitnodiging ("inv_<id>") sturen we de uitnodiging opnieuw.
export async function sendRemindersAction(ids: string[], topic?: string) {
  return guarded(async () => {
    const parsed = z.array(z.string().max(40)).min(1).max(500).parse(ids);
    const manager = await assertRole("manager");
    await connectDb();
    await assertRateLimit({ key: `herinnering:user:${manager._id}`, limit: 30, windowMs: HOUR });

    const userIds = parsed.filter((id) => objectId.safeParse(id).success).map((id) => new Types.ObjectId(id));
    const inviteIds = parsed.filter((id) => id.startsWith("inv_")).map((id) => objectId.parse(id.slice(4)));

    const [users, invites, org] = await Promise.all([
      User.find({ _id: { $in: userIds }, orgId: manager.orgId, status: "actief" }).lean(),
      Invite.find({ _id: { $in: inviteIds }, orgId: manager.orgId, acceptedAt: null, revokedAt: null }),
      Organization.findById(manager.orgId).lean(),
    ]);

    await Promise.all(
      users.map((u) =>
        notify({
          userId: u._id,
          orgId: manager.orgId,
          type: "assignment",
          title: topic ? `Herinnering: ga verder met ${topic}` : "Herinnering van je teammanager",
          body: `${manager.firstName} ${manager.lastName} herinnert je eraan om verder te gaan${topic ? ` met ${topic}` : ""}.`,
          href: "/dashboard",
        }),
      ),
    );
    const base = process.env.AUTH_URL ?? "http://localhost:3000";
    for (const invite of invites) {
      invite.lastSentAt = new Date();
      await invite.save();
      await sendMail({
        to: invite.email,
        subject: `Herinnering: je uitnodiging voor ${org?.name} op AI Academy`,
        text: `${manager.firstName} ${manager.lastName} nodigde je uit voor AI Academy. Accepteer de uitnodiging via de link hieronder.`,
        url: `${base}/uitnodiging/${invite.token}`,
      });
    }
    await audit({
      orgId: manager.orgId,
      actor: manager,
      category: "gebruikers",
      action: invites.length && !users.length ? "Uitnodiging opnieuw verstuurd" : "Herinnering verstuurd",
      target: [...users.map((u) => `${u.firstName} ${u.lastName}`), ...invites.map((i) => i.email)].join(", "),
    });
    return { sent: users.length + invites.length };
  });
}
