import api from "../api/axios";
import type { StudentSubmissionGradesResponse } from "../types/studentSubmissionGrade";

/** GET /api/v1/student/submission-grades?submissionId= — returns rubric grades for the student's submission. */
export async function getStudentSubmissionGrades(
  submissionId: number | string
): Promise<StudentSubmissionGradesResponse | null> {
  try {
    const { data } = await api.get<StudentSubmissionGradesResponse>(
      "/api/v1/student/submission-grades",
      { params: { submissionId: String(submissionId) } }
    );
    return data ?? null;
  } catch {
    return null;
  }
}
