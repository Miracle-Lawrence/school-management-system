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
  principalSignatureUrl?: string;
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
    email: data.email !== undefined ? data.email || null : school.email,
    phone: data.phone !== undefined ? data.phone || null : school.phone,
    address: data.address !== undefined ? data.address || null : school.address,
    city: data.city !== undefined ? data.city || null : school.city,
    state: data.state !== undefined ? data.state || null : school.state,
    country: data.country || school.country,

    // School branding
    logoUrl: data.logoUrl !== undefined ? data.logoUrl : school.logoUrl,
    faviconUrl:
      data.faviconUrl !== undefined ? data.faviconUrl : school.faviconUrl,
    motto: data.motto !== undefined ? data.motto || null : school.motto,
    primaryColor:
      data.primaryColor !== undefined
        ? data.primaryColor || null
        : school.primaryColor,
    secondaryColor:
      data.secondaryColor !== undefined
        ? data.secondaryColor || null
        : school.secondaryColor,
    accentColor:
      data.accentColor !== undefined
        ? data.accentColor || null
        : school.accentColor,
    website: data.website !== undefined ? data.website || null : school.website,
    principalName:
      data.principalName !== undefined
        ? data.principalName || null
        : school.principalName,
    principalTitle:
      data.principalTitle !== undefined
        ? data.principalTitle || null
        : school.principalTitle,
    principalSignatureUrl:
      data.principalSignatureUrl !== undefined
        ? data.principalSignatureUrl
        : school.principalSignatureUrl,
    stampUrl: data.stampUrl !== undefined ? data.stampUrl : school.stampUrl,
  });
}
