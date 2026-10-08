import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB

const ALLOWED_IMAGE_TYPES = new Map<string, string>([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

export async function saveStudentPhoto(
  file: File,
  schoolId: number,
  studentId: number,
) {
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Please select a passport photograph.");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("Passport photograph must not exceed 2 MB.");
  }

  const extension = ALLOWED_IMAGE_TYPES.get(file.type);

  if (!extension) {
    throw new Error(
      "Invalid passport photograph. Please upload JPG, PNG, or WEBP.",
    );
  }

  const uploadDirectory = path.join(
    process.cwd(),
    "public",
    "uploads",
    "students",
    String(schoolId),
  );

  await mkdir(uploadDirectory, { recursive: true });

  const fileName = `${studentId}-${Date.now()}.${extension}`;

  const filePath = path.join(uploadDirectory, fileName);

  const buffer = Buffer.from(await file.arrayBuffer());

  await writeFile(filePath, buffer);

  return `/uploads/students/${schoolId}/${fileName}`;
}

export async function savePrincipalSignature(file: File, schoolId: number) {
  return saveSchoolBrandingImage(file, schoolId, "principal-signature");
}

export async function saveSchoolLogo(file: File, schoolId: number) {
  return saveSchoolBrandingImage(file, schoolId, "logo");
}

export async function saveSchoolFavicon(file: File, schoolId: number) {
  return saveSchoolBrandingImage(file, schoolId, "favicon");
}

export async function saveSchoolStamp(file: File, schoolId: number) {
  return saveSchoolBrandingImage(file, schoolId, "stamp");
}

async function saveSchoolBrandingImage(
  file: File,
  schoolId: number,
  assetName: string,
) {
  if (!(file instanceof File) || file.size === 0) {
    throw new Error(`Please select a ${assetName.replace("-", " ")} image.`);
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`${assetName.replace("-", " ")} must not exceed 2 MB.`);
  }

  const extension = ALLOWED_IMAGE_TYPES.get(file.type);

  if (!extension) {
    throw new Error(
      `Invalid ${assetName.replace(
        "-",
        " ",
      )}. Please upload JPG, PNG, or WEBP.`,
    );
  }

  const uploadDirectory = path.join(
    process.cwd(),
    "public",
    "uploads",
    "schools",
    String(schoolId),
  );

  await mkdir(uploadDirectory, { recursive: true });

  const fileName = `${assetName}-${Date.now()}.${extension}`;

  const filePath = path.join(uploadDirectory, fileName);

  const buffer = Buffer.from(await file.arrayBuffer());

  await writeFile(filePath, buffer);

  return `/uploads/schools/${schoolId}/${fileName}`;
}

export async function deleteUploadedFile(
  fileUrl?: string | null,
  schoolId?: number,
) {
  if (!fileUrl || !schoolId) {
    return;
  }

  const uploadRoot = path.resolve(
    process.cwd(),
    "public",
    "uploads",
    "students",
    String(schoolId),
  );

  const normalizedUrl = fileUrl.replace(/^\/+/, "");

  const expectedPrefix = `uploads/students/${schoolId}/`;

  if (!normalizedUrl.startsWith(expectedPrefix)) {
    console.warn("Skipped deletion of unsafe student photo path:", fileUrl);
    return;
  }

  const fileName = path.basename(normalizedUrl);

  if (!fileName || fileName === "." || fileName === "..") {
    console.warn("Skipped deletion of invalid student photo path:", fileUrl);
    return;
  }

  const filePath = path.resolve(uploadRoot, fileName);

  const relativePath = path.relative(uploadRoot, filePath);

  if (
    relativePath.startsWith("..") ||
    path.isAbsolute(relativePath) ||
    relativePath !== fileName
  ) {
    console.warn("Skipped deletion of unsafe student photo path:", fileUrl);
    return;
  }

  try {
    await unlink(filePath);
  } catch (error) {
    const err = error as NodeJS.ErrnoException;

    if (err.code !== "ENOENT") {
      console.warn("Could not delete student photo:", {
        fileUrl,
        error: err.message,
      });
    }
  }
}
