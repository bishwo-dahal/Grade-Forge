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

function decodeBasicEntities(raw: string): string {
  // Minimal decoding for strings produced by copydetect.
  return raw
    .replace(/&quot;/g, '"')
    .replace(/&#34;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function stripUnknownTags(raw: string): string {
  // Remove any remaining HTML tags (we handle highlight spans separately).
  return raw.replace(/<[^>]+>/g, "");
}

function renderCopydetectSpans(
  rawCode: string,
  classes: { red: string; green: string }
): React.ReactNode | null {
  // copydetect emits <span class='highlight-red'> ... </span> and highlight-green.
  const code = decodeBasicEntities(rawCode);
  if (!code.includes("highlight-red") && !code.includes("highlight-green")) {
    return null;
  }

  const openRe = /<span class='highlight-(red|green)'>/g;
  const closeTag = "</span>";

  const parts: React.ReactNode[] = [];
  let idx = 0;
  let currentColor: "red" | "green" | null = null;

  while (idx < code.length) {
    const openMatch = openRe.exec(code);
    const nextOpenIndex = openMatch ? openMatch.index : -1;
    const nextCloseIndex = currentColor ? code.indexOf(closeTag, idx) : -1;

    if (currentColor == null) {
      if (nextOpenIndex === -1) {
        parts.push(stripUnknownTags(code.slice(idx)));
        break;
      }
      if (nextOpenIndex > idx) {
        parts.push(stripUnknownTags(code.slice(idx, nextOpenIndex)));
      }
      currentColor = openMatch![1] as "red" | "green";
      idx = nextOpenIndex + openMatch![0].length;
      continue;
    }

    // We are inside a highlight span.
    if (nextCloseIndex === -1) {
      parts.push(
        <span key={`${idx}-tail`} className={currentColor === "red" ? classes.red : classes.green}>
          {stripUnknownTags(code.slice(idx))}
        </span>
      );
      break;
    }
    const highlightedText = stripUnknownTags(code.slice(idx, nextCloseIndex));
    parts.push(
      <span key={`${idx}-${nextCloseIndex}`} className={currentColor === "red" ? classes.red : classes.green}>
        {highlightedText}
      </span>
    );
    idx = nextCloseIndex + closeTag.length;
    currentColor = null;
    // Reset regex search position to current idx for the next open.
    openRe.lastIndex = idx;
  }

  return <>{parts}</>;
}

function renderHighlightedCode(
  rawCode: string | null | undefined,
  markers: { start: string; end: string } | null | undefined,
  highlightClassName: string
): React.ReactNode {
  if (!rawCode) return "—";
  const spanRendered = renderCopydetectSpans(rawCode, {
    red: highlightClassName,
    green: highlightClassName,
  });
  if (spanRendered) {
    return spanRendered;
  }

  const code = stripUnknownTags(decodeBasicEntities(rawCode));
  const start = markers?.start ?? ">>";
  const end = markers?.end ?? "<<";

  if (!code.includes(start) || !code.includes(end)) {
    return code;
  }

  const parts: React.ReactNode[] = [];
  let i = 0;
  while (i < code.length) {
    const s = code.indexOf(start, i);
    if (s === -1) {
      parts.push(code.slice(i));
      break;
    }
    if (s > i) {
      parts.push(code.slice(i, s));
    }
    const afterStart = s + start.length;
    const e = code.indexOf(end, afterStart);
    if (e === -1) {
      // Unbalanced marker; render remainder as plain text.
      parts.push(code.slice(s));
      break;
    }
    const matchText = code.slice(afterStart, e);
    parts.push(
      <span key={`${s}-${e}`} className={highlightClassName}>
        {matchText}
      </span>
    );
    i = e + end.length;
  }
  return <>{parts}</>;
}

interface PlagiarismReportPanelProps {
  assignmentId: string;
  isFaculty: boolean;
  /** When provided, show only this student's row (submission view). */
  studentId?: string | null;
}

export function PlagiarismReportPanel({ assignmentId, isFaculty, studentId }: PlagiarismReportPanelProps) {
  const [report, setReport] = useState<GraderReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<"all" | "high_struct" | "high_token">("all");
  const [sortMode, setSortMode] = useState<"ai_risk" | "similarity">("ai_risk");

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
  const allResults = payload?.results ?? [];
  const filteredResults = studentId ? allResults.filter((r) => r.student_id === String(studentId)) : allResults;
  const results = [...filteredResults].sort((a, b) => {
    if (sortMode === "similarity") {
      return (b.similarity_score ?? 0) - (a.similarity_score ?? 0);
    }
    return Number(b.ai_features?.risk_score ?? 0) - Number(a.ai_features?.risk_score ?? 0);
  });
  const highlightMarkers = payload?.highlight_markers ?? { start: ">>", end: "<<" };
  const summary = payload?.ai_features?.summary as
    | { total_students: number; flagged_students: number; max_similarity: number }
    | undefined;
  const authorshipSummary = payload?.ai_features?.authorship_risk_summary as
    | {
        total_students: number;
        high_risk_students: number;
        medium_risk_students: number;
        max_risk_score: number;
      }
    | undefined;
  const aiDisclaimer = typeof payload?.ai_features?.disclaimer === "string" ? payload.ai_features.disclaimer : null;
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
        <h2 className="text-lg font-semibold text-[#2B2A2A]">
          {studentId ? "Similarity (this submission)" : "Similarity Report"}
        </h2>
        {isFaculty && !studentId && (
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
          {studentId
            ? "No plagiarism report is available yet for this assignment."
            : `No report yet.${isFaculty ? " Click “Generate report” to run similarity analysis for this assignment." : ""}`}
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

          {!studentId && summary && (
            <>
              <div className="mb-3 inline-flex flex-wrap gap-3 text-[12px] text-gray-700">
                <span className="px-2 py-1 rounded-full bg-gray-50 border border-gray-200">
                  Students: {summary.total_students}
                </span>
                <span className="px-2 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700">
                  Similarity flagged: {summary.flagged_students}
                </span>
                <span className="px-2 py-1 rounded-full bg-gray-50 border border-gray-200">
                  Max similarity: {Math.round((summary.max_similarity ?? 0) * 100)}%
                </span>
                {authorshipSummary && (
                  <>
                    <span className="px-2 py-1 rounded-full bg-red-50 border border-red-200 text-red-700">
                      AI high risk: {authorshipSummary.high_risk_students}
                    </span>
                    <span className="px-2 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-700">
                      AI medium risk: {authorshipSummary.medium_risk_students}
                    </span>
                    <span className="px-2 py-1 rounded-full bg-gray-50 border border-gray-200">
                      Max AI risk: {Math.round((authorshipSummary.max_risk_score ?? 0) * 100)}%
                    </span>
                  </>
                )}
              </div>
              {aiDisclaimer && (
                <p className="mb-4 text-[12px] text-gray-600">
                  {aiDisclaimer}
                </p>
              )}
              <p className="mb-4 text-[12px] text-gray-600">
                Current version combines style-based heuristics with a small similarity-context weight for triage only.
              </p>
              {!studentId && (
                <div className="mb-4 flex items-center gap-2 text-[12px] text-gray-700">
                  <span>Sort rows by:</span>
                  <button
                    type="button"
                    onClick={() => setSortMode("ai_risk")}
                    className={
                      "px-2 py-0.5 rounded-full border text-xs " +
                      (sortMode === "ai_risk"
                        ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                        : "border-gray-300 bg-white text-gray-600")
                    }
                  >
                    AI risk
                  </button>
                  <button
                    type="button"
                    onClick={() => setSortMode("similarity")}
                    className={
                      "px-2 py-0.5 rounded-full border text-xs " +
                      (sortMode === "similarity"
                        ? "border-amber-300 bg-amber-50 text-amber-700"
                        : "border-gray-300 bg-white text-gray-600")
                    }
                  >
                    Similarity
                  </button>
                </div>
              )}
            </>
          )}

          {results.length === 0 ? (
            <p className="text-[14px] text-gray-500">
              {studentId ? "No plagiarism data found for this student in the latest report." : "No submissions in this report."}
            </p>
          ) : (
            <div className="space-y-2">
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-left text-[14px]">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-2 font-medium text-[#2B2A2A]">Student</th>
                      <th className="px-4 py-2 font-medium text-[#2B2A2A]">Similarity</th>
                      <th className="px-4 py-2 font-medium text-[#2B2A2A]">AI risk</th>
                      <th className="px-4 py-2 font-medium text-[#2B2A2A]">Warning</th>
                      <th className="px-4 py-2 w-8" />
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-100 bg-gray-50/60">
                      <td colSpan={5} className="px-4 py-2">
                        <div className="flex flex-wrap items-center gap-2 text-[12px] text-gray-700">
                          <span className="mr-1 text-gray-500">Filter comparisons:</span>
                          <button
                            type="button"
                            onClick={() => setFilterMode("all")}
                            className={
                              "px-2 py-0.5 rounded-full border text-xs " +
                              (filterMode === "all"
                                ? "border-[#5A7ACD] bg-[#EEF3FF] text-[#2B2A2A]"
                                : "border-gray-300 bg-white text-gray-600")
                            }
                          >
                            All
                          </button>
                          <button
                            type="button"
                            onClick={() => setFilterMode("high_struct")}
                            className={
                              "px-2 py-0.5 rounded-full border text-xs " +
                              (filterMode === "high_struct"
                                ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                                : "border-gray-300 bg-white text-gray-600")
                            }
                          >
                            High structural
                          </button>
                          <button
                            type="button"
                            onClick={() => setFilterMode("high_token")}
                            className={
                              "px-2 py-0.5 rounded-full border text-xs " +
                              (filterMode === "high_token"
                                ? "border-amber-400 bg-amber-50 text-amber-700"
                                : "border-gray-300 bg-white text-gray-600")
                            }
                          >
                            High token
                          </button>
                        </div>
                      </td>
                    </tr>
                    {results.map((row: GraderReportResultItem) => {
                      const simPct = Math.round((row.similarity_score ?? 0) * 100);
                      const hasComparisons = row.comparisons?.length > 0;
                      const matchesCount = (row as any).matches_count as number | undefined;
                      const riskLevel =
                        simPct >= 75
                          ? "High"
                          : simPct >= 40
                          ? "Medium"
                          : matchesCount && matchesCount > 0
                          ? "Low"
                          : "None";
                      const isExpanded = studentId ? true : expandedStudentId === row.student_id;
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
                              {riskLevel !== "None" && (
                                <span
                                  className={
                                    "ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] border " +
                                    (riskLevel === "High"
                                      ? "border-red-200 bg-red-50 text-red-700"
                                      : riskLevel === "Medium"
                                      ? "border-amber-200 bg-amber-50 text-amber-700"
                                      : "border-gray-200 bg-gray-50 text-gray-600")
                                  }
                                >
                                  {riskLevel} risk
                                  {matchesCount ? ` · ${matchesCount} match${matchesCount > 1 ? "es" : ""}` : ""}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-2 text-[13px]">
                              {(() => {
                                const aiScore = Number(row.ai_features?.risk_score ?? 0);
                                const aiLevel = String(row.ai_features?.risk_level ?? "none");
                                const aiPct = Math.round(aiScore * 100);
                                const reasons = Array.isArray(row.ai_features?.top_reasons)
                                  ? row.ai_features.top_reasons.slice(0, 2)
                                  : [];
                                if (aiLevel === "none" && aiPct <= 0) return <span className="text-gray-500">—</span>;
                                const levelClass =
                                  aiLevel === "high"
                                    ? "border-red-200 bg-red-50 text-red-700"
                                    : aiLevel === "medium"
                                    ? "border-orange-200 bg-orange-50 text-orange-700"
                                    : "border-gray-200 bg-gray-50 text-gray-700";
                                return (
                                  <div className="space-y-1">
                                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] border ${levelClass}`}>
                                      {aiLevel.toUpperCase()} · {aiPct}%
                                    </span>
                                    {reasons.length > 0 && (
                                      <p className="text-[11px] text-gray-600 max-w-[260px] line-clamp-2">{reasons.join(" ")}</p>
                                    )}
                                  </div>
                                );
                              })()}
                            </td>
                            <td className="px-4 py-2 text-gray-600 text-[13px] max-w-[200px] truncate">
                              {row.similarity_warning ?? "—"}
                            </td>
                            <td className="px-4 py-2">
                              {hasComparisons && !studentId && (
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
                              <td colSpan={5} className="px-4 py-3">
                                <div className="space-y-3 text-[13px]">
                                  {Array.isArray(row.ai_features?.signals) && row.ai_features.signals.length > 0 && (
                                    <div className="rounded border border-indigo-100 bg-indigo-50/50 p-3">
                                      <p className="text-[12px] font-medium text-indigo-800 mb-1">AI risk reasons (heuristic)</p>
                                      <ul className="text-[12px] text-indigo-900 list-disc pl-4 space-y-1">
                                        {row.ai_features.signals.slice(0, 5).map((signal, sIdx) => (
                                          <li key={sIdx}>
                                            {signal.reason} (weight {Math.round((Number(signal.weight) || 0) * 100)}%)
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  {row.ai_features?.llm_rationale &&
                                    typeof row.ai_features.llm_rationale === "object" && (
                                      <div className="rounded border border-violet-100 bg-violet-50/50 p-3">
                                        <p className="text-[12px] font-medium text-violet-800 mb-1">
                                          Optional LLM explanation
                                        </p>
                                        <p className="text-[12px] text-violet-900">
                                          {(row.ai_features.llm_rationale as { summary?: string }).summary ?? "—"}
                                        </p>
                                      </div>
                                    )}
                                  {row.comparisons
                                    .filter((comp) => {
                                      if (filterMode === "all") return true;
                                      const struct = comp.left.structural_similarity ?? 0;
                                      const token = comp.left.token_similarity ?? 0;
                                      if (filterMode === "high_struct") {
                                        return struct >= 0.7;
                                      }
                                      if (filterMode === "high_token") {
                                        return token >= 0.7;
                                      }
                                      return true;
                                    })
                                    .map((comp, idx) => (
                                    <div
                                      key={idx}
                                      className="rounded border border-gray-200 bg-white p-3"
                                    >
                                      <div className="mb-2 text-[11px] text-gray-600">
                                        {typeof comp.left.token_similarity === "number" &&
                                        typeof comp.left.structural_similarity === "number" ? (
                                          <>
                                            Token:{" "}
                                            {Math.round((comp.left.token_similarity ?? 0) * 100)}% · Structural:{" "}
                                            {Math.round((comp.left.structural_similarity ?? 0) * 100)}% · Combined:{" "}
                                            {Math.round(
                                              (comp.left.combined_similarity ?? comp.left.similarity ?? 0) * 100
                                            )}
                                            %
                                          </>
                                        ) : (
                                          <>Similarity details unavailable</>
                                        )}
                                      </div>
                                      <div className="grid grid-cols-2 gap-3">
                                        <div>
                                          <p className="font-medium text-gray-700 mb-1">
                                            You (left) — {Math.round((comp.left.similarity ?? 0) * 100)}%
                                          </p>
                                          <pre className="whitespace-pre-wrap break-words text-[12px] bg-gray-50 p-2 rounded max-h-72 overflow-auto">
                                            {renderHighlightedCode(
                                              comp.left.code,
                                              highlightMarkers,
                                              "bg-amber-200/70 text-gray-900 rounded-sm px-0.5"
                                            )}
                                          </pre>
                                        </div>
                                        <div>
                                          <p className="font-medium text-gray-700 mb-1">
                                            Other (right) — {Math.round((comp.right.similarity ?? 0) * 100)}%
                                          </p>
                                          <pre className="whitespace-pre-wrap break-words text-[12px] bg-gray-50 p-2 rounded max-h-72 overflow-auto">
                                            {renderHighlightedCode(
                                              comp.right.code,
                                              highlightMarkers,
                                              "bg-emerald-200/70 text-gray-900 rounded-sm px-0.5"
                                            )}
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
