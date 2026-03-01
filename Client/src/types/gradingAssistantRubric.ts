/** GET /api/v1/grading-assistant/rubrics/{id} */
export interface GradingAssistantRubricResponse {
  id: number;
  name?: string | null;
  description?: string | null;
  facultyId?: number | null;
  criteria?: RubricCriteriaResponse[] | null;
}

export interface RubricCriteriaResponse {
  id: number;
  title?: string | null;
  description?: string | null;
  maxScore?: number | null;
  weight?: number | null;
}
