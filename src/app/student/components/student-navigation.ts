export type StudentNavigationItem = {
  label: string;
  href: string;
  icon: string;
};

export type StudentNavigationGroup = {
  label: string;
  items: StudentNavigationItem[];
};

export const studentNavigation: StudentNavigationGroup[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/student/dashboard", icon: "dashboard" },
      { label: "My Profile", href: "/student/profile", icon: "profile" },
    ],
  },
  {
    label: "Learning",
    items: [
      { label: "My Class & Subjects", href: "/student/subjects", icon: "subjects" },
      { label: "Assignments", href: "/student/assignments", icon: "assignments" },
      { label: "Class Notes", href: "/student/class-notes", icon: "notes" },
    ],
  },
  {
    label: "Assessments & Results",
    items: [
      { label: "Online Exams", href: "/student/cbt", icon: "exams" },
      { label: "My Results", href: "/student/results", icon: "results" },
    ],
  },
  {
    label: "Attendance",
    items: [
      { label: "Attendance", href: "/student/attendance", icon: "attendance" },
    ],
  },
  {
    label: "Communication",
    items: [
      { label: "Announcements", href: "/student/announcements", icon: "announcements" },
      { label: "Notifications", href: "/student/notifications", icon: "notifications" },
    ],
  },
  {
    label: "Settings",
    items: [
      { label: "Settings", href: "/student/settings", icon: "settings" },
    ],
  },
];