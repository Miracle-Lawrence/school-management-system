export type SchoolNavigationItem = {
  label: string;
  href: string;
  icon: string;
};

export type SchoolNavigationGroup = {
  label: string;
  items: SchoolNavigationItem[];
};

export const schoolNavigation: SchoolNavigationGroup[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/school/dashboard", icon: "dashboard" },
    ],
  },
  {
    label: "User Management",
    items: [
      { label: "Students", href: "/school/students", icon: "students" },
      { label: "Teachers", href: "/school/teachers", icon: "teachers" },
      { label: "Parents", href: "/school/parents", icon: "parents" },
    ],
  },
  {
    label: "Academics",
    items: [
      { label: "Classes", href: "/school/classes", icon: "classes" },
      { label: "Subjects", href: "/school/subjects", icon: "subjects" },
      { label: "Academic Sessions", href: "/school/academic-sessions", icon: "calendar" },
    ],
  },
  {
    label: "Assessments & Results",
    items: [
      { label: "Assessments", href: "/school/assessments", icon: "assessments" },
      { label: "Question Banks", href: "/school/cbt/question-banks", icon: "questions" },
      { label: "Results", href: "/school/results", icon: "results" },
      { label: "Report Settings", href: "/school/report-settings", icon: "reports" },
    ],
  },
  {
    label: "Finance",
    items: [
      { label: "Fee Categories", href: "/school/fee-categories", icon: "categories" },
      { label: "Fee Structures", href: "/school/fee-structures", icon: "fees" },
      { label: "Student Fee Invoicing", href: "/school/student-invoices", icon: "invoices" },
      { label: "Fee Collection Dashboard", href: "/school/fee-payments", icon: "payments" },
    ],
  },
  {
    label: "Communication",
    items: [
      { label: "Communication Centre", href: "/school/notifications", icon: "messages" },
    ],
  },
  {
    label: "Settings",
    items: [
      { label: "Settings", href: "/school/settings", icon: "settings" },
    ],
  },
];