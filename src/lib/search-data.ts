export interface SearchItem {
  id: string;
  title: string;
  subtitle: string;
  type: "student" | "teacher" | "staff" | "page";
  link: string;
}

export const searchItems: SearchItem[] = [
  // Pages
  { id: "p1", title: "Dashboard", subtitle: "Overview and insights", type: "page", link: "/" },
  { id: "p2", title: "Students", subtitle: "Student directory", type: "page", link: "/students" },
  { id: "p3", title: "Staff Management", subtitle: "Faculty & Staff directory", type: "page", link: "/staff" },
  { id: "p4", title: "Attendance", subtitle: "Track daily presence", type: "page", link: "/attendance" },
  { id: "p5", title: "Fees", subtitle: "Financial records", type: "page", link: "/fees" },
  { id: "p6", title: "Marks", subtitle: "Exam results and reports", type: "page", link: "/marks" },
  { id: "p7", title: "Messages", subtitle: "In-app communication", type: "page", link: "/messages" },

  // Students
  { id: "s1", title: "Alex Johnson", subtitle: "GR001 - 10th A", type: "student", link: "/students" },
  { id: "s2", title: "Sarah Williams", subtitle: "GR002 - 10th A", type: "student", link: "/students" },
  { id: "s3", title: "John Doe", subtitle: "GR003 - 9th B", type: "student", link: "/students" },
  { id: "s4", title: "Jane Smith", subtitle: "GR004 - 8th C", type: "student", link: "/students" },

  // Staff (formerly teachers)
  { id: "t1", title: "Robert Wilson", subtitle: "Physics - Faculty", type: "staff", link: "/staff" },
  { id: "t2", title: "Sarah Taylor", subtitle: "English - Faculty", type: "staff", link: "/staff" },
  { id: "t3", title: "Emily Brown", subtitle: "Mathematics - Faculty", type: "staff", link: "/staff" },
];
