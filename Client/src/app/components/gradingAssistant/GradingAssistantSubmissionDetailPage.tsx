import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ChevronLeft } from "lucide-react";
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
import { SubmissionGradingPanel } from "../grading/SubmissionGradingPanel";
import { getLatestGraderReportForStudent } from "../../../services/graderReportService";
import type { GraderReportResultItem } from "../../../types/graderReport";

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
  const [plagResult, setPlagResult] = useState<GraderReportResultItem | null>(null);
  const [plagStatus, setPlagStatus] = useState<"idle" | "loading" | "none" | "error">("idle");

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
    Promise.all([getAssignmentByCourse(cId, aId), listSubmissionsByAssignment(aId), getGradesBySubmission(sId)])
      .then(async ([assign, list, gradeList]) => {
        setAssignment(assign);
        const found = list.find((s) => s.id === sId);
        setSubmission(found ?? null);
        setGrades(gradeList);

        if (found) {
          setPlagStatus("loading");
          try {
            const latest = await getLatestGraderReportForStudent(aId, found.studentId);
            if (!latest) {
              setPlagResult(null);
              setPlagStatus("none");
            } else {
              setPlagResult(latest.student);
              setPlagStatus("idle");
            }
          } catch {
            setPlagResult(null);
            setPlagStatus("error");
          }
        } else {
          setPlagResult(null);
          setPlagStatus("none");
        }
      })
      .catch(() => {
        setError("Failed to load submission.");
        setPlagResult(null);
        setPlagStatus("error");
      })
      .finally(() => setLoading(false));
  }, [classId, assignmentId, submissionId]);

  const gradesByCriteriaId = useMemo(() => {
    const map: Record<number, SubmissionGradeResponse> = {};
    for (const g of grades) {
      map[g.rubricCriteriaId] = g;
    }
    return map;
  }, [grades]);

  useEffect(() => {
    if (!assignment?.rubricId) {
      setRubric(null);
      return;
    }
    getRubric(assignment.rubricId)
      .then(setRubric)
      .catch(() => setRubric(null));
  }, [assignment?.rubricId]);

  const goToSettingsSection = (section: SettingsSection) => {
    navigate(`/settings?section=${section}`);
  };

  const handleLogout = () => {
    clearAuthenticated();
    navigate("/signin", { replace: true });
  };

  const handleSaveOverall = async (data: { marks: number; feedback: string }) => {
    if (!submissionId || submission == null) return;
    const payload = {
      marks: data.marks,
      feedback: data.feedback.trim() || undefined,
    };
    const updated = await updateSubmissionGrade(submissionId, payload);
    setSubmission(updated);
  };

  const handleSaveRubric = async (
    items: Array<{ criterionId: number; awardedScore: number; feedback: string }>,
  ) => {
    if (!submission) return;
    const subId = submission.id;
    const promises: Promise<SubmissionGradeResponse>[] = [];
    for (const item of items) {
      const payload = {
        submissionId: subId,
        rubricCriteriaId: item.criterionId,
        awardedScore: item.awardedScore,
        feedback: item.feedback.trim() || undefined,
      };
      const existing = gradesByCriteriaId[item.criterionId];
      if (existing) {
        promises.push(updateGrade(existing.id, payload));
      } else {
        promises.push(createGrade(payload));
      }
    }
    await Promise.all(promises);
    const updated = await getGradesBySubmission(subId);
    setGrades(updated);
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
          <div className="max-w-7xl mx-auto px-8 py-6">
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
              <div className="mt-2 grid grid-cols-1 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-6">
                {/* Left: assignment + code context */}
                <div className="space-y-6">
                  {assignment && (
                    <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                      <div className="px-6 py-5 border-b border-gray-200">
                        <h2 className="text-[16px] font-semibold text-[#2B2A2A]">
                          {assignment.name}
                        </h2>
                        {assignment.courseName && (
                          <p className="mt-1 text-[13px] text-gray-600">
                            {assignment.courseName}
                          </p>
                        )}
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-[12px] text-gray-600">
                          <div>
                            <span className="font-semibold block text-gray-500 mb-0.5">
                              Available from
                            </span>
                            <span>{formatDate(assignment.availableFrom)}</span>
                          </div>
                          <div>
                            <span className="font-semibold block text-gray-500 mb-0.5">
                              Due date
                            </span>
                            <span>{formatDate(assignment.dueDate)}</span>
                          </div>
                          <div>
                            <span className="font-semibold block text-gray-500 mb-0.5">
                              Late due
                            </span>
                            <span>{formatDate(assignment.lateDueDate)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="px-6 py-5 space-y-4 max-h-[260px] overflow-y-auto">
                        {assignment.description && (
                          <div>
                            <h3 className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                              Description
                            </h3>
                            <p className="text-[13px] text-[#2B2A2A] whitespace-pre-wrap">
                              {assignment.description}
                            </p>
                          </div>
                        )}
                        {rubric?.criteria && rubric.criteria.length > 0 && (
                          <div>
                            <h3 className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                              Rubric overview
                            </h3>
                            <ul className="space-y-1.5">
                              {rubric.criteria.map((c) => (
                                <li
                                  key={c.id}
                                  className="text-[13px] text-[#2B2A2A] flex items-baseline gap-1.5"
                                >
                                  <span className="h-1.5 w-1.5 rounded-full bg-[#5A7ACD] mt-1" />
                                  <span>
                                    <span className="font-medium">
                                      {c.title ?? "Criterion"}
                                    </span>
                                    {c.maxScore != null && (
                                      <span className="text-gray-500">
                                        {` — max ${c.maxScore} pts`}
                                      </span>
                                    )}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </section>
                  )}

                  {/* Simple code viewer from submission files */}
                  {submission.files && submission.files.length > 0 && (
                    <section className="bg-[#1e1e1e] rounded-2xl border border-[#2d2d2d] overflow-hidden">
                      <GradingAssistantCodeViewer
                        files={submission.files}
                        language={assignment?.languageName ?? "Code"}
                      />
                    </section>
                  )}
                </div>

                {/* Right: shared grading panel + plagiarism summary for this student */}
                <div className="space-y-4">
                  <SubmissionGradingPanel
                    header={{
                      studentName: submission.studentName,
                      studentEmail: submission.studentEmail,
                      assignmentName: submission.assignmentName,
                      courseName: submission.courseName,
                      submittedAt: submission.submittedAt,
                      status: submission.status,
                      currentMarks: submission.marks ?? null,
                      currentFeedback: submission.feedback ?? null,
                    }}
                    files={submission.files}
                    rubric={
                      rubric && rubric.criteria
                        ? {
                            name: rubric.name ?? assignment?.rubricName ?? null,
                            criteria: rubric.criteria as RubricCriteriaResponse[],
                            existingGrades: Object.fromEntries(
                              Object.entries(gradesByCriteriaId).map(
                                ([id, g]) => [
                                  Number(id),
                                  {
                                    awardedScore: g.awardedScore,
                                    feedback: g.feedback ?? null,
                                  },
                                ],
                              ),
                            ),
                          }
                        : null
                    }
                    onSaveOverall={handleSaveOverall}
                    onSaveRubric={
                      rubric && rubric.criteria && rubric.criteria.length > 0
                        ? handleSaveRubric
                        : undefined
                    }
                  />

                  <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                    <div className="px-5 py-3 border-b border-gray-200">
                      <h2 className="text-[14px] font-semibold text-[#2B2A2A]">
                        Plagiarism & AI (latest report)
                      </h2>
                      <p className="text-[12px] text-gray-500">
                        Shows this student&apos;s row from the latest grader report for this assignment.
                      </p>
                    </div>
                    <div className="px-5 py-4 text-[13px] text-gray-700">
                      {plagStatus === "loading" && <p>Loading Plagiarism & AI report…</p>}
                      {plagStatus === "error" && (
                        <p className="text-red-600">Unable to load Plagiarism & AI report.</p>
                      )}
                      {plagStatus === "none" && (
                        <p className="text-gray-600">
                          No completed grader report found yet for this assignment, or this student is
                          not included.
                        </p>
                      )}
                      {plagStatus !== "loading" && plagResult && (
                        <div className="space-y-2">
                          <p>
                            Similarity score:{" "}
                            <span className="font-semibold">
                              {Math.round((plagResult.similarity_score ?? 0) * 100)}%
                            </span>
                          </p>
                          <p>
                            Warning:{" "}
                            <span className="text-gray-800">
                              {plagResult.similarity_warning ?? "None"}
                            </span>
                          </p>
                          {typeof plagResult.matches_count === "number" && (
                            <p>Suspicious matches: {plagResult.matches_count}</p>
                          )}
                          {plagResult.comparisons && plagResult.comparisons.length > 0 && (
                            <p className="text-[12px] text-gray-600">
                              {
                                "Detailed side-by-side comparisons are available on the assignment's Plagiarism & AI tab."
                              }
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </section>
                </div>
              </div>
            )}
          </div>
        </main>
      }
    />
  );
}

interface GradingAssistantCodeViewerProps {
  files: GradingAssistantSubmissionResponse["files"];
  language: string;
}

function GradingAssistantCodeViewer({ files, language }: GradingAssistantCodeViewerProps) {
  const safeFiles = files ?? [];
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [code, setCode] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeFile = safeFiles[selectedIndex];

  useEffect(() => {
    if (!activeFile?.url) {
      setCode("");
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(activeFile.url)
      .then((res) => res.text())
      .then((text) => {
        if (!cancelled) {
          setCode(text);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Unable to load file contents.");
          setCode("");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [activeFile?.url]);

  const lines = (code || "").split("\n");

  return (
    <div className="h-full flex flex-col">
      {/* Top bar with language and file selector */}
      <div className="bg-[#252526] border-b border-[#2d2d2d] px-4 py-2 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-[12px] font-medium text-gray-300">
            {language}
          </span>
          {safeFiles.length > 1 && (
            <select
              value={String(selectedIndex)}
              onChange={(e) => setSelectedIndex(Number(e.target.value))}
              className="bg-[#1e1e1e] border border-[#3a3a3a] rounded px-2 py-1 text-[12px] text-gray-200 focus:outline-none focus:ring-1 focus:ring-[#5A7ACD]"
            >
              {safeFiles.map((f, index) => (
                <option key={f.id ?? index} value={index}>
                  {f.fileName ?? `File ${index + 1}`}
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="text-[11px] text-gray-500">
          {loading
            ? "Loading…"
            : error
              ? "Error"
              : `${lines.length} line${lines.length === 1 ? "" : "s"}`}
        </div>
      </div>

      {/* Code area */}
      <div className="flex-1 overflow-auto">
        {error ? (
          <div className="p-4 text-[12px] text-red-400">{error}</div>
        ) : (
          <div className="flex">
            {/* Line numbers */}
            <div className="bg-[#1e1e1e] text-right pr-4 pl-4 py-4 select-none flex-shrink-0 border-r border-[#2d2d2d]">
              {lines.map((_, index) => (
                <div
                  key={index}
                  className="text-[13px] leading-[1.6] font-mono text-gray-600"
                >
                  {index + 1}
                </div>
              ))}
            </div>
            {/* Code content */}
            <div className="flex-1 px-4 py-4">
              <pre className="text-[13px] leading-[1.6] font-mono text-gray-300">
                {lines.map((line, index) => (
                  <div key={index} className="min-h-[1.6em]">
                    {line || " "}
                  </div>
                ))}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
