import "dotenv/config";

import { db } from "../src/prisma/db";
import { hashPassword } from "../src/lib/auth/password";

const email = "admin@example.com";
const password = "ChangeMe123!";
const name = "Platform Owner";

const existingUser = await db.orm.public.User.where((user) =>
  user.email.eq(email),
).first();

if (existingUser) {
  console.log(`User already exists: ${email}`);
  process.exit(0);
}

const passwordHash = await hashPassword(password);

const user = await db.orm.public.User.create({
  email,
  passwordHash,
  name,
  role: "PLATFORM_OWNER",
  schoolId: null,
  isActive: true,
});

console.log("Platform owner created successfully.");
console.log(`Email: ${user.email}`);
console.log(`ID: ${user.id}`);
