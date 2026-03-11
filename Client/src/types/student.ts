// NOTE: UI-driven student profile payload used by registration completion flow.
export interface StudentRegistrationCompletionRequest {
  cwid: string;
  major: string;
  canvasUserId: string;
}

// NOTE: Response shape mirrors backend student DTO fields currently used by the completion page flow.
export interface StudentRegistrationCompletionResponse {
  id: number;
  userId: number;
  cwid: string;
  major: string;
  canvasUserId: string;
}
