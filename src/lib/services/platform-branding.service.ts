import { db } from "@/prisma/db";
import {
  deletePlatformImage,
  uploadPlatformImage,
} from "@/lib/storage/object-storage";

export async function savePlatformBranding(input: {
  platformName: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  website?: string;
  businessAddress?: string;
  invoiceFooterText?: string;
}) {
  const platformName = input.platformName.trim();
  const primaryColor = input.primaryColor.trim();
  const secondaryColor = input.secondaryColor.trim();
  const accentColor = input.accentColor.trim();
  const website = input.website?.trim() ?? "";
  const businessAddress = input.businessAddress?.trim() ?? "";
  const invoiceFooterText = input.invoiceFooterText?.trim() ?? "";

  if (platformName.length < 2 || platformName.length > 100) {
    throw new Error("Platform name must be between 2 and 100 characters.");
  }

  const validColor = /^#[0-9a-fA-F]{6}$/;

  for (const color of [primaryColor, secondaryColor, accentColor]) {
    if (!validColor.test(color)) {
      throw new Error("Enter valid six-digit hexadecimal brand colours.");
    }
  }

  if (website && website.length > 255) {
    throw new Error("Website address cannot exceed 255 characters.");
  }

  if (website) {
    try {
      const parsed = new URL(website);
      if (!["http:", "https:"].includes(parsed.protocol)) {
        throw new Error();
      }
    } catch {
      throw new Error("Enter a valid website URL.");
    }
  }

  if (businessAddress.length > 500) {
    throw new Error("Business address cannot exceed 500 characters.");
  }

  if (invoiceFooterText.length > 1000) {
    throw new Error("Invoice footer cannot exceed 1,000 characters.");
  }

  const settingsList = await db.orm.public.PlatformSetting.all();
  const current = settingsList[0];

  const values = {
    platformName,
    primaryColor,
    secondaryColor,
    accentColor,
    website: website || null,
    businessAddress: businessAddress || null,
    invoiceFooterText: invoiceFooterText || null,
    updatedAt: new Date().toISOString(),
  };

  if (current) {
    await db.orm.public.PlatformSetting.where((item) =>
      item.id.eq(current.id),
    ).update(values);
  } else {
    await db.orm.public.PlatformSetting.create({
      ...values,
      defaultCurrency: "NGN",
      defaultTimezone: "Africa/Lagos",
    });
  }
}

export async function uploadPlatformBrandingLogo(file: File) {
  const settingsList = await db.orm.public.PlatformSetting.all();
  const current = settingsList[0];

  const newLogoUrl = await uploadPlatformImage(file, "logos");

  try {
    if (current) {
      await db.orm.public.PlatformSetting.where((item) =>
        item.id.eq(current.id),
      ).update({
        logoUrl: newLogoUrl,
        updatedAt: new Date().toISOString(),
      });
    } else {
      await db.orm.public.PlatformSetting.create({
        platformName: "SchoolMS",
        logoUrl: newLogoUrl,
        defaultCurrency: "NGN",
        defaultTimezone: "Africa/Lagos",
      });
    }
  } catch (error) {
    await deletePlatformImage(newLogoUrl);
    throw error;
  }

  if (current?.logoUrl && current.logoUrl !== newLogoUrl) {
    await deletePlatformImage(current.logoUrl);
  }

  return newLogoUrl;
}
