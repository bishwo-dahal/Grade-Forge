/** GET /api/v1/grading-assistant/submissions?assignmentId= */
export interface GradingAssistantSubmissionResponse {
  /** Backend may send submissionId; use for links and API calls. */
  submissionId?: number;
  /** Legacy/alternate; prefer submissionId when present. */
  id?: number;
  assignmentId?: number;
  assignmentName?: string | null;
  courseId?: number;
  courseName?: string | null;
  studentId: number;
  studentName?: string | null;
  studentEmail?: string | null;
  files?: SubmissionFileResponse[] | null;
  marks?: number | null;
  feedback?: string | null;
  grade?: number | null;
  submittedAt?: string | null;
  status?: string | null;
}

export interface SubmissionFileResponse {
  id?: number;
  fileName?: string;
  /** Backend sends downloadUrl; we map it for the table. */
  downloadUrl?: string | null;
  /** Legacy/alternate key; prefer downloadUrl. */
  url?: string;
  [key: string]: unknown;
}

/** PUT /api/v1/grading-assistant/submissions/{id}/grade */
export interface SubmissionGradeRequest {
  marks: number;
  feedback?: string | null;
}
