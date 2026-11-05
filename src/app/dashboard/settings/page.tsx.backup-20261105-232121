import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/authorization";
import { db } from "@/prisma/db";

export const dynamic = "force-dynamic";

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

  redirect("/dashboard/settings?saved=1");
}

export default async function PlatformSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
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
                  <option value="NGN">NGN — Nigerian Naira</option>
                  <option value="USD">USD — US Dollar</option>
                  <option value="GBP">GBP — British Pound</option>
                  <option value="EUR">EUR — Euro</option>
                  <option value="CAD">CAD — Canadian Dollar</option>
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
                    Africa/Lagos — West Africa
                  </option>
                  <option value="UTC">UTC — Coordinated Universal Time</option>
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
