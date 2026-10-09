import Link from "next/link";
import { redirect } from "next/navigation";

import TeacherForm from "../teacher-form";
import { requireRole } from "@/lib/auth/authorization";
import { createTeacher } from "@/lib/services/teacher.service";
import { createTeacherSchema } from "@/lib/validation/teacher";

type TeacherFormState = {
  error: string | null;
};

export default function NewTeacherPage() {
  async function createTeacherAction(
    _previousState: TeacherFormState,
    formData: FormData,
  ): Promise<TeacherFormState> {
    "use server";

    try {
      const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);

      const schoolId = session.user.schoolId;

      if (!schoolId) {
        return {
          error: "School context is required.",
        };
      }

      const result = createTeacherSchema.safeParse({
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

      try {
        await createTeacher(schoolId, result.data);
      } catch (error) {
        if (error instanceof Error) {
          return {
            error: error.message,
          };
        }

        return {
          error: "Unable to create the teacher.",
        };
      }
    } catch (error) {
      if (error instanceof Error) {
        return {
          error: error.message,
        };
      }

      return {
        error: "Something went wrong. Please try again.",
      };
    }

    redirect("/school/teachers");
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-2 sm:px-4">
      {/* Header */}
      <div>
        <Link
          href="/school/teachers"
          className="text-sm font-medium text-blue-600 transition hover:text-blue-700"
        >
          ← Back to Teachers
        </Link>

        <div className="mt-5">
          <p className="text-sm font-semibold text-blue-600">
            Staff Management
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Add Teacher
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Add a teacher to your school's staff records.
          </p>
        </div>
      </div>

      <TeacherForm action={createTeacherAction} />
    </div>
  );
}
