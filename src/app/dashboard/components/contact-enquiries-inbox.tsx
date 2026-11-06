"use client";

import { useCallback, useEffect, useState } from "react";

type EnquiryStatus = "NEW" | "READ" | "REPLIED" | "ARCHIVED";

type Enquiry = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  service: string;
  message: string;
  status: EnquiryStatus;
  createdAt: string;
  updatedAt: string;
};

const statusStyles: Record<EnquiryStatus, string> = {
  NEW: "bg-red-100 text-red-700",
  READ: "bg-blue-100 text-blue-700",
  REPLIED: "bg-emerald-100 text-emerald-700",
  ARCHIVED: "bg-slate-100 text-slate-600",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function ContactEnquiriesInbox() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [selected, setSelected] = useState<Enquiry | null>(null);
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  const loadEnquiries = useCallback(async () => {
    try {
      setError("");

      const response = await fetch("/api/dashboard/contact-enquiries", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Unable to load enquiries.");
      }

      const data = await response.json();
      setEnquiries(data.enquiries ?? []);

      setSelected((current) =>
        current
          ? (data.enquiries ?? []).find(
              (item: Enquiry) => item.id === current.id,
            ) ?? null
          : null,
      );
    } catch {
      setError("We could not load enquiries. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadEnquiries();
  }, [loadEnquiries]);

  async function updateStatus(
    enquiry: Enquiry,
    status: Exclude<EnquiryStatus, "NEW">,
  ) {
    setUpdating(true);
    setError("");

    try {
      const response = await fetch(
        `/api/dashboard/contact-enquiries/${enquiry.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        },
      );

      if (!response.ok) {
        throw new Error("Unable to update enquiry.");
      }

      setEnquiries((current) =>
        current.map((item) =>
          item.id === enquiry.id ? { ...item, status } : item,
        ),
      );

      setSelected((current) =>
        current?.id === enquiry.id ? { ...current, status } : current,
      );

      window.dispatchEvent(new Event("enquiries-updated"));
    } catch {
      setError("The enquiry status could not be updated. Please try again.");
    } finally {
      setUpdating(false);
    }
  }

  async function openEnquiry(enquiry: Enquiry) {
    setSelected(enquiry);

    if (enquiry.status === "NEW") {
      await updateStatus(enquiry, "READ");
    }
  }

  const visibleEnquiries = enquiries.filter((enquiry) => {
    if (filter === "ALL") return enquiry.status !== "ARCHIVED";
    return enquiry.status === filter;
  });

  const unreadCount = enquiries.filter(
    (enquiry) => enquiry.status === "NEW",
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm text-slate-500">
            Messages submitted through the MLOEXA Studio website.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <span className="font-semibold text-slate-800">
              {enquiries.length} total messages
            </span>
            <span className="text-slate-300">•</span>
            <span className="font-semibold text-red-600">
              {unreadCount} unread
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void loadEnquiries()}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Refresh inbox
        </button>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid min-h-[560px] gap-5 lg:grid-cols-[0.85fr_1.15fr]">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 p-4">
            <div className="flex flex-wrap gap-2">
              {["ALL", "NEW", "READ", "REPLIED"].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFilter(value)}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                    filter === value
                      ? "bg-[#101b35] text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {value === "ALL" ? "All messages" : value}
                </button>
              ))}
            </div>
          </div>

          <div className="max-h-[680px] overflow-y-auto">
            {loading ? (
              <p className="p-6 text-sm text-slate-500">Loading enquiries...</p>
            ) : visibleEnquiries.length === 0 ? (
              <div className="p-8 text-center">
                <p className="font-semibold text-slate-700">No messages found</p>
                <p className="mt-1 text-sm text-slate-500">
                  New website enquiries will appear here.
                </p>
              </div>
            ) : (
              visibleEnquiries.map((enquiry) => (
                <button
                  key={enquiry.id}
                  type="button"
                  onClick={() => void openEnquiry(enquiry)}
                  className={`w-full border-b border-slate-100 p-4 text-left transition hover:bg-slate-50 ${
                    selected?.id === enquiry.id ? "bg-blue-50/70" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {enquiry.status === "NEW" && (
                          <span className="h-2 w-2 shrink-0 rounded-full bg-red-500" />
                        )}
                        <p className="truncate text-sm font-bold text-slate-900">
                          {enquiry.name}
                        </p>
                      </div>
                      <p className="mt-1 truncate text-xs text-slate-500">
                        {enquiry.email}
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${statusStyles[enquiry.status]}`}>
                      {enquiry.status}
                    </span>
                  </div>
                  <p className="mt-3 text-xs font-semibold text-slate-700">
                    {enquiry.service}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                    {enquiry.message}
                  </p>
                  <p className="mt-3 text-[11px] text-slate-400">
                    {formatDate(enquiry.createdAt)}
                  </p>
                </button>
              ))
            )}
          </div>
        </section>

        <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
          {!selected ? (
            <div className="flex h-full min-h-64 flex-col items-center justify-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl text-slate-500">
                ✉
              </div>
              <p className="mt-4 font-bold text-slate-800">
                Select a message
              </p>
              <p className="mt-1 max-w-xs text-sm text-slate-500">
                Choose an enquiry from the list to read the full message.
              </p>
            </div>
          ) : (
            <div>
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Website enquiry
                  </p>
                  <h3 className="mt-2 text-xl font-bold text-slate-900">
                    {selected.name}
                  </h3>
                  <p className="mt-1 break-all text-sm text-slate-500">
                    {selected.email}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${statusStyles[selected.status]}`}>
                  {selected.status}
                </span>
              </div>

              <div className="grid gap-5 border-b border-slate-100 py-5 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Service requested
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-800">
                    {selected.service}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Phone number
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-800">
                    {selected.phone || "Not provided"}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Date received
                  </p>
                  <p className="mt-2 text-sm text-slate-800">
                    {formatDate(selected.createdAt)}
                  </p>
                </div>
              </div>

              <div className="py-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Message
                </p>
                <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">
                  {selected.message}
                </p>
              </div>

              <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-5">
                <a
                  href={`mailto:${selected.email}?subject=${encodeURIComponent(`Re: ${selected.service} enquiry`)}`}
                  className="rounded-xl bg-[#101b35] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-900"
                >
                  Reply by email
                </a>

                {selected.status !== "REPLIED" && (
                  <button
                    type="button"
                    disabled={updating}
                    onClick={() => void updateStatus(selected, "REPLIED")}
                    className="rounded-xl border border-emerald-200 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50"
                  >
                    Mark as replied
                  </button>
                )}

                {selected.status !== "ARCHIVED" && (
                  <button
                    type="button"
                    disabled={updating}
                    onClick={() => void updateStatus(selected, "ARCHIVED")}
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    Archive
                  </button>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
