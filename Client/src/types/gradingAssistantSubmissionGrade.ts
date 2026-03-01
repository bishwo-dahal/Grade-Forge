/** POST/PUT /api/v1/grading-assistant/submission-grades */
export interface SubmissionGradeRequest {
  submissionId: number;
  rubricCriteriaId: number;
  awardedScore: number;
  feedback?: string | null;
}

/** GET /api/v1/grading-assistant/submission-grades, GET by id */
export interface SubmissionGradeResponse {
  id: number;
  submissionId: number;
  rubricCriteriaId: number;
  rubricCriteriaTitle?: string | null;
  awardedScore: number;
  feedback?: string | null;
}
