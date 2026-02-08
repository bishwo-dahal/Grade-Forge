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
  passed: boolean;
  input: string;
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

// NOTE: Added class-level submission row for faculty class tables.
export interface ClassSubmissionItem {
  id: string;
  student: string;
  assignment: string;
  submittedAt: string;
  status: "ungraded" | "graded";
  score?: number;
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
