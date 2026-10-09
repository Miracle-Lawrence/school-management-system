"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (!result || result.error) {
        setError("Invalid email or password.");
        return;
      }

      const response = await fetch("/api/auth/session");

      if (!response.ok) {
        setError("Unable to verify your session. Please try again.");
        return;
      }

      const session = await response.json();
      const role = session?.user?.role;

      if (!role) {
        setError("Unable to determine your account role.");
        return;
      }

      switch (role) {
        case "PLATFORM_OWNER":
        case "PLATFORM_ADMIN":
          router.push("/dashboard");
          break;

        case "SCHOOL_OWNER":
        case "SCHOOL_ADMIN":
        case "TEACHER":
        case "PARENT":
        case "STUDENT":
          router.push("/school/dashboard");
          break;

        default:
          setError("Your account role is not supported.");
      }
    } catch {
      setError("A connection error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-2">
      {/* Company branding panel */}
      <section className="relative flex min-h-[340px] flex-col justify-between overflow-hidden bg-[#071d3a] px-7 py-8 text-white sm:px-12 sm:py-10 lg:min-h-screen lg:px-14 lg:py-14">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "linear-gradient(90deg, rgba(5, 22, 46, 0.96), rgba(5, 22, 46, 0.70)), url('https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1600&q=85')",
          }}
        />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-amber-400/50 bg-white/10 text-2xl text-amber-300">
              ✦
            </div>
            <div>
              <p className="text-lg font-bold tracking-tight sm:text-xl">
                School Management System
              </p>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-amber-300">
                Education · People · Progress
              </p>
            </div>
          </div>

          <div className="mt-12 max-w-xl lg:mt-24">
            <p className="mb-5 text-xs font-bold uppercase tracking-[0.3em] text-amber-300">
              Platform Administration
            </p>

            <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl xl:text-6xl">
              Empowering schools for a{" "}
              <span className="text-amber-300">brighter future.</span>
            </h1>

            <p className="mt-6 max-w-lg text-base leading-7 text-slate-200 sm:text-lg">
              One central platform to oversee schools, manage users, and support
              better educational outcomes.
            </p>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-3 lg:mt-16 lg:grid-cols-1 xl:grid-cols-3">
            {[
              {
                number: "01",
                title: "Manage schools",
                description: "Oversee registered schools",
              },
              {
                number: "02",
                title: "Manage access",
                description: "Control platform accounts",
              },
              {
                number: "03",
                title: "Track progress",
                description: "Monitor platform activity",
              },
            ].map((item) => (
              <div key={item.number} className="flex gap-3">
                <span className="text-sm font-bold text-amber-300">
                  {item.number}
                </span>
                <div>
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-300">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 mt-10 text-xs text-slate-300">
          A smarter way to manage education.
        </p>
      </section>

      {/* Login form */}
      <section className="flex items-center justify-center px-5 py-12 sm:px-10 lg:px-12">
        <div className="w-full max-w-md">
          <div className="mb-9">
            <div className="mb-7 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#071d3a] text-2xl text-amber-300 shadow-lg shadow-slate-900/10">
              ✦
            </div>

            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-600">
              Secure administrator access
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
              Welcome back
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              Sign in to manage your schools and platform settings.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Email address
              </label>

              <input
                id="email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                disabled={loading}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 disabled:opacity-60"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Password
              </label>

              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  disabled={loading}
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 pr-20 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 disabled:opacity-60"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="absolute inset-y-0 right-3 my-auto rounded-md px-2 text-xs font-semibold text-slate-500 hover:text-slate-900"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-3 rounded-xl bg-[#071d3a] px-4 py-4 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:bg-[#102f55] focus:outline-none focus:ring-4 focus:ring-amber-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign in to your account"}
              {!loading && <span aria-hidden="true">→</span>}
            </button>
          </form>

          <div className="mt-8 flex items-center gap-3 border-t border-slate-200 pt-6">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
              ✓
            </span>
            <div>
              <p className="text-xs font-semibold text-slate-700">
                Protected administrator portal
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Access is intended for authorized platform administrators.
              </p>
            </div>
          </div>

          <p className="mt-10 text-center text-xs text-slate-400">
            School Management System · Platform Portal
          </p>
        </div>
      </section>
    </main>
  );
}
