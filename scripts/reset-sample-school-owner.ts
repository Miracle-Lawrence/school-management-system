import { db } from "../src/prisma/db";
import { hashPassword } from "../src/lib/auth/password";

async function main() {
  const school = await db.orm.public.School.where((s) =>
    s.slug.eq("sample-school-international"),
  ).first();

  if (!school) {
    throw new Error("Sample School International was not found.");
  }

  const owner = await db.orm.public.User.where((u) =>
    u.schoolId.eq(school.id),
  ).first();

  if (!owner) {
    throw new Error(
      "No user was found for this school. No account was changed.",
    );
  }

  const temporaryPassword = "TempSample2026!";
  const passwordHash = await hashPassword(temporaryPassword);

    await db.orm.public.User.where((user) => user.id.eq(owner.id)).update({
  passwordHash,
});

  console.log("Password reset completed.");
  console.log(`School: ${school.name}`);
  console.log(`Account email: ${owner.email}`);
  console.log(`Temporary password: ${temporaryPassword}`);
}

main().catch((error) => {
  console.error("Password reset failed:", error);
  process.exitCode = 1;
});
