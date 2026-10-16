"use server";

import { revalidatePath } from "next/cache";
import { getLearningPath } from "@/lib/content";
import { guarded } from "@/server/actions/result";
import { connectDb } from "@/server/db";
import { UserError } from "@/server/errors";
import { Certificate, Enrollment } from "@/server/models";
import { assertRole } from "@/server/session";

// Specialisatie kiezen na AI 101. Kan alleen als het voorgaande leerpad met certificaat is afgerond.
export async function chooseSpecialisationAction(pathSlug: string) {
  return guarded(async () => {
    const user = await assertRole("learner");
    const path = await getLearningPath(pathSlug);
    if (!path?.prerequisite) throw new UserError("Geen specialisatie");
    await connectDb();
    const passed = await Certificate.exists({ userId: user._id, pathSlug: path.prerequisite });
    if (!passed) throw new UserError("Rond eerst het voorgaande leerpad af");
    await Enrollment.updateOne(
      { userId: user._id, pathSlug },
      { $setOnInsert: { orgId: user.orgId, chosenAt: new Date() } },
      { upsert: true },
    );
    revalidatePath("/", "layout");
  });
}
