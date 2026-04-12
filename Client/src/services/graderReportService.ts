import api from "../api/axios";
import type {
  GraderReportResponse,
  GraderReportResultItem,
  GraderReportResultPayload,
} from "../types/graderReport";

const BASE = "/api/v1/faculty/assignments";

/**
 * Trigger grader report generation for an assignment. Returns 202 with report id and status PENDING.
 * Consumer will process in background; poll getGraderReportLatest until status is COMPLETED or FAILED.
 */
export async function requestGraderReport(assignmentId: number | string): Promise<GraderReportResponse> {
  const id = Number(assignmentId);
  const { data } = await api.post<GraderReportResponse>(`${BASE}/${id}/grader-report`);
  return data;
}

/**
 * Get the latest grader report for an assignment. Returns null if none (404).
 */
export async function getGraderReportLatest(assignmentId: number | string): Promise<GraderReportResponse | null> {
  const id = Number(assignmentId);
  try {
    const { data } = await api.get<GraderReportResponse>(`${BASE}/${id}/grader-report/latest`);
    return data;
  } catch (e: unknown) {
    const status = (e as { response?: { status?: number } })?.response?.status;
    if (status === 404) return null;
    throw e;
  }
}

const TERMINAL_STATUSES: Set<string> = new Set(["COMPLETED", "FAILED"]);

/**
 * Poll for report status until COMPLETED or FAILED, or timeout.
 */
export async function pollGraderReportUntilDone(
  assignmentId: number | string,
  options: { intervalMs?: number; timeoutMs?: number } = {}
): Promise<GraderReportResponse> {
  const { intervalMs = 3000, timeoutMs = 300000 } = options; // 5 min max
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const report = await getGraderReportLatest(assignmentId);
    if (report && TERMINAL_STATUSES.has(report.status)) {
      return report;
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error("Grader report timed out.");
}

/**
 * Convenience helper: get plagiarism info for a single student from the latest report.
 * Returns null if no report exists or the student is not present in the results.
 */
export async function getLatestGraderReportForStudent(
  assignmentId: number | string,
  studentId: number | string,
): Promise<{ report: GraderReportResponse; student: GraderReportResultItem } | null> {
  const latest = await getGraderReportLatest(assignmentId);
  if (!latest || !latest.result || latest.status !== "COMPLETED") {
    return null;
  }
  let payload: GraderReportResultPayload | null = null;
  try {
    payload = JSON.parse(latest.result) as GraderReportResultPayload;
  } catch {
    return null;
  }
  const sid = String(studentId);
  const match = payload.results.find((r) => r.student_id === sid);
  if (!match) {
    return null;
  }
  return { report: latest, student: match };
}
