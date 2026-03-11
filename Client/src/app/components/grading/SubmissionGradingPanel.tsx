import React, { useEffect, useState } from "react";
import { CheckCircle, FileText, Save } from "lucide-react";

interface SubmissionFileLike {
  id?: number;
  fileName?: string;
  url?: string;
}

interface RubricCriterionLike {
  id: number;
  title?: string | null;
  description?: string | null;
  maxScore?: number | null;
}

interface RubricGradeLike {
  awardedScore: number;
  feedback?: string | null;
}

interface SubmissionGradingPanelProps {
  header: {
    studentName?: string | null;
    studentEmail?: string | null;
    assignmentName?: string | null;
    courseName?: string | null;
    submittedAt?: string | null;
    status?: string | null;
    currentMarks?: number | null;
    currentFeedback?: string | null;
  };
  files?: SubmissionFileLike[] | null;
  rubric?: {
    name?: string | null;
    criteria: RubricCriterionLike[];
    existingGrades: Record<number, RubricGradeLike>;
  } | null;
  onSaveOverall: (data: { marks: number; feedback: string }) => Promise<void> | void;
  onSaveRubric?: (
    grades: Array<{ criterionId: number; awardedScore: number; feedback: string }>
  ) => Promise<void> | void;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

interface CriterionRowProps {
  criterion: RubricCriterionLike;
  awardedScore: string;
  feedback: string;
  onScoreChange: (value: string) => void;
  onFeedbackChange: (value: string) => void;
}

function CriterionRow({
  criterion,
  awardedScore,
  feedback,
  onScoreChange,
  onFeedbackChange,
}: CriterionRowProps) {
  const maxScore = criterion.maxScore ?? 0;

  return (
    <div className="border border-gray-200 rounded-xl p-4 space-y-3">
      <div>
        <h4 className="text-[14px] font-medium text-[#2B2A2A]">
          {criterion.title ?? "Criterion"}
        </h4>
        {criterion.description && (
          <p className="text-[13px] text-gray-600 mt-0.5">{criterion.description}</p>
        )}
        {maxScore > 0 && (
          <p className="text-[12px] text-gray-500 mt-1">Max score: {maxScore}</p>
        )}
      </div>
      <div className="flex flex-wrap gap-4 items-start">
        <div>
          <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Score
          </label>
          <input
            type="number"
            min={0}
            max={maxScore}
            value={awardedScore}
            onChange={(e) => onScoreChange(e.target.value)}
            className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-[14px] text-[#2B2A2A] focus:border-[#5A7ACD] focus:outline-none focus:ring-1 focus:ring-[#5A7ACD]"
          />
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Feedback
          </label>
          <textarea
            rows={2}
            value={feedback}
            onChange={(e) => onFeedbackChange(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-[14px] text-[#2B2A2A] focus:border-[#5A7ACD] focus:outline-none focus:ring-1 focus:ring-[#5A7ACD]"
            placeholder="Optional"
          />
        </div>
      </div>
    </div>
  );
}

export function SubmissionGradingPanel({
  header,
  files,
  rubric,
  onSaveOverall,
  onSaveRubric,
}: SubmissionGradingPanelProps) {
  const [marks, setMarks] = useState<string>(
    header.currentMarks != null ? String(header.currentMarks) : "",
  );
  const [overallFeedback, setOverallFeedback] = useState<string>(
    header.currentFeedback ?? "",
  );
  const [criteriaScores, setCriteriaScores] = useState<
    Record<number, { awardedScore: string; feedback: string }>
  >({});
  const [savingOverall, setSavingOverall] = useState(false);
  const [savingRubric, setSavingRubric] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setMarks(header.currentMarks != null ? String(header.currentMarks) : "");
    setOverallFeedback(header.currentFeedback ?? "");
  }, [header.currentMarks, header.currentFeedback]);

  useEffect(() => {
    if (!rubric?.criteria?.length) {
      setCriteriaScores({});
      return;
    }
    const next: Record<number, { awardedScore: string; feedback: string }> = {};
    for (const c of rubric.criteria) {
      const g = rubric.existingGrades[c.id];
      next[c.id] = {
        awardedScore: g != null ? String(g.awardedScore) : "",
        feedback: g?.feedback ?? "",
      };
    }
    setCriteriaScores(next);
  }, [rubric]);

  const handleSaveOverallClick = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const numMarks = marks.trim() === "" ? NaN : parseFloat(marks);
    if (Number.isNaN(numMarks) || numMarks < 0) {
      setError("Enter a valid marks value (number ≥ 0).");
      return;
    }

    try {
      setSavingOverall(true);
      await onSaveOverall({
        marks: numMarks,
        feedback: overallFeedback.trim(),
      });
      setSuccess("Grade saved.");
    } catch {
      setError("Failed to save grade.");
    } finally {
      setSavingOverall(false);
      if (!error) {
        window.setTimeout(() => setSuccess(null), 4000);
      }
    }
  };

  const handleSaveRubricClick = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rubric?.criteria?.length || !onSaveRubric) return;
    setError(null);
    setSuccess(null);

    const payloads: Array<{ criterionId: number; awardedScore: number; feedback: string }> = [];
    for (const c of rubric.criteria) {
      const state = criteriaScores[c.id];
      const rawScore = state?.awardedScore?.trim();
      const max = c.maxScore ?? 0;
      const numeric = rawScore === "" ? 0 : Number.parseInt(rawScore ?? "0", 10) || 0;
      const awardedScore = Math.max(0, Math.min(max, numeric));
      const fb = state?.feedback?.trim() ?? "";
      payloads.push({
        criterionId: c.id,
        awardedScore,
        feedback: fb,
      });
    }

    try {
      setSavingRubric(true);
      await onSaveRubric(payloads);
      setSuccess("Rubric grades saved.");
    } catch {
      setError("Failed to save rubric grades.");
    } finally {
      setSavingRubric(false);
      if (!error) {
        window.setTimeout(() => setSuccess(null), 4000);
      }
    }
  };

  const setCriterionScore = (criterionId: number, field: "awardedScore" | "feedback", value: string) => {
    setCriteriaScores((prev) => ({
      ...prev,
      [criterionId]: {
        ...prev[criterionId],
        [field]: value,
      },
    }));
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-6">
        <div className="px-6 py-5 border-b border-gray-200">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EEF3FF] flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-[#5A7ACD]" strokeWidth={2} />
            </div>
            <div>
              <h1 className="text-[22px] font-semibold text-[#2B2A2A]">
                {header.assignmentName ?? "Submission"}
              </h1>
              <p className="text-[13px] text-gray-600 mt-0.5">
                {header.courseName ?? "Course"}
              </p>
            </div>
          </div>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <h3 className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Student
              </h3>
              <p className="text-[14px] text-[#2B2A2A]">
                {header.studentName ?? "—"}
              </p>
              {header.studentEmail && (
                <p className="text-[13px] text-gray-600">
                  {header.studentEmail}
                </p>
              )}
            </div>
            <div>
              <h3 className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Submitted at
              </h3>
              <p className="text-[14px] text-[#2B2A2A]">
                {formatDate(header.submittedAt)}
              </p>
            </div>
            <div>
              <h3 className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Status
              </h3>
              <p className="text-[14px] text-[#2B2A2A]">
                {header.status ?? "—"}
              </p>
            </div>
            <div>
              <h3 className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Marks
              </h3>
              <p className="text-[14px] text-[#2B2A2A]">
                {header.currentMarks != null ? String(header.currentMarks) : "—"}
              </p>
            </div>
          </div>
          {header.currentFeedback && (
            <div>
              <h3 className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Existing feedback
              </h3>
              <p className="text-[14px] text-[#2B2A2A] whitespace-pre-wrap">
                {header.currentFeedback}
              </p>
            </div>
          )}
          {files && files.length > 0 && (
            <div>
              <h3 className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Files
              </h3>
              <ul className="space-y-1">
                {files.map((f, index) => (
                  <li key={f.id ?? index}>
                    {f.url ? (
                      <a
                        href={f.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[14px] text-[#5A7ACD] hover:underline"
                      >
                        {f.fileName ?? "File"}
                      </a>
                    ) : (
                      <span className="text-[14px] text-[#2B2A2A]">
                        {f.fileName ?? "File"}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {success && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[14px] text-emerald-800">
          <CheckCircle className="h-5 w-5 flex-shrink-0 text-emerald-600" strokeWidth={2} />
          <span>{success}</span>
        </div>
      )}

      {/* Overall grade */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-[16px] font-semibold text-[#2B2A2A]">
            Grade (overall)
          </h2>
        </div>
        <form onSubmit={handleSaveOverallClick} className="px-6 py-5 space-y-4">
          {error && (
            <p className="text-[14px] text-red-600">{error}</p>
          )}
          <div>
            <label
              htmlFor="submission-marks"
              className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-1"
            >
              Marks
            </label>
            <input
              id="submission-marks"
              type="number"
              min={0}
              step="any"
              value={marks}
              onChange={(e) => setMarks(e.target.value)}
              className="w-full max-w-[200px] rounded-lg border border-gray-300 px-3 py-2 text-[14px] text-[#2B2A2A] focus:border-[#5A7ACD] focus:outline-none focus:ring-1 focus:ring-[#5A7ACD]"
            />
          </div>
          <div>
            <label
              htmlFor="submission-feedback"
              className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-1"
            >
              Feedback
            </label>
            <textarea
              id="submission-feedback"
              rows={4}
              value={overallFeedback}
              onChange={(e) => setOverallFeedback(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-[14px] text-[#2B2A2A] focus:border-[#5A7ACD] focus:outline-none focus:ring-1 focus:ring-[#5A7ACD]"
              placeholder="Optional feedback for the student"
            />
          </div>
          <button
            type="submit"
            disabled={savingOverall}
            className="inline-flex items-center gap-2 rounded-lg bg-[#5A7ACD] px-4 py-2 text-[14px] font-medium text-white hover:bg-[#4a6abd] disabled:opacity-60 transition-colors"
          >
            <Save className="w-4 h-4" strokeWidth={2} />
            {savingOverall ? "Saving…" : "Save grade"}
          </button>
        </form>
      </div>

      {/* Rubric grading */}
      {rubric?.criteria && rubric.criteria.length > 0 && onSaveRubric && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-[16px] font-semibold text-[#2B2A2A]">
              Grade by rubric — {rubric.name ?? "Rubric"}
            </h2>
          </div>
          <form onSubmit={handleSaveRubricClick} className="px-6 py-5 space-y-5">
            {error && (
              <p className="text-[14px] text-red-600">{error}</p>
            )}
            {rubric.criteria.map((c) => (
              <CriterionRow
                key={c.id}
                criterion={c}
                awardedScore={criteriaScores[c.id]?.awardedScore ?? ""}
                feedback={criteriaScores[c.id]?.feedback ?? ""}
                onScoreChange={(v) => setCriterionScore(c.id, "awardedScore", v)}
                onFeedbackChange={(v) => setCriterionScore(c.id, "feedback", v)}
              />
            ))}
            <button
              type="submit"
              disabled={savingRubric}
              className="inline-flex items-center gap-2 rounded-lg bg-[#5A7ACD] px-4 py-2 text-[14px] font-medium text-white hover:bg-[#4a6abd] disabled:opacity-60 transition-colors"
            >
              <Save className="w-4 h-4" strokeWidth={2} />
              {savingRubric ? "Saving…" : "Save rubric grades"}
            </button>
          </form>
        </div>
      )}
    </>
  );
}

