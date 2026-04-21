import React, { useMemo } from "react";
import { Eye, Loader2 } from "lucide-react";
import type { AssignmentResult, RubricCategory } from "../../../types/grade";
import type { FacultyAssignmentSubmissionRow } from "../../../types/submission";
import type { StudentSubmissionGradesResponse } from "../../../types/studentSubmissionGrade";
import type { Rubric } from "../../../types/rubric";

interface ResultsPanelProps {
  // NOTE: Results are provided by the page so this panel stays view-only.
  results: AssignmentResult | null;
  facultySubmissionRows?: FacultyAssignmentSubmissionRow[];
  onPreviewFacultyFile?: (optionId: string) => void;
  facultyPreviewLoadingOptionId?: string | null;
  facultyPreviewErrorMessage?: string | null;
  /** Student view: rubric grades from GET /api/v1/student/submission-grades */
  studentSubmissionGrades?: StudentSubmissionGradesResponse | null;
  /** Student view: assignment rubric to resolve sub-criterion labels (fallback when no studentRubric) */
  rubricCategories?: RubricCategory[];
  /** Student view: full rubric from GET /api/v1/student/rubrics/{id} — used to build combined table with grades */
  studentRubric?: Rubric | null;
}

export function ResultsPanel({
  results,
  facultySubmissionRows,
  onPreviewFacultyFile,
  facultyPreviewLoadingOptionId,
  facultyPreviewErrorMessage,
  studentSubmissionGrades,
  rubricCategories = [],
  studentRubric,
}: ResultsPanelProps) {
  const gradesBySubCriteriaId = useMemo(() => {
    const map = new Map<number, { awardedScore: number; feedback: string | null }>();
    if (studentSubmissionGrades?.grades) {
      for (const g of studentSubmissionGrades.grades) {
        map.set(g.rubricSubCriteriaId, { awardedScore: g.awardedScore, feedback: g.feedback ?? null });
      }
    }
    return map;
  }, [studentSubmissionGrades]);

  const subCriteriaMap = useMemo(() => {
    const map = new Map<number, { description: string; maxPoints: number }>();
    for (const cat of rubricCategories) {
      for (const c of cat.criteria) {
        if (c.id != null) {
          map.set(c.id, { description: c.description, maxPoints: c.points });
        }
      }
    }
    return map;
  }, [rubricCategories]);
  const getStatusMessage = (score: number) => {
    if (score >= 95) return "Excellent Work!";
    if (score >= 85) return "Good Effort!";
    if (score >= 70) return "Needs Improvement";
    return "Please Revisit";
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "#5A7ACD";
    if (score >= 70) return "#FEB05D";
    return "#ef4444";
  };

  if (facultySubmissionRows) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <h3 className="text-[16px] font-semibold text-[#2B2A2A] mb-2">Submissions</h3>
        <p className="text-[12px] text-gray-500 mb-4">Review each uploaded file and open it in the editor.</p>
        {facultyPreviewErrorMessage ? (
          <div className="mb-4 rounded-lg border border-[#F2C9CC] bg-[#FFF5F5] px-3 py-2 text-[12px] text-[#C23A42]">
            {facultyPreviewErrorMessage}
          </div>
        ) : null}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {facultySubmissionRows.length > 0 ? (
            facultySubmissionRows.map((row, rowIndex) => (
              <div
                key={row.submissionId}
                className={`p-4 ${rowIndex !== facultySubmissionRows.length - 1 ? "border-b border-gray-100" : ""}`}
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-[13px] font-semibold text-[#2B2A2A]">{row.studentName}</p>
                  <p className="text-[11px] text-gray-500">{row.submittedAt}</p>
                </div>
                {row.files.length > 0 ? (
                  <div className="space-y-2">
                    {row.files.map((file) => {
                      const optionId = `${row.submissionId}:${file.id}`;
                      const isLoading = facultyPreviewLoadingOptionId === optionId;
                      return (
                        <div
                          key={optionId}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-100 px-3 py-2"
                        >
                          <span className="text-[12px] text-[#2B2A2A]">{file.fileName}</span>
                          <div className="flex items-center gap-2">
                            {file.downloadUrl ? (
                              <a
                                href={file.downloadUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[12px] text-[#5A7ACD] hover:text-[#4a6abd] hover:underline"
                              >
                                Download
                              </a>
                            ) : null}
                            <button
                              type="button"
                              onClick={() => onPreviewFacultyFile?.(optionId)}
                              disabled={!onPreviewFacultyFile || isLoading || !file.downloadUrl}
                              className="px-2.5 py-1.5 rounded-md border border-gray-300 bg-white text-[11px] text-[#2B2A2A] hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-1.5"
                            >
                              {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2} /> : <Eye className="w-3.5 h-3.5" strokeWidth={2} />}
                              <span>{isLoading ? "Loading..." : "See in editor"}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[12px] text-gray-500">No files uploaded with this submission.</p>
                )}
              </div>
            ))
          ) : (
            // NOTE: Faculty submissions tab keeps an explicit empty state when assignment has no uploaded files yet.
            <p className="p-4 text-[12px] text-gray-500">No student submissions available yet.</p>
          )}
        </div>
      </div>
    );
  }

  if (!results) {
    return null;
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Circular Score Display */}
      <div className="mb-6 bg-gradient-to-br from-[#5A7ACD]/5 to-[#FEB05D]/5 rounded-xl p-6 border border-gray-100">
        <div className="flex flex-col items-center">
          {/* Circular Progress */}
          <div className="relative w-28 h-28 mb-4">
            <svg className="w-28 h-28 transform -rotate-90">
              {/* Background circle */}
              <circle
                cx="56"
                cy="56"
                r="50"
                stroke="#e5e7eb"
                strokeWidth="8"
                fill="none"
              />
              {/* Progress circle */}
              <circle
                cx="56"
                cy="56"
                r="50"
                stroke={getScoreColor(results.score)}
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 50}`}
                strokeDashoffset={`${2 * Math.PI * 50 * (1 - results.score / 100)}`}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
            {/* Score text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-3xl font-bold text-[#2B2A2A]">{results.score}</div>
              <div className="text-gray-400 text-xs">/ 100</div>
            </div>
          </div>

          {/* Status Message */}
          <div className="text-[15px] font-semibold text-[#2B2A2A] mb-1">
            {getStatusMessage(results.score)}
          </div>
          
          {/* Timestamp */}
          <div className="text-[11px] text-gray-500">
            Graded on {results.gradedAt}
          </div>
        </div>
      </div>

      {/* Feedback (from submission) — below circle, before rubric */}
      {results.submissionFeedback != null && results.submissionFeedback !== "" && (
        <div className="mb-6 p-4 rounded-lg border border-gray-200 bg-gray-50">
          <p className="text-[12px] font-medium text-[#2B2A2A] mb-1">Feedback</p>
          <p className="text-[12px] text-gray-700 whitespace-pre-wrap">{results.submissionFeedback}</p>
        </div>
      )}

      {/* Rubric Breakdown — only shown when real grading data exists */}
      {((studentRubric && studentSubmissionGrades?.grades && studentSubmissionGrades.grades.length > 0) ||
        (studentSubmissionGrades?.grades && studentSubmissionGrades.grades.length > 0)) && (
      <div className="mb-6">
        <h3 className="text-[13px] font-semibold text-[#5A7ACD] mb-3 flex items-center gap-2 uppercase tracking-wide">
          <div className="w-0.5 h-4 bg-[#5A7ACD] rounded-full"></div>
          {studentRubric?.name ? `${studentRubric.name} — Breakdown` : "Rubric Breakdown"}
        </h3>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {studentRubric && studentSubmissionGrades?.grades && studentSubmissionGrades.grades.length > 0 ? (
            (() => {
              const isWeighted = studentRubric.rubricType === "WEIGHTED";
              const rubricMax = studentRubric.criteria.reduce((sum, c) => {
                if (c.subCriteria?.length) return sum + c.subCriteria!.reduce((s, sub) => s + sub.maxScore, 0);
                return sum + (c.maxScore ?? c.points ?? 0);
              }, 0);
              const maxPointsForScale = (results?.totalPoints ?? rubricMax) || 100;
              const round2 = (x: number) => Math.round(x * 100) / 100;
              /** Row points: unweighted = awarded; weighted = (awarded/max)*(weight/100)*scale */
              const rowPts = (
                awarded: number,
                max: number,
                weight: number | null,
              ): number | null => {
                if (!Number.isFinite(awarded)) return null;
                if (!isWeighted) return round2(awarded);
                if (max <= 0 || weight == null) return null;
                return round2((awarded / max) * (weight / 100) * maxPointsForScale);
              };
              /** Sum of all row points (computed from rubric + grades). */
              const totalPts = (() => {
                let sum = 0;
                for (const criterion of studentRubric.criteria) {
                  const hasSub = criterion.subCriteria && criterion.subCriteria.length > 0;
                  if (hasSub) {
                    for (const sub of criterion.subCriteria!) {
                      const g = sub.id != null ? gradesBySubCriteriaId.get(sub.id) : undefined;
                      if (g != null) {
                        const p = rowPts(g.awardedScore, sub.maxScore, sub.weight ?? null);
                        if (p != null) sum += p;
                      }
                    }
                  } else {
                    const g = criterion.id != null ? gradesBySubCriteriaId.get(criterion.id) : undefined;
                    const max = criterion.maxScore ?? criterion.points ?? 0;
                    if (g != null) {
                      const p = rowPts(g.awardedScore, max, criterion.weight ?? null);
                      if (p != null) sum += p;
                    }
                  }
                }
                return sum;
              })();
              const colCount = isWeighted ? 6 : 5;
              return (
                <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="py-3 px-4 text-[12px] font-semibold text-[#2B2A2A] uppercase tracking-wide">
                          Criterion / Sub-criterion
                        </th>
                        <th className="py-3 px-4 text-[12px] font-semibold text-[#2B2A2A] uppercase tracking-wide w-20 text-right">
                          Max
                        </th>
                        {isWeighted && (
                          <th className="py-3 px-4 text-[12px] font-semibold text-[#2B2A2A] uppercase tracking-wide w-20 text-right">
                            Weight %
                          </th>
                        )}
                        <th className="py-3 px-4 text-[12px] font-semibold text-[#2B2A2A] uppercase tracking-wide w-24 text-right">
                          Awarded
                        </th>
                        <th className="py-3 px-4 text-[12px] font-semibold text-[#2B2A2A] uppercase tracking-wide w-20 text-right">
                          Pts
                        </th>
                        <th className="py-3 px-4 text-[12px] font-semibold text-[#2B2A2A] uppercase tracking-wide">
                          Feedback
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentRubric.criteria.map((criterion) => {
                        const hasSub = criterion.subCriteria && criterion.subCriteria.length > 0;
                        if (hasSub) {
                          return (
                            <React.Fragment key={criterion.id ?? criterion.title}>
                              <tr className="border-b border-gray-100 bg-gray-50/50">
                                <td colSpan={colCount} className="py-2.5 px-4 text-[13px] font-semibold text-[#2B2A2A]">
                                  {criterion.title}
                                  {!isWeighted && criterion.points != null && (
                                    <span className="ml-2 text-[11px] font-normal text-gray-500">
                                      ({criterion.points} pts)
                                    </span>
                                  )}
                                  {isWeighted && criterion.weight != null && (
                                    <span className="ml-2 text-[11px] font-normal text-gray-500">
                                      ({criterion.weight}%)
                                    </span>
                                  )}
                                </td>
                              </tr>
                              {criterion.subCriteria!.map((sub) => {
                                const grade = sub.id != null ? gradesBySubCriteriaId.get(sub.id) : undefined;
                                const awarded = grade?.awardedScore ?? 0;
                                const max = sub.maxScore;
                                const w = sub.weight ?? null;
                                const pts = grade != null ? rowPts(awarded, max, w) : null;
                                return (
                                  <tr key={sub.id ?? sub.description ?? ""} className="border-b border-gray-100">
                                    <td className="py-2.5 px-4 pl-6 text-[12px] text-[#2B2A2A]">
                                      {sub.description ?? criterion.title}
                                    </td>
                                    <td className="py-2.5 px-4 text-[12px] text-gray-600 text-right">
                                      {sub.maxScore}
                                    </td>
                                    {isWeighted && (
                                      <td className="py-2.5 px-4 text-[12px] text-gray-600 text-right">
                                        {sub.weight != null ? `${sub.weight}%` : "—"}
                                      </td>
                                    )}
                                    <td className="py-2.5 px-4 text-[12px] font-semibold text-[#2B2A2A] text-right">
                                      {grade != null ? grade.awardedScore.toFixed(2) : "—"}
                                    </td>
                                    <td className="py-2.5 px-4 text-[12px] text-[#5A7ACD] text-right font-medium">
                                      {pts != null ? pts.toFixed(2) : "—"}
                                    </td>
                                    <td className="py-2.5 px-4 text-[11px] text-gray-600 italic">
                                      {grade?.feedback ?? "—"}
                                    </td>
                                  </tr>
                                );
                              })}
                            </React.Fragment>
                          );
                        }
                        const grade = criterion.id != null ? gradesBySubCriteriaId.get(criterion.id) : undefined;
                        const max = criterion.maxScore ?? criterion.points ?? 0;
                        const awarded = grade?.awardedScore ?? 0;
                        const w = criterion.weight ?? null;
                        const pts = grade != null ? rowPts(awarded, max, w) : null;
                        return (
                          <tr key={criterion.id ?? criterion.title} className="border-b border-gray-100">
                            <td className="py-2.5 px-4 text-[12px] text-[#2B2A2A]">
                              {criterion.title}
                              {criterion.description ? ` — ${criterion.description}` : ""}
                              {!isWeighted && criterion.points != null && (
                                <span className="ml-1 text-[11px] text-gray-500">({criterion.points} pts)</span>
                              )}
                            </td>
                            <td className="py-2.5 px-4 text-[12px] text-gray-600 text-right">{max}</td>
                            {isWeighted && (
                              <td className="py-2.5 px-4 text-[12px] text-gray-600 text-right">
                                {criterion.weight != null ? `${criterion.weight}%` : "—"}
                              </td>
                            )}
                            <td className="py-2.5 px-4 text-[12px] font-semibold text-[#2B2A2A] text-right">
                              {grade != null ? grade.awardedScore.toFixed(2) : "—"}
                            </td>
                            <td className="py-2.5 px-4 text-[12px] text-[#5A7ACD] text-right font-medium">
                              {pts != null ? pts.toFixed(2) : "—"}
                            </td>
                            <td className="py-2.5 px-4 text-[11px] text-gray-600 italic">
                              {grade?.feedback ?? "—"}
                            </td>
                          </tr>
                        );
                      })}
                      <tr className="bg-gray-50 border-t-2 border-gray-200">
                        <td className="py-3 px-4 text-[13px] font-semibold text-[#2B2A2A]">Total</td>
                        <td className="py-3 px-4 text-[12px] text-gray-600 text-right">
                          {rubricMax}
                        </td>
                        {isWeighted && <td className="py-3 px-4" />}
                        <td className="py-3 px-4 text-[12px] text-gray-600 text-right">
                          {studentSubmissionGrades.grades.reduce((sum, g) => sum + g.awardedScore, 0).toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-[14px] font-bold text-[#5A7ACD] text-right">
                          {totalPts.toFixed(2)}
                          {maxPointsForScale > 0 && (
                            <span className="ml-1.5 text-[11px] font-normal text-gray-500">
                              / {maxPointsForScale} ({(totalPts / maxPointsForScale * 100).toFixed(1)}%)
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4" />
                      </tr>
                    </tbody>
                  </table>
                </div>
              </>
              );
            })()
          ) : studentSubmissionGrades?.grades && studentSubmissionGrades.grades.length > 0 ? (
            <>
              {studentSubmissionGrades.grades.map((grade, index) => {
                const meta = subCriteriaMap.get(grade.rubricSubCriteriaId);
                const label = meta?.description ?? `Criterion ${index + 1}`;
                const maxPoints = meta?.maxPoints ?? null;
                const scoreText = maxPoints != null ? `${grade.awardedScore}/${maxPoints}` : String(grade.awardedScore);
                return (
                  <div
                    key={grade.rubricSubCriteriaId}
                    className={`p-4 ${index !== studentSubmissionGrades.grades.length - 1 ? "border-b border-gray-100" : ""}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="text-[13px] font-semibold text-[#2B2A2A] mb-0.5">
                          {label}
                        </div>
                        {grade.feedback && (
                          <div className="text-[11px] text-gray-600 italic mt-0.5">
                            {grade.feedback}
                          </div>
                        )}
                      </div>
                      <div className="text-right ml-6">
                        <div className="text-[14px] font-bold text-[#2B2A2A]">
                          {scoreText}
                        </div>
                      </div>
                    </div>
                    {maxPoints != null && maxPoints > 0 && (
                      <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
                        <div
                          className="h-1.5 rounded-full transition-all duration-1000"
                          style={{
                            width: `${Math.min(100, (grade.awardedScore / maxPoints) * 100)}%`,
                            backgroundColor: grade.awardedScore >= maxPoints ? "#5A7ACD" : "#FEB05D",
                          }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
              <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                <span className="text-[13px] font-semibold text-[#2B2A2A]">Total</span>
                <span className="text-[15px] font-bold text-[#5A7ACD]">
                  {studentSubmissionGrades.grades.reduce((sum, g) => sum + g.awardedScore, 0).toFixed(2)}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
      )}

      {/* Back Button */}
      <div>
        <button 
          onClick={() => window.history.back()}
          className="w-full py-2.5 bg-[#F5F2F2] hover:bg-gray-200 text-[#2B2A2A] rounded-lg text-[13px] font-medium transition-colors flex items-center justify-center gap-2"
        >
          <span>&larr;</span>
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
