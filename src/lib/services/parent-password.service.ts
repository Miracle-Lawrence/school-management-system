import { randomBytes } from "node:crypto";

import { hashPassword } from "@/lib/auth/password";
import { db } from "@/prisma/db";

export async function resetParentPassword(
  schoolId: number,
  parentId: number,
) {
  const parent = await db.orm.public.Parent.where((record) =>
    record.id.eq(parentId),
  ).first();

  if (!parent || parent.schoolId !== schoolId) {
    throw new Error("Parent not found in this school.");
  }

  if (!parent.userId) {
    throw new Error("This parent does not have a linked login account.");
  }

  const user = await db.orm.public.User.where((record) =>
    record.id.eq(parent.userId!),
  ).first();

  if (
    !user ||
    user.schoolId !== schoolId ||
    user.role !== "PARENT"
  ) {
    throw new Error("The linked parent login could not be verified.");
  }

  // Generate a cryptographically random, URL-safe temporary password.
  const temporaryPassword = randomBytes(12).toString("base64url");
  const passwordHash = await hashPassword(temporaryPassword);

  await db.orm.public.User.where((record) =>
    record.id.eq(user.id),
  ).update({
    passwordHash,
    mustChangePassword: true,
    sessionVersion: user.sessionVersion + 1,
  });

  return temporaryPassword;
}
