import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import AcademicSessionForm from "../../academic-session-form";
import { requireRole } from "@/lib/auth/authorization";
import { updateAcademicSession } from "@/lib/services/academic-session.service";
import { db } from "@/prisma/db";
import { academicSessionSchema } from "@/lib/validation/academic-session";

type AcademicSessionFormState = {
  error: string | null;
};

type EditAcademicSessionPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditAcademicSessionPage({
  params,
}: EditAcademicSessionPageProps) {
  const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);

  const schoolId = session.user.schoolId;

  if (!schoolId) {
    throw new Error("School context is required.");
  }

  const { id } = await params;
  const sessionId = Number(id);

  if (!Number.isInteger(sessionId)) {
    notFound();
  }

  const academicSession = await db.orm.public.AcademicSession.where(
    (academicSession) => academicSession.id.eq(sessionId),
  ).first();

  if (!academicSession || academicSession.schoolId !== schoolId) {
    notFound();
  }

  async function updateAcademicSessionAction(
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
        await updateAcademicSession(schoolId, sessionId, result.data);
      } catch (error) {
        if (error instanceof Error) {
          return {
            error: error.message,
          };
        }

        return {
          error: "Unable to update the academic session.",
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

    redirect(`/school/academic-sessions/${sessionId}`);
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-2 sm:px-4">
      {/* Header */}
      <div>
        <Link
          href={`/school/academic-sessions/${sessionId}`}
          className="text-sm font-medium text-blue-600 transition hover:text-blue-700"
        >
          ← Back to Academic Session
        </Link>

        <div className="mt-5">
          <p className="text-sm font-semibold text-blue-600">
            Academic Management
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Edit Academic Session
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Update the academic session name and dates.
          </p>
        </div>
      </div>

      <AcademicSessionForm
        action={updateAcademicSessionAction}
        initialName={academicSession.name}
        initialStartDate={academicSession.startDate.toString().slice(0, 10)}
        initialEndDate={academicSession.endDate.toString().slice(0, 10)}
        cancelHref={`/school/academic-sessions/${sessionId}`}
        submitLabel="Save Changes"
      />
    </div>
  );
}
