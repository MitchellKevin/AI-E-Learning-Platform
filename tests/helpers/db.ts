import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, afterEach, beforeAll } from "vitest";
import { connectDb, disconnectDb } from "@/server/db";
import { Organization, Team, User } from "@/server/models";

// Start een lege in-memory database voor het testbestand.
export function setupTestDb() {
  let server: MongoMemoryServer;

  beforeAll(async () => {
    server = await MongoMemoryServer.create();
    await connectDb(server.getUri("ai-academy-test"));
    await Promise.all(Object.values(mongoose.models).map((m) => m.syncIndexes()));
  });

  afterEach(async () => {
    const collections = await mongoose.connection.db!.collections();
    await Promise.all(collections.map((c) => c.deleteMany({})));
  });

  afterAll(async () => {
    await disconnectDb();
    await server?.stop();
  });
}

export async function createOrgWithUser(name = "Testorg", email = "test@testorg.nl", extra: Record<string, unknown> = {}) {
  const org = await Organization.create({ name, slug: name.toLowerCase(), initials: name.slice(0, 2).toUpperCase() });
  const team = await Team.create({ orgId: org._id, name: "Design" });
  const user = await User.create({
    email,
    firstName: "Test",
    lastName: "Gebruiker",
    orgId: org._id,
    teamId: team._id,
    onboarding: { completedAt: new Date() },
    ...extra,
  });
  return { org, team, user: user.toObject() as typeof user & { orgId: NonNullable<typeof user.orgId> } };
}
