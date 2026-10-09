import Link from "next/link";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/authorization";
import { createAcademicSession } from "@/lib/services/academic-session.service";
import AcademicSessionForm from "../academic-session-form";
import { academicSessionSchema } from "@/lib/validation/academic-session";

type AcademicSessionFormState = {
  error: string | null;
};

export default function NewAcademicSessionPage() {
  async function createAcademicSessionAction(
    _previousState: AcademicSessionFormState,
    formData: FormData,
  ): Promise<AcademicSessionFormState> {
    "use server";

    try {
      const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);

      const schoolId = session.user.schoolId;

      if (!schoolId) {
        return {
          error: "School context is required.",
        };
      }

      const result = academicSessionSchema.safeParse({
        name: formData.get("name"),
        startDate: formData.get("startDate"),
        endDate: formData.get("endDate"),
      });

      if (!result.success) {
        return {
          error:
            result.error.issues[0]?.message ??
            "Invalid academic session information.",
        };
      }

      try {
        await createAcademicSession(schoolId, result.data);
      } catch (error) {
        if (
          error instanceof Error &&
          error.message === "An academic session with this name already exists."
        ) {
          return {
            error: error.message,
          };
        }

        throw error;
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

    redirect("/school/academic-sessions");
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-2 sm:px-4">
      {/* Header */}
      <div>
        <Link
          href="/school/academic-sessions"
          className="text-sm font-medium text-blue-600 transition hover:text-blue-700"
        >
          ← Back to Academic Sessions
        </Link>

        <div className="mt-5">
          <p className="text-sm font-semibold text-blue-600">
            Academic Management
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Add Academic Session
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Create a new academic session for your school.
          </p>
        </div>
      </div>

      <AcademicSessionForm
        action={createAcademicSessionAction}
        cancelHref="/school/academic-sessions"
        submitLabel="Create Session"
      />
    </div>
  );
}
