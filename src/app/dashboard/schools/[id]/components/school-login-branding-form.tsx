"use client";

import { useState } from "react";

type SchoolLoginBrandingFormProps = {
  schoolName: string;
  motto: string;
  logoUrl: string;
  loginImageUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
};

export default function SchoolLoginBrandingForm({
  schoolName,
  motto,
  logoUrl,
  loginImageUrl,
  primaryColor,
  secondaryColor,
  accentColor,
}: SchoolLoginBrandingFormProps) {
  const [logoPreview, setLogoPreview] = useState(logoUrl);
  const [loginImagePreview, setLoginImagePreview] = useState(loginImageUrl);

  const [primary, setPrimary] = useState(primaryColor || "#1D4ED8");
  const [secondary, setSecondary] = useState(secondaryColor || "#0F172A");
  const [accent, setAccent] = useState(accentColor || "#16A34A");

  return (
    <section className="mt-6 rounded-lg border bg-white p-6">
      <div>
        <h2 className="text-lg font-semibold">Login Page Branding</h2>

        <p className="mt-1 text-sm text-gray-500">
          Configure how this school's login page will look when students,
          parents, teachers, and administrators sign in.
        </p>
      </div>

      <div className="mt-6 space-y-6">
        <div>
          <label
            htmlFor="schoolName"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            School Name
          </label>

          <input
            id="schoolName"
            value={schoolName}
            readOnly
            className="w-full rounded-md border bg-gray-50 px-3 py-2 text-sm text-gray-700"
          />
        </div>

        <div>
          <label
            htmlFor="motto"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Motto / Tagline
          </label>

          <input
            id="motto"
            name="motto"
            defaultValue={motto}
            placeholder="Knowledge, Character and Excellence"
            className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label
              htmlFor="logo"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              School Logo
            </label>

            <input
              id="logo"
              name="logo"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="block w-full text-sm text-gray-600"
              onChange={(event) => {
                const file = event.target.files?.[0];

                if (file) {
                  setLogoPreview(URL.createObjectURL(file));
                }
              }}
            />

            {logoPreview && (
              <div className="mt-4 flex h-24 w-24 items-center justify-center rounded-md border bg-gray-50 p-2">
                <img
                  src={logoPreview}
                  alt={`${schoolName} logo`}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            )}
          </div>

          <div>
            <label
              htmlFor="loginImage"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Login Page Photo
            </label>

            <input
              id="loginImage"
              name="loginImage"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="block w-full text-sm text-gray-600"
              onChange={(event) => {
                const file = event.target.files?.[0];

                if (file) {
                  setLoginImagePreview(URL.createObjectURL(file));
                }
              }}
            />

            {loginImagePreview && (
              <div className="mt-4 h-40 overflow-hidden rounded-md border bg-gray-50">
                <img
                  src={loginImagePreview}
                  alt={`${schoolName} login`}
                  className="h-full w-full object-cover"
                />
              </div>
            )}

            <p className="mt-2 text-xs text-gray-500">
              Recommended: landscape school photo. JPG, PNG, or WEBP. Maximum
              size: 2 MB.
            </p>
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-semibold text-gray-800">
            Brand Colors
          </h3>

          <div className="grid gap-6 sm:grid-cols-3">
            <div>
              <label
                htmlFor="primaryColor"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Primary Color
              </label>

              <div className="flex gap-2">
                <input
                  type="color"
                  value={primary}
                  onChange={(event) => setPrimary(event.target.value)}
                  className="h-10 w-12 cursor-pointer rounded border p-1"
                  aria-label="Choose primary color"
                />

                <input
                  id="primaryColor"
                  name="primaryColor"
                  value={primary}
                  onChange={(event) => setPrimary(event.target.value)}
                  className="min-w-0 flex-1 rounded-md border px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="secondaryColor"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Secondary Color
              </label>

              <div className="flex gap-2">
                <input
                  type="color"
                  value={secondary}
                  onChange={(event) => setSecondary(event.target.value)}
                  className="h-10 w-12 cursor-pointer rounded border p-1"
                  aria-label="Choose secondary color"
                />

                <input
                  id="secondaryColor"
                  name="secondaryColor"
                  value={secondary}
                  onChange={(event) => setSecondary(event.target.value)}
                  className="min-w-0 flex-1 rounded-md border px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="accentColor"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Accent Color
              </label>

              <div className="flex gap-2">
                <input
                  type="color"
                  value={accent}
                  onChange={(event) => setAccent(event.target.value)}
                  className="h-10 w-12 cursor-pointer rounded border p-1"
                  aria-label="Choose accent color"
                />

                <input
                  id="accentColor"
                  name="accentColor"
                  value={accent}
                  onChange={(event) => setAccent(event.target.value)}
                  className="min-w-0 flex-1 rounded-md border px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
