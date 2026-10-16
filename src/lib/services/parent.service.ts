import { hashPassword } from "@/lib/auth/password";
import { db } from "@/prisma/db";
import type { CreateParentInput } from "@/lib/validation/parent";

export async function createParent(schoolId: number, data: CreateParentInput) {
  const normalizedEmail = data.email.trim().toLowerCase();

  const existingUser = await db.orm.public.User.where((user) =>
    user.email.eq(normalizedEmail),
  ).first();

  if (existingUser) {
    throw new Error("An account with this email address already exists.");
  }

  const passwordHash = await hashPassword(data.password);

  const user = await db.orm.public.User.create({
    schoolId,
    email: normalizedEmail,
    passwordHash,
    name: `${data.firstName.trim()} ${data.lastName.trim()}`,
    phone: data.phone || null,
    role: "PARENT",
    isActive: true,
    mustChangePassword: true,
  });

  try {
    return await db.orm.public.Parent.create({
      schoolId,
      userId: user.id,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      phone: data.phone || null,
      email: normalizedEmail,
      address: data.address || null,
    });
  } catch (error) {
    // Clean up the login if creating its parent profile failed.
    await db.orm.public.User.where((record) => record.id.eq(user.id)).delete();

    throw error;
  }
}

export async function updateParent(
  schoolId: number,
  parentId: number,
  data: {
    firstName: string;
    lastName: string;
    phone?: string;
    email?: string;
    address?: string;
  },
) {
  const parent = await db.orm.public.Parent.where((record) =>
    record.id.eq(parentId),
  ).first();

  if (!parent || parent.schoolId !== schoolId) {
    throw new Error("Parent not found.");
  }

  return db.orm.public.Parent.where((record) => record.id.eq(parentId)).update({
    firstName: data.firstName,
    lastName: data.lastName,
    phone: data.phone || null,
    email: data.email || null,
    address: data.address || null,
  });
}
