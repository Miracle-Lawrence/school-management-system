import Link from "next/link";
import { db } from "@/prisma/db";

export default async function SchoolsPage() {
  const schools = await db.orm.public.School.all();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Schools</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage schools registered on the platform.
          </p>
        </div>

        <Link
          href="/dashboard/schools/new"
          className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          Add School
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border bg-white">
        {schools.length === 0 ? (
          <div className="p-8 text-center">
            <h2 className="font-semibold">No schools yet</h2>

            <p className="mt-2 text-sm text-gray-500">
              Add your first school to start using the platform.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-6 py-4 font-semibold">School</th>
                  <th className="px-6 py-4 font-semibold">Slug</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Country</th>
                  <th className="px-6 py-4 font-semibold">Actions</th>
                </tr>
              </thead>

              <tbody>
                {schools.map((school) => (
                  <tr key={school.id} className="border-b last:border-0">
                    <td className="px-6 py-4 font-medium">{school.name}</td>

                    <td className="px-6 py-4 text-gray-600">{school.slug}</td>

                    <td className="px-6 py-4">{school.status}</td>

                    <td className="px-6 py-4">{school.country}</td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/dashboard/schools/${school.id}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
