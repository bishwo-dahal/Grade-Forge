export type TestRunJobStatus = "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED";

export interface RunTestsResponse {
  testRunJobId: number;
  submissionId: number;
  status: TestRunJobStatus;
}

export interface TestCaseResultItem {
  testCaseId: number | null;
  testCaseTitle: string;
  /** null for custom-stdin runs (no pass/fail). */
  passed: boolean | null;
  actualOutput: string | null;
  expectedOutput: string | null;
  timedOut: boolean;
  errorMessage: string | null;
  runtimeMs: number | null;
  isPrivate?: boolean | null;
}

export interface TestRunJobStatusResponse {
  id: number;
  submissionId: number;
  status: TestRunJobStatus;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  errorMessage: string | null;
  results: TestCaseResultItem[];
  passedCount: number;
  totalCount: number;
}
