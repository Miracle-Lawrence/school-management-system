import "server-only";

import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

import { getS3Client } from "./s3-client";

const PUBLIC_BUCKET = "school-public-assets";
const PRIVATE_BUCKET = "school-private-media";
const MAX_FILE_SIZE = 2 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = new Map<string, string>([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

export type ImageVisibility = "public" | "private";

type ParsedStorageReference = {
  visibility: ImageVisibility;
  key: string;
};

function getBucket(visibility: ImageVisibility): string {
  return visibility === "public" ? PUBLIC_BUCKET : PRIVATE_BUCKET;
}

function encodeObjectKey(key: string): string {
  return key.split("/").map(encodeURIComponent).join("/");
}

function parseStorageReference(
  reference: string,
): ParsedStorageReference | null {
  const match = reference.match(/^neon-(public|private):\/\/(.+)$/);

  if (!match) return null;

  return {
    visibility: match[1] as ImageVisibility,
    key: match[2],
  };
}

export async function uploadImage(
  file: File,
  options: {
    schoolId: number;
    category: string;
    visibility: ImageVisibility;
    ownerId?: number;
  },
): Promise<string> {
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Please select an image.");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("Image must not exceed 2 MB.");
  }

  const extension = ALLOWED_IMAGE_TYPES.get(file.type);

  if (!extension) {
    throw new Error("Only JPG, PNG, and WEBP images are allowed.");
  }

  if (!Number.isSafeInteger(options.schoolId) || options.schoolId <= 0) {
    throw new Error("Invalid school identifier.");
  }

  if (
    options.ownerId !== undefined &&
    (!Number.isSafeInteger(options.ownerId) || options.ownerId <= 0)
  ) {
    throw new Error("Invalid image owner identifier.");
  }

  const safeCategory = options.category.replace(/[^a-zA-Z0-9_-]/g, "");

  if (!safeCategory) {
    throw new Error("Invalid image category.");
  }

  const ownerSegment =
    options.ownerId === undefined ? "" : `${options.ownerId}/`;

  const key = [
    "schools",
    String(options.schoolId),
    safeCategory,
    ownerSegment + `${randomUUID()}.${extension}`,
  ].join("/");

  const bucket = getBucket(options.visibility);
  const body = Buffer.from(await file.arrayBuffer());

  await getS3Client().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: file.type,
      ContentLength: body.length,
      CacheControl:
        options.visibility === "public"
          ? "public, max-age=31536000, immutable"
          : "private, no-store",
    }),
  );

  return `neon-${options.visibility}://${key}`;
}

export async function resolveImageUrl(
  reference?: string | null,
  expectedSchoolId?: number,
): Promise<string | null> {
  if (!reference) return null;

  const parsed = parseStorageReference(reference);

  // Keep existing local URLs working during the migration.
  if (!parsed) return reference;

  // Private images must belong to the school requesting the image.
  // This check happens before a signed URL is generated.
  if (parsed.visibility === "private") {
    if (
      !Number.isSafeInteger(expectedSchoolId) ||
      expectedSchoolId === undefined ||
      expectedSchoolId <= 0
    ) {
      throw new Error(
        "A valid school identifier is required to resolve a private image.",
      );
    }

    const expectedPrefix = `schools/${expectedSchoolId}/`;

    if (!parsed.key.startsWith(expectedPrefix)) {
      throw new Error(
        "Refusing to resolve a private image that does not belong to this school.",
      );
    }
  }

  const endpoint = process.env.AWS_ENDPOINT_URL_S3;

  if (!endpoint) {
    throw new Error("AWS_ENDPOINT_URL_S3 is not configured.");
  }

  if (parsed.visibility === "public") {
    return `${endpoint.replace(/\/+$/, "")}/${PUBLIC_BUCKET}/${encodeObjectKey(parsed.key)}`;
  }

  return getSignedUrl(
    getS3Client(),
    new GetObjectCommand({
      Bucket: PRIVATE_BUCKET,
      Key: parsed.key,
    }),
    { expiresIn: 900 },
  );
}

export async function deleteStoredImage(
  reference?: string | null,
  expectedSchoolId?: number,
): Promise<void> {
  if (!reference) return;

  const parsed = parseStorageReference(reference);

  // Legacy local paths are not objects in Neon Object Storage.
  if (!parsed) return;

  if (
    !Number.isSafeInteger(expectedSchoolId) ||
    expectedSchoolId === undefined ||
    expectedSchoolId <= 0
  ) {
    throw new Error("A valid school identifier is required to delete an image.");
  }

  const expectedPrefix = `schools/${expectedSchoolId}/`;

  if (!parsed.key.startsWith(expectedPrefix)) {
    throw new Error(
      "Refusing to delete an image that does not belong to this school.",
    );
  }

  await getS3Client().send(
    new DeleteObjectCommand({
      Bucket: getBucket(parsed.visibility),
      Key: parsed.key,
    }),
  );
}
