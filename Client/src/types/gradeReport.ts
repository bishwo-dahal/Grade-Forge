/** Assignment grade item in course grade report (GET .../grade-report) */
export interface CourseGradeReportAssignment {
  assignmentId: number;
  assignmentName: string;
  score: number | null;
  maxScore: number;
  status: "NOT_SUBMITTED" | "SUBMITTED" | "GRADED";
}

/** Student row in course grade report */
export interface CourseGradeReportStudent {
  studentId: number;
  studentName: string;
  totalScore: number;
  assignments: CourseGradeReportAssignment[];
}

/** GET /api/v1/faculty/courses/{courseId}/grade-report */
export interface CourseGradeReportResponse {
  courseId: number;
  courseName: string;
  students: CourseGradeReportStudent[];
}

/** Student row in assignment-grade report */
export interface AssignmentGradeReportStudent {
  studentId: number;
  studentName: string;
  score: number | null;
  maxScore: number;
  status: "NOT_SUBMITTED" | "SUBMITTED" | "GRADED";
}

/** GET /api/v1/faculty/courses/{courseId}/grade-report/assignments/{assignmentId}?studentIds=1,2,3 */
export interface AssignmentGradeReportResponse {
  courseId: number;
  assignmentId: number;
  assignmentName: string;
  students: AssignmentGradeReportStudent[];
}
