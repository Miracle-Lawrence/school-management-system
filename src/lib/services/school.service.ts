import { db } from "@/prisma/db";

type UpdateSchoolData = {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
};

export async function updateSchool(schoolId: number, data: UpdateSchoolData) {
  const school = await db.orm.public.School.where((school) =>
    school.id.eq(schoolId),
  ).first();

  if (!school) {
    throw new Error("School not found.");
  }

  return db.orm.public.School.where((school) => school.id.eq(schoolId)).update({
    name: data.name,
    email: data.email || null,
    phone: data.phone || null,
    address: data.address || null,
    city: data.city || null,
    state: data.state || null,
    country: data.country || school.country,
  });
}
