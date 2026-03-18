import api from "../api/axios";
import type {
  CourseGradeReportResponse,
  AssignmentGradeReportResponse,
} from "../types/gradeReport";

/** GET /api/v1/faculty/courses/{courseId}/grade-report — full course gradebook */
export async function getCourseGradeReport(
  courseId: number,
  studentIds?: number[],
  assignmentIds?: number[],
): Promise<CourseGradeReportResponse> {
  const params =
    (studentIds != null && studentIds.length > 0) || (assignmentIds != null && assignmentIds.length > 0)
      ? {
          studentIds: studentIds?.length ? studentIds.join(",") : undefined,
          assignmentIds: assignmentIds?.length ? assignmentIds.join(",") : undefined,
        }
      : undefined;
  const { data } = await api.get<CourseGradeReportResponse>(
    `/api/v1/faculty/courses/${courseId}/grade-report`,
    { params },
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
