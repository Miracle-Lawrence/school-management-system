import ContactEnquiriesInbox from "@/app/dashboard/components/contact-enquiries-inbox";
import { requireRole } from "@/lib/auth/authorization";

export const metadata = {
  title: "Website Enquiries | SchoolMS Platform",
};

export default async function ContactEnquiriesPage() {
  await requireRole(["PLATFORM_OWNER", "PLATFORM_ADMIN"]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
          MLOEXA Studio
        </p>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
          Website Enquiries
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Manage project enquiries and messages submitted through your public website.
        </p>
      </div>

      <ContactEnquiriesInbox />
    </div>
  );
}
