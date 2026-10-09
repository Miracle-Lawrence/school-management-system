import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import SchoolLoginForm from "./components/school-login-form";

import { signIn } from "@/auth";
import { getSchoolFromHost } from "@/lib/tenant/school";

export default async function SchoolLoginPage() {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host");

  if (!host) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="rounded-lg border bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-semibold">School Not Found</h1>
          <p className="mt-2 text-sm text-gray-500">
            The school could not be identified.
          </p>
        </div>
      </main>
    );
  }

  const school = await getSchoolFromHost(host);

  if (!school) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="rounded-lg border bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-semibold">School Not Found</h1>
          <p className="mt-2 text-sm text-gray-500">
            This login address is not associated with a registered school.
          </p>
        </div>
      </main>
    );
  }

  if (school.status !== "ACTIVE") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="rounded-lg border bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-semibold">School Unavailable</h1>
          <p className="mt-2 text-sm text-gray-500">
            This school's portal is currently unavailable.
          </p>
        </div>
      </main>
    );
  }

  async function login(_previousState: { error?: string }, formData: FormData) {
    "use server";

    const email = formData.get("email");
    const password = formData.get("password");

    if (typeof email !== "string" || typeof password !== "string") {
      return {
        error: "Please enter your email address and password.",
      };
    }

    try {
      await signIn("credentials", {
        email,
        password,
        host,
        redirectTo: "/school/dashboard",
      });

      return {};
    } catch (error) {
      if (error instanceof AuthError) {
        return {
          error:
            "The email or password is incorrect, or this account does not belong to this school's portal.",
        };
      }

      throw error;
    }
  }

  const primaryColor = school.primaryColor ?? "#1D4ED8";
  const secondaryColor = school.secondaryColor ?? "#0F172A";
  const accentColor = school.accentColor ?? "#16A34A";

  return (
    <main
      className="min-h-screen"
      style={{
        background: `linear-gradient(135deg, ${secondaryColor}, ${primaryColor})`,
      }}
    >
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="grid w-full max-w-6xl overflow-hidden rounded-2xl bg-white shadow-2xl lg:grid-cols-2">
          <div
            className="relative hidden min-h-[650px] overflow-hidden lg:block"
            style={{ backgroundColor: secondaryColor }}
          >
            {school.loginImageUrl ? (
              <img
                src={school.loginImageUrl}
                alt={`${school.name} campus`}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(135deg, ${secondaryColor}, ${primaryColor})`,
                }}
              />
            )}

            <div className="absolute inset-0 bg-black/45" />

            <div className="relative z-10 flex h-full flex-col justify-between p-10 text-white">
              <div>
                {school.logoUrl && (
                  <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-white p-3 shadow-lg">
                    <img
                      src={school.logoUrl}
                      alt={`${school.name} logo`}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                )}
              </div>

              <div>
                <h1 className="max-w-lg text-4xl font-bold leading-tight">
                  {school.name}
                </h1>

                {school.motto && (
                  <p className="mt-4 max-w-md text-lg text-white/90">
                    {school.motto}
                  </p>
                )}

                <div
                  className="mt-6 h-1 w-20 rounded-full"
                  style={{ backgroundColor: accentColor }}
                />
              </div>
            </div>
          </div>

          <div className="flex min-h-[650px] items-center justify-center p-8 sm:p-12">
            <div className="w-full max-w-md">
              <div className="mb-8 text-center lg:text-left">
                {school.logoUrl && (
                  <div className="mb-6 flex justify-center lg:hidden">
                    <div className="flex h-20 w-20 items-center justify-center rounded-xl border bg-white p-3 shadow-sm">
                      <img
                        src={school.logoUrl}
                        alt={`${school.name} logo`}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                  </div>
                )}

                <p
                  className="text-sm font-semibold uppercase tracking-wider"
                  style={{ color: primaryColor }}
                >
                  {school.name}
                </p>

                <h2 className="mt-2 text-3xl font-bold text-gray-900">
                  Welcome Back
                </h2>

                <p className="mt-2 text-sm text-gray-500">
                  Sign in to access your school portal.
                </p>
              </div>

              <SchoolLoginForm action={login} primaryColor={primaryColor} />
              <div className="mt-8 border-t pt-6 text-center">
                <p className="text-xs text-gray-400">
                  Powered by your school management platform
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
