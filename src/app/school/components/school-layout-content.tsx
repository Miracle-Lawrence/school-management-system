"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type SchoolLayoutContentProps = {
  children: ReactNode;
};

export default function SchoolLayoutContent({
  children,
}: SchoolLayoutContentProps) {
  const pathname = usePathname();

  const isReportCard = pathname === "/school/results/report-card";

  if (isReportCard) {
    return <>{children}</>;
  }

  return <>{children}</>;
}
