import api from "../api/axios";
import type {
  AssignmentBasicResponse,
  AssignmentDetailResponse,
} from "../types/gradingAssistantAssignment";

const BASE = "/api/v1/grading-assistant/assignments";

export async function listAssignmentsByCourse(
  courseId: number | string
): Promise<AssignmentBasicResponse[]> {
  const { data } = await api.get<AssignmentBasicResponse[]>(BASE, {
    params: { courseId: String(courseId) },
  });
  return data ?? [];
}

export async function getAssignmentByCourse(
  courseId: number | string,
  assignmentId: number | string
): Promise<AssignmentDetailResponse> {
  const cId = Number(courseId);
  const aId = Number(assignmentId);
  const { data } = await api.get<AssignmentDetailResponse>(
    `${BASE}/course/${cId}/${aId}`
  );
  return data;
}
