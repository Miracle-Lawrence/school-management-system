import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/authorization";
import NotificationManager from "./notification-manager";

export default async function SchoolNotificationsPage() {
  const session = await requireRole(["SCHOOL_OWNER", "SCHOOL_ADMIN"]);

  if (!session.user.schoolId) {
    redirect("/school/dashboard");
  }

  return (
    <main className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Communication Centre
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Send announcements and important updates to parents and review
          notifications sent by your school.
        </p>
      </div>

      <NotificationManager />
    </main>
  );
}
