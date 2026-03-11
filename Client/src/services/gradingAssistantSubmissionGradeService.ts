import api from "../api/axios";
import type {
  SubmissionGradeRequest,
  SubmissionGradeResponse,
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
