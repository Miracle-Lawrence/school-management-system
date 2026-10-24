"use client";

import type { ReactNode } from "react";

type ParentLayoutContentProps = {
  children: ReactNode;
};

export default function ParentLayoutContent({
  children,
}: ParentLayoutContentProps) {
  return <>{children}</>;
}
