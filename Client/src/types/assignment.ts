// NOTE: UI-driven types; add fields only when the UI needs them to avoid premature complexity.

export type AssignmentStatus = "not_submitted" | "submitted" | "late" | "graded";

export interface AssignmentDetail {
  id: string;
  title: string;
  course: string;
  courseCode: string;
  dueDate: string;
  status: AssignmentStatus;
  points: {
    earned: number | null;
    total: number;
  };
  submissionsUsed: number;
  submissionsAllowed: number | null;
  language: string;
  hasStarterCode: boolean;
}

export interface AssignmentSummary {
  id: string | number;
  title: string;
  number?: number;
  dueDate: string;
  status: AssignmentStatus | "not_submitted" | "graded";
  points: number;
  totalPoints?: number;
}

// NOTE: Added grading header context for faculty grading workflows.
export interface GradingAssignmentContext {
  id: string;
  title: string;
  courseName: string;
  section: string;
}

export interface UpcomingAssignment {
  id: number;
  title: string;
  course: string;
  dueDate: string;
  daysLeft: string;
  urgent: boolean;
  icon: string;
  iconBg: string;
}

// NOTE: Student assignments workspace type includes only fields rendered in the current list UI.
export type StudentAssignmentStatus = "upcoming" | "active" | "completed" | "overdue";

export interface StudentAssignmentListItem {
  id: string;
  title: string;
  courseCode: string;
  courseName: string;
  points: number;
  dueAt: string;
  status: StudentAssignmentStatus;
  progressPercent: number | null;
  icon: string;
  iconBg: string;
}

// NOTE: Added list item type used by the recent assignments table UI.
export interface RecentAssignmentItem {
  name: string;
  className: string;
  dueDate: string;
  status: string;
  statusColor: string;
  statusBg: string;
  iconKey: "clock" | "circle" | "check";
}

// NOTE: Added assignment content model used by the description panel.
export interface AssignmentDescription {
  problemDescription: string[];
  requiredMethods: Array<{
    name: string;
    description: string;
  }>;
  exampleCode: string;
  inputOutput: {
    input: string;
    output: string;
  };
  rubric: Array<{
    category: string;
    description: string;
    points: string;
  }>;
  constraints: string[];
}

// NOTE: Added editor example map so code samples can come from services.
export interface EditorCodeExamples {
  [language: string]: string;
}
