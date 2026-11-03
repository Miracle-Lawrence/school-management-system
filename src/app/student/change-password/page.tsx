import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { ChangePasswordForm } from "@/components/auth/change-password-form";

import { requireRole } from "@/lib/auth/authorization";
import { hashPassword } from "@/lib/auth/password";
import { db } from "@/prisma/db";

const changePasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Use at least 8 characters.")
      .max(128, "Password must not exceed 128 characters."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

async function changePasswordAction(formData: FormData): Promise<{ success: boolean; error?: string }> {
  "use server";

  const session = await requireRole(["STUDENT"]);
  const userId = Number(session.user.id);

  const result = changePasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!result.success) {
    return { success: false, error: "The passwords must match and contain between 8 and 128 characters." };
  }

  const user = await db.orm.public.User
    .where((item) => item.id.eq(userId))
    .first();

  if (!user || !user.isActive || !user.mustChangePassword) {
    redirect("/student/dashboard");
  }

  const passwordHash = await hashPassword(result.data.password);

  await db.orm.public.User
    .where((item) => item.id.eq(userId))
    .update({
      passwordHash,
      mustChangePassword: false,
      sessionVersion: user.sessionVersion + 1,
    });
  return { success: true };
}

export default async function StudentChangePasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await requireRole(["STUDENT"]);
  const userId = Number(session.user.id);

  const user = await db.orm.public.User
    .where((item) => item.id.eq(userId))
    .first();

  if (!user || !user.isActive) {
    redirect("/login");
  }

  if (!user.mustChangePassword) {
    redirect("/student/dashboard");
  }

  const params = await searchParams;

  return (
    <main className="mx-auto max-w-md space-y-6 px-4 py-10">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">
          Set Your New Password
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          Before accessing your student portal, create a new password.
          Use at least 8 characters and choose a password you have not
          used elsewhere.
        </p>
      </header>

      {params.error === "invalid" && (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          The passwords must match and contain between 8 and 128 characters.
          Please try again.
        </p>
      )}

      <ChangePasswordForm action={changePasswordAction} variant="student" />
    </main>
  );
}
