/** Payload for creating or updating a grading assistant. */
export interface GradingAssistantRequest {
  name: string;
  email: string;
  password?: string;
  officeHours?: string;
  department?: string;
}

/** Response shape from the grading assistant API. */
export interface GradingAssistantResponse {
  id: number;
  userId: number;
  facultyId: number;
  name: string;
  email: string;
  role: string;
  officeHours?: string;
  department?: string;
}
