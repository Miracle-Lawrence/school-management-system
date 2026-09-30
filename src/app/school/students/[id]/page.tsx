import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/authorization";
import { db } from "@/prisma/db";
import { assignStudentToClass } from "@/lib/services/student-class.service";
import { updateStudent } from "@/lib/services/student.service";
import { createStudentSchema } from "@/lib/validation/student";

type StudentDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function StudentDetailsPage({
  params,
}: StudentDetailsPageProps) {
  const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);

  const schoolId = session.user.schoolId;

  if (!schoolId) {
    throw new Error("School context is required.");
  }

  const { id } = await params;
  const studentId = Number(id);

  if (!Number.isInteger(studentId)) {
    notFound();
  }

  const student = await db.orm.public.Student.where((student) =>
    student.id.eq(studentId),
  ).first();

  if (!student || student.schoolId !== schoolId) {
    notFound();
  }

  const classes = await db.orm.public.SchoolClass.where((schoolClass) =>
    schoolClass.schoolId.eq(schoolId),
  ).all();

  const currentClass = student.classId
    ? classes.find((schoolClass) => schoolClass.id === student.classId)
    : undefined;

  async function assignClassAction(formData: FormData) {
    "use server";

    const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);

    const schoolId = session.user.schoolId;

    if (!schoolId) {
      throw new Error("School context is required.");
    }

    const classId = Number(formData.get("classId"));

    if (!Number.isInteger(classId)) {
      throw new Error("Invalid class.");
    }

    await assignStudentToClass(schoolId, studentId, classId);

    redirect(`/school/students/${studentId}`);
  }

  async function updateStudentAction(formData: FormData) {
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
      classId: "",
    });

    if (!result.success) {
      throw new Error(
        result.error.issues[0]?.message || "Invalid student information.",
      );
    }

    await updateStudent(schoolId, studentId, result.data);

    redirect(`/school/students/${studentId}`);
  }

  const dateOfBirth = student.dateOfBirth
    ? student.dateOfBirth.toString().slice(0, 10)
    : "";

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <Link
          href="/school/students"
          className="text-sm text-gray-600 hover:underline"
        >
          ← Back to Students
        </Link>

        <div className="mt-4">
          <h1 className="text-2xl font-bold">
            {student.firstName}{" "}
            {student.middleName ? `${student.middleName} ` : ""}
            {student.lastName}
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Student details and class assignment.
          </p>

          <Link
            href={`/school/students/${student.id}/attendance`}
            className="mt-4 inline-block text-sm font-medium text-blue-600 hover:underline"
          >
            View Attendance →
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border bg-white p-6">
          <h2 className="font-semibold">Student Information</h2>

          <dl className="mt-4 space-y-4 text-sm">
            <div>
              <dt className="text-gray-500">Admission Number</dt>

              <dd className="mt-1 font-medium">{student.admissionNumber}</dd>
            </div>

            <div>
              <dt className="text-gray-500">Gender</dt>

              <dd className="mt-1 font-medium">{student.gender}</dd>
            </div>

            <div>
              <dt className="text-gray-500">Date of Birth</dt>

              <dd className="mt-1 font-medium">{dateOfBirth || "—"}</dd>
            </div>

            <div>
              <dt className="text-gray-500">Email</dt>

              <dd className="mt-1 font-medium">{student.email || "—"}</dd>
            </div>

            <div>
              <dt className="text-gray-500">Phone</dt>

              <dd className="mt-1 font-medium">{student.phone || "—"}</dd>
            </div>

            <div>
              <dt className="text-gray-500">Address</dt>

              <dd className="mt-1 font-medium">{student.address || "—"}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-lg border bg-white p-6">
          <h2 className="font-semibold">Class Assignment</h2>

          <p className="mt-2 text-sm text-gray-500">
            Current class:{" "}
            <span className="font-medium text-gray-900">
              {currentClass?.name || "Not assigned"}
            </span>
          </p>

          {classes.length === 0 ? (
            <p className="mt-6 text-sm text-gray-500">
              No classes have been created yet.
            </p>
          ) : (
            <form action={assignClassAction} className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="classId"
                  className="mb-2 block text-sm font-medium"
                >
                  Assign Class
                </label>

                <select
                  id="classId"
                  name="classId"
                  defaultValue={student.classId ? String(student.classId) : ""}
                  required
                  className="w-full rounded-md border px-3 py-2"
                >
                  <option value="">Select a class</option>

                  {classes.map((schoolClass) => (
                    <option key={schoolClass.id} value={schoolClass.id}>
                      {schoolClass.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
              >
                {student.classId ? "Change Class" : "Assign Class"}
              </button>
            </form>
          )}
        </div>
      </div>

      <details className="rounded-lg border bg-white">
        <summary className="cursor-pointer px-6 py-4 font-semibold">
          Edit Student Information
        </summary>

        <form action={updateStudentAction} className="space-y-6 border-t p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="admissionNumber"
                className="block text-sm font-medium"
              >
                Admission Number
              </label>

              <input
                id="admissionNumber"
                name="admissionNumber"
                defaultValue={student.admissionNumber}
                required
                className="mt-2 w-full rounded-md border px-3 py-2"
              />
            </div>

            <div>
              <label htmlFor="gender" className="block text-sm font-medium">
                Gender
              </label>

              <select
                id="gender"
                name="gender"
                defaultValue={student.gender}
                required
                className="mt-2 w-full rounded-md border px-3 py-2"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
            </div>

            <div>
              <label htmlFor="firstName" className="block text-sm font-medium">
                First Name
              </label>

              <input
                id="firstName"
                name="firstName"
                defaultValue={student.firstName}
                required
                className="mt-2 w-full rounded-md border px-3 py-2"
              />
            </div>

            <div>
              <label htmlFor="middleName" className="block text-sm font-medium">
                Middle Name
              </label>

              <input
                id="middleName"
                name="middleName"
                defaultValue={student.middleName || ""}
                className="mt-2 w-full rounded-md border px-3 py-2"
              />
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium">
                Last Name
              </label>

              <input
                id="lastName"
                name="lastName"
                defaultValue={student.lastName}
                required
                className="mt-2 w-full rounded-md border px-3 py-2"
              />
            </div>

            <div>
              <label
                htmlFor="dateOfBirth"
                className="block text-sm font-medium"
              >
                Date of Birth
              </label>

              <input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                defaultValue={dateOfBirth}
                className="mt-2 w-full rounded-md border px-3 py-2"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium">
                Email
              </label>

              <input
                id="email"
                name="email"
                type="email"
                defaultValue={student.email || ""}
                className="mt-2 w-full rounded-md border px-3 py-2"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium">
                Phone
              </label>

              <input
                id="phone"
                name="phone"
                defaultValue={student.phone || ""}
                className="mt-2 w-full rounded-md border px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-medium">
              Address
            </label>

            <textarea
              id="address"
              name="address"
              defaultValue={student.address || ""}
              rows={3}
              className="mt-2 w-full rounded-md border px-3 py-2"
            />
          </div>

          <button
            type="submit"
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            Save Changes
          </button>
        </form>
      </details>
    </div>
  );
}
