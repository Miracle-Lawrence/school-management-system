import Link from "next/link";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/authorization";
import { promoteStudents } from "@/lib/services/student-class.service";
import { db } from "@/prisma/db";

import PromotionForm from "./promotion-form";

type PromotionFormState = {
  error: string | null;
};

type StudentPromotionPageProps = {
  searchParams: Promise<{
    success?: string;
  }>;
};

export default async function StudentPromotionPage({
  searchParams,
}: StudentPromotionPageProps) {
  const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);

  const schoolId = session.user.schoolId;

  if (!schoolId) {
    throw new Error("School context is required.");
  }

  const classes = await db.orm.public.SchoolClass.where((schoolClass) =>
    schoolClass.schoolId.eq(schoolId),
    ).all();
    
    const { success } = await searchParams;

  async function promoteStudentsAction(
    _previousState: PromotionFormState,
    formData: FormData,
  ): Promise<PromotionFormState> {
    "use server";

    const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);

    const schoolId = session.user.schoolId;

    if (!schoolId) {
      return {
        error: "School context is required.",
      };
    }

    const fromClassId = Number(formData.get("fromClassId"));
    const toClassId = Number(formData.get("toClassId"));

    const studentIds = formData
      .getAll("studentIds")
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value));

    if (!Number.isInteger(fromClassId)) {
      return {
        error: "Please select the current class.",
      };
    }

    if (!Number.isInteger(toClassId)) {
      return {
        error: "Please select the destination class.",
      };
    }

    if (studentIds.length === 0) {
      return {
        error: "Please select at least one student to promote.",
      };
    }

    let result;

    try {
      result = await promoteStudents(
        schoolId,
        studentIds,
        fromClassId,
        toClassId,
      );
    } catch (error) {
      if (error instanceof Error) {
        return {
          error: error.message,
        };
      }

      return {
        error: "Unable to promote the selected students.",
      };
    }

    redirect(
      `/school/students/promote?success=${encodeURIComponent(
        `${result.count} student${
          result.count === 1 ? "" : "s"
        } promoted successfully from ${result.fromClass} to ${result.toClass}.`,
      )}`,
    );
  }


  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-2 sm:px-4">
      <div>
        <Link
          href="/school/students"
          className="text-sm font-medium text-blue-600 transition hover:text-blue-700"
        >
          ← Back to Students
        </Link>

        <div className="mt-5">
          <p className="text-sm font-semibold text-blue-600">
            Student Management
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Bulk Class Promotion
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Select students from a class and move them to another class in bulk.
          </p>
        </div>
      </div>

      <PromotionForm
        action={promoteStudentsAction}
        classes={classes.map((schoolClass) => ({
          id: schoolClass.id,
          name: schoolClass.name,
        }))}
        successMessage={success ?? null}
      />
    </div>
  );
}
