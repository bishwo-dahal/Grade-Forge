import React, { useCallback, useEffect, useState } from "react";
import {
  requestGraderReport,
  getGraderReportLatest,
  pollGraderReportUntilDone,
} from "../../../services/graderReportService";
import type {
  GraderReportResponse,
  GraderReportResultPayload,
  GraderReportResultItem,
} from "../../../types/graderReport";

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return "—";
  }
}

function parseResultPayload(resultJson: string | null): GraderReportResultPayload | null {
  if (!resultJson || resultJson.trim() === "") return null;
  try {
    return JSON.parse(resultJson) as GraderReportResultPayload;
  } catch {
    return null;
  }
}

interface PlagiarismReportPanelProps {
  assignmentId: string;
  isFaculty: boolean;
}

export function PlagiarismReportPanel({ assignmentId, isFaculty }: PlagiarismReportPanelProps) {
  const [report, setReport] = useState<GraderReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);

  const fetchLatest = useCallback(async () => {
    if (!assignmentId) return;
    setError(null);
    try {
      const latest = await getGraderReportLatest(assignmentId);
      setReport(latest ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load report.");
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => {
    if (!assignmentId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchLatest();
  }, [assignmentId, fetchLatest]);

  // Poll while report is PENDING or RUNNING
  useEffect(() => {
    if (!report || report.status === "COMPLETED" || report.status === "FAILED") return;
    const interval = setInterval(fetchLatest, 3000);
    return () => clearInterval(interval);
  }, [report?.status, fetchLatest]);

  const handleGenerate = useCallback(async () => {
    if (!assignmentId || !isFaculty) return;
    setGenerating(true);
    setError(null);
    try {
      await requestGraderReport(assignmentId);
      const done = await pollGraderReportUntilDone(assignmentId, { intervalMs: 3000, timeoutMs: 300000 });
      setReport(done);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate report.");
    } finally {
      setGenerating(false);
    }
  }, [assignmentId, isFaculty]);

  const payload = report?.result ? parseResultPayload(report.result) : null;
  const results = payload?.results ?? [];
  const isTerminal = report?.status === "COMPLETED" || report?.status === "FAILED";
  const isRunning = report?.status === "PENDING" || report?.status === "RUNNING";

  if (loading && !report) {
    return (
      <div className="p-6 text-[14px] text-gray-500">
        Loading report…
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-lg font-semibold text-[#2B2A2A]">Similarity Report</h2>
        {isFaculty && (
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating || isRunning}
            className="px-4 py-2 rounded-lg bg-[#2B2A2A] hover:bg-[#3a3939] disabled:opacity-50 disabled:cursor-not-allowed text-white text-[14px] font-medium"
          >
            {generating || isRunning ? "Generating…" : "Generate report"}
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-[14px] text-red-700">
          {error}
        </div>
      )}

      {!report && !loading && (
        <p className="text-[14px] text-gray-500">
          No report yet.{isFaculty ? " Click “Generate report” to run similarity analysis for this assignment." : ""}
        </p>
      )}

      {report && isTerminal && report.status === "FAILED" && (
        <p className="text-[14px] text-red-600">
          Report failed: {report.errorMessage ?? "Unknown error"}
        </p>
      )}

      {report && isRunning && (
        <p className="text-[14px] text-gray-600">
          Report is being generated… This may take a few minutes.
        </p>
      )}

      {report && report.status === "COMPLETED" && (
        <>
          <p className="text-[13px] text-gray-500 mb-4">
            Generated at {formatDate(report.generatedAt)}
            {report.triggerType === "DEADLINE" && " (automatic after deadline)"}
          </p>

          {results.length === 0 ? (
            <p className="text-[14px] text-gray-500">No submissions in this report.</p>
          ) : (
            <div className="space-y-2">
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-left text-[14px]">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-2 font-medium text-[#2B2A2A]">Student</th>
                      <th className="px-4 py-2 font-medium text-[#2B2A2A]">Similarity</th>
                      <th className="px-4 py-2 font-medium text-[#2B2A2A]">Warning</th>
                      <th className="px-4 py-2 w-8" />
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((row: GraderReportResultItem) => {
                      const simPct = Math.round((row.similarity_score ?? 0) * 100);
                      const hasComparisons = row.comparisons?.length > 0;
                      const isExpanded = expandedStudentId === row.student_id;
                      return (
                        <React.Fragment key={row.student_id}>
                          <tr className="border-b border-gray-100 hover:bg-gray-50/80">
                            <td className="px-4 py-2 font-mono text-[13px]">{row.student_id}</td>
                            <td className="px-4 py-2">
                              <span
                                className={
                                  simPct >= 50 ? "font-semibold text-amber-600" : "text-gray-700"
                                }
                              >
                                {simPct}%
                              </span>
                            </td>
                            <td className="px-4 py-2 text-gray-600 text-[13px] max-w-[200px] truncate">
                              {row.similarity_warning ?? "—"}
                            </td>
                            <td className="px-4 py-2">
                              {hasComparisons && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedStudentId(isExpanded ? null : row.student_id)
                                  }
                                  className="text-[#5A7ACD] hover:underline text-[13px]"
                                >
                                  {isExpanded ? "Hide" : "Show"} comparisons
                                </button>
                              )}
                            </td>
                          </tr>
                          {isExpanded && hasComparisons && (
                            <tr className="bg-gray-50/50">
                              <td colSpan={4} className="px-4 py-3">
                                <div className="space-y-3 text-[13px]">
                                  {row.comparisons.map((comp, idx) => (
                                    <div
                                      key={idx}
                                      className="rounded border border-gray-200 bg-white p-3"
                                    >
                                      <div className="grid grid-cols-2 gap-3">
                                        <div>
                                          <p className="font-medium text-gray-700 mb-1">
                                            You (left) — {Math.round((comp.left.similarity ?? 0) * 100)}%
                                          </p>
                                          <pre className="whitespace-pre-wrap break-words text-[12px] bg-gray-50 p-2 rounded max-h-40 overflow-auto">
                                            {comp.left.code?.replace(/<[^>]+>/g, "").replace(/&quot;/g, '"').replace(/&#34;/g, '"') ?? "—"}
                                          </pre>
                                        </div>
                                        <div>
                                          <p className="font-medium text-gray-700 mb-1">
                                            Other (right) — {Math.round((comp.right.similarity ?? 0) * 100)}%
                                          </p>
                                          <pre className="whitespace-pre-wrap break-words text-[12px] bg-gray-50 p-2 rounded max-h-40 overflow-auto">
                                            {comp.right.code?.replace(/<[^>]+>/g, "").replace(/&quot;/g, '"').replace(/&#34;/g, '"') ?? "—"}
                                          </pre>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
