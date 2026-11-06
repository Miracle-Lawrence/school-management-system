"use client";

import { useEffect } from "react";
import AppErrorView from "@/components/system/app-error-view";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application route error:", error);
  }, [error]);

  return (
    <AppErrorView
      code="500"
      title="We hit a problem"
      description="This page could not be loaded. Please try again. If the problem continues, contact your administrator."
      actionLabel="Try again"
      onRetry={reset}
      showDashboard={false}
    />
  );
}
