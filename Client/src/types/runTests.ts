export type TestRunJobStatus = "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED";

export interface RunTestsResponse {
  testRunJobId: number;
  submissionId: number;
  status: TestRunJobStatus;
}

export interface TestCaseResultItem {
  testCaseId: number;
  testCaseTitle: string;
  passed: boolean;
  actualOutput: string | null;
  expectedOutput: string | null;
  timedOut: boolean;
  errorMessage: string | null;
  runtimeMs: number | null;
  isPrivate?: boolean;
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
