import React, { useState, useEffect } from "react";
import { Award, MessageSquare, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "../ui/dialog";
import type { RubricCategory } from "../../../types/grade";
import type { Rubric } from "../../../types/rubric";
import { roundTo2, formatMax2Decimals } from "../../../utils/number";

export interface GradeSubmissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When true, show rubric criteria inputs; otherwise single marks input */
  hasRubric: boolean;
  rubricCategories: RubricCategory[];
  /** Nested rubric (criteria with subCriteria) for faculty; when set, description shown at top and table shows criterion → sub-criteria rows */
  rubricNested?: Rubric | null;
  /** Existing per-criterion grades for faculty rubric grading (keyed by rubric criteria id). */
  rubricExistingGrades?: Record<
    number,
    {
      awardedScore: number;
      feedback?: string | null;
    }
  >;
  /** Max points for non-rubric mode */
  maxPoints: number;
  currentMarks: number | null;
  currentFeedback: string;
  /** feedback = user-typed feedback (sent to PATCH grade). rubricGrades = per-criterion data for batch API only. */
  onSubmit: (
    marks: number,
    feedback: string,
    rubricGrades?: Array<{ criterionId: number; score: number; comment: string }>,
  ) => Promise<void>;
  isSubmitting?: boolean;
}

/** Flatten criteria with max points and weight for form state */
function flattenCriteria(categories: RubricCategory[]): { id?: number; maxPoints: number; weight?: number | null }[] {
  const list: { id?: number; maxPoints: number; weight?: number | null }[] = [];
  for (const cat of categories) {
    for (const c of cat.criteria) {
      list.push({ id: c.id, maxPoints: c.points, weight: c.weight ?? null });
    }
  }
  return list;
}

function rubricTotal(categories: RubricCategory[]): number {
  return categories.reduce((sum, cat) => sum + cat.points, 0);
}

/** Distribute total marks across criteria proportionally by max points (for prefilling existing grade). */
function distributeMarksAcrossCriteria(
  flatCriteria: { maxPoints: number }[],
  totalMarks: number
): number[] {
  const totalMax = flatCriteria.reduce((s, c) => s + c.maxPoints, 0);
  if (totalMax <= 0 || totalMarks <= 0) return flatCriteria.map(() => 0);
  const scores = flatCriteria.map((c) => {
    const p = (c.maxPoints / totalMax) * totalMarks;
    return Math.min(c.maxPoints, Math.floor(p));
  });
  let remainder = totalMarks - scores.reduce((a, b) => a + b, 0);
  for (let i = 0; remainder > 0 && i < flatCriteria.length; i++) {
    const cap = flatCriteria[i].maxPoints - scores[i];
    const add = Math.min(remainder, cap);
    if (add > 0) {
      scores[i] += add;
      remainder -= add;
    }
  }
  return scores;
}

/** Whether rubric has nested criteria (criteria[].subCriteria) for hierarchical display */
function hasNestedCriteria(rubric: Rubric | null | undefined): boolean {
  return (rubric?.criteria?.some((c) => (c.subCriteria?.length ?? 0) > 0) ?? false);
}

/** True when all criteria/subCriteria have weight == null (unweighted rubric). Then we hide Weight % and Pts and use sum of grades for total. */
function isRubricUnweighted(
  rubricNested: Rubric | null | undefined,
  hasNested: boolean,
  flatCriteria: { weight?: number | null }[],
): boolean {
  if (hasNested && rubricNested?.criteria) {
    return rubricNested.criteria
      .filter((c) => (c.subCriteria?.length ?? 0) > 0)
      .every((c) => (c.subCriteria ?? []).every((s) => s.weight == null));
  }
  return flatCriteria.length > 0 && flatCriteria.every((c) => c.weight == null);
}

export function GradeSubmissionDialog({
  open,
  onOpenChange,
  hasRubric,
  rubricCategories,
  rubricNested,
  rubricExistingGrades,
  maxPoints,
  currentMarks,
  currentFeedback,
  onSubmit,
  isSubmitting = false,
}: GradeSubmissionDialogProps) {
  const flatCriteria = flattenCriteria(rubricCategories);
  const rubricMax = rubricTotal(rubricCategories);
  const nested = Boolean(rubricNested && hasNestedCriteria(rubricNested));
  const isUnweighted = isRubricUnweighted(rubricNested, nested, flatCriteria);

  const [marksInput, setMarksInput] = useState("");
  /** Grade per criterion as string (allows blank "" and decimals e.g. "2.5") */
  const [criterionScores, setCriterionScores] = useState<string[]>(() =>
    flatCriteria.map(() => ""),
  );
  const [criterionComments, setCriterionComments] = useState<string[]>(() =>
    flatCriteria.map(() => ""),
  );
  /** Faculty can override Pts per criterion; null = use calculated from grade/weight */
  const [overridePts, setOverridePts] = useState<(number | null)[]>(() =>
    flatCriteria.map(() => null),
  );
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState<string | null>(null);

  const parseGrade = (s: string): number => Math.max(0, Number.parseFloat(s) || 0);

  useEffect(() => {
    if (!open) return;
    setMarksInput(currentMarks != null ? String(currentMarks) : "");
    setFeedback(currentFeedback ?? "");
    setOverridePts(flatCriteria.map(() => null));
    if (hasRubric) {
      if (rubricExistingGrades && Object.keys(rubricExistingGrades).length > 0) {
        setCriterionScores(
          flatCriteria.map((c) =>
            c.id != null && rubricExistingGrades[c.id]
              ? String(rubricExistingGrades[c.id]!.awardedScore)
              : "",
          ),
        );
        setCriterionComments(
          flatCriteria.map((c) =>
            c.id != null && rubricExistingGrades[c.id]
              ? rubricExistingGrades[c.id]!.feedback ?? ""
              : "",
          ),
        );
      } else if (currentMarks != null && currentMarks > 0 && rubricMax > 0) {
        setCriterionScores(
          distributeMarksAcrossCriteria(flatCriteria, currentMarks).map((n) => (n ? String(n) : "")),
        );
        setCriterionComments(flatCriteria.map(() => ""));
      } else {
        setCriterionScores(flatCriteria.map(() => ""));
        setCriterionComments(flatCriteria.map(() => ""));
      }
    } else {
      setCriterionScores(flatCriteria.map(() => ""));
      setCriterionComments(flatCriteria.map(() => ""));
    }
    setError(null);
  }, [
    open,
    currentMarks,
    currentFeedback,
    hasRubric,
    rubricMax,
    flatCriteria.length,
    rubricExistingGrades,
  ]);

  const computedMarks = hasRubric
    ? criterionScores.reduce((sum, s, i) => {
        const max = flatCriteria[i]?.maxPoints ?? 0;
        const g = parseGrade(s);
        return sum + (max > 0 ? Math.min(max, g) : g);
      }, 0)
    : null;

  /** Calculated Pts for row i (from grade, max, weight). Used when overridePts[i] is null. Max 2 decimals. */
  const getCalculatedPts = (flatIndex: number, max: number, weight: number | null): number => {
    const grade = max > 0 ? Math.min(max, parseGrade(criterionScores[flatIndex] ?? "")) : parseGrade(criterionScores[flatIndex] ?? "");
    if (weight != null && max > 0) return roundTo2((grade / max) * (weight / 100) * maxPoints);
    if (rubricMax > 0) return roundTo2((grade * maxPoints) / rubricMax);
    return 0;
  };

  /** Back-calculate grade from Pts for a row (so Grade and Pts stay related). Max 2 decimals. */
  const gradeFromPts = (pts: number, max: number, weight: number | null): number => {
    if (weight != null && weight > 0 && maxPoints > 0) return roundTo2((pts * max * 100) / (weight * maxPoints));
    if (rubricMax > 0 && maxPoints > 0) return roundTo2((pts * rubricMax) / maxPoints);
    return 0;
  };

  /** Max Pts for a row (cap so user cannot enter more than this). Max 2 decimals. */
  const maxPtsForRow = (max: number, weight: number | null): number => {
    if (weight != null && weight >= 0) return roundTo2((weight / 100) * maxPoints);
    if (rubricMax > 0 && max > 0) return roundTo2((max / rubricMax) * maxPoints);
    return maxPoints;
  };

  /** Total = sum of (override Pts or calculated Pts). So when faculty edit Pts, total updates. */
  const normalizedRubricMarks = (() => {
    if (!hasRubric || flatCriteria.length === 0) return null;
    const allHaveWeight = flatCriteria.every(
      (c) => c.weight != null && Number.isFinite(c.weight) && c.weight >= 0,
    );
    if (allHaveWeight) {
      let sum = 0;
      for (let i = 0; i < flatCriteria.length; i++) {
        const max = flatCriteria[i].maxPoints;
        const w = flatCriteria[i].weight ?? 0;
        const rowMax = maxPtsForRow(max, flatCriteria[i].weight ?? null);
        const calculated = getCalculatedPts(i, max, w);
        const pts = roundTo2(
          overridePts[i] != null && Number.isFinite(overridePts[i])
            ? Math.min(overridePts[i]!, rowMax)
            : calculated,
        );
        sum += pts;
      }
      return sum;
    }
    // Unweighted: grade entered = points for that row; total = sum of grades (no scaling)
    return roundTo2(Math.min(maxPoints, computedMarks ?? 0));
  })();

  const handleSubmit = async () => {
    setError(null);
    const rawMarks = hasRubric
      ? (normalizedRubricMarks ?? 0)
      : parseFloat(marksInput);
    const marks = roundTo2(rawMarks);
    if (!Number.isFinite(marks) || marks < 0) {
      setError("Enter a valid score (0 or higher).");
      return;
    }
    const max = maxPoints;
    if (marks > max) {
      setError(`Score cannot exceed ${max}.`);
      return;
    }
    try {
      const userFeedback = feedback.trim();
      const rubricGrades = hasRubric
        ? rubricCategories.flatMap((category, catIndex) =>
            category.criteria.map((criterion, critIndex) => {
              const flatIndex =
                rubricCategories
                  .slice(0, catIndex)
                  .reduce((acc, c) => acc + c.criteria.length, 0) + critIndex;
              if (typeof criterion.id !== "number") return null;
              return {
                criterionId: criterion.id,
                score: parseGrade(criterionScores[flatIndex] ?? ""),
                comment: criterionComments[flatIndex] ?? "",
              };
            }),
          ).filter((g): g is { criterionId: number; score: number; comment: string } => g != null)
        : undefined;

      await onSubmit(marks, userFeedback, rubricGrades);
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save grade.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={hasRubric ? "sm:max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0" : "sm:max-w-md"}
        aria-describedby={undefined}
      >
        <DialogHeader className="space-y-1.5 shrink-0 px-6 pt-6 pb-2">
          <DialogTitle className="text-xl text-[#2B2A2A]">
            Grade submission
          </DialogTitle>
          <DialogDescription className="text-[13px] text-gray-600">
            {hasRubric
              ? "Award points for each criterion. The total is saved as the submission grade."
              : "Enter the overall marks for this submission."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto px-6">
        <div className="space-y-5 py-1">
          {error ? (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2">
              <p className="text-[13px] text-red-700">{error}</p>
            </div>
          ) : null}

          {/* Score section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[13px] font-medium text-[#2B2A2A]">
              <Award className="w-4 h-4 text-[#FEB05D]" strokeWidth={2} />
              <span>Score</span>
            </div>

            {hasRubric ? (
              <div className="space-y-4 pr-1 -mr-1">
                {rubricNested && hasNestedCriteria(rubricNested) && (
                  <div className="rounded-xl border border-[#E4E7EC] bg-[#F9FAFB] px-4 py-3">
                    {rubricNested.name ? (
                      <p className="text-[14px] font-semibold text-[#2B2A2A]">{rubricNested.name}</p>
                    ) : null}
                    {rubricNested.description ? (
                      <p className="mt-1 text-[13px] text-gray-600">{rubricNested.description}</p>
                    ) : null}
                  </div>
                )}
                <div className="overflow-x-auto rounded-xl border border-gray-200 bg-[#F9FAFB]">
                  <table className="min-w-full border-separate border-spacing-0 text-left">
                    <thead className="bg-[#E4E7EC] text-[12px] font-semibold text-[#1F2430]">
                      <tr>
                        <th className="px-4 py-2 align-middle">Criterion</th>
                        <th className="w-[110px] px-3 py-2 align-middle text-right">Grade</th>
                        {!isUnweighted && (
                          <>
                            <th className="w-[64px] px-2 py-2 align-middle text-right">Weight (%)</th>
                            <th className="w-[110px] px-3 py-2 align-middle text-center">Pts</th>
                          </>
                        )}
                        <th className="px-4 py-2 align-middle">Instructor comments</th>
                      </tr>
                    </thead>
                    <tbody className="text-[13px] text-[#1F2430]">
                      {rubricNested && hasNestedCriteria(rubricNested)
                        ? rubricNested.criteria
                            .filter((c) => (c.subCriteria?.length ?? 0) > 0)
                            .map((criterion, cIdx) => {
                              const subList = criterion.subCriteria ?? [];
                              return (
                                <React.Fragment key={cIdx}>
                                  <tr className="border-t border-gray-200 bg-[#F3F6FB]">
                                    <td colSpan={isUnweighted ? 3 : 5} className="px-4 py-2 align-middle">
                                      <span className="text-[13px] font-semibold text-[#1F2430]">
                                        {criterion.title || `Criterion ${cIdx + 1}`}
                                        {isUnweighted && criterion.points != null && (
                                          <span className="ml-1.5 font-normal text-[#5D6A80]">
                                            ({criterion.points} pts)
                                          </span>
                                        )}
                                      </span>
                                    </td>
                                  </tr>
                                  {subList.map((sub, sIdx) => {
                                    const flatIndex = rubricNested.criteria
                                      .filter((cr) => (cr.subCriteria?.length ?? 0) > 0)
                                      .slice(0, cIdx)
                                      .reduce((acc, cr) => acc + (cr.subCriteria?.length ?? 0), 0) + sIdx;
                                    const max = sub.maxScore ?? 0;
                                    const gradeStr = criterionScores[flatIndex] ?? "";
                                    const weight = sub.weight ?? null;
                                    const percentOfMax = weight != null ? weight : (rubricMax > 0 && max > 0 ? (max / rubricMax) * 100 : 0);
                                    const calculatedPts = getCalculatedPts(flatIndex, max, weight);
                                    const rowMaxPts = maxPtsForRow(max, weight);
                                    const rawPts = overridePts[flatIndex] != null && Number.isFinite(overridePts[flatIndex]) ? overridePts[flatIndex]! : calculatedPts;
                                    const pts = roundTo2(Math.min(rawPts, rowMaxPts));
                                    const comment = criterionComments[flatIndex] ?? "";
                                    return (
                                      <tr
                                        key={`${cIdx}-${sIdx}`}
                                        className="border-t border-gray-200 bg-white last:rounded-b-xl [&:last-child>td:first-child]:rounded-bl-xl [&:last-child>td:last-child]:rounded-br-xl"
                                      >
                                        <td className="px-4 py-3 align-middle pl-6">
                                          <div className="text-[12px] text-[#2B2A2A]">
                                            {sub.description ?? "—"}
                                          </div>
                                        </td>
                                        <td className="w-[110px] px-3 py-3 align-middle">
                                          <div className="flex flex-col items-center gap-0.5">
                                            <span className="text-[10px] text-gray-500">{max < 0 ? `${max}–0` : `0–${max}`}</span>
                                            <input
                                              type="number"
                                              min={max < 0 ? max : 0}
                                              max={max < 0 ? 0 : max}
                                              step="0.01"
                                              value={gradeStr}
                                              onChange={(e) => {
                                                const raw = e.target.value;
                                                if (raw === "") {
                                                  setCriterionScores((prev) => {
                                                    const next = [...prev];
                                                    next[flatIndex] = "";
                                                    return next;
                                                  });
                                                  setOverridePts((prev) => {
                                                    const next = [...prev];
                                                    next[flatIndex] = null;
                                                    return next;
                                                  });
                                                  return;
                                                }
                                                const parsed = parseFloat(raw);
                                                if (!Number.isFinite(parsed)) return;
                                                const minVal = max < 0 ? max : 0;
                                                const clamped = Math.min(max, Math.max(minVal, parsed));
                                                const inRange = parsed === clamped;
                                                const moreThan2Decimals = roundTo2(parsed) !== parsed;
                                                const display = inRange
                                                  ? moreThan2Decimals
                                                    ? formatMax2Decimals(roundTo2(parsed))
                                                    : raw.trim()
                                                  : (() => {
                                                      const r = roundTo2(clamped);
                                                      return r === Math.floor(r) ? String(Math.round(r)) : r.toFixed(2);
                                                    })();
                                                setCriterionScores((prev) => {
                                                  const next = [...prev];
                                                  next[flatIndex] = display;
                                                  return next;
                                                });
                                                setOverridePts((prev) => {
                                                  const next = [...prev];
                                                  next[flatIndex] = null;
                                                  return next;
                                                });
                                              }}
                                              placeholder="—"
                                              className="h-8 w-16 rounded-lg border border-gray-300 bg-white px-2 text-right text-[13px] tabular-nums text-[#1F2430] focus:border-[#5A7ACD] focus:ring-1 focus:ring-[#5A7ACD]/30 outline-none"
                                            />
                                          </div>
                                        </td>
                                        {!isUnweighted && (
                                          <>
                                            <td className="w-[64px] px-2 py-3 align-middle text-right">
                                              <span className="text-[12px] text-gray-700">
                                                {weight != null ? `${roundTo2(weight)}%` : (rubricMax > 0 && max > 0 ? `${roundTo2(percentOfMax)}%` : "—")}
                                              </span>
                                            </td>
                                            <td className="w-[110px] px-3 py-3 align-middle">
                                              <div className="flex justify-center">
                                                <input
                                                  type="number"
                                                  min={0}
                                                  max={rowMaxPts}
                                                  step="0.01"
                                                  value={pts}
                                                  onChange={(e) => {
                                                    const raw = e.target.value;
                                                    if (raw === "") {
                                                      setOverridePts((prev) => {
                                                        const next = [...prev];
                                                        next[flatIndex] = null;
                                                        return next;
                                                      });
                                                      setCriterionScores((prev) => {
                                                        const next = [...prev];
                                                        next[flatIndex] = "";
                                                        return next;
                                                      });
                                                      return;
                                                    }
                                                    const v = parseFloat(raw);
                                                    if (!Number.isFinite(v) || v < 0) return;
                                                    const clamped = roundTo2(Math.min(rowMaxPts, v));
                                                    setOverridePts((prev) => {
                                                      const next = [...prev];
                                                      next[flatIndex] = clamped;
                                                      return next;
                                                    });
                                                    const gradeBack = Math.max(0, max > 0 ? Math.min(max, gradeFromPts(clamped, max, weight)) : gradeFromPts(clamped, max, weight));
                                                    setCriterionScores((prev) => {
                                                      const next = [...prev];
                                                      next[flatIndex] = (() => { const r = roundTo2(gradeBack); return r === Math.floor(r) ? String(Math.round(r)) : r.toFixed(2); })();
                                                      return next;
                                                    });
                                                  }}
                                                  className="h-8 w-20 rounded-lg border border-gray-300 bg-white px-2 text-center text-[12px] tabular-nums text-[#1F2430] focus:border-[#5A7ACD] focus:ring-1 focus:ring-[#5A7ACD]/30 outline-none"
                                                />
                                              </div>
                                            </td>
                                          </>
                                        )}
                                        <td className="px-4 py-3 align-middle">
                                          <textarea
                                            rows={2}
                                            value={comment}
                                            onChange={(e) =>
                                              setCriterionComments((prev) => {
                                                const next = [...prev];
                                                next[flatIndex] = e.target.value;
                                                return next;
                                              })
                                            }
                                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-[12px] text-[#2B2A2A] placeholder:text-gray-400 focus:border-[#5A7ACD] focus:ring-1 focus:ring-[#5A7ACD]/30 outline-none"
                                            placeholder="Comments…"
                                          />
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </React.Fragment>
                              );
                            })
                        : rubricCategories.map((category, catIndex) =>
                            category.criteria.map((criterion, critIndex) => {
                              const flatIndex =
                                rubricCategories
                                  .slice(0, catIndex)
                                  .reduce((acc, c) => acc + c.criteria.length, 0) + critIndex;
                              const max = criterion.points ?? 0;
                              const gradeStr = criterionScores[flatIndex] ?? "";
                              const weight = criterion.weight ?? null;
                              const percentOfMax = weight != null ? weight : (rubricMax > 0 && max > 0 ? (max / rubricMax) * 100 : 0);
                              const calculatedPts = getCalculatedPts(flatIndex, max, weight);
                              const rowMaxPts = maxPtsForRow(max, weight);
                              const rawPts = overridePts[flatIndex] != null && Number.isFinite(overridePts[flatIndex]) ? overridePts[flatIndex]! : calculatedPts;
                              const pts = roundTo2(Math.min(rawPts, rowMaxPts));
                              const comment = criterionComments[flatIndex] ?? "";

                              return (
                                <tr
                                  key={`${catIndex}-${critIndex}`}
                                  className="border-t border-gray-200 bg-white last:rounded-b-xl [&:last-child>td:first-child]:rounded-bl-xl [&:last-child>td:last-child]:rounded-br-xl"
                                >
                                  <td className="px-4 py-3 align-middle">
                                    <div className="text-[12px] font-semibold text-[#2B2A2A]">
                                      {criterion.description ?? "Criterion"}
                                    </div>
                                    <div className="mt-0.5 text-[11px] text-gray-500">
                                      {category.name}
                                    </div>
                                  </td>
                                  <td className="w-[110px] px-3 py-3 align-middle">
                                    <div className="flex flex-col items-center gap-0.5">
                                      <span className="text-[10px] text-gray-500">{max < 0 ? `${max}–0` : `0–${max}`}</span>
                                      <input
                                        type="number"
                                        min={max < 0 ? max : 0}
                                        max={max < 0 ? 0 : max}
                                        step="0.01"
                                        value={gradeStr}
                                        onChange={(e) => {
                                          const raw = e.target.value;
                                          if (raw === "") {
                                            setCriterionScores((prev) => {
                                              const next = [...prev];
                                              next[flatIndex] = "";
                                              return next;
                                            });
                                            setOverridePts((prev) => {
                                              const next = [...prev];
                                              next[flatIndex] = null;
                                              return next;
                                            });
                                            return;
                                          }
                                          const parsed = parseFloat(raw);
                                          if (!Number.isFinite(parsed)) return;
                                          const minVal = max < 0 ? max : 0;
                                          const clamped = Math.min(max, Math.max(minVal, parsed));
                                          const inRange = parsed === clamped;
                                          const moreThan2Decimals = roundTo2(parsed) !== parsed;
                                          const display = inRange
                                            ? moreThan2Decimals
                                              ? formatMax2Decimals(roundTo2(parsed))
                                              : raw.trim()
                                            : (() => {
                                                const r = roundTo2(clamped);
                                                return r === Math.floor(r) ? String(Math.round(r)) : r.toFixed(2);
                                              })();
                                          setCriterionScores((prev) => {
                                            const next = [...prev];
                                            next[flatIndex] = display;
                                            return next;
                                          });
                                          setOverridePts((prev) => {
                                            const next = [...prev];
                                            next[flatIndex] = null;
                                            return next;
                                          });
                                        }}
                                        placeholder="—"
                                        className="h-8 w-16 rounded-lg border border-gray-300 bg-white px-2 text-right text-[13px] tabular-nums text-[#1F2430] focus:border-[#5A7ACD] focus:ring-1 focus:ring-[#5A7ACD]/30 outline-none"
                                      />
                                    </div>
                                  </td>
                                  {!isUnweighted && (
                                    <>
                                      <td className="w-[64px] px-2 py-3 align-middle text-right">
                                        <span className="text-[12px] text-gray-700">
                                          {weight != null ? `${roundTo2(weight)}%` : (rubricMax > 0 && max > 0 ? `${roundTo2(percentOfMax)}%` : "—")}
                                        </span>
                                      </td>
                                      <td className="w-[110px] px-3 py-3 align-middle">
                                        <div className="flex justify-center">
                                          <input
                                            type="number"
                                            min={0}
                                            max={rowMaxPts}
                                            step="0.01"
                                            value={pts}
                                            onChange={(e) => {
                                              const raw = e.target.value;
                                              if (raw === "") {
                                                setOverridePts((prev) => {
                                                  const next = [...prev];
                                                  next[flatIndex] = null;
                                                  return next;
                                                });
                                                setCriterionScores((prev) => {
                                                  const next = [...prev];
                                                  next[flatIndex] = "";
                                                  return next;
                                                });
                                                return;
                                              }
                                              const v = parseFloat(raw);
                                              if (!Number.isFinite(v) || v < 0) return;
                                              const clamped = roundTo2(Math.min(rowMaxPts, v));
                                              setOverridePts((prev) => {
                                                const next = [...prev];
                                                next[flatIndex] = clamped;
                                                return next;
                                              });
                                              const gradeBack = Math.max(0, max > 0 ? Math.min(max, gradeFromPts(clamped, max, weight)) : gradeFromPts(clamped, max, weight));
                                              setCriterionScores((prev) => {
                                                const next = [...prev];
                                                next[flatIndex] = (() => { const r = roundTo2(gradeBack); return r === Math.floor(r) ? String(Math.round(r)) : r.toFixed(2); })();
                                                return next;
                                              });
                                            }}
                                            className="h-8 w-20 rounded-lg border border-gray-300 bg-white px-2 text-center text-[12px] tabular-nums text-[#1F2430] focus:border-[#5A7ACD] focus:ring-1 focus:ring-[#5A7ACD]/30 outline-none"
                                          />
                                        </div>
                                      </td>
                                    </>
                                  )}
                                  <td className="px-4 py-3 align-middle">
                                    <textarea
                                      rows={2}
                                      value={comment}
                                      onChange={(e) =>
                                        setCriterionComments((prev) => {
                                          const next = [...prev];
                                          next[flatIndex] = e.target.value;
                                          return next;
                                        })
                                      }
                                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-[12px] text-[#2B2A2A] placeholder:text-gray-400 focus:border-[#5A7ACD] focus:ring-1 focus:ring-[#5A7ACD]/30 outline-none"
                                      placeholder="Comments for this criterion…"
                                    />
                                  </td>
                                </tr>
                              );
                            }),
                          )}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-[#2B2A2A] text-white px-4 py-3">
                  <span className="text-[13px] font-medium">Total</span>
                  <span className="text-[15px] font-bold tabular-nums">
                    {normalizedRubricMarks != null
                      ? roundTo2(normalizedRubricMarks)
                      : 0}{" "}
                    / {maxPoints} pts
                  </span>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
                <div className="flex items-end gap-3">
                  <div className="flex-1 min-w-0">
                    <input
                      type="number"
                      min={0}
                      max={maxPoints}
                      step={1}
                      value={marksInput}
                      onChange={(e) => setMarksInput(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-[15px] font-medium tabular-nums focus:border-[#5A7ACD] focus:ring-1 focus:ring-[#5A7ACD]/30 outline-none"
                      placeholder="0"
                    />
                  </div>
                  <span className="text-[14px] text-gray-500 pb-2.5">
                    / {maxPoints} points
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Feedback section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[13px] font-medium text-[#2B2A2A]">
              <MessageSquare className="w-4 h-4 text-gray-400" strokeWidth={2} />
              <span>Feedback</span>
              <span className="text-[11px] font-normal text-gray-400">(optional)</span>
            </div>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-[13px] text-gray-700 placeholder:text-gray-400 resize-none focus:border-[#5A7ACD] focus:ring-1 focus:ring-[#5A7ACD]/30 outline-none"
              placeholder="Add comments for the student…"
            />
          </div>
        </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2 pt-4 pb-6 px-6 shrink-0 border-t border-gray-100">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="px-4 py-2.5 text-[13px] font-medium text-gray-600 hover:bg-gray-100 rounded-lg border border-gray-300 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={isSubmitting}
            className="px-5 py-2.5 bg-[#2B2A2A] hover:bg-[#3a3939] text-white text-[13px] font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
                <span>Saving…</span>
              </>
            ) : (
              <span>Save grade</span>
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
