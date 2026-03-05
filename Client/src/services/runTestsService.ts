import api from "../api/axios";
import { getAuthenticatedRole } from "../app/auth";
import type { RunTestsResponse, TestRunJobStatusResponse } from "../types/runTests";

function getBasePath(): string {
  const role = getAuthenticatedRole();
  switch (role) {
    case "FACULTY":
      return "/api/v1/faculty/submissions";
    case "STUDENT":
      return "/api/v1/student/submissions";
    case "GRADING_ASSISTANT":
      return "/api/v1/grading-assistant/submissions";
    default:
      return "/api/v1/student/submissions";
  }
}

/**
 * Request a test run for the given submission. Returns job id; poll getRunTestsLatest or getRunTestsByJobId for status.
 */
export async function requestRunTests(submissionId: number | string): Promise<RunTestsResponse> {
  const base = getBasePath();
  const id = Number(submissionId);
  const { data } = await api.post<RunTestsResponse>(`${base}/${id}/run-tests`);
  return data;
}

/**
 * Get the latest test run for a submission (for polling).
 */
export async function getRunTestsLatest(submissionId: number | string): Promise<TestRunJobStatusResponse | null> {
  const base = getBasePath();
  const id = Number(submissionId);
  try {
    const { data } = await api.get<TestRunJobStatusResponse>(`${base}/${id}/run-tests/latest`);
    return data;
  } catch (e: unknown) {
    const status = (e as { response?: { status?: number } })?.response?.status;
    if (status === 404) return null;
    throw e;
  }
}

/**
 * Get a specific test run job by id.
 */
export async function getRunTestsByJobId(jobId: number): Promise<TestRunJobStatusResponse> {
  const role = getAuthenticatedRole();
  const base =
    role === "FACULTY"
      ? "/api/v1/faculty/submissions"
      : role === "GRADING_ASSISTANT"
        ? "/api/v1/grading-assistant/submissions"
        : "/api/v1/student/submissions";
  const { data } = await api.get<TestRunJobStatusResponse>(`${base}/run-tests/${jobId}`);
  return data;
}

const TERMINAL_STATUSES: Set<string> = new Set(["COMPLETED", "FAILED"]);

/**
 * Poll for job status until COMPLETED or FAILED, or timeout. Uses submissionId and latest endpoint.
 */
export async function pollRunTestsUntilDone(
  submissionId: number | string,
  options: { intervalMs?: number; timeoutMs?: number } = {}
): Promise<TestRunJobStatusResponse> {
  const { intervalMs = 1500, timeoutMs = 120000 } = options;
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const job = await getRunTestsLatest(submissionId);
    if (job && TERMINAL_STATUSES.has(job.status)) {
      return job;
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error("Run tests timed out.");
}
