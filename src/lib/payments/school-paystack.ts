import "server-only";

import { decryptCredential } from "@/lib/payments/credential-encryption";
import { db } from "@/prisma/db";

/**
 * Returns the credential to use for a NEW payment.
 *
 * If a school has a configuration, it must be enabled.
 * The legacy global key is used only when the school has
 * no configuration record.
 */
export async function getPaystackSecretForNewPayment(
  schoolId: number,
): Promise<string | null> {
  const config = await db.orm.public.SchoolPaymentConfig.where((item) =>
    item.schoolId.eq(schoolId),
  ).first();

  if (config) {
    if (!config.isEnabled || !config.encryptedSecretKey) {
      return null;
    }

    return decryptCredential(config.encryptedSecretKey);
  }

  // Backward compatibility for schools not yet configured individually.
  return process.env.PAYSTACK_SECRET_KEY || null;
}

/**
 * Returns credentials that may be needed to verify an existing payment.
 *
 * A payment may have been initialized with the school's current key
 * or with the legacy global key before individual configuration was added.
 *
 * This function does not enable payments; it only provides candidates
 * for verifying transactions already in progress.
 */
export async function getPaystackSecretCandidates(
  schoolId: number,
): Promise<string[]> {
  const config = await db.orm.public.SchoolPaymentConfig.where((item) =>
    item.schoolId.eq(schoolId),
  ).first();

  const candidates: string[] = [];

  if (config?.encryptedSecretKey) {
    candidates.push(decryptCredential(config.encryptedSecretKey));
  }

  const legacySecret = process.env.PAYSTACK_SECRET_KEY;

  if (legacySecret && !candidates.includes(legacySecret)) {
    candidates.push(legacySecret);
  }

  return candidates;
}
