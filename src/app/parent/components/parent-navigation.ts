export type ParentNavigationItem = {
  label: string;
  href: string;
  icon: string;
};

export type ParentNavigationGroup = {
  label: string;
  items: ParentNavigationItem[];
};

export const parentNavigation: ParentNavigationGroup[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/parent/dashboard", icon: "dashboard" },
    ],
  },
  {
    label: "Finance",
    items: [
      { label: "Finance & Payments", href: "/parent/finance", icon: "finance" },
    ],
  },
  {
    label: "Academics",
    items: [
      { label: "Academic Reports", href: "/parent/reports", icon: "reports" },
    ],
  },
  {
    label: "Communication",
    items: [
      { label: "Notifications", href: "/parent/notifications", icon: "notifications" },
    ],
  },
];