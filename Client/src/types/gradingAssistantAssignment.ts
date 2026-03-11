/** GET /api/v1/grading-assistant/assignments?courseId= - list for a course. */
export interface AssignmentBasicResponse {
  id: number;
  courseId: number;
  name: string;
  description?: string | null;
  totalPoints?: number | null;
  availableFrom?: string | null;
  dueDate?: string | null;
  lateDueDate?: string | null;
}

/** GET /api/v1/grading-assistant/assignments/course/{courseId}/{assignmentId} - full details. */
export interface AssignmentDetailResponse {
  id: number;
  courseId: number;
  courseName?: string | null;
  languageId?: number | null;
  languageName?: string | null;
  name: string;
  description?: string | null;
  totalPoints?: number | null;
  submissionType?: string | null;
  starterCodeUrl?: string | null;
  availableFrom?: string | null;
  dueDate?: string | null;
  lateDueDate?: string | null;
  rubricId?: number | null;
  rubricName?: string | null;
}
