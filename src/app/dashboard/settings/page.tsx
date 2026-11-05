import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/authorization";
import { db } from "@/prisma/db";
import {
  uploadPlatformBrandingLogo,
  savePlatformBranding,
} from "@/lib/services/platform-branding.service";
import { resolvePlatformImageUrl } from "@/lib/storage/object-storage";

export const dynamic = "force-dynamic";

async function uploadPlatformLogo(formData: FormData) {
  "use server";

  await requireRole(["PLATFORM_OWNER", "PLATFORM_ADMIN"]);

  const file = formData.get("logo");

  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Please select a platform logo.");
  }

  await uploadPlatformBrandingLogo(file);

  redirect("/dashboard/settings?logoSaved=1");
}

async function savePlatformSettings(formData: FormData) {
  "use server";

  await requireRole(["PLATFORM_OWNER", "PLATFORM_ADMIN"]);

  const platformName = String(formData.get("platformName") ?? "").trim();
  const supportEmail = String(formData.get("supportEmail") ?? "")
    .trim()
    .toLowerCase();
  const supportPhone = String(formData.get("supportPhone") ?? "").trim();
  const defaultCurrency = String(formData.get("defaultCurrency") ?? "").trim();
  const defaultTimezone = String(formData.get("defaultTimezone") ?? "").trim();
  const registrationEnabled = formData.get("registrationEnabled") === "on";
  const maintenanceMode = formData.get("maintenanceMode") === "on";
  const maintenanceMessage = String(
    formData.get("maintenanceMessage") ?? "",
  ).trim();

  if (platformName.length < 2 || platformName.length > 100) {
    throw new Error("Platform name must be between 2 and 100 characters.");
  }

  if (
    supportEmail &&
    (supportEmail.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supportEmail))
  ) {
    throw new Error("Enter a valid support email address.");
  }

  if (supportPhone.length > 30) {
    throw new Error("Support phone cannot exceed 30 characters.");
  }

  if (!["NGN", "USD", "GBP", "EUR", "CAD"].includes(defaultCurrency)) {
    throw new Error("Select a supported default currency.");
  }

  if (
    !["Africa/Lagos", "UTC", "Europe/London", "America/New_York"].includes(
      defaultTimezone,
    )
  ) {
    throw new Error("Select a supported timezone.");
  }

  if (maintenanceMessage.length > 1000) {
    throw new Error("Maintenance message cannot exceed 1,000 characters.");
  }

  const existingSettings = await db.orm.public.PlatformSetting.all();
  const currentSettings = existingSettings[0];

  const values = {
    platformName,
    supportEmail: supportEmail || null,
    supportPhone: supportPhone || null,
    defaultCurrency,
    defaultTimezone,
    registrationEnabled,
    maintenanceMode,
    maintenanceMessage: maintenanceMessage || null,
    updatedAt: new Date().toISOString(),
  };

  if (currentSettings) {
    await db.orm.public.PlatformSetting.where((item) =>
      item.id.eq(currentSettings.id),
    ).update(values);
  } else {
    await db.orm.public.PlatformSetting.create(values);
  }

  await savePlatformBranding({
    platformName,
    primaryColor: String(formData.get("primaryColor") ?? "#101b35"),
    secondaryColor: String(formData.get("secondaryColor") ?? "#334155"),
    accentColor: String(formData.get("accentColor") ?? "#2563eb"),
    website: String(formData.get("website") ?? ""),
    businessAddress: String(formData.get("businessAddress") ?? ""),
    invoiceFooterText: String(formData.get("invoiceFooterText") ?? ""),
  });

  redirect("/dashboard/settings?saved=1");
}

export default async function PlatformSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; logoSaved?: string }>;
}) {
  await requireRole(["PLATFORM_OWNER", "PLATFORM_ADMIN"]);

  const params = await searchParams;
  const settingsList = await db.orm.public.PlatformSetting.all();
  const settings = settingsList[0];

  const platformName = settings?.platformName ?? "SchoolMS";
  const supportEmail = settings?.supportEmail ?? "";
  const supportPhone = settings?.supportPhone ?? "";
  const defaultCurrency = settings?.defaultCurrency ?? "NGN";
  const defaultTimezone = settings?.defaultTimezone ?? "Africa/Lagos";
  const registrationEnabled = settings?.registrationEnabled ?? true;
  const maintenanceMode = settings?.maintenanceMode ?? false;
  const maintenanceMessage = settings?.maintenanceMessage ?? "";
  const primaryColor = settings?.primaryColor ?? "#101b35";
  const secondaryColor = settings?.secondaryColor ?? "#334155";
  const accentColor = settings?.accentColor ?? "#2563eb";
  const website = settings?.website ?? "";
  const businessAddress = settings?.businessAddress ?? "";
  const invoiceFooterText = settings?.invoiceFooterText ?? "";
  const logoUrl = await resolvePlatformImageUrl(settings?.logoUrl);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header>
        <p className="text-sm font-semibold text-blue-700">
          Platform Administration
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          Platform Settings
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Configure general platform details, regional preferences, and
          administrative controls.
        </p>
      </header>

      {params.saved === "1" && (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-800"
        >
          Your platform settings have been saved successfully.
        </div>
      )}

      {params.logoSaved === "1" && (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-800"
        >
          Platform logo uploaded successfully.
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-5 sm:px-8">
          <h2 className="text-lg font-bold text-slate-900">
            Platform Logo
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Upload the logo displayed on platform invoices and payment receipts.
          </p>
        </div>

        <form
          action={uploadPlatformLogo}
          encType="multipart/form-data"
          className="space-y-5 p-6 sm:p-8"
        >
          {logoUrl && (
            <div className="flex items-center gap-4">
              <img
                src={logoUrl}
                alt="Current platform logo"
                className="h-20 w-20 rounded-lg border border-slate-200 object-contain p-2"
              />
              <p className="text-sm text-slate-500">
                Current platform logo
              </p>
            </div>
          )}

          <label className="block text-sm font-semibold text-slate-700">
            Choose logo
            <input
              type="file"
              name="logo"
              accept="image/png,image/jpeg,image/webp"
              required
              className="mt-2 block w-full rounded-lg border border-slate-300 p-3 text-sm"
            />
            <span className="mt-2 block text-xs font-normal text-slate-500">
              PNG, JPG or WEBP. Maximum file size: 2 MB.
            </span>
          </label>

          <button
            type="submit"
            className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Upload Logo
          </button>
        </form>
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-5 sm:px-8">
          <h2 className="text-lg font-bold text-slate-900">
            General information
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Set the name and support contact details displayed for your
            platform.
          </p>
        </div>

        <form action={savePlatformSettings} className="space-y-8 p-6 sm:p-8">
          <div className="grid gap-6 md:grid-cols-2">
            <label className="block text-sm font-semibold text-slate-700">
              Platform name
              <input
                type="text"
                name="platformName"
                required
                minLength={2}
                maxLength={100}
                defaultValue={platformName}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </label>

            <label className="block text-sm font-semibold text-slate-700">
              Support email
              <input
                type="email"
                name="supportEmail"
                maxLength={254}
                defaultValue={supportEmail}
                placeholder="support@example.com"
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </label>

            <label className="block text-sm font-semibold text-slate-700">
              Support phone
              <input
                type="tel"
                name="supportPhone"
                maxLength={30}
                defaultValue={supportPhone}
                placeholder="+234 ..."
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </label>
          </div>

          <div className="border-t border-slate-100 pt-7">
            <h2 className="text-lg font-bold text-slate-900">
              Invoice and receipt branding
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Customize the information displayed on platform invoices and receipts.
            </p>

            <div className="mt-5 grid gap-6 md:grid-cols-2">
              <label className="block text-sm font-semibold text-slate-700">
                Primary colour
                <input type="color" name="primaryColor" defaultValue={primaryColor}
                  className="mt-2 h-12 w-full cursor-pointer rounded-lg border border-slate-300 p-1" />
              </label>

              <label className="block text-sm font-semibold text-slate-700">
                Secondary colour
                <input type="color" name="secondaryColor" defaultValue={secondaryColor}
                  className="mt-2 h-12 w-full cursor-pointer rounded-lg border border-slate-300 p-1" />
              </label>

              <label className="block text-sm font-semibold text-slate-700">
                Accent colour
                <input type="color" name="accentColor" defaultValue={accentColor}
                  className="mt-2 h-12 w-full cursor-pointer rounded-lg border border-slate-300 p-1" />
              </label>

              <label className="block text-sm font-semibold text-slate-700">
                Website
                <input type="url" name="website" maxLength={255}
                  defaultValue={website} placeholder="https://example.com"
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" />
              </label>

              <label className="block text-sm font-semibold text-slate-700 md:col-span-2">
                Business address
                <textarea name="businessAddress" maxLength={500} rows={3}
                  defaultValue={businessAddress}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" />
              </label>

              <label className="block text-sm font-semibold text-slate-700 md:col-span-2">
                Invoice and receipt footer
                <textarea name="invoiceFooterText" maxLength={1000} rows={3}
                  defaultValue={invoiceFooterText}
                  placeholder="Thank you for your business."
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" />
              </label>
            </div>
          </div>
          <div className="border-t border-slate-100 pt-7">
            <h2 className="text-lg font-bold text-slate-900">
              Regional preferences
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Choose the default currency and timezone for platform
              administration.
            </p>

            <div className="mt-5 grid gap-6 md:grid-cols-2">
              <label className="block text-sm font-semibold text-slate-700">
                Default currency
                <select
                  name="defaultCurrency"
                  defaultValue={defaultCurrency}
                  required
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                >
                  <option value="NGN">NGN â€” Nigerian Naira</option>
                  <option value="USD">USD â€” US Dollar</option>
                  <option value="GBP">GBP â€” British Pound</option>
                  <option value="EUR">EUR â€” Euro</option>
                  <option value="CAD">CAD â€” Canadian Dollar</option>
                </select>
              </label>

              <label className="block text-sm font-semibold text-slate-700">
                Default timezone
                <select
                  name="defaultTimezone"
                  defaultValue={defaultTimezone}
                  required
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                >
                  <option value="Africa/Lagos">
                    Africa/Lagos â€” West Africa
                  </option>
                  <option value="UTC">UTC â€” Coordinated Universal Time</option>
                  <option value="Europe/London">Europe/London</option>
                  <option value="America/New_York">America/New_York</option>
                </select>
              </label>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-7">
            <h2 className="text-lg font-bold text-slate-900">
              Platform controls
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Configure whether new school registrations are permitted and
              whether maintenance mode should be enabled.
            </p>

            <div className="mt-5 space-y-4">
              <label className="flex cursor-pointer items-start gap-4 rounded-xl border border-slate-200 p-4 transition hover:bg-slate-50">
                <input
                  type="checkbox"
                  name="registrationEnabled"
                  defaultChecked={registrationEnabled}
                  className="mt-1 h-4 w-4 accent-blue-600"
                />
                <span>
                  <span className="block text-sm font-semibold text-slate-800">
                    Allow school registration
                  </span>
                  <span className="mt-1 block text-sm text-slate-500">
                    Enable or disable new school registrations across the
                    platform.
                  </span>
                </span>
              </label>

              <label className="flex cursor-pointer items-start gap-4 rounded-xl border border-amber-200 bg-amber-50/50 p-4 transition hover:bg-amber-50">
                <input
                  type="checkbox"
                  name="maintenanceMode"
                  defaultChecked={maintenanceMode}
                  className="mt-1 h-4 w-4 accent-amber-600"
                />
                <span>
                  <span className="block text-sm font-semibold text-slate-800">
                    Maintenance mode
                  </span>
                  <span className="mt-1 block text-sm text-slate-600">
                    Save the platform&apos;s maintenance state for use by
                    maintenance handling logic.
                  </span>
                </span>
              </label>

              <label className="block text-sm font-semibold text-slate-700">
                Maintenance message
                <textarea
                  name="maintenanceMessage"
                  rows={3}
                  maxLength={1000}
                  defaultValue={maintenanceMessage}
                  placeholder="We are performing scheduled maintenance. Please try again later."
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
                <span className="mt-1 block text-xs font-normal text-slate-500">
                  Up to 1,000 characters. This message is stored but is not
                  displayed to users automatically yet.
                </span>
              </label>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              Changes are stored in your PostgreSQL database.
            </p>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-xl bg-[#101b35] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/20"
            >
              Save Settings
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-xl border border-blue-100 bg-blue-50/70 p-5">
        <h2 className="text-sm font-bold text-slate-900">Configuration note</h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          These settings are persisted for future platform use. Registration
          restrictions and maintenance mode will only affect users once their
          respective application workflows are connected to these settings.
        </p>
      </section>
    </div>
  );
}







