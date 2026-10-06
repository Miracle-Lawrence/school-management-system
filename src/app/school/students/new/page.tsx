import Link from "next/link";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/authorization";
import {
  createStudent,
  updateStudentPhoto,
} from "@/lib/services/student.service";

import { saveStudentPhoto } from "@/lib/utils/file-upload";
import { db } from "@/prisma/db";
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

   const student = await createStudent(schoolId, {
     ...result.data,
     classId,
   });

   const photo = formData.get("photo");

   if (photo instanceof File && photo.size > 0) {
     const photoUrl = await saveStudentPhoto(photo, schoolId, student.id);

     await updateStudentPhoto(schoolId, student.id, photoUrl);
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

      {/* Form */}
      <form
        action={createStudentAction}
        className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
      >
        {/* Basic information */}
        <div className="border-b border-slate-200 px-6 py-5 sm:px-8">
          <h2 className="text-base font-semibold text-slate-900">
            Basic Information
          </h2>

          <p className="mt-1 text-sm text-slate-600">
            Enter the student's identification and personal information.
          </p>
        </div>

        <div className="space-y-6 px-6 py-6 sm:px-8">
          {/* Admission number */}
          <div>
            <label
              htmlFor="admissionNumber"
              className="block text-sm font-semibold text-slate-800"
            >
              Admission Number
              <span className="ml-1 text-red-500">*</span>
            </label>

            <p className="mt-1 text-xs text-slate-500">
              A unique number used to identify the student.
            </p>

            <input
              id="admissionNumber"
              name="admissionNumber"
              type="text"
              required
              placeholder="e.g. STU-002"
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Names */}
          <div className="grid gap-5 sm:grid-cols-3">
            <div>
              <label
                htmlFor="firstName"
                className="block text-sm font-semibold text-slate-800"
              >
                First Name
                <span className="ml-1 text-red-500">*</span>
              </label>

              <input
                id="firstName"
                name="firstName"
                type="text"
                required
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                type="text"
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="lastName"
                className="block text-sm font-semibold text-slate-800"
              >
                Last Name
                <span className="ml-1 text-red-500">*</span>
              </label>

              <input
                id="lastName"
                name="lastName"
                type="text"
                required
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          {/* Gender and DOB */}
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="gender"
                className="block text-sm font-semibold text-slate-800"
              >
                Gender
                <span className="ml-1 text-red-500">*</span>
              </label>

              <select
                id="gender"
                name="gender"
                required
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Select gender</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
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
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          {/* Passport Photograph */}
          <div className="border-t border-slate-200 pt-6">
            <h2 className="text-base font-semibold text-slate-900">
              Passport Photograph
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              Upload a clear passport photograph for the student's profile and
              report card.
            </p>

            <div className="mt-5">
              <label
                htmlFor="photo"
                className="block text-sm font-semibold text-slate-800"
              >
                Student Photograph
              </label>

              <input
                id="photo"
                name="photo"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-700 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
              />

              <p className="mt-2 text-xs text-slate-500">
                JPG, PNG, or WEBP. Maximum size: 2 MB.
              </p>
            </div>
          </div>

          {/* Academic information */}
          <div className="border-t border-slate-200 pt-6">
            <h2 className="text-base font-semibold text-slate-900">
              Academic Information
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              Assign the student to a class if their class is already available.
            </p>

            <div className="mt-5">
              <label
                htmlFor="classId"
                className="block text-sm font-semibold text-slate-800"
              >
                Class
              </label>

              <select
                id="classId"
                name="classId"
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Not assigned</option>

                {classes.map((schoolClass) => (
                  <option key={schoolClass.id} value={schoolClass.id}>
                    {schoolClass.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Contact information */}
          <div className="border-t border-slate-200 pt-6">
            <h2 className="text-base font-semibold text-slate-900">
              Contact Information
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              Add contact details for the student.
            </p>

            <div className="mt-5 space-y-5">
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
                  className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                  type="tel"
                  className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
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
                  rows={3}
                  className="mt-2 w-full resize-y rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Form actions */}
        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-5 sm:flex-row sm:justify-end sm:px-8">
          <Link
            href="/school/students"
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Cancel
          </Link>

          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            Create Student
          </button>
        </div>
      </form>
    </div>
  );
}
