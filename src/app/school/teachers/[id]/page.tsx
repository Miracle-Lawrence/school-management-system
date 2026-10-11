import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { hashPassword } from "@/lib/auth/password";
import { requireRole } from "@/lib/auth/authorization";
import { updateTeacher } from "@/lib/services/teacher.service";
import { db } from "@/prisma/db";
import TeacherEditForm from "../teacher-edit-form";
import TeacherPasswordResetForm from "../teacher-password-reset-form";
import type { TeacherPasswordResetState } from "../teacher-password-reset-form";

type TeacherDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

const updateTeacherSchema = z.object({
  employeeId: z.string().trim().min(1).max(50),
  firstName: z.string().trim().min(2).max(50),
  lastName: z.string().trim().min(2).max(50),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  email: z
    .string()
    .trim()
    .email("Enter a valid email address.")
    .transform((email) => email.toLowerCase()),
});

type TeacherEditFormState = {
  error: string | null;
};

export default async function TeacherDetailsPage({
  params,
}: TeacherDetailsPageProps) {
  const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);
  const schoolId = session.user.schoolId;

  if (!schoolId) {
    throw new Error("School context is required.");
  }

  const { id } = await params;
  const teacherId = Number(id);

  if (!Number.isInteger(teacherId) || teacherId <= 0) {
    notFound();
  }

  const teacher = await db.orm.public.Teacher.where((item) =>
    item.id.eq(teacherId),
  ).first();

  if (!teacher || teacher.schoolId !== schoolId) {
    notFound();
  }

  const linkedUser = teacher.userId
    ? await db.orm.public.User.where((item) =>
        item.id.eq(teacher.userId!),
      ).first()
    : null;

  const accountStatus =
    linkedUser &&
    linkedUser.schoolId === schoolId &&
    linkedUser.role === "TEACHER"
      ? linkedUser.isActive
        ? "Active"
        : "Inactive"
      : "Not linked";

  const assignments = await db.orm.public.TeacherAssignment.where((item) =>
    item.teacherId.eq(teacherId),
  ).all();

  const classes = await db.orm.public.SchoolClass.where((item) =>
    item.schoolId.eq(schoolId),
  ).all();

  const subjects = await db.orm.public.Subject.where((item) =>
    item.schoolId.eq(schoolId),
  ).all();

  const classMap = new Map(classes.map((item) => [item.id, item.name]));
  const subjectMap = new Map(subjects.map((item) => [item.id, item.name]));

  async function updateTeacherAction(
    _previousState: TeacherEditFormState,
    formData: FormData,
  ): Promise<TeacherEditFormState> {
    "use server";

    try {
      const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);
      const schoolId = session.user.schoolId;

      if (!schoolId) {
        return { error: "School context is required." };
      }

      const result = updateTeacherSchema.safeParse({
        employeeId: formData.get("employeeId"),
        firstName: formData.get("firstName"),
        lastName: formData.get("lastName"),
        phone: formData.get("phone"),
        email: formData.get("email"),
      });

      if (!result.success) {
        return {
          error:
            result.error.issues[0]?.message ?? "Invalid teacher information.",
        };
      }

      await updateTeacher(schoolId, teacherId, result.data);
    } catch (error) {
      if (error instanceof Error) {
        return { error: error.message };
      }

      return {
        error: "Unable to update the teacher. Please try again.",
      };
    }

    redirect(`/school/teachers/${teacherId}`);
  }

  async function resetTeacherPasswordAction(
    _previousState: TeacherPasswordResetState,
    formData: FormData,
  ): Promise<TeacherPasswordResetState> {
    "use server";

    // Keep authorization outside the ordinary error-handling block.
    const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);
    const schoolId = session.user.schoolId;

    if (!schoolId) {
      return {
        error: "School context is required.",
        success: null,
      };
    }

    const passwordSchema = z
      .string()
      .min(4, "Password must be at least 4 characters.")
      .max(128, "Password is too long.");

    const passwordResult = passwordSchema.safeParse(formData.get("password"));

    if (!passwordResult.success) {
      return {
        error: passwordResult.error.issues[0]?.message ?? "Invalid password.",
        success: null,
      };
    }

    try {
      const teacher = await db.orm.public.Teacher.where((item) =>
        item.id.eq(teacherId),
      ).first();

      if (!teacher || teacher.schoolId !== schoolId) {
        return {
          error: "Teacher not found in your school.",
          success: null,
        };
      }

      if (!teacher.email?.trim()) {
        return {
          error:
            "This teacher has no email address. Edit the teacher profile and add an email before resetting the password.",
          success: null,
        };
      }

      const email = teacher.email.trim().toLowerCase();
      const passwordHash = await hashPassword(passwordResult.data);

      // Case 1: The teacher already has a linked login account.
      if (teacher.userId) {
        const user = await db.orm.public.User.where((item) =>
          item.id.eq(teacher.userId!),
        ).first();

        if (!user || user.schoolId !== schoolId || user.role !== "TEACHER") {
          return {
            error:
              "The linked teacher login account could not be verified. Please contact support.",
            success: null,
          };
        }

        await db.orm.public.User.where((item) => item.id.eq(user.id)).update({
          passwordHash,
          sessionVersion: user.sessionVersion + 1,
        });
      } else {
        // Case 2: Legacy teacher without a linked login account.
        const existingUser = await db.orm.public.User.where((item) =>
          item.email.eq(email),
        ).first();

        let userId: number;

        if (existingUser) {
          // Never attach an account belonging to another school or role.
          if (
            existingUser.schoolId !== schoolId ||
            existingUser.role !== "TEACHER"
          ) {
            return {
              error:
                "This email is already associated with another account. Update the teacher's email before continuing.",
              success: null,
            };
          }

          // Ensure the login account is not linked to another teacher.
          const linkedTeacher = await db.orm.public.Teacher.where((item) =>
            item.userId.eq(existingUser.id),
          ).first();

          if (linkedTeacher) {
            return {
              error: "This login account is already linked to another teacher.",
              success: null,
            };
          }

          await db.orm.public.User.where((item) =>
            item.id.eq(existingUser.id),
          ).update({
            passwordHash,
            name: `${teacher.firstName} ${teacher.lastName}`,
            phone: teacher.phone ?? null,
            isActive: true,
            sessionVersion: existingUser.sessionVersion + 1,
          });

          userId = existingUser.id;
        } else {
          // Create a login account for the legacy teacher.
          const newUser = await db.orm.public.User.create({
            schoolId,
            email,
            passwordHash,
            name: `${teacher.firstName} ${teacher.lastName}`,
            phone: teacher.phone ?? null,
            role: "TEACHER",
            isActive: true,
          });

          userId = newUser.id;
        }

        // Link the existing teacher profile to the login account.
        await db.orm.public.Teacher.where((item) =>
          item.id.eq(teacherId),
        ).update({
          userId,
          email,
        });
      }

      return {
        error: null,
        success: "Teacher password reset successfully.",
      };
    } catch (error) {
      console.error("Teacher password reset failed:", error);

      return {
        error: "Unable to reset the teacher password. Please try again.",
        success: null,
      };
    }
  }

  const fullName = `${teacher.firstName} ${teacher.lastName}`;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-2 sm:px-4">
      {/* Header */}
      <div>
        <Link
          href="/school/teachers"
          className="text-sm font-medium text-blue-600 transition hover:text-blue-700"
        >
          &larr; Back to Teachers
        </Link>

        <div className="mt-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-50 text-lg font-bold text-blue-600">
                {teacher.firstName.charAt(0)}
                {teacher.lastName.charAt(0)}
              </div>

              <div>
                <p className="text-sm font-semibold text-blue-600">
                  Teacher Profile
                </p>

                <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                  {fullName}
                </h1>

                <p className="mt-1 text-sm text-slate-600">
                  Employee ID{" "}
                  <span className="font-semibold text-slate-800">
                    {teacher.employeeId}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Information and assignments */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="font-semibold text-slate-900">
              Teacher Information
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              Personal and contact information.
            </p>
          </div>

          <dl className="grid gap-5 px-6 py-6 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Employee ID
              </dt>
              <dd className="mt-1 font-medium text-slate-900">
                {teacher.employeeId}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                First Name
              </dt>
              <dd className="mt-1 font-medium text-slate-900">
                {teacher.firstName}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Last Name
              </dt>
              <dd className="mt-1 font-medium text-slate-900">
                {teacher.lastName}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Email
              </dt>
              <dd className="mt-1 break-words text-slate-700">
                {teacher.email ?? "—"}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Phone
              </dt>
              <dd className="mt-1 text-slate-700">{teacher.phone ?? "—"}</dd>
            </div>

            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Login Account
              </dt>

              <dd className="mt-2">
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                    accountStatus === "Active"
                      ? "bg-green-100 text-green-700"
                      : accountStatus === "Inactive"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {accountStatus}
                </span>
              </dd>

              {linkedUser && accountStatus !== "Not linked" && (
                <p className="mt-2 break-words text-sm text-slate-500">
                  Login email: {linkedUser.email}
                </p>
              )}
            </div>
          </dl>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="font-semibold text-slate-900">
              Teaching Assignments
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              Classes and subjects assigned to this teacher.
            </p>
          </div>

          <div className="px-6 py-6">
            {assignments.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center">
                <p className="font-medium text-slate-800">
                  No teaching assignments yet
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Assign this teacher to classes and subjects to see them here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {assignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                  >
                    <p className="font-semibold text-slate-900">
                      {classMap.get(assignment.classId) ?? "Unknown Class"}
                    </p>

                    <p className="mt-1 text-sm text-slate-600">
                      Subject:{" "}
                      <span className="font-medium text-slate-800">
                        {subjectMap.get(assignment.subjectId) ??
                          "Unknown Subject"}
                      </span>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Edit teacher information */}
      <details className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <summary className="cursor-pointer px-6 py-5 font-semibold text-slate-900 transition hover:bg-slate-50 sm:px-8">
          Edit Teacher Information
        </summary>

        <TeacherEditForm
          action={updateTeacherAction}
          employeeId={teacher.employeeId}
          firstName={teacher.firstName}
          lastName={teacher.lastName}
          email={teacher.email ?? ""}
          phone={teacher.phone ?? ""}
        />
      </details>

      {/* Password management */}
      <details className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <summary className="cursor-pointer px-6 py-5 font-semibold text-slate-900 transition hover:bg-slate-50 sm:px-8">
          Reset Teacher Password
        </summary>

        <TeacherPasswordResetForm action={resetTeacherPasswordAction} />
      </details>
    </div>
  );
}
