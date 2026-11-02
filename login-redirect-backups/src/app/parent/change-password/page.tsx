import { redirect } from "next/navigation";
import { z } from "zod";

import { requireRole } from "@/lib/auth/authorization";
import { hashPassword } from "@/lib/auth/password";
import { db } from "@/prisma/db";

const changePasswordSchema = z
  .object({
    password: z.string().min(8, "Use at least 8 characters.").max(128),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

async function changePasswordAction(formData: FormData) {
  "use server";

  const session = await requireRole(["PARENT"]);
  const userId = Number(session.user.id);

  const result = changePasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!result.success) {
    redirect("/parent/change-password?error=invalid");
  }

  const user = await db.orm.public.User
    .where((item) => item.id.eq(userId))
    .first();

  if (!user || !user.isActive || !user.mustChangePassword) {
    redirect("/parent/dashboard");
  }

  const passwordHash = await hashPassword(result.data.password);

  await db.orm.public.User
    .where((item) => item.id.eq(userId))
    .update({
      passwordHash,
      mustChangePassword: false,
      sessionVersion: user.sessionVersion + 1,
    });

  // The sessionVersion change invalidates this session.
  // Have the parent sign in again with their new password.
  redirect("/login?passwordChanged=1");
}

export default async function ParentChangePasswordPage() {
  const session = await requireRole(["PARENT"]);
  const userId = Number(session.user.id);

  const user = await db.orm.public.User
    .where((item) => item.id.eq(userId))
    .first();

  if (!user || !user.mustChangePassword) {
    redirect("/parent/dashboard");
  }

  return (
    <main className="mx-auto max-w-md space-y-5 p-6">
      <header>
        <h1 className="text-2xl font-bold">Set your new password</h1>
        <p className="mt-2 text-sm text-slate-600">
          For your account’s security, create a new password before continuing.
          Use at least 8 characters.
        </p>
      </header>

      <form action={changePasswordAction} className="space-y-4">
        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium">
            New password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            maxLength={128}
            autoComplete="new-password"
            className="w-full rounded-md border p-2"
          />
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="mb-1 block text-sm font-medium"
          >
            Confirm new password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            minLength={8}
            maxLength={128}
            autoComplete="new-password"
            className="w-full rounded-md border p-2"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-md bg-blue-600 px-4 py-2 font-semibold text-white"
        >
          Change password
        </button>
      </form>
    </main>
  );
}