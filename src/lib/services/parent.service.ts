import { db } from "@/prisma/db";

type CreateParentData = {
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  address?: string;
};

export async function createParent(schoolId: number, data: CreateParentData) {
  const parent = await db.orm.public.Parent.create({
    schoolId,
    firstName: data.firstName,
    lastName: data.lastName,
    phone: data.phone || null,
    email: data.email || null,
    address: data.address || null,
  });

  return parent;
}

type UpdateParentData = {
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  address?: string;
};

export async function updateParent(
  schoolId: number,
  parentId: number,
  data: UpdateParentData,
) {
  const parent = await db.orm.public.Parent.where((parent) =>
    parent.id.eq(parentId),
  ).first();

  if (!parent || parent.schoolId !== schoolId) {
    throw new Error("Parent not found.");
  }

  return db.orm.public.Parent.where((parent) => parent.id.eq(parentId)).update({
    firstName: data.firstName,
    lastName: data.lastName,
    phone: data.phone || null,
    email: data.email || null,
    address: data.address || null,
  });
}
