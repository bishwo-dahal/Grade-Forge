// NOTE: UI-driven types; add fields only when the UI needs them to avoid premature complexity.

import type { GroupStudentResponse } from "./courseGroup";

export type AssignmentStatus = "not_submitted" | "submitted" | "late" | "graded";

export interface AssignmentDetail {
  id: string;
  title: string;
  course: string;
  courseCode: string;
  /** Course id for API calls (e.g. test suite by course + assignment). */
  courseId?: number;
  dueDate: string;
  /** Formatted available-from datetime, or null if not set. */
  availableFrom?: string | null;
  /** Formatted late-due datetime, or null if not set. */
  lateDueDate?: string | null;
  status: AssignmentStatus;
  points: {
    earned: number | null;
    total: number;
  };
  submissionsUsed: number;
  submissionsAllowed: number | null;
  language: string;
  /** Optional comma-separated list of allowed source extensions for this assignment's language (e.g. ".py,.txt,.csv"). */
  languageAllowedExtensions?: string | null;
  hasStarterCode: boolean;
  submissionType?: string;
  /** @deprecated Backend may still return a single URL; prefer starterCodeFiles. */
  starterCodeUrl?: string | null;
  /** Presigned S3 links from the API for starter code files. */
  starterCodeFiles?: Array<{ fileName: string; downloadUrl: string }>;
  /**
   * When assignment is group-assigned (`submissionType === "GROUP"`), this is the main group selected by the faculty.
   * Backend may also provide the subgroup assignment for the latest submission.
   */
  mainGroupId?: number | null;
  mainGroupName?: string | null;
  subGroupName?: string | null;
  subGroupMembers?: GroupStudentResponse[] | null;
  rubricName?: string | null;
  rubricId?: number | null;
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

// NOTE: UI-driven models for faculty assignment creation; grow only when the create page renders new fields.
export interface FacultyAssignmentCreatePageHeader {
  classId: string;
  courseCode: string;
  courseName: string;
}

export interface AssignmentCreateOption {
  id: string;
  label: string;
}

export type AssignmentSubmissionType = "INDIVIDUAL" | "GROUP";

export interface AssignmentCreateFormData {
  title: string;
  description: string;
  // NOTE: Optional schedule gates map directly to backend Assignment.availableFrom.
  availableFromDate: string;
  availableFromTime: string;
  dueDate: string;
  dueTime: string;
  // NOTE: Optional late deadline maps to backend Assignment.lateDueDate.
  lateDueDate: string;
  lateDueTime: string;
  languageId: string;
  submissionType: AssignmentSubmissionType;
  // NOTE: When submissionType is GROUP, backend requires assigning an assignment to a main group.
  mainGroupId: string;
  /** New files to upload (multipart part name `files`); any file type. On edit, combined with `keepFileIds` in the assignment JSON. */
  starterFiles: File[];
  // NOTE: Rubric linkage is optional and references pre-created faculty rubrics.
  rubricId: string;
  totalPoints: number;
}

/** Starter files already on the assignment when editing (download links from API). */
export interface AssignmentExistingStarterFile {
  id: number;
  fileName: string;
  downloadUrl: string | null;
}

export interface FacultyAssignmentCreatePageData {
  header: FacultyAssignmentCreatePageHeader;
  languageOptions: AssignmentCreateOption[];
  rubricOptions: AssignmentCreateOption[];
  mainGroupOptions: AssignmentCreateOption[];
  initialForm: AssignmentCreateFormData;
  /** Populated in edit mode so faculty can see current starter files before replacing. */
  existingStarterFiles?: AssignmentExistingStarterFile[];
}
