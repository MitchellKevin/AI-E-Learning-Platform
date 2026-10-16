import { describe, expect, it } from "vitest";
import { PointEvent, User } from "@/server/models";
import { addDays } from "@/server/services/dates";
import { leaderboardMembers } from "@/server/services/leaderboard";
import { createOrgWithUser, setupTestDb } from "./helpers/db";

setupTestDb();

describe("leaderboardMembers", () => {
  it("telt punten per periode en toont alleen de eigen organisatie", async () => {
    const { org, team, user } = await createOrgWithUser("Noord", "a@noord.nl");
    const colleague = await User.create({ email: "b@noord.nl", firstName: "Bea", lastName: "Bos", orgId: org._id, teamId: team._id });
    const other = await createOrgWithUser("Zuid", "x@zuid.nl");

    await PointEvent.insertMany([
      { userId: user._id, orgId: org._id, amount: 100, reason: "hoofdstuk", refId: "a", createdAt: new Date() },
      { userId: user._id, orgId: org._id, amount: 300, reason: "start", refId: "b", createdAt: addDays(new Date(), -90) },
      { userId: colleague._id, orgId: org._id, amount: 50, reason: "hoofdstuk", refId: "a", createdAt: new Date() },
      { userId: other.user._id, orgId: other.org._id, amount: 9999, reason: "start", refId: "a", createdAt: new Date() },
    ]);

    const members = await leaderboardMembers(org._id, user._id);
    expect(members.map((m) => m.name).sort()).toEqual(["Bea Bos", "Test Gebruiker"]);
    const me = members.find((m) => m.id === String(user._id))!;
    expect(me.points.altijd).toBe(400);
    expect(me.points.maand).toBe(100);
    expect(me.points.week).toBe(100);
    expect(me.team).toBe("Design");
  });

  it("laat collega's die zich afmelden weg, maar jezelf niet", async () => {
    const { org, team, user } = await createOrgWithUser("Noord", "a@noord.nl", {
      settings: { privacy: { showOnLeaderboard: false } },
    });
    await User.create({
      email: "b@noord.nl",
      firstName: "Bea",
      lastName: "Bos",
      orgId: org._id,
      teamId: team._id,
      settings: { privacy: { showOnLeaderboard: false } },
    });

    const members = await leaderboardMembers(org._id, user._id);
    expect(members.map((m) => m.id)).toEqual([String(user._id)]);
  });
});
