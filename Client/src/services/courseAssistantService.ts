import api from "../api/axios";
import type {
  CourseAssistantRequest,
  CourseAssistantResponse,
} from "../types/courseAssistant";

const BASE = "/api/v1/faculty/course-assistants";

export async function listCourseAssistants(
  courseId?: number | string
): Promise<CourseAssistantResponse[]> {
  const params =
    courseId != null ? { courseId: String(courseId) } : undefined;
  const { data } = await api.get<CourseAssistantResponse[]>(BASE, { params });
  return data ?? [];
}

export async function assignCourseAssistant(
  payload: CourseAssistantRequest
): Promise<CourseAssistantResponse> {
  const { data } = await api.post<CourseAssistantResponse>(BASE, payload);
  return data;
}

export async function updateCourseAssistant(
  id: number | string,
  payload: CourseAssistantRequest
): Promise<CourseAssistantResponse> {
  const numericId = Number(id);
  const { data } = await api.put<CourseAssistantResponse>(
    `${BASE}/${numericId}`,
    payload
  );
  return data;
}

export async function removeCourseAssistant(id: number | string): Promise<void> {
  const numericId = Number(id);
  await api.delete(`${BASE}/${numericId}`);
}
