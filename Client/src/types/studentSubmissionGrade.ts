/** GET /api/v1/student/submission-grades?submissionId= response */
export interface StudentSubmissionGradesResponse {
  submissionId: number;
  grades: Array<{
    rubricSubCriteriaId: number;
    awardedScore: number;
    feedback?: string | null;
  }>;
}
