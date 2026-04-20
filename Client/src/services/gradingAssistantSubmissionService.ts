import api from "../api/axios";
import type {
  GradingAssistantSubmissionResponse,
  SubmissionGradeRequest,
} from "../types/gradingAssistantSubmission";

const BASE = "/api/v1/grading-assistant/submissions";

export async function listSubmissionsByAssignment(
  assignmentId: number | string
): Promise<GradingAssistantSubmissionResponse[]> {
  const { data } = await api.get<GradingAssistantSubmissionResponse[]>(BASE, {
    params: { assignmentId: String(assignmentId) },
  });
  return data ?? [];
}

export async function getSubmissionById(
  submissionId: number | string
): Promise<GradingAssistantSubmissionResponse> {
  const id = Number(submissionId);
  const { data } = await api.get<GradingAssistantSubmissionResponse>(`${BASE}/${id}`);
  return data;
}

export async function updateSubmissionGrade(
  submissionId: number | string,
  payload: SubmissionGradeRequest
): Promise<GradingAssistantSubmissionResponse> {
  const id = Number(submissionId);
  const { data } = await api.put<GradingAssistantSubmissionResponse>(
    `${BASE}/${id}/grade`,
    payload
  );
  return data;
}
