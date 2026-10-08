"use client";

import { useState } from "react";

type SchoolBrandingFormProps = {
  motto: string;
  logoUrl: string;
  faviconUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  website: string;
  principalName: string;
  principalTitle: string;
  principalSignatureUrl: string;
  stampUrl: string;
};

const DEFAULT_PRIMARY = "#1D4ED8";
const DEFAULT_SECONDARY = "#0F172A";
const DEFAULT_ACCENT = "#16A34A";

export default function SchoolBrandingForm({
  motto,
  logoUrl,
  faviconUrl,
  primaryColor,
  secondaryColor,
  accentColor,
  website,
  principalName,
    principalTitle,
    principalSignatureUrl,
  stampUrl,
}: SchoolBrandingFormProps) {

    const [signaturePreview, setSignaturePreview] = useState(
      principalSignatureUrl,
    );
  const [primary, setPrimary] = useState(primaryColor || DEFAULT_PRIMARY);
  const [secondary, setSecondary] = useState(
    secondaryColor || DEFAULT_SECONDARY,
  );
  const [accent, setAccent] = useState(accentColor || DEFAULT_ACCENT);

  const [logoPreview, setLogoPreview] = useState(logoUrl);
  const [faviconPreview, setFaviconPreview] = useState(faviconUrl);
  const [stampPreview, setStampPreview] = useState(stampUrl);

  return (
    <section className="border-t border-slate-200 pt-8">
      <div className="mb-5">
        <h3 className="text-base font-semibold text-slate-900">
          School Branding
        </h3>

        <p className="mt-1 text-sm text-slate-600">
          Configure the branding information that will appear across the school
          portal, report cards, and other school documents.
        </p>
      </div>

      <div className="space-y-8">
        {/* School identity */}
        <div>
          <h4 className="mb-4 text-sm font-semibold text-slate-800">
            School Identity
          </h4>

          <div className="space-y-6">
            <div>
              <label
                htmlFor="motto"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                School Motto / Tagline
              </label>

              <input
                id="motto"
                name="motto"
                defaultValue={motto}
                placeholder="e.g. Knowledge, Character and Excellence"
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="logo"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  School Logo
                </label>

                <input
                  id="logo"
                  name="logo"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) => {
                    const file = event.target.files?.[0];

                    if (!file) return;

                    setLogoPreview(URL.createObjectURL(file));
                  }}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 file:mr-4 file:rounded-md file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-700"
                />

                {logoPreview && (
                  <div className="mt-3 flex h-24 w-24 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-2">
                    <img
                      src={logoPreview}
                      alt="School logo preview"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                )}

                <p className="mt-2 text-xs text-slate-500">
                  Upload your school logo. JPG, PNG, or WEBP, maximum 2 MB.
                </p>
              </div>

              <div>
                <label
                  htmlFor="favicon"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  School Favicon
                </label>

                <input
                  id="favicon"
                  name="favicon"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) => {
                    const file = event.target.files?.[0];

                    if (!file) return;

                    setFaviconPreview(URL.createObjectURL(file));
                  }}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 file:mr-4 file:rounded-md file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-700"
                />

                {faviconPreview && (
                  <div className="mt-3 flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-2">
                    <img
                      src={faviconPreview}
                      alt="School favicon preview"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                )}

                <p className="mt-2 text-xs text-slate-500">
                  Upload an image for the browser tab and school portal. JPG,
                  PNG, or WEBP.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Brand colors */}
        <div className="border-t border-slate-200 pt-6">
          <h4 className="mb-4 text-sm font-semibold text-slate-800">
            Brand Colors
          </h4>

          <div className="grid gap-6 sm:grid-cols-3">
            <ColorField
              id="primaryColor"
              name="primaryColor"
              label="Primary Color"
              value={primary}
              onChange={setPrimary}
            />

            <ColorField
              id="secondaryColor"
              name="secondaryColor"
              label="Secondary Color"
              value={secondary}
              onChange={setSecondary}
            />

            <ColorField
              id="accentColor"
              name="accentColor"
              label="Accent Color"
              value={accent}
              onChange={setAccent}
            />
          </div>
        </div>

        {/* Website and leadership */}
        <div className="border-t border-slate-200 pt-6">
          <h4 className="mb-4 text-sm font-semibold text-slate-800">
            Website & School Leadership
          </h4>

          <div className="space-y-6">
            <div>
              <label
                htmlFor="website"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                School Website
              </label>

              <input
                id="website"
                name="website"
                type="url"
                defaultValue={website}
                placeholder="https://www.yourschool.com"
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="principalName"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Principal / Head Teacher Name
                </label>

                <input
                  id="principalName"
                  name="principalName"
                  defaultValue={principalName}
                  placeholder="e.g. Mrs. Jane Smith"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label
                  htmlFor="principalSignature"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Principal Signature
                </label>

                <input
                  id="principalSignature"
                  name="principalSignature"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 file:mr-4 file:rounded-md file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-700"
                />

                {signaturePreview && (
                  <div className="mt-3 flex h-20 w-40 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-2">
                    <img
                      src={signaturePreview}
                      alt="Principal signature preview"
                      className="max-h-full max-w-full object-contain"
                      onError={() => setSignaturePreview("")}
                    />
                  </div>
                )}

                <p className="mt-2 text-xs text-slate-500">
                  Upload a clear signature image. JPG, PNG, or WEBP, maximum 2
                  MB.
                </p>
              </div>

              <div>
                <label
                  htmlFor="principalTitle"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Leadership Title
                </label>

                <input
                  id="principalTitle"
                  name="principalTitle"
                  defaultValue={principalTitle}
                  placeholder="e.g. Principal"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
          </div>
        </div>

        {/* School stamp */}
        <div className="border-t border-slate-200 pt-6">
          <h4 className="mb-4 text-sm font-semibold text-slate-800">
            School Stamp / Seal
          </h4>

          <div>
            <label
              htmlFor="stamp"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Stamp / Seal
            </label>

            <input
              id="stamp"
              name="stamp"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => {
                const file = event.target.files?.[0];

                if (!file) return;

                setStampPreview(URL.createObjectURL(file));
              }}
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 file:mr-4 file:rounded-md file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-700"
            />

            {stampPreview && (
              <div className="mt-3 flex h-28 w-28 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-2">
                <img
                  src={stampPreview}
                  alt="School stamp preview"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            )}

            <p className="mt-2 text-xs text-slate-500">
              Upload your official school stamp or seal. JPG, PNG, or WEBP,
              maximum 2 MB.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

type ColorFieldProps = {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
};

function ColorField({ id, name, label, value, onChange }: ColorFieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-semibold text-slate-700"
      >
        {label}
      </label>

      <div className="flex gap-3">
        <input
          id={id}
          name={name}
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 w-14 cursor-pointer rounded-lg border border-slate-300 bg-white p-1"
        />

        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          pattern="^#[0-9A-Fa-f]{6}$"
          maxLength={7}
          className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-mono uppercase text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          aria-label={`${label} hex value`}
        />
      </div>
    </div>
  );
}
