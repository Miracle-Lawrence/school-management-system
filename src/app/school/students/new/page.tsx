import Link from "next/link";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/authorization";
import { db } from "@/prisma/db";
import { createStudent } from "@/lib/services/student.service";
import { createStudentSchema } from "@/lib/validation/student";

export default async function NewStudentPage() {
  const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);

  const schoolId = session.user.schoolId;

  if (!schoolId) {
    throw new Error("School context is required.");
  }

  const classes = await db.orm.public.SchoolClass.where((schoolClass) =>
    schoolClass.schoolId.eq(schoolId),
  ).all();

  async function createStudentAction(formData: FormData) {
    "use server";

    const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);

    const schoolId = session.user.schoolId;

    if (!schoolId) {
      throw new Error("School context is required.");
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
      throw new Error(
        result.error.issues[0]?.message ?? "Invalid student information.",
      );
    }

    const classId = result.data.classId
      ? Number(result.data.classId)
      : undefined;

    await createStudent(schoolId, {
      ...result.data,
      classId,
    });

    redirect("/school/students");
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Add Student</h1>

        <p className="mt-1 text-sm text-gray-500">
          Add a new student to your school.
        </p>
      </div>

      <form
        action={createStudentAction}
        className="space-y-6 rounded-lg border bg-white p-6"
      >
        <div>
          <label
            htmlFor="admissionNumber"
            className="mb-2 block text-sm font-medium"
          >
            Admission Number
          </label>

          <input
            id="admissionNumber"
            name="admissionNumber"
            type="text"
            required
            placeholder="e.g. STU-002"
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label
              htmlFor="firstName"
              className="mb-2 block text-sm font-medium"
            >
              First Name
            </label>

            <input
              id="firstName"
              name="firstName"
              type="text"
              required
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="lastName"
              className="mb-2 block text-sm font-medium"
            >
              Last Name
            </label>

            <input
              id="lastName"
              name="lastName"
              type="text"
              required
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="middleName"
            className="mb-2 block text-sm font-medium"
          >
            Middle Name
          </label>

          <input
            id="middleName"
            name="middleName"
            type="text"
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="gender" className="mb-2 block text-sm font-medium">
              Gender
            </label>

            <select
              id="gender"
              name="gender"
              required
              className="w-full rounded-md border px-3 py-2 text-sm"
            >
              <option value="">Select gender</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="dateOfBirth"
              className="mb-2 block text-sm font-medium"
            >
              Date of Birth
            </label>

            <input
              id="dateOfBirth"
              name="dateOfBirth"
              type="date"
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label htmlFor="classId" className="mb-2 block text-sm font-medium">
            Class
          </label>

          <select
            id="classId"
            name="classId"
            className="w-full rounded-md border px-3 py-2 text-sm"
          >
            <option value="">Not assigned</option>

            {classes.map((schoolClass) => (
              <option key={schoolClass.id} value={schoolClass.id}>
                {schoolClass.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-medium">
            Email
          </label>

          <input
            id="email"
            name="email"
            type="email"
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="phone" className="mb-2 block text-sm font-medium">
            Phone
          </label>

          <input
            id="phone"
            name="phone"
            type="tel"
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="address" className="mb-2 block text-sm font-medium">
            Address
          </label>

          <textarea
            id="address"
            name="address"
            rows={3}
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            Create Student
          </button>

          <Link
            href="/school/students"
            className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
