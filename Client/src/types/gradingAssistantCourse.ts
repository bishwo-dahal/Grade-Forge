/** Response from GET /api/v1/grading-assistant/courses (courses assigned to the grading assistant). */
export interface GradingAssistantCourseResponse {
  id: number;
  name: string;
  courseCode: string;
  section?: string;
  description?: string | null;
  imageUrl?: string | null;
  canvasCourseId?: string | null;
  active?: boolean;
  isPublished?: boolean;
  semester?: GradingAssistantCourseSemester | null;
  faculty?: GradingAssistantCourseFaculty | null;
}

export interface GradingAssistantCourseSemester {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
}

export interface GradingAssistantCourseFaculty {
  id: number;
  name: string;
  email: string;
  department?: string | null;
  qualifications?: string | null;
}
