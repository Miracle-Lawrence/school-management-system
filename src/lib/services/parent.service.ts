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
