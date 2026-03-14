import api from "../api/axios";
import type {
  SubmissionGradeRequest,
  SubmissionGradeResponse,
  GASubmissionGradesResponse,
  GASubmissionGradeBatchRequest,
} from "../types/gradingAssistantSubmissionGrade";

const BASE = "/api/v1/grading-assistant/submission-grades";

export async function getGradesBySubmission(
  submissionId: number | string
): Promise<SubmissionGradeResponse[]> {
  const { data } = await api.get<SubmissionGradeResponse[]>(BASE, {
    params: { submissionId: String(submissionId) },
  });
  return data ?? [];
}

/** GET /api/v1/grading-assistant/submission-grades/{submissionId} — returns existing grades for rubric table prefill. */
export async function getGASubmissionGrades(
  submissionId: number | string
): Promise<Array<{ rubricSubCriteriaId: number; awardedScore: number; feedback?: string | null }>> {
  const id = String(submissionId);
  try {
    const { data } = await api.get<GASubmissionGradesResponse>(`${BASE}/${id}`);
    return data?.grades ?? [];
  } catch {
    return [];
  }
}

/** POST /api/v1/grading-assistant/submission-grades — create rubric grades for a submission (batch). */
export async function createGASubmissionGradesBatch(
  request: GASubmissionGradeBatchRequest
): Promise<GASubmissionGradesResponse> {
  const { data } = await api.post<GASubmissionGradesResponse>(BASE, request);
  return data;
}

/** PUT /api/v1/grading-assistant/submission-grades/{submissionId} — replace rubric grades for a submission. */
export async function replaceGASubmissionGrades(
  submissionId: number | string,
  request: GASubmissionGradeBatchRequest
): Promise<GASubmissionGradesResponse> {
  const id = String(submissionId);
  const { data } = await api.put<GASubmissionGradesResponse>(`${BASE}/${id}`, request);
  return data;
}

export async function getGrade(
  id: number | string
): Promise<SubmissionGradeResponse> {
  const { data } = await api.get<SubmissionGradeResponse>(`${BASE}/${id}`);
  return data;
}

export async function createGrade(
  payload: SubmissionGradeRequest
): Promise<SubmissionGradeResponse> {
  const { data } = await api.post<SubmissionGradeResponse>(BASE, payload);
  return data;
}

export async function updateGrade(
  id: number | string,
  payload: SubmissionGradeRequest
): Promise<SubmissionGradeResponse> {
  const { data } = await api.put<SubmissionGradeResponse>(
    `${BASE}/${id}`,
    payload
  );
  return data;
}
