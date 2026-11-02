import { requireRole } from "@/lib/auth/authorization";
import { db } from "@/prisma/db";
import { redirect } from "next/navigation";

export default async function StudentProfilePage() {
  const session = await requireRole(["STUDENT"]);
  const userId = Number(session.user.id);
  const schoolId = session.user.schoolId;

  if (!Number.isInteger(userId) || !schoolId) {
    redirect("/login");
  }

  const student = await db.orm.public.Student.where((item) =>
    item.userId.eq(userId),
  ).first();

  if (!student || student.schoolId !== schoolId || !student.isActive) {
    return (
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
        <section className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="font-semibold text-amber-900">
            Student profile unavailable
          </h2>
          <p className="mt-2 text-sm leading-6 text-amber-800">
            Your account is not linked to an active student record. Please
            contact your school administrator.
          </p>
        </section>
      </div>
    );
  }

  const fullName = [
    student.firstName,
    student.middleName,
    student.lastName,
  ].filter(Boolean).join(" ");

  const schoolClass = student.classId
    ? await db.orm.public.SchoolClass.where((item) =>
        item.id.eq(student.classId!),
      ).first()
    : null;

  const validClass =
    schoolClass && schoolClass.schoolId === schoolId ? schoolClass : null;

  const details = [
    { label: "Full name", value: fullName },
    { label: "Admission number", value: student.admissionNumber },
    { label: "Class", value: validClass?.name ?? "Not assigned" },
    { label: "Gender", value: String(student.gender).replaceAll("_", " ") },
    {
      label: "Date of birth",
      value: student.dateOfBirth
        ? new Date(student.dateOfBirth).toLocaleDateString("en-NG")
        : "Not provided",
    },
    { label: "Email", value: student.email || session.user.email || "Not provided" },
    { label: "Phone", value: student.phone || "Not provided" },
    { label: "Address", value: student.address || "Not provided" },
    { label: "Account status", value: student.isActive ? "Active" : "Inactive" },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <p className="text-sm font-semibold text-blue-600">Student portal</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          My Profile
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          View your personal information and school admission details.
        </p>
      </header>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-blue-700 to-indigo-700 p-6 text-white sm:p-8">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white/40 bg-white/15 text-2xl font-bold">
              {student.photoUrl ? (
                <img
                  src={student.photoUrl}
                  alt={fullName}
                  className="h-full w-full object-cover"
                />
              ) : (
                student.firstName.charAt(0).toUpperCase()
              )}
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-bold sm:text-2xl">{fullName}</h2>
              <p className="mt-1 text-sm text-blue-100">
                Admission No.: {student.admissionNumber}
              </p>
              <p className="mt-1 text-sm text-blue-100">
                {validClass?.name ?? "Class not assigned"}
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-8">
          <h2 className="text-lg font-bold text-slate-900">
            Personal information
          </h2>
          <dl className="mt-5 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
            {details.map((detail) => (
              <div key={detail.label} className="min-w-0">
                <dt className="text-sm text-slate-500">{detail.label}</dt>
                <dd className="mt-1 break-words text-sm font-semibold text-slate-900">
                  {detail.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <p className="text-sm leading-6 text-slate-500">
        If any of these details are incorrect, please contact your school
        administrator to request an update.
      </p>
    </div>
  );
}
