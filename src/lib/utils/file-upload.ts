import {
  deleteStoredImage,
  uploadImage,
} from "@/lib/storage/object-storage";

export async function saveStudentPhoto(
  file: File,
  schoolId: number,
  studentId: number,
) {
  try {
    return await uploadImage(file, {
      schoolId,
      category: "students",
      visibility: "private",
      ownerId: studentId,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Please select an image.") {
      throw new Error("Please select a passport photograph.");
    }

    if (error instanceof Error && error.message === "Image must not exceed 2 MB.") {
      throw new Error("Passport photograph must not exceed 2 MB.");
    }

    if (error instanceof Error && error.message === "Only JPG, PNG, and WEBP images are allowed.") {
      throw new Error(
        "Invalid passport photograph. Please upload JPG, PNG, or WEBP.",
      );
    }

    throw error;
  }
}

export async function savePrincipalSignature(file: File, schoolId: number) {
  return uploadImage(file, {
    schoolId,
    category: "principal-signatures",
    visibility: "private",
  });
}

export async function saveSchoolLogo(file: File, schoolId: number) {
  return uploadImage(file, {
    schoolId,
    category: "logos",
    visibility: "public",
  });
}

export async function saveSchoolLoginImage(file: File, schoolId: number) {
  return uploadImage(file, {
    schoolId,
    category: "login-images",
    visibility: "public",
  });
}

export async function saveSchoolFavicon(file: File, schoolId: number) {
  return uploadImage(file, {
    schoolId,
    category: "favicons",
    visibility: "public",
  });
}

export async function saveSchoolStamp(file: File, schoolId: number) {
  return uploadImage(file, {
    schoolId,
    category: "stamps",
    visibility: "private",
  });
}

export async function deleteUploadedFile(
  fileUrl?: string | null,
  schoolId?: number,
) {
  if (!fileUrl || !schoolId) return;

  await deleteStoredImage(fileUrl, schoolId);
}
