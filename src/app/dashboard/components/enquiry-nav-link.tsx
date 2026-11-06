"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type EnquiryNavLinkProps = {
  mobile?: boolean;
  onNavigate?: () => void;
};

export default function EnquiryNavLink({
  mobile = false,
  onNavigate,
}: EnquiryNavLinkProps) {
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshCount = useCallback(async () => {
    try {
      const response = await fetch("/api/dashboard/contact-enquiries", {
        cache: "no-store",
      });

      if (!response.ok) return;

      const data = await response.json();
      setUnreadCount(Number(data.unreadCount) || 0);
    } catch {
      // Keep the last known count if the request fails.
    }
  }, []);

  useEffect(() => {
    void refreshCount();

    const interval = window.setInterval(refreshCount, 30000);

    window.addEventListener("enquiries-updated", refreshCount);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("enquiries-updated", refreshCount);
    };
  }, [refreshCount]);

  return (
    <Link
      href="/dashboard/enquiries"
      onClick={onNavigate}
      aria-label={`Website enquiries, ${unreadCount} unread`}
      className={
        mobile
          ? "flex items-center justify-between rounded-lg px-3 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
          : "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
      }
    >
      <span className="flex items-center gap-3">
        <span className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/5 text-slate-300 transition-colors group-hover:bg-blue-500/20 group-hover:text-blue-300">
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="m3 7 9 6 9-6" />
          </svg>
        </span>
        <span>Website Enquiries</span>
      </span>

      {unreadCount > 0 && (
        <span className="flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-[10px] font-extrabold text-white shadow-sm shadow-red-950/30">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </Link>
  );
}
