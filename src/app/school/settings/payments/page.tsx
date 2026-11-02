import { requireRole } from "@/lib/auth/authorization";
import PaymentConfigForm from "./payment-config-form";

export default async function SchoolPaymentSettingsPage() {
  await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <p className="text-sm font-medium text-blue-600">
          School Settings
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">
          Payment Configuration
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Connect your school's Paystack account to receive school fee
          payments directly into your designated account.
        </p>
      </div>

      <PaymentConfigForm />
    </div>
  );
}
