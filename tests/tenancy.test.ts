import { describe, expect, it } from "vitest";
import { Assignment, Invite, Organization, PointEvent, Team, User } from "@/server/models";
import { loadAdminSource } from "@/server/services/admin-team";
import { canSignIn, resolveMembership, seatsInUse, ssoRequiredFor } from "@/server/services/membership";
import { addDays } from "@/server/services/dates";
import { createOrgWithUser, setupTestDb } from "./helpers/db";

setupTestDb();

describe("lidmaatschap", () => {
  it("koppelt via een open uitnodiging, niet via een verlopen of ingetrokken", async () => {
    const { org, team } = await createOrgWithUser();
    await Invite.create({ token: "a", orgId: org._id, teamId: team._id, email: "nieuw@testorg.nl", role: "manager", expiresAt: addDays(new Date(), 7) });
    await Invite.create({ token: "b", orgId: org._id, email: "oud@testorg.nl", expiresAt: addDays(new Date(), -1) });
    await Invite.create({ token: "c", orgId: org._id, email: "weg@testorg.nl", expiresAt: addDays(new Date(), 7), revokedAt: new Date() });

    const membership = await resolveMembership("Nieuw@TestOrg.nl");
    expect(String(membership?.orgId)).toBe(String(org._id));
    expect(membership?.role).toBe("manager");
    expect(await resolveMembership("oud@testorg.nl")).toBeNull();
    expect(await resolveMembership("weg@testorg.nl")).toBeNull();
  });

  it("laat via een domein alleen toe als het geverifieerd is en automatisch toetreden aan staat", async () => {
    const { org } = await createOrgWithUser();
    await Organization.updateOne({ _id: org._id }, { autoJoin: true, domains: [{ domain: "testorg.nl", verified: false }] });
    expect(await canSignIn("iemand@testorg.nl")).toBe(false);

    await Organization.updateOne({ _id: org._id }, { "domains.0.verified": true });
    expect(await canSignIn("iemand@testorg.nl")).toBe(true);

    await Organization.updateOne({ _id: org._id }, { autoJoin: false });
    expect(await canSignIn("iemand@testorg.nl")).toBe(false);
  });

  it("weigert gedeactiveerde gebruikers", async () => {
    await createOrgWithUser("Testorg", "weg@testorg.nl", { status: "gedeactiveerd" });
    expect(await canSignIn("weg@testorg.nl")).toBe(false);
    expect(await canSignIn("onbekend@elders.nl")).toBe(false);
  });

  it("telt actieve gebruikers en open uitnodigingen als bezette licenties", async () => {
    const { org } = await createOrgWithUser();
    await User.create({ email: "uit@testorg.nl", orgId: org._id, status: "gedeactiveerd" });
    await Invite.create({ token: "x", orgId: org._id, email: "x@testorg.nl", expiresAt: addDays(new Date(), 7) });
    await Invite.create({ token: "y", orgId: org._id, email: "y@testorg.nl", expiresAt: addDays(new Date(), -7) });
    expect(await seatsInUse(org._id)).toBe(2);
  });
});

describe("beheerdata", () => {
  it("bevat alleen leden, toewijzingen en punten van de eigen organisatie", async () => {
    const a = await createOrgWithUser("Noord", "a@noord.nl");
    const b = await createOrgWithUser("Zuid", "b@zuid.nl");
    await Assignment.create({ orgId: b.org._id, pathSlug: "ai-101", teamIds: [b.team._id], deadline: addDays(new Date(), 30) });
    await Assignment.create({ orgId: a.org._id, pathSlug: "ui-ux-design", userIds: [a.user._id], deadline: addDays(new Date(), 30) });
    await Assignment.create({ orgId: a.org._id, pathSlug: "ai-101", userIds: [a.user._id], deadline: addDays(new Date(), 30), deletedAt: new Date() });
    await PointEvent.create({ userId: b.user._id, orgId: b.org._id, amount: 500, reason: "start", refId: "x" });

    const source = await loadAdminSource(a.org._id);
    expect(source.members.map((m) => m.email)).toEqual(["a@noord.nl"]);
    expect(source.assignments).toHaveLength(1);
    expect(source.assignments[0].pathSlug).toBe("ui-ux-design");
    expect(source.teams).toEqual(["Design"]);
    expect(source.members[0].points).toBe(0);
    // Toegewezen pad staat bij het lid, naast AI 101.
    expect(source.members[0].paths.map((p) => p.slug).sort()).toEqual(["ai-101", "ui-ux-design"]);
  });

  it("neemt teamtoewijzingen mee voor iedereen in het team", async () => {
    const { org, team, user } = await createOrgWithUser();
    const colleague = await User.create({ email: "c@testorg.nl", orgId: org._id, teamId: team._id, firstName: "C", lastName: "D" });
    const other = await Team.create({ orgId: org._id, name: "Development" });
    await User.create({ email: "e@testorg.nl", orgId: org._id, teamId: other._id, firstName: "E", lastName: "F" });
    await Assignment.create({ orgId: org._id, pathSlug: "ai-101", teamIds: [team._id], deadline: addDays(new Date(), 30) });

    const source = await loadAdminSource(org._id);
    expect(source.assignments[0].memberIds.sort()).toEqual([String(user._id), String(colleague._id)].sort());
  });
});

describe("toegang via domein en SSO", () => {
  it("automatisch toetreden kost een licentie: vol is vol", async () => {
    const { org } = await createOrgWithUser();
    await Organization.updateOne({ _id: org._id }, { autoJoin: true, seats: 2, domains: [{ domain: "testorg.nl", verified: true }] });
    expect(await canSignIn("nieuw@testorg.nl")).toBe(true);

    await Invite.create({ token: "z", orgId: org._id, email: "ander@elders.nl", expiresAt: addDays(new Date(), 7) });
    // 1 gebruiker + 1 open uitnodiging = 2 van 2 licenties.
    expect(await canSignIn("nieuw@testorg.nl")).toBe(false);
  });

  it("negeert verwijderde domeinen", async () => {
    const { org } = await createOrgWithUser();
    await Organization.updateOne({ _id: org._id }, { autoJoin: true, domains: [{ domain: "testorg.nl", verified: true, removedAt: new Date() }] });
    expect(await canSignIn("nieuw@testorg.nl")).toBe(false);
  });

  it("verplicht SSO alleen voor adressen op de domeinen van een organisatie die SSO afdwingt", async () => {
    const { org } = await createOrgWithUser("Testorg", "lid@testorg.nl");
    await Organization.updateOne(
      { _id: org._id },
      { domains: [{ domain: "testorg.nl", verified: true }], sso: { provider: "microsoft", status: "verbonden", enforced: false } },
    );
    expect(await ssoRequiredFor("lid@testorg.nl")).toBe(false);

    await Organization.updateOne({ _id: org._id }, { "sso.enforced": true });
    expect(await ssoRequiredFor("lid@testorg.nl")).toBe(true);
    expect(await ssoRequiredFor("nieuw@testorg.nl")).toBe(true);
    // Een extern lid met een ander domein mag gewoon een inloglink gebruiken.
    await User.create({ email: "extern@elders.nl", orgId: org._id });
    expect(await ssoRequiredFor("extern@elders.nl")).toBe(false);
  });
});
