import Link from "next/link";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/authorization";
import { createStudent } from "@/lib/services/student.service";
import { createStudentSchema } from "@/lib/validation/student";
import { db } from "@/prisma/db";

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

  const data = result.data;

  await createStudent(schoolId, {
    admissionNumber: data.admissionNumber,
    firstName: data.firstName,
    middleName: data.middleName || undefined,
    lastName: data.lastName,
    gender: data.gender,
    dateOfBirth: data.dateOfBirth || undefined,
    email: data.email || undefined,
    phone: data.phone || undefined,
    address: data.address || undefined,
    classId: data.classId ? Number(data.classId) : undefined,
  });

  redirect("/school/students");
}

export default async function NewStudentPage() {
  const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);

  const schoolId = session.user.schoolId;

  if (!schoolId) {
    throw new Error("School context is required.");
  }

  const classes = await db.orm.public.SchoolClass.where((schoolClass) =>
    schoolClass.schoolId.eq(schoolId),
  ).all();

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <Link
          href="/school/students"
          className="text-sm text-gray-500 hover:text-black"
        >
          ← Back to Students
        </Link>

        <h1 className="mt-4 text-2xl font-bold">Add Student</h1>

        <p className="mt-1 text-sm text-gray-500">
          Add a new student to your school.
        </p>
      </div>

      <form
        action={createStudentAction}
        className="space-y-6 rounded-lg border bg-white p-6"
      >
        <div>
          <h2 className="text-lg font-semibold">Student Information</h2>

          <p className="mt-1 text-sm text-gray-500">
            Enter the student's basic information.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
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
              placeholder="STU-001"
              className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2"
            />
          </div>

          <div>
            <label htmlFor="gender" className="mb-2 block text-sm font-medium">
              Gender
            </label>

            <select
              id="gender"
              name="gender"
              required
              defaultValue=""
              className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2"
            >
              <option value="" disabled>
                Select gender
              </option>

              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
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
              placeholder="John"
              className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2"
            />
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
              placeholder="Michael"
              className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2"
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
              placeholder="Doe"
              className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
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
              className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2"
            />
          </div>

          <div>
            <label htmlFor="classId" className="mb-2 block text-sm font-medium">
              Class
            </label>

            <select
              id="classId"
              name="classId"
              defaultValue=""
              className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2"
            >
              <option value="">Not assigned</option>

              {classes.map((schoolClass) => (
                <option key={schoolClass.id} value={schoolClass.id}>
                  {schoolClass.name}
                </option>
              ))}
            </select>

            {classes.length === 0 && (
              <p className="mt-1 text-xs text-gray-500">
                No classes have been created yet.
              </p>
            )}
          </div>
        </div>

        <div className="border-t pt-6">
          <h2 className="text-lg font-semibold">Contact Information</h2>

          <p className="mt-1 text-sm text-gray-500">
            Optional contact details for the student.
          </p>
        </div>

        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-medium">
            Email
          </label>

          <input
            id="email"
            name="email"
            type="email"
            placeholder="student@example.com"
            className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2"
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
            placeholder="08012345678"
            className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2"
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
            placeholder="Student address"
            className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2"
          />
        </div>

        <div className="flex justify-end gap-3 border-t pt-6">
          <Link
            href="/school/students"
            className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            Create Student
          </button>
        </div>
      </form>
    </div>
  );
}
