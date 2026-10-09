"use client";

import { useActionState } from "react";

type StudentEditFormState = {
  error: string | null;
};

type StudentEditFormProps = {
  action: (
    previousState: StudentEditFormState,
    formData: FormData,
  ) => Promise<StudentEditFormState>;
  student: {
    admissionNumber: string;
    firstName: string;
    middleName: string | null;
    lastName: string;
    gender: "MALE" | "FEMALE";
    dateOfBirth: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    photoUrl: string | null;
  };
};

export default function StudentEditForm({
  action,
  student,
}: StudentEditFormProps) {
  const [state, formAction, isPending] = useActionState(action, {
    error: null,
  });

  return (
    <form
      action={formAction}
      className="space-y-6 border-t border-slate-200 px-6 py-6 sm:px-8"
    >
      {state.error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
        >
          {state.error}
        </div>
      )}

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
            defaultValue={student.dateOfBirth}
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

      <div className="border-t border-slate-200 pt-6">
        <h2 className="text-base font-semibold text-slate-900">
          Passport Photograph
        </h2>

        <p className="mt-1 text-sm text-slate-600">
          Update the student's passport photograph. Leave this empty to keep the
          current photograph.
        </p>

        {student.photoUrl && (
          <div className="mt-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Current Photograph
            </p>

            <img
              src={student.photoUrl}
              alt={`${student.firstName} ${student.lastName}`}
              className="h-32 w-28 rounded-lg border border-slate-200 object-cover"
            />
          </div>
        )}

        <div className="mt-5">
          <label
            htmlFor="photo"
            className="block text-sm font-semibold text-slate-800"
          >
            {student.photoUrl ? "Replace Photograph" : "Upload Photograph"}
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

      <div className="flex justify-end border-t border-slate-200 pt-5">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
