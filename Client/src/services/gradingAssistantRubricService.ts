import api from "../api/axios";
import type { GradingAssistantRubricResponse } from "../types/gradingAssistantRubric";

const BASE = "/api/v1/grading-assistant/rubrics";

export async function getRubric(
  id: number | string
): Promise<GradingAssistantRubricResponse> {
  const { data } = await api.get<GradingAssistantRubricResponse>(
    `${BASE}/${id}`
  );
  return data;
}
