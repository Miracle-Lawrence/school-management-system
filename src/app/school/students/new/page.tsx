import Link from "next/link";
import { redirect } from "next/navigation";

import StudentForm from "../student-form";
import { requireRole } from "@/lib/auth/authorization";
import {
  createStudent,
  updateStudentPhoto,
} from "@/lib/services/student.service";
import { saveStudentPhoto } from "@/lib/utils/file-upload";
import { db } from "@/prisma/db";
import { createStudentSchema } from "@/lib/validation/student";

type StudentFormState = {
  error: string | null;
};

export default async function NewStudentPage() {
  const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);

  const schoolId = session.user.schoolId;

  if (!schoolId) {
    throw new Error("School context is required.");
  }

  const classes = await db.orm.public.SchoolClass.where((schoolClass) =>
    schoolClass.schoolId.eq(schoolId),
  ).all();

  async function createStudentAction(
    _previousState: StudentFormState,
    formData: FormData,
  ): Promise<StudentFormState> {
    "use server";

    try {
      const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);

      const schoolId = session.user.schoolId;

      if (!schoolId) {
        return {
          error: "School context is required.",
        };
      }

      const result = createStudentSchema.safeParse({
        admissionNumber: formData.get("admissionNumber"),
        firstName: formData.get("firstName"),
        middleName: formData.get("middleName"),
        lastName: formData.get("lastName"),
        gender: formData.get("gender"),
        dateOfBirth: formData.get("dateOfBirth"),
        email: formData.get("email"),
        phone: formData.get("phone"),
        address: formData.get("address"),
        classId: formData.get("classId"),
      });

      if (!result.success) {
        return {
          error:
            result.error.issues[0]?.message ?? "Invalid student information.",
        };
      }

      const classId = result.data.classId
        ? Number(result.data.classId)
        : undefined;

      let student;

      try {
        student = await createStudent(schoolId, {
          ...result.data,
          classId,
        });
      } catch (error) {
        if (error instanceof Error) {
          return {
            error: error.message,
          };
        }

        return {
          error: "Unable to create the student.",
        };
      }

      const photo = formData.get("photo");

      if (photo instanceof File && photo.size > 0) {
        try {
          const photoUrl = await saveStudentPhoto(photo, schoolId, student.id);

          await updateStudentPhoto(schoolId, student.id, photoUrl);
        } catch (error) {
          if (error instanceof Error) {
            return {
              error: error.message,
            };
          }

          return {
            error: "Unable to save the student's photograph.",
          };
        }
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

    redirect("/school/students");
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-2 sm:px-4">
      {/* Page heading */}
      <div>
        <Link
          href="/school/students"
          className="text-sm font-medium text-blue-600 transition hover:text-blue-700"
        >
          ← Back to Students
        </Link>

        <div className="mt-4">
          <p className="text-sm font-semibold text-blue-600">
            Student Management
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Add Student
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Create a new student record and optionally assign the student to a
            class.
          </p>
        </div>
      </div>

      <StudentForm
        action={createStudentAction}
        classes={classes.map((schoolClass) => ({
          id: schoolClass.id,
          name: schoolClass.name,
        }))}
      />
    </div>
  );
}
