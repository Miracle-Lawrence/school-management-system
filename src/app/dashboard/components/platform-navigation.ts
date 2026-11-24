export type PlatformNavigationItem = {
  name: string;
  href: string;
  icon: string;
};

export type PlatformNavigationGroup = {
  label: string;
  items: PlatformNavigationItem[];
};

export const platformNavigation: PlatformNavigationGroup[] = [
  {
    label: "Overview",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: "dashboard" },
    ],
  },
  {
    label: "School Management",
    items: [
      { name: "Schools", href: "/dashboard/schools", icon: "schools" },
      { name: "Users", href: "/dashboard/users", icon: "users" },
    ],
  },
  {
    label: "Billing & Subscriptions",
    items: [
      { name: "Subscription Plans", href: "/dashboard/subscriptions", icon: "plans" },
      { name: "School Subscriptions", href: "/dashboard/subscriptions/schools", icon: "subscriptions" },
      { name: "Payment Records", href: "/dashboard/subscriptions/payments", icon: "records" },
      { name: "Billing Rates", href: "/dashboard/billing/rates", icon: "rates" },
      { name: "Invoices", href: "/dashboard/billing/invoices", icon: "invoices" },
      { name: "Payments", href: "/dashboard/billing/payments", icon: "payments" },
    ],
  },
  {
    label: "System",
    items: [
      { name: "Settings", href: "/dashboard/settings", icon: "settings" },
    ],
  },
];