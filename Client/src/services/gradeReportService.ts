import api from "../api/axios";
import type {
  CourseGradeReportResponse,
  AssignmentGradeReportResponse,
} from "../types/gradeReport";

/** GET /api/v1/faculty/courses/{courseId}/grade-report — full course gradebook */
export async function getCourseGradeReport(
  courseId: number
): Promise<CourseGradeReportResponse> {
  const { data } = await api.get<CourseGradeReportResponse>(
    `/api/v1/faculty/courses/${courseId}/grade-report`
  );
  return data;
}

/** GET /api/v1/faculty/courses/{courseId}/grade-report/assignments/{assignmentId} — optional studentIds filter */
export async function getAssignmentGradeReport(
  courseId: number,
  assignmentId: number,
  studentIds?: number[]
): Promise<AssignmentGradeReportResponse> {
  const params =
    studentIds != null && studentIds.length > 0
      ? { studentIds: studentIds.join(",") }
      : undefined;
  const { data } = await api.get<AssignmentGradeReportResponse>(
    `/api/v1/faculty/courses/${courseId}/grade-report/assignments/${assignmentId}`,
    { params }
  );
  return data;
}
