/** Payload for assigning or updating a course assistant. */
export interface CourseAssistantRequest {
  courseId: number;
  gradingAssistantId: number;
}

/** Response shape from the course assistant API. */
export interface CourseAssistantResponse {
  id: number;
  courseId: number;
  courseName: string;
  gradingAssistantId: number;
  gradingAssistantName: string;
  gradingAssistantEmail: string;
  assignedAt: string;
}
