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

export interface GradeSubmissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When true, show rubric criteria inputs; otherwise single marks input */
  hasRubric: boolean;
  rubricCategories: RubricCategory[];
  /** Max points for non-rubric mode */
  maxPoints: number;
  currentMarks: number | null;
  currentFeedback: string;
  onSubmit: (marks: number, feedback: string) => Promise<void>;
  isSubmitting?: boolean;
}

/** Flatten criteria with max points for form state */
function flattenCriteria(categories: RubricCategory[]): { maxPoints: number }[] {
  const list: { maxPoints: number }[] = [];
  for (const cat of categories) {
    for (const c of cat.criteria) {
      list.push({ maxPoints: c.points });
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

export function GradeSubmissionDialog({
  open,
  onOpenChange,
  hasRubric,
  rubricCategories,
  maxPoints,
  currentMarks,
  currentFeedback,
  onSubmit,
  isSubmitting = false,
}: GradeSubmissionDialogProps) {
  const flatCriteria = flattenCriteria(rubricCategories);
  const rubricMax = rubricTotal(rubricCategories);

  const [marksInput, setMarksInput] = useState("");
  const [criterionScores, setCriterionScores] = useState<number[]>(() =>
    flatCriteria.map(() => 0)
  );
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setMarksInput(currentMarks != null ? String(currentMarks) : "");
    setFeedback(currentFeedback ?? "");
    if (hasRubric && currentMarks != null && currentMarks > 0 && rubricMax > 0) {
      setCriterionScores(distributeMarksAcrossCriteria(flatCriteria, currentMarks));
    } else {
      setCriterionScores(flatCriteria.map(() => 0));
    }
    setError(null);
  }, [open, currentMarks, currentFeedback, hasRubric, rubricMax, flatCriteria.length]);

  const computedMarks = hasRubric
    ? criterionScores.reduce((a, b) => a + b, 0)
    : null;

  const handleSubmit = async () => {
    setError(null);
    const marks = hasRubric
      ? (computedMarks ?? 0)
      : parseFloat(marksInput);
    if (!Number.isFinite(marks) || marks < 0) {
      setError("Enter a valid score (0 or higher).");
      return;
    }
    const max = hasRubric ? rubricMax : maxPoints;
    if (marks > max) {
      setError(`Score cannot exceed ${max}.`);
      return;
    }
    try {
      await onSubmit(marks, feedback.trim());
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save grade.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={hasRubric ? "sm:max-w-xl" : "sm:max-w-md"}
        aria-describedby={undefined}
      >
        <DialogHeader className="space-y-1.5">
          <DialogTitle className="text-xl text-[#2B2A2A]">
            Grade submission
          </DialogTitle>
          <DialogDescription className="text-[13px] text-gray-600">
            {hasRubric
              ? "Award points for each criterion. The total is saved as the submission grade."
              : "Enter the overall marks for this submission."}
          </DialogDescription>
        </DialogHeader>

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
              <div className="space-y-4 max-h-[36vh] overflow-y-auto pr-1 -mr-1">
                {rubricCategories.map((category, catIndex) => (
                  <div
                    key={catIndex}
                    className="rounded-xl border border-gray-200 bg-gray-50/60 overflow-hidden"
                  >
                    <div className="px-4 py-2.5 border-b border-gray-200 bg-white/80">
                      <h4 className="text-[13px] font-semibold text-[#2B2A2A]">
                        {category.name}
                      </h4>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {category.criteria.map((criterion, critIndex) => {
                        const flatIndex = rubricCategories
                          .slice(0, catIndex)
                          .reduce((acc, c) => acc + c.criteria.length, 0)
                          + critIndex;
                        const value = criterionScores[flatIndex] ?? 0;
                        return (
                          <div
                            key={critIndex}
                            className="flex items-center justify-between gap-4 px-4 py-3 bg-white"
                          >
                            <p className="text-[13px] text-gray-700 flex-1 min-w-0">
                              {criterion.description}
                            </p>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-[12px] text-gray-400">
                                / {criterion.points}
                              </span>
                              <input
                                type="number"
                                min={0}
                                max={criterion.points}
                                step={1}
                                value={value}
                                onChange={(e) => {
                                  const v = parseInt(e.target.value, 10);
                                  if (!Number.isFinite(v)) return;
                                  setCriterionScores((prev) => {
                                    const next = [...prev];
                                    next[flatIndex] = Math.max(
                                      0,
                                      Math.min(criterion.points, v)
                                    );
                                    return next;
                                  });
                                }}
                                className="w-14 rounded-lg border border-gray-300 px-2.5 py-1.5 text-right text-[13px] font-medium tabular-nums focus:border-[#5A7ACD] focus:ring-1 focus:ring-[#5A7ACD]/30 outline-none"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between rounded-xl bg-[#2B2A2A] text-white px-4 py-3">
                  <span className="text-[13px] font-medium">Total</span>
                  <span className="text-[15px] font-bold tabular-nums">
                    {computedMarks ?? 0} / {rubricMax} pts
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

        <DialogFooter className="gap-2 sm:gap-2 pt-2">
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
