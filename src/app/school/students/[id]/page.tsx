import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/authorization";
import { assignStudentToClass } from "@/lib/services/student-class.service";
import { updateStudent } from "@/lib/services/student.service";
import { db } from "@/prisma/db";
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

  const fullName = `${student.firstName} ${
    student.middleName ? `${student.middleName} ` : ""
  }${student.lastName}`;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-2 sm:px-4">
      {/* Header */}
      <div>
        <Link
          href="/school/students"
          className="text-sm font-medium text-blue-600 transition hover:text-blue-700"
        >
          ← Back to Students
        </Link>

        <div className="mt-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-50 text-lg font-bold text-blue-600">
                {student.firstName.charAt(0)}
                {student.lastName.charAt(0)}
              </div>

              <div>
                <p className="text-sm font-semibold text-blue-600">
                  Student Profile
                </p>

                <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                  {fullName}
                </h1>

                <p className="mt-1 text-sm text-slate-600">
                  Admission No.{" "}
                  <span className="font-semibold text-slate-800">
                    {student.admissionNumber}
                  </span>
                </p>
              </div>
            </div>

            <Link
              href={`/school/students/${student.id}/attendance`}
              className="inline-flex w-fit items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              View Attendance →
            </Link>
          </div>
        </div>
      </div>

      {/* Student information and class assignment */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Student information */}
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="font-semibold text-slate-900">
              Student Information
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              Personal and contact information.
            </p>
          </div>

          <dl className="grid gap-5 px-6 py-6 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Admission Number
              </dt>

              <dd className="mt-1 font-semibold text-slate-900">
                {student.admissionNumber}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Gender
              </dt>

              <dd className="mt-1 font-medium text-slate-800">
                {student.gender}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Date of Birth
              </dt>

              <dd className="mt-1 font-medium text-slate-800">
                {dateOfBirth || "—"}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Email
              </dt>

              <dd className="mt-1 break-words font-medium text-slate-800">
                {student.email || "—"}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Phone
              </dt>

              <dd className="mt-1 font-medium text-slate-800">
                {student.phone || "—"}
              </dd>
            </div>

            <div className="sm:col-span-2">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Address
              </dt>

              <dd className="mt-1 font-medium text-slate-800">
                {student.address || "—"}
              </dd>
            </div>
          </dl>
        </section>

        {/* Class assignment */}
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="font-semibold text-slate-900">Class Assignment</h2>

            <p className="mt-1 text-sm text-slate-600">
              Manage the student's current class.
            </p>
          </div>

          <div className="px-6 py-6">
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Current Class
              </p>

              <p className="mt-2 text-lg font-bold text-slate-900">
                {currentClass?.name || "Not assigned"}
              </p>
            </div>

            {classes.length === 0 ? (
              <p className="mt-6 text-sm text-slate-600">
                No classes have been created yet.
              </p>
            ) : (
              <form action={assignClassAction} className="mt-6 space-y-4">
                <div>
                  <label
                    htmlFor="classId"
                    className="block text-sm font-semibold text-slate-800"
                  >
                    Assign Class
                  </label>

                  <select
                    id="classId"
                    name="classId"
                    defaultValue={
                      student.classId ? String(student.classId) : ""
                    }
                    required
                    className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                  className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  {student.classId ? "Change Class" : "Assign Class"}
                </button>
              </form>
            )}
          </div>
        </section>
      </div>

      {/* Edit student */}
      <details className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <summary className="cursor-pointer px-6 py-5 text-sm font-semibold text-slate-900 transition hover:bg-slate-50 sm:px-8">
          Edit Student Information
        </summary>

        <form
          action={updateStudentAction}
          className="space-y-6 border-t border-slate-200 px-6 py-6 sm:px-8"
        >
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Personal Information
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              Update the student's basic information.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="admissionNumber"
                className="block text-sm font-semibold text-slate-800"
              >
                Admission Number
              </label>

              <input
                id="admissionNumber"
                name="admissionNumber"
                defaultValue={student.admissionNumber}
                required
                className="mt-2 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="gender"
                className="block text-sm font-semibold text-slate-800"
              >
                Gender
              </label>

              <select
                id="gender"
                name="gender"
                defaultValue={student.gender}
                required
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="firstName"
                className="block text-sm font-semibold text-slate-800"
              >
                First Name
              </label>

              <input
                id="firstName"
                name="firstName"
                defaultValue={student.firstName}
                required
                className="mt-2 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="middleName"
                className="block text-sm font-semibold text-slate-800"
              >
                Middle Name
              </label>

              <input
                id="middleName"
                name="middleName"
                defaultValue={student.middleName || ""}
                className="mt-2 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="lastName"
                className="block text-sm font-semibold text-slate-800"
              >
                Last Name
              </label>

              <input
                id="lastName"
                name="lastName"
                defaultValue={student.lastName}
                required
                className="mt-2 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="dateOfBirth"
                className="block text-sm font-semibold text-slate-800"
              >
                Date of Birth
              </label>

              <input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                defaultValue={dateOfBirth}
                className="mt-2 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-slate-800"
              >
                Email
              </label>

              <input
                id="email"
                name="email"
                type="email"
                defaultValue={student.email || ""}
                className="mt-2 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-semibold text-slate-800"
              >
                Phone
              </label>

              <input
                id="phone"
                name="phone"
                defaultValue={student.phone || ""}
                className="mt-2 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="address"
              className="block text-sm font-semibold text-slate-800"
            >
              Address
            </label>

            <textarea
              id="address"
              name="address"
              defaultValue={student.address || ""}
              rows={3}
              className="mt-2 w-full resize-y rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="flex justify-end border-t border-slate-200 pt-5">
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              Save Changes
            </button>
          </div>
        </form>
      </details>
    </div>
  );
}
