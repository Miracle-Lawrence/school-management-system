import { requireRole } from "@/lib/auth/authorization";
import FeeReminderButton from "./fee-reminder-button";
import StudentInvoiceManager from "./student-invoice-manager";

export const dynamic = "force-dynamic";

export default async function StudentInvoicesPage() {
  await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);

  return (
    <main className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Student Fee Invoicing
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Generate term fee invoices and track invoices issued to students.
        </p>
      </div>

      <FeeReminderButton />

      <StudentInvoiceManager />
    </main>
  );
}
