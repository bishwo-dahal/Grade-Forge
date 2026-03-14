/** GET /api/v1/grading-assistant/rubrics/{id} — may return same shape as faculty (rubricType, criteria[].points, subCriteria). */
export interface GradingAssistantRubricResponse {
  id: number;
  name?: string | null;
  description?: string | null;
  facultyId?: number | null;
  rubricType?: "WEIGHTED" | "UNWEIGHTED";
  criteria?: (RubricCriteriaResponse | GradingAssistantRubricCriterionNested)[] | null;
}

export interface RubricCriteriaResponse {
  id: number;
  title?: string | null;
  description?: string | null;
  maxScore?: number | null;
  weight?: number | null;
}

/** Criterion with nested subCriteria (same as faculty rubric). */
export interface GradingAssistantRubricCriterionNested {
  id?: number;
  title?: string | null;
  points?: number | null;
  subCriteria?: Array<{
    id?: number;
    description?: string | null;
    maxScore: number;
    weight?: number | null;
  }>;
}
