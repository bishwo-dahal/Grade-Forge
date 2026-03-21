// NOTE: UI-driven types; add fields only when the UI needs them to avoid premature complexity.

import type { RubricItem } from "./grade";

export type SubmissionStatus =
  | "not-graded"
  | "auto-graded"
  | "manually-adjusted"
  | "finalized";

export interface SubmissionTestResult {
  name: string;
  passed: boolean;
  input: string;
  expected: string;
  actual: string;
}

export interface PublicTestCase {
  id: number;
  name: string;
  /** undefined for custom-stdin runs (no pass/fail). */
  passed?: boolean;
  input: string;
  /** If set, input is provided as a file with this name (not stdin). */
  inputFileName?: string | null;
  expectedOutput: string;
  actualOutput: string;
  executionTime?: string;
}

export interface SubmissionSummary {
  id: string;
  studentName: string;
  status: SubmissionStatus;
  score: number | null;
}

// NOTE: Submission file metadata stays UI-driven so faculty/student views share one stable shape.
export interface SubmissionFileItem {
  id: string;
  fileName: string;
  fileType: string | null;
  fileSize: number | null;
  downloadUrl: string | null;
}

// NOTE: Added class-level submission row for faculty class tables.
export interface ClassSubmissionItem {
  id: string;
  // FIX: Faculty submissions table needs assignment id to route each row to the assignment workspace.
  assignmentId: string;
  student: string;
  assignment: string;
  submittedAt: string;
  status: "ungraded" | "graded";
  score?: number;
  files: SubmissionFileItem[];
  primaryFileName: string | null;
  additionalFileCount: number;
  primaryDownloadUrl: string | null;
}

// NOTE: Added right-panel submission link model for pending grading lists.
export interface PendingSubmissionItem {
  id: string;
  assignmentId: string;
  studentName: string;
  assignmentTitle: string;
  courseCode: string;
}

export interface SubmissionDetail {
  id: string;
  studentName: string;
  studentId: string;
  submittedAt: string;
  isLate: boolean;
  daysLate: number;
  language: string;
  attemptNumber: number;
  status: SubmissionStatus;
  autoScore: number;
  manualScore: number | null;
  totalPoints: number;
  code: string;
  publicTestResults: SubmissionTestResult[];
  privateTestResults: {
    passed: number;
    total: number;
  };
  rubric: RubricItem[];
  instructorFeedback: string;
  similarityScore: number;
  aiLikelihood: number;
}

// NOTE: Added console output bundle for grading console panels.
export interface SubmissionConsoleData {
  output: string;
  errors: string;
  executionLog: string;
}

// NOTE: Faculty assignment results tab needs full per-submission file lists for download actions.
export interface FacultyAssignmentSubmissionRow {
  submissionId: string;
  /** Numeric id from backend, stringified. Used to map plagiarism results (student_id). */
  studentId?: string;
  studentName: string;
  submittedAt: string;
  marks: number | null;
  files: SubmissionFileItem[];
}

// NOTE: Faculty editor selector options are flattened from submission rows so view components stay data-agnostic.
export interface FacultySubmissionFileOption {
  optionId: string;
  submissionId: string;
  studentName: string;
  fileName: string;
  submittedAt: string;
  downloadUrl: string | null;
  label: string;
}

// NOTE: Read-only editor payload keeps only fields required to render selected submission code in workspace.
export interface FacultyEditorPreviewPayload {
  optionId: string;
  fileName: string;
  language: string;
  content: string;
  /** When set, editor shows all submission files (e.g. on AssignmentGradingPage); otherwise single file (fileName + content). */
  files?: { fileName: string; content: string }[];
}

// NOTE: Grade modal options are flattened from faculty submission rows to keep grading UI strictly presentational.
export interface FacultySubmissionGradeOption {
  submissionId: string;
  studentName: string;
  submittedAt: string;
  currentMarks: number | null;
  label: string;
}

export interface FacultySubmissionGradePayload {
  submissionId: string;
  marks: number;
  feedback: string;
}

// NOTE: Speed grading assignment selector is derived from class submissions so launch UI stays lightweight.
export interface SpeedGradingAssignmentOption {
  assignmentId: string;
  assignmentName: string;
  totalSubmissions: number;
  ungradedSubmissions: number;
}

// NOTE: Queue stats keep right-panel summary cards data-driven and detached from render logic.
export interface SpeedGradingQueueStats {
  total: number;
  graded: number;
  ungraded: number;
}

// NOTE: Speed grading test summary separates public/private pass counts for focused instructor decisions.
export interface SpeedGradingTestSummary {
  hasRun: boolean;
  publicPassed: number;
  publicTotal: number;
  privatePassed: number;
  privateTotal: number;
}

/** PATCH /api/v1/faculty/submissions/{submissionId}/grade request body (SubmissionGradeRequest: marks, feedback). */
export interface SubmissionGradeRequest {
  marks: number;
  feedback: string;
}
