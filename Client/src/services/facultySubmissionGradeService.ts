import api from "../api/axios";
import type {
  FacultySubmissionGradeRequest,
  FacultySubmissionGradeResponse,
  SubmissionGradeBatchRequest,
  SubmissionGradeResponse,
} from "../types/facultySubmissionGrade";

const BASE = "/api/v1/faculty/submission-grades";

export async function getFacultyGradesBySubmission(
  submissionId: number | string,
): Promise<FacultySubmissionGradeResponse[]> {
  const { data } = await api.get<FacultySubmissionGradeResponse[]>(BASE, {
    params: { submissionId: String(submissionId) },
  });
  return data ?? [];
}

export async function createFacultyGrade(
  payload: FacultySubmissionGradeRequest,
): Promise<FacultySubmissionGradeResponse> {
  const { data } = await api.post<FacultySubmissionGradeResponse>(BASE, payload);
  return data;
}

export async function updateFacultyGrade(
  id: number | string,
  payload: FacultySubmissionGradeRequest,
): Promise<FacultySubmissionGradeResponse> {
  const { data } = await api.put<FacultySubmissionGradeResponse>(`${BASE}/${id}`, payload);
  return data;
}

/** GET grades for a submission by submission ID (path). Returns list of SubmissionGradeResponse. */
export async function getSubmissionGrades(
  submissionId: number | string,
): Promise<SubmissionGradeResponse[]> {
  const id = String(submissionId);
  const { data } = await api.get<SubmissionGradeResponse[]>(`${BASE}/${id}`);
  if (Array.isArray(data)) return data;
  if (data != null && typeof data === "object" && "id" in data) return [data as SubmissionGradeResponse];
  return [];
}

/** POST batch: create all grades for a submission in one request */
export async function createGradesBatch(
  request: SubmissionGradeBatchRequest,
): Promise<SubmissionGradeResponse[]> {
  const { data } = await api.post<SubmissionGradeResponse[]>(BASE, request);
  return data ?? [];
}

/** PUT replace all grades for a submission (edit existing). */
export async function replaceSubmissionGrades(
  submissionId: number | string,
  request: SubmissionGradeBatchRequest,
): Promise<SubmissionGradeResponse[]> {
  const id = String(submissionId);
  const { data } = await api.put<SubmissionGradeResponse[]>(`${BASE}/${id}`, request);
  return data ?? [];
}

