import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";

import { db } from "@/prisma/db";

type BrandingImageType = "logo" | "stamp";

const MAX_FILE_SIZE = 2 * 1024 * 1024;

const ALLOWED_TYPES = new Map<string, string>([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

export async function uploadSchoolBrandingImage(
  schoolId: number,
  type: BrandingImageType,
  file: File,
) {
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Please select an image.");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("Image must not exceed 2MB.");
  }

  const extension = ALLOWED_TYPES.get(file.type);

  if (!extension) {
    throw new Error("Only JPG, PNG, and WEBP images are allowed.");
  }

  const school = await db.orm.public.School.where((item) =>
    item.id.eq(schoolId),
  ).first();

  if (!school) {
    throw new Error("School not found.");
  }

  const uploadDirectory = path.join(
    process.cwd(),
    "public",
    "uploads",
    "schools",
    String(schoolId),
  );

  await mkdir(uploadDirectory, {
    recursive: true,
  });

  const filename = `${type}-${Date.now()}.${extension}`;

  const filePath = path.join(uploadDirectory, filename);

  const buffer = Buffer.from(await file.arrayBuffer());

  await writeFile(filePath, buffer);

  const publicUrl = `/uploads/schools/${schoolId}/${filename}`;

  const previousUrl = type === "logo" ? school.logoUrl : school.stampUrl;

  if (type === "logo") {
    await db.orm.public.School.where((item) => item.id.eq(schoolId)).update({
      logoUrl: publicUrl,
    });
  } else {
    await db.orm.public.School.where((item) => item.id.eq(schoolId)).update({
      stampUrl: publicUrl,
    });
  }

  // Remove the previous uploaded image if it belongs to our
  // local school-upload directory.
  if (previousUrl && previousUrl.startsWith(`/uploads/schools/${schoolId}/`)) {
    const previousPath = path.join(
      process.cwd(),
      "public",
      previousUrl.replace(/^\/+/, ""),
    );

    try {
      await unlink(previousPath);
    } catch {
      // Ignore missing old files.
    }
  }

  return publicUrl;
}
