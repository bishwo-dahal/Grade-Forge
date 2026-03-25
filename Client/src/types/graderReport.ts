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
  student_name?: string | null;
  final_grade: number;
  similarity_score: number;
  similarity_warning: string | null;
  matches_count?: number;
  comparisons: GraderReportComparison[];
  ai_features: {
    risk_score?: number;
    risk_level?: "none" | "low" | "medium" | "high";
    top_reasons?: string[];
    signals?: Array<{
      kind: string;
      weight: number;
      value?: number | string;
      reason: string;
      cohort_median?: number;
    }>;
    llm_rationale?: {
      summary?: string;
      caveats?: string[];
      model?: string;
      source?: string;
    };
    metrics?: {
      code_lines?: number;
      comment_ratio?: number;
      avg_line_length?: number;
      line_length_std?: number;
      long_identifier_ratio?: number;
      non_ascii_count?: number;
      em_dash_count?: number;
      marker_hits?: number;
    };
    [key: string]: unknown;
  };
}

export interface GraderReportComparison {
  left: {
    student_id: string;
    student_name?: string | null;
    file_path: string;
    code: string;
    similarity: number;
    token_similarity?: number;
    structural_similarity?: number;
    combined_similarity?: number;
  };
  right: {
    student_id: string;
    student_name?: string | null;
    file_path: string;
    code: string;
    similarity: number;
    token_similarity?: number;
    structural_similarity?: number;
    combined_similarity?: number;
  };
  overlap_tokens?: number;
}

export interface GraderReportResultPayload {
  assignment_id: string;
  results: GraderReportResultItem[];
  highlight_markers: { start: string; end: string };
  ai_features: {
    summary?: {
      total_students: number;
      flagged_students: number;
      max_similarity: number;
    };
    authorship_risk_summary?: {
      total_students: number;
      high_risk_students: number;
      medium_risk_students: number;
      max_risk_score: number;
    };
    model_info?: {
      name?: string;
      type?: string;
      uses_training_data?: boolean;
    };
    disclaimer?: string;
    rationale_mode?: "deterministic_only" | "llm_assisted";
    // Allow any future assignment-level AI features.
    [key: string]: unknown;
  };
}
