import api from "../api/axios";
import type { GradingAssistantCourseResponse } from "../types/gradingAssistantCourse";

const BASE = "/api/v1/grading-assistant/courses";

export async function listGradingAssistantCourses(): Promise<GradingAssistantCourseResponse[]> {
  const { data } = await api.get<GradingAssistantCourseResponse[]>(BASE);
  return data ?? [];
}
