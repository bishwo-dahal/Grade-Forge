import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { CheckCircle, ChevronLeft, FileText, Save } from "lucide-react";
import type { AssignmentDetailResponse } from "../../../types/gradingAssistantAssignment";
import type { GradingAssistantRubricResponse, RubricCriteriaResponse } from "../../../types/gradingAssistantRubric";
import type { GradingAssistantSubmissionResponse } from "../../../types/gradingAssistantSubmission";
import type { SubmissionGradeResponse } from "../../../types/gradingAssistantSubmissionGrade";
import { getAssignmentByCourse } from "../../../services/gradingAssistantAssignmentService";
import { getRubric } from "../../../services/gradingAssistantRubricService";
import {
  listSubmissionsByAssignment,
  updateSubmissionGrade,
} from "../../../services/gradingAssistantSubmissionService";
import {
  createGrade,
  getGradesBySubmission,
  updateGrade,
} from "../../../services/gradingAssistantSubmissionGradeService";
import { clearAuthenticated, getAuthenticatedUser } from "../../auth";
import { AuthShell } from "../layout/AuthShell";
import { AuthTopBar } from "../layout/AuthTopBar";
import type { SettingsSection } from "../layout/AuthTopBar";

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

function CriterionRow({
  criterion,
  awardedScore,
  feedback,
  onScoreChange,
  onFeedbackChange,
}: {
  criterion: RubricCriteriaResponse;
  awardedScore: string;
  feedback: string;
  onScoreChange: (v: string) => void;
  onFeedbackChange: (v: string) => void;
}) {
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

export function GradingAssistantSubmissionDetailPage() {
  const { classId, assignmentId, submissionId } = useParams();
  const navigate = useNavigate();
  const user = getAuthenticatedUser();
  const displayName = user?.name ?? "Grading Assistant";
  const displayEmail = user?.email ?? "";
  const displayInitials =
    displayName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "GA";

  const [assignment, setAssignment] = useState<AssignmentDetailResponse | null>(null);
  const [submission, setSubmission] =
    useState<GradingAssistantSubmissionResponse | null>(null);
  const [rubric, setRubric] = useState<GradingAssistantRubricResponse | null>(null);
  const [grades, setGrades] = useState<SubmissionGradeResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [marks, setMarks] = useState<string>("");
  const [feedback, setFeedback] = useState<string>("");
  /** Per-criterion: criterion id -> { awardedScore, feedback } for controlled inputs */
  const [criteriaScores, setCriteriaScores] = useState<Record<number, { awardedScore: string; feedback: string }>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!classId || !assignmentId || !submissionId) {
      setLoading(false);
      return;
    }
    const cId = Number(classId);
    const aId = Number(assignmentId);
    const sId = Number(submissionId);
    if (!cId || !aId || !sId) {
      setLoading(false);
      setError("Invalid course, assignment, or submission.");
      return;
    }
    setLoading(true);
    setError(null);
    Promise.all([
      getAssignmentByCourse(cId, aId),
      listSubmissionsByAssignment(aId),
      getGradesBySubmission(sId),
    ])
      .then(([assign, list, gradeList]) => {
        setAssignment(assign);
        const found = list.find((s) => s.id === sId);
        setSubmission(found ?? null);
        setGrades(gradeList);
        if (found) {
          setMarks(found.marks != null ? String(found.marks) : "");
          setFeedback(found.feedback ?? "");
        }
      })
      .catch(() => setError("Failed to load submission."))
      .finally(() => setLoading(false));
  }, [classId, assignmentId, submissionId]);

  useEffect(() => {
    if (!assignment?.rubricId) {
      setRubric(null);
      return;
    }
    getRubric(assignment.rubricId)
      .then(setRubric)
      .catch(() => setRubric(null));
  }, [assignment?.rubricId]);

  const gradesByCriteriaId = useMemo(() => {
    const map: Record<number, SubmissionGradeResponse> = {};
    for (const g of grades) {
      map[g.rubricCriteriaId] = g;
    }
    return map;
  }, [grades]);

  useEffect(() => {
    if (!rubric?.criteria?.length) return;
    const next: Record<number, { awardedScore: string; feedback: string }> = {};
    for (const c of rubric.criteria) {
      const g = gradesByCriteriaId[c.id];
      next[c.id] = {
        awardedScore: g != null ? String(g.awardedScore) : "",
        feedback: g?.feedback ?? "",
      };
    }
    setCriteriaScores(next);
  }, [rubric?.criteria, gradesByCriteriaId]);

  const goToSettingsSection = (section: SettingsSection) => {
    navigate(`/settings?section=${section}`);
  };

  const handleLogout = () => {
    clearAuthenticated();
    navigate("/signin", { replace: true });
  };

  const handleSaveGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!submissionId || submission == null) return;
    const numMarks = marks.trim() === "" ? NaN : parseFloat(marks);
    if (Number.isNaN(numMarks) || numMarks < 0) {
      setSaveError("Enter a valid marks value (number ≥ 0).");
      return;
    }
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(null);
    updateSubmissionGrade(submissionId, {
      marks: numMarks,
      feedback: feedback.trim() || undefined,
    })
      .then((updated) => {
        setSubmission(updated);
        setMarks(updated.marks != null ? String(updated.marks) : "");
        setFeedback(updated.feedback ?? "");
        setSaveError(null);
        setSaveSuccess("Grade saved.");
        setTimeout(() => setSaveSuccess(null), 4000);
      })
      .catch(() => setSaveError("Failed to save grade."))
      .finally(() => setSaving(false));
  };

  const handleSaveRubricGrades = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submission || !rubric?.criteria?.length) return;
    const subId = submission.id;
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(null);
    try {
      const promises: Promise<SubmissionGradeResponse>[] = [];
      for (const c of rubric.criteria) {
        const state = criteriaScores[c.id];
        const rawScore = state?.awardedScore?.trim();
        const awardedScore = rawScore === "" ? 0 : Math.max(0, Math.min(c.maxScore ?? 0, parseInt(rawScore ?? "0", 10) || 0));
        const feedbackVal = state?.feedback?.trim() ?? "";
        const payload = {
          submissionId: subId,
          rubricCriteriaId: c.id,
          awardedScore,
          feedback: feedbackVal || undefined,
        };
        const existing = gradesByCriteriaId[c.id];
        if (existing) {
          promises.push(updateGrade(existing.id, payload));
        } else {
          promises.push(createGrade(payload));
        }
      }
      await Promise.all(promises);
      const updated = await getGradesBySubmission(subId);
      setGrades(updated);
      setCriteriaScores((prev) => {
        const next = { ...prev };
        for (const g of updated) {
          next[g.rubricCriteriaId] = {
            awardedScore: String(g.awardedScore),
            feedback: g.feedback ?? "",
          };
        }
        return next;
      });
      setSaveError(null);
      setSaveSuccess("Rubric grades saved.");
      setTimeout(() => setSaveSuccess(null), 4000);
    } catch {
      setSaveError("Failed to save rubric grades.");
    } finally {
      setSaving(false);
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
    <AuthShell
      roleView="gradingAssistant"
      topBar={
        <AuthTopBar
          roleView="gradingAssistant"
          profile={{
            name: displayName,
            email: displayEmail,
            initials: displayInitials,
          }}
          searchPlaceholder="Search..."
          onSettingsSectionSelect={goToSettingsSection}
          onLogout={handleLogout}
        />
      }
      mainContent={
        <main className="flex-1 overflow-y-auto bg-[#F5F2F2]">
          <div className="max-w-5xl mx-auto px-8 py-6">
            <Link
              to={`/grading-assistant/class/${classId}/assignment/${assignmentId}`}
              className="inline-flex items-center gap-1.5 text-[13px] text-gray-600 hover:text-[#2B2A2A] transition-colors mb-4"
            >
              <ChevronLeft className="w-4 h-4" strokeWidth={2} />
              Back to assignment
            </Link>

            {loading && (
              <p className="text-[14px] text-gray-600">Loading submission…</p>
            )}
            {error && !loading && (
              <div className="rounded-2xl border border-gray-200 bg-white p-6">
                <p className="text-[14px] text-red-600">{error}</p>
                <Link
                  to={`/grading-assistant/class/${classId}/assignment/${assignmentId}`}
                  className="mt-3 inline-block text-[13px] font-medium text-[#5A7ACD]"
                >
                  Back to assignment
                </Link>
              </div>
            )}
            {!loading && submission && (
              <>
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-6">
                  <div className="px-6 py-5 border-b border-gray-200">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#EEF3FF] flex items-center justify-center flex-shrink-0">
                        <FileText
                          className="w-5 h-5 text-[#5A7ACD]"
                          strokeWidth={2}
                        />
                      </div>
                      <div>
                        <h1 className="text-[22px] font-semibold text-[#2B2A2A]">
                          Submission #{submission.id}
                        </h1>
                        <p className="text-[13px] text-gray-600 mt-0.5">
                          {submission.assignmentName ?? "Assignment"} ·{" "}
                          {submission.courseName ?? "Course"}
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
                          {submission.studentName ?? "—"}
                        </p>
                        {submission.studentEmail && (
                          <p className="text-[13px] text-gray-600">
                            {submission.studentEmail}
                          </p>
                        )}
                      </div>
                      <div>
                        <h3 className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                          Submitted at
                        </h3>
                        <p className="text-[14px] text-[#2B2A2A]">
                          {formatDate(submission.submittedAt)}
                        </p>
                      </div>
                      <div>
                        <h3 className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                          Status
                        </h3>
                        <p className="text-[14px] text-[#2B2A2A]">
                          {submission.status ?? "—"}
                        </p>
                      </div>
                      <div>
                        <h3 className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                          Marks
                        </h3>
                        <p className="text-[14px] text-[#2B2A2A]">
                          {submission.marks != null
                            ? String(submission.marks)
                            : "—"}
                        </p>
                      </div>
                    </div>
                    {submission.feedback && (
                      <div>
                        <h3 className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                          Feedback
                        </h3>
                        <p className="text-[14px] text-[#2B2A2A] whitespace-pre-wrap">
                          {submission.feedback}
                        </p>
                      </div>
                    )}
                    {submission.files && submission.files.length > 0 && (
                      <div>
                        <h3 className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
                          Files
                        </h3>
                        <ul className="space-y-1">
                          {submission.files.map((f, i) => (
                            <li key={f.id ?? i}>
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

                {saveSuccess && (
                  <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[14px] text-emerald-800">
                    <CheckCircle className="h-5 w-5 flex-shrink-0 text-emerald-600" strokeWidth={2} />
                    <span>{saveSuccess}</span>
                  </div>
                )}

                {/* Plain grade (marks + feedback) — always shown */}
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-6">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-[16px] font-semibold text-[#2B2A2A]">
                      Grade (overall)
                    </h2>
                  </div>
                  <form onSubmit={handleSaveGrade} className="px-6 py-5 space-y-4">
                    {saveError && (
                      <p className="text-[14px] text-red-600">{saveError}</p>
                    )}
                    <div>
                      <label
                        htmlFor="ga-marks"
                        className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-1"
                      >
                        Marks
                      </label>
                      <input
                        id="ga-marks"
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
                        htmlFor="ga-feedback"
                        className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-1"
                      >
                        Feedback
                      </label>
                      <textarea
                        id="ga-feedback"
                        rows={4}
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-[14px] text-[#2B2A2A] focus:border-[#5A7ACD] focus:outline-none focus:ring-1 focus:ring-[#5A7ACD]"
                        placeholder="Optional feedback for the student"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center gap-2 rounded-lg bg-[#5A7ACD] px-4 py-2 text-[14px] font-medium text-white hover:bg-[#4a6abd] disabled:opacity-60 transition-colors"
                    >
                      <Save className="w-4 h-4" strokeWidth={2} />
                      {saving ? "Saving…" : "Save grade"}
                    </button>
                  </form>
                </div>

                {/* Rubric criteria grading — when assignment has a rubric */}
                {rubric?.criteria && rubric.criteria.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h2 className="text-[16px] font-semibold text-[#2B2A2A]">
                        Grade by rubric — {rubric.name ?? "Rubric"}
                      </h2>
                    </div>
                    <form onSubmit={handleSaveRubricGrades} className="px-6 py-5 space-y-5">
                      {saveError && (
                        <p className="text-[14px] text-red-600">{saveError}</p>
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
                        disabled={saving}
                        className="inline-flex items-center gap-2 rounded-lg bg-[#5A7ACD] px-4 py-2 text-[14px] font-medium text-white hover:bg-[#4a6abd] disabled:opacity-60 transition-colors"
                      >
                        <Save className="w-4 h-4" strokeWidth={2} />
                        {saving ? "Saving…" : "Save rubric grades"}
                      </button>
                    </form>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      }
    />
  );
}
