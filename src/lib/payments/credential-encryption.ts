import "server-only";

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const KEY_ENV_NAME = "PAYMENT_CREDENTIALS_ENCRYPTION_KEY";
const FORMAT_VERSION = "v1";

function getEncryptionKey(): Buffer {
  const encodedKey = process.env[KEY_ENV_NAME];

  if (!encodedKey) {
    throw new Error(`${KEY_ENV_NAME} is not configured.`);
  }

  const key = Buffer.from(encodedKey, "base64");

  // Require a canonical Base64 encoding of exactly 32 bytes.
  if (key.length !== 32 || key.toString("base64") !== encodedKey) {
    throw new Error(
      `${KEY_ENV_NAME} must be a valid Base64-encoded 32-byte key.`,
    );
  }

  return key;
}

export function encryptCredential(plaintext: string): string {
  if (!plaintext) {
    throw new Error("Cannot encrypt an empty credential.");
  }

  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(ALGORITHM, key, iv);

  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return [
    FORMAT_VERSION,
    iv.toString("base64"),
    authTag.toString("base64"),
    ciphertext.toString("base64"),
  ].join(".");
}

export function decryptCredential(payload: string): string {
  const parts = payload.split(".");

  if (parts.length !== 4 || parts[0] !== FORMAT_VERSION) {
    throw new Error("Unsupported encrypted credential format.");
  }

  const [, encodedIv, encodedAuthTag, encodedCiphertext] = parts;

  const iv = Buffer.from(encodedIv, "base64");
  const authTag = Buffer.from(encodedAuthTag, "base64");
  const ciphertext = Buffer.from(encodedCiphertext, "base64");

  if (
    iv.length !== IV_LENGTH ||
    authTag.length !== AUTH_TAG_LENGTH ||
    ciphertext.length === 0
  ) {
    throw new Error("Invalid encrypted credential format.");
  }

  const key = getEncryptionKey();

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  // Authentication failure causes final() to throw.
  const plaintext = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return plaintext.toString("utf8");
}
