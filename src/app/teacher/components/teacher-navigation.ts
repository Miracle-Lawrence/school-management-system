export type TeacherNavigationItem = {
  label: string;
  href: string;
  icon: string;
};

export type TeacherNavigationGroup = {
  label: string;
  items: TeacherNavigationItem[];
};

export const teacherNavigation: TeacherNavigationGroup[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/teacher/dashboard", icon: "dashboard" },
    ],
  },
  {
    label: "Teaching",
    items: [
      { label: "My Classes", href: "/teacher/classes", icon: "classes" },
      { label: "Attendance", href: "/teacher/attendance", icon: "attendance" },
      { label: "Class Notes", href: "/teacher/class-notes", icon: "notes" },
    ],
  },
  {
    label: "Assessments & Results",
    items: [
      { label: "Assessments", href: "/teacher/assessments", icon: "assessments" },
      { label: "Question Banks", href: "/teacher/cbt/question-banks", icon: "questions" },
      { label: "Assignments", href: "/teacher/assignments", icon: "assignments" },
      { label: "Assignment Grading", href: "/teacher/assignments/grading", icon: "grading" },
      { label: "Gradebook", href: "/teacher/gradebook", icon: "gradebook" },
      { label: "Subject Results", href: "/teacher/subject-results", icon: "results" },
      { label: "Report Comments", href: "/teacher/report-comments", icon: "comments" },
      { label: "Psychomotor Assessments", href: "/teacher/psychomotor", icon: "psychomotor" },
    ],
  },
  {
    label: "Account",
    items: [
      { label: "My Profile", href: "/teacher/profile", icon: "profile" },
    ],
  },
  {
    label: "Communication",
    items: [
      { label: "Notifications", href: "/teacher/notifications", icon: "notifications" },
    ],
  },
];