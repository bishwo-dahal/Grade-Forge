import type { GraderReportResultPayload } from "../types/graderReport";

export type LlmReportBanner = { text: string; severity: "warning" };

/**
 * Faculty-facing notice when optional LLM evidence failed (only errors; success is silent).
 * Hides legacy info/success lines from older report JSON.
 */
export function getLlmReportBanner(payload: GraderReportResultPayload | null): LlmReportBanner | null {
  if (!payload?.ai_features?.model_info) return null;
  const mi = payload.ai_features.model_info;
  const report = typeof mi.llm_ai_signal_report === "string" ? mi.llm_ai_signal_report.trim() : "";
  if (report) {
    if (mi.llm_ai_signal_report_severity !== "warning") return null;
    return { text: report, severity: "warning" };
  }
  const reason =
    typeof mi.llm_ai_signal_unavailable_reason === "string"
      ? mi.llm_ai_signal_unavailable_reason.trim()
      : "";
  if (reason) {
    return {
      text: `Our model could not generate LLM evidence. ${reason}`,
      severity: "warning",
    };
  }
  return null;
}
