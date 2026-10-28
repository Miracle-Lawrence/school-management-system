"use client";

import { useEffect, useState, type ReactNode } from "react";

type TrackedContentType = "CLASS_NOTE" | "ASSIGNMENT" | "GRADE" | "RESULT";

export default function StudentContentReadObserver({
  contentType,
  contentId,
  children,
}: {
  contentType: TrackedContentType;
  contentId: number;
  children: ReactNode;
}) {
  const [element, setElement] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!element) return;

    let sent = false;

    const observer = new IntersectionObserver(
      (entries) => {
        if (sent || !entries.some((entry) => entry.isIntersecting)) {
          return;
        }

        sent = true;
        observer.disconnect();

        void fetch("/api/student/content-reads", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            contentType,
            contentId,
          }),
        })
          .then((response) => {
            if (response.ok) {
              window.dispatchEvent(
                new Event("student-content-reads-updated"),
              );
            }
          })
          .catch(() => {
            // Tracking failures must not prevent students from viewing content.
          });
      },
      { threshold: 0.1 },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [element, contentType, contentId]);

  return <div ref={setElement}>{children}</div>;
}
