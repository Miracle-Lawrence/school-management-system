import "dotenv/config";

import { db } from "../src/prisma/db";
import { hashPassword } from "../src/lib/auth/password";

const email = "admin@example.com";
const password = "NewAdmin123!";
const name = "Platform Owner";

const existingUsers = await db.orm.public.User.where((user) =>
  user.role.eq("PLATFORM_OWNER"),
).all();

const existingUser = existingUsers[0];

const passwordHash = await hashPassword(password);

if (existingUser) {
  await db.orm.public.User.where((user) => user.id.eq(existingUser.id)).update({
    email,
    passwordHash,
    name,
    isActive: true,
    schoolId: null,
  });

  console.log("Platform owner credentials reset successfully.");
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
  console.log(`ID: ${existingUser.id}`);
} else {
  const user = await db.orm.public.User.create({
    email,
    passwordHash,
    name,
    role: "PLATFORM_OWNER",
    schoolId: null,
    isActive: true,
  });

  console.log("Platform owner created successfully.");
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
  console.log(`ID: ${user.id}`);
}
