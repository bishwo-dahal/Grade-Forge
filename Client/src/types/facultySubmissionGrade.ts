export interface FacultySubmissionGradeRequest {
  submissionId: number;
  rubricCriteriaId: number;
  awardedScore: number;
  feedback?: string | null;
}

export interface FacultySubmissionGradeResponse {
  id: number;
  submissionId: number;
  rubricCriteriaId: number;
  rubricCriteriaTitle?: string | null;
  awardedScore: number;
  feedback?: string | null;
}

/** POST /api/v1/faculty/submission-grades batch request */
export interface SubmissionGradeBatchRequest {
  submissionId: number;
  grades: SubmissionGradeItemRequest[];
}

export interface SubmissionGradeItemRequest {
  rubricSubCriteriaId: number;
  awardedScore: number;
  feedback?: string | null;
}

/** Batch create response item */
export interface SubmissionGradeResponse {
  id: number;
  submissionId: number;
  rubricSubCriteriaId: number;
  rubricSubCriteriaDescription?: string | null;
  rubricCriteriaId: number;
  rubricCriteriaTitle?: string | null;
  awardedScore: number;
  feedback?: string | null;
}

