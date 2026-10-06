import { db } from "@/prisma/db";

type UpdateSchoolData = {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;

  // School branding
  logoUrl?: string;
  faviconUrl?: string;
  motto?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  website?: string;
  principalName?: string;
  principalTitle?: string;
  stampUrl?: string;
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

    // School branding
    logoUrl: data.logoUrl || null,
    faviconUrl: data.faviconUrl || null,
    motto: data.motto || null,
    primaryColor: data.primaryColor || null,
    secondaryColor: data.secondaryColor || null,
    accentColor: data.accentColor || null,
    website: data.website || null,
    principalName: data.principalName || null,
    principalTitle: data.principalTitle || null,
    stampUrl: data.stampUrl || null,
  });
}
