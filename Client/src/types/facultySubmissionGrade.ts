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

