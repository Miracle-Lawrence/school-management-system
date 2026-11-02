import "server-only";

import { NextResponse } from "next/server";

import { requireApiRole } from "@/lib/auth/authorization";
import {
  decryptCredential,
  encryptCredential,
} from "@/lib/payments/credential-encryption";
import { db } from "@/prisma/db";

export const dynamic = "force-dynamic";

const ALLOWED_ROLES = ["SCHOOL_OWNER", "SCHOOL_ADMIN"];

type PaystackValidationResult =
  { valid: true } | { valid: false; message: string };

function getPublicConfig(config: {
  publicKey: string | null;
  encryptedSecretKey: string | null;
  isEnabled: boolean;
  lastValidatedAt: string | null;
}) {
  return {
    provider: "PAYSTACK",
    publicKey: config.publicKey,
    hasSecretKey: Boolean(config.encryptedSecretKey),
    isEnabled: config.isEnabled,
    lastValidatedAt: config.lastValidatedAt,
  };
}

async function validatePaystackCredentials(
  publicKey: string,
  secretKey: string,
): Promise<PaystackValidationResult> {
  if (!publicKey.startsWith("pk_") || !secretKey.startsWith("sk_")) {
    return {
      valid: false,
      message: "Enter a valid Paystack public key and secret key.",
    };
  }

  try {
    const response = await fetch("https://api.paystack.co/transaction", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        Accept: "application/json",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });

    if (response.status === 401 || response.status === 403) {
      return {
        valid: false,
        message: "Paystack rejected the secret key. Check your credentials.",
      };
    }

    if (!response.ok) {
      return {
        valid: false,
        message:
          "Paystack could not validate the credentials right now. Please try again.",
      };
    }

    const result: unknown = await response.json();

    if (
      !result ||
      typeof result !== "object" ||
      !("status" in result) ||
      result.status !== true
    ) {
      return {
        valid: false,
        message: "Paystack could not validate these credentials.",
      };
    }

    return { valid: true };
  } catch {
    return {
      valid: false,
      message:
        "Unable to contact Paystack. Check your connection and try again.",
    };
  }
}

export async function GET() {
  try {
    const session = await requireApiRole(ALLOWED_ROLES);

    if (session instanceof NextResponse) {
      return session;
    }

    const schoolId = session.user.schoolId;

    if (!schoolId) {
      return NextResponse.json(
        { error: "School context is required." },
        { status: 400 },
      );
    }

    const config = await db.orm.public.SchoolPaymentConfig.where((item) =>
      item.schoolId.eq(schoolId),
    ).first();

    return NextResponse.json(
      {
        config: config
          ? getPublicConfig(config)
          : {
              provider: "PAYSTACK",
              publicKey: null,
              hasSecretKey: false,
              isEnabled: false,
              lastValidatedAt: null,
            },
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("Paystack configuration lookup failed.", error);

    return NextResponse.json(
      { error: "Unable to load payment configuration." },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await requireApiRole(ALLOWED_ROLES);

    if (session instanceof NextResponse) {
      return session;
    }

    const schoolId = session.user.schoolId;

    if (!schoolId) {
      return NextResponse.json(
        { error: "School context is required." },
        { status: 400 },
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Request body must contain valid JSON." },
        { status: 400 },
      );
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { error: "Invalid payment configuration." },
        { status: 400 },
      );
    }

    const input = body as Record<string, unknown>;

    const publicKey =
      typeof input.publicKey === "string" ? input.publicKey.trim() : "";

    const submittedSecret =
      typeof input.secretKey === "string" ? input.secretKey.trim() : "";

    if (!publicKey || !submittedSecret) {
      return NextResponse.json(
        {
          error: "Both the Paystack public key and secret key are required.",
        },
        { status: 400 },
      );
    }

    if (publicKey.length > 200 || submittedSecret.length > 500) {
      return NextResponse.json(
        { error: "The supplied credentials have an invalid length." },
        { status: 400 },
      );
    }

    const validation = await validatePaystackCredentials(
      publicKey,
      submittedSecret,
    );

    if (!validation.valid) {
      return NextResponse.json({ error: validation.message }, { status: 400 });
    }

    const existing = await db.orm.public.SchoolPaymentConfig.where((item) =>
      item.schoolId.eq(schoolId),
    ).first();

    const encryptedSecretKey = encryptCredential(submittedSecret);
    const lastValidatedAt = new Date().toISOString();

    if (existing) {
      await db.orm.public.SchoolPaymentConfig.where((item) =>
        item.schoolId.eq(schoolId),
      ).update({
        provider: "PAYSTACK",
        publicKey,
        encryptedSecretKey,
        isEnabled: true,
        lastValidatedAt,
      });
    } else {
      await db.orm.public.SchoolPaymentConfig.create({
        schoolId,
        provider: "PAYSTACK",
        publicKey,
        encryptedSecretKey,
        isEnabled: true,
        lastValidatedAt,
      });
    }

    return NextResponse.json({
      message: "Paystack credentials validated and saved successfully.",
      config: {
        provider: "PAYSTACK",
        publicKey,
        hasSecretKey: true,
        isEnabled: true,
        lastValidatedAt,
      },
    });
  } catch (error) {
    console.error("Paystack configuration save failed.", error);

    return NextResponse.json(
      { error: "Unable to save payment configuration." },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  try {
    const session = await requireApiRole(ALLOWED_ROLES);

    if (session instanceof NextResponse) {
      return session;
    }

    const schoolId = session.user.schoolId;

    if (!schoolId) {
      return NextResponse.json(
        { error: "School context is required." },
        { status: 400 },
      );
    }

    const existing = await db.orm.public.SchoolPaymentConfig.where((item) =>
      item.schoolId.eq(schoolId),
    ).first();

    if (!existing) {
      return NextResponse.json({
        message: "Paystack is already disabled for this school.",
      });
    }

    await db.orm.public.SchoolPaymentConfig.where((item) =>
      item.schoolId.eq(schoolId),
    ).update({
      isEnabled: false,
    });

    return NextResponse.json({
      message: "Paystack has been disabled for this school.",
    });
  } catch (error) {
    console.error("Paystack configuration disable failed.", error);

    return NextResponse.json(
      { error: "Unable to disable Paystack." },
      { status: 500 },
    );
  }
}
