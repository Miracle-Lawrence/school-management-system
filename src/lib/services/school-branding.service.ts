import { db } from "@/prisma/db";
import {
  deleteStoredImage,
  uploadImage,
} from "@/lib/storage/object-storage";

type BrandingImageType = "logo" | "stamp";

export async function uploadSchoolBrandingImage(
  schoolId: number,
  type: BrandingImageType,
  file: File,
) {
  if (!Number.isSafeInteger(schoolId) || schoolId <= 0) {
    throw new Error("Invalid school ID.");
  }

  const school = await db.orm.public.School.where((item) =>
    item.id.eq(schoolId),
  ).first();

  if (!school) {
    throw new Error("School not found.");
  }

  const previousUrl = type === "logo" ? school.logoUrl : school.stampUrl;

  const newUrl = await uploadImage(file, {
    schoolId,
    category: type === "logo" ? "logos" : "stamps",
    visibility: type === "logo" ? "public" : "private",
  });

  try {
    if (type === "logo") {
      await db.orm.public.School.where((item) => item.id.eq(schoolId)).update({
        logoUrl: newUrl,
      });
    } else {
      await db.orm.public.School.where((item) => item.id.eq(schoolId)).update({
        stampUrl: newUrl,
      });
    }
  } catch (error) {
    await deleteStoredImage(newUrl, schoolId);
    throw error;
  }

  if (previousUrl && previousUrl !== newUrl) {
    await deleteStoredImage(previousUrl, schoolId);
  }

  return newUrl;
}
