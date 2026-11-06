"use client";

import "./globals.css";
import { useEffect } from "react";
import AppErrorView from "@/components/system/app-error-view";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global application error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <AppErrorView
          code="500"
          title="Something went wrong"
          description="An unexpected system error occurred. Your request could not be completed. Please try again."
          actionLabel="Try again"
          onRetry={reset}
          showDashboard={false}
        />
      </body>
    </html>
  );
}
