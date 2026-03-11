export type GraderReportStatus = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
export type GraderReportTriggerType = "DEADLINE" | "MANUAL";

export interface GraderReportResponse {
  id: number;
  assignmentId: number;
  generatedAt: string;
  triggerType: GraderReportTriggerType;
  status: GraderReportStatus;
  errorMessage: string | null;
  /** Full pipeline JSON when status is COMPLETED; null otherwise. */
  result: string | null;
}

/** One student's result in the pipeline output (parsed from result JSON). */
export interface GraderReportResultItem {
  student_id: string;
  final_grade: number;
  similarity_score: number;
  similarity_warning: string | null;
  comparisons: GraderReportComparison[];
  ai_features: Record<string, unknown>;
}

export interface GraderReportComparison {
  left: { student_id: string; file_path: string; code: string; similarity: number };
  right: { student_id: string; file_path: string; code: string; similarity: number };
  overlap_tokens?: number;
}

export interface GraderReportResultPayload {
  assignment_id: string;
  results: GraderReportResultItem[];
  highlight_markers: { start: string; end: string };
  ai_features: Record<string, unknown>;
}
