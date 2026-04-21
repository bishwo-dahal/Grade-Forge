import { matchPath } from "react-router";
import type { AppRole } from "./auth";

const ROLE_LABEL: Record<AppRole, string> = {
  STUDENT: "Student",
  FACULTY: "Faculty",
  GRADING_ASSISTANT: "Grading assistant",
  UNIVERSITY_ADMIN: "University admin",
  SYSTEM_ADMIN: "System admin",
};

/** Ordered most-specific first so `matchPath` picks the best label. */
const PATH_TITLE_RULES: { path: string; title: string }[] = [
  { path: "/faculty/class/:classId/assignment/:assignmentId/submission/:submissionId", title: "Submission" },
  { path: "/faculty/class/:classId/speed-grading/:assignmentId", title: "Speed grading" },
  { path: "/faculty/class/:classId/assignments/:assignmentId/edit", title: "Edit assignment" },
  { path: "/faculty/class/:classId/assignments/create", title: "Create assignment" },
  { path: "/faculty/class/:classId/assignment/:assignmentId", title: "Assignment" },
  { path: "/faculty/class/:classId/students/:studentId", title: "Student" },
  { path: "/faculty/class/:classId/groups/:mainGroupId", title: "Group" },
  { path: "/faculty/class/:classId", title: "Class" },
  { path: "/faculty/class/:classId/:section", title: "Class" },
  { path: "/faculty/assignment/:assignmentId/submission/:submissionId", title: "Submission" },
  { path: "/faculty/assignment/:assignmentId", title: "Assignment" },
  { path: "/grading-assistant/class/:classId/assignment/:assignmentId/submission/:submissionId", title: "Submission" },
  { path: "/grading-assistant/class/:classId/assignment/:assignmentId", title: "Assignment" },
  { path: "/grading-assistant/class/:classId", title: "Class" },
  { path: "/grading-assistant/courses", title: "Courses" },
  { path: "/assignment/:assignmentId/grade/:submissionId", title: "Grade" },
  { path: "/assignment/:assignmentId", title: "Assignment" },
  { path: "/faculty/my-classes/create", title: "Create class" },
  { path: "/faculty/my-classes", title: "My classes" },
  { path: "/faculty/rubrics/new", title: "New rubric" },
  { path: "/faculty/rubrics/:rubricId", title: "Rubric" },
  { path: "/faculty/rubrics", title: "Rubrics" },
  { path: "/faculty/grading-assistants", title: "Grading assistants" },
  { path: "/faculty/students", title: "Students" },
  { path: "/faculty/schedule", title: "Schedule" },
  { path: "/faculty/grading", title: "Grading" },
  { path: "/university-admin/faculty", title: "Faculty" },
  { path: "/university-admin/semesters", title: "Semesters" },
  { path: "/university-admin/courses", title: "Courses" },
  { path: "/university-admin/languages", title: "Languages" },
  { path: "/university-admin/manage-users", title: "Users" },
  { path: "/university-admin/monitor", title: "Monitor" },
  { path: "/university-admin/training-data", title: "Training data" },
  { path: "/university-admin/settings", title: "Settings" },
  { path: "/university-admin", title: "University admin" },
  { path: "/student/my-courses", title: "My courses" },
  { path: "/student/assignments", title: "Assignments" },
  { path: "/student/calendar", title: "Calendar" },
  { path: "/student/materials", title: "Materials" },
  { path: "/student/discussions", title: "Discussions" },
  { path: "/complete-registration", title: "Complete registration" },
  { path: "/course/:courseId", title: "Course" },
  { path: "/class/:classId", title: "Class" },
  { path: "/dashboard", title: "Dashboard" },
  { path: "/settings", title: "Settings" },
  { path: "/signin", title: "Sign in" },
  { path: "/signup", title: "Sign up" },
  { path: "/", title: "Home" },
];

export function formatDocumentTitle(pathname: string, role: AppRole | null): string {
  const pageTitle = resolvePageTitle(pathname);
  const roleLabel = role ? ROLE_LABEL[role] : null;

  if (roleLabel && pageTitle && pageTitle !== "Home") {
    return `${pageTitle} · ${roleLabel} · Grade Forge`;
  }
  if (roleLabel) {
    return `${roleLabel} · Grade Forge`;
  }
  if (pageTitle && pageTitle !== "Home") {
    return `${pageTitle} · Grade Forge`;
  }
  return "Grade Forge";
}

function resolvePageTitle(pathname: string): string {
  const normalized = pathname.endsWith("/") && pathname.length > 1 ? pathname.slice(0, -1) : pathname;

  for (const { path, title } of PATH_TITLE_RULES) {
    if (matchPath({ path, end: true }, normalized)) {
      return title;
    }
  }

  if (normalized !== "/" && normalized !== "") {
    return "Not found";
  }
  return "Home";
}
