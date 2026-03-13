import React, { useCallback, useEffect, useMemo, useState } from "react";
import JSZip from "jszip";
import { Link, useNavigate, useParams } from "react-router";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { ChevronLeft, GripVertical, User, CheckSquare, Download } from "lucide-react";
import { AssignmentHeader } from "./assignment/AssignmentHeader";
import { DescriptionPanel } from "./assignment/DescriptionPanel";
import { PublicTestsPanel } from "./assignment/PublicTestsPanel";
import { GradingRubricPanel } from "./assignment/GradingRubricPanel";
import { CircularScorePanel } from "./assignment/CircularScorePanel";
import { GradeSubmissionDialog } from "./assignment/GradeSubmissionDialog";
import { CodeWorkspace } from "./assignment/CodeWorkspace";
import {
  getAssignmentDescription,
  getAssignmentDetailById,
  listRubricCategories,
} from "../../services/assignmentService";
import {
  fetchSubmissionFileText,
  listFacultyAssignmentSubmissionFiles,
  resolvePreviewLanguage,
  submitFacultySubmissionGrade,
} from "../../services/submissionService";
import {
  createFacultyGrade,
  updateFacultyGrade,
} from "../../services/facultySubmissionGradeService";
import type { FacultySubmissionGradeResponse } from "../../types/facultySubmissionGrade";
import { getRunTestsLatest, requestRunTests, runTestsWithFiles, pollRunTestsUntilDone } from "../../services/runTestsService";
import { getAssignmentByCourse } from "../../services/gradingAssistantAssignmentService";
import { getRubric } from "../../services/gradingAssistantRubricService";
import {
  listSubmissionsByAssignment,
  updateSubmissionGrade,
} from "../../services/gradingAssistantSubmissionService";
import { clearAuthenticated, getAuthenticatedUser, getAuthenticatedRole } from "../auth";
import { AuthShell } from "./layout/AuthShell";
import { AuthTopBar } from "./layout/AuthTopBar";
import type { SettingsSection } from "./layout/AuthTopBar";
import type { AssignmentDetail, AssignmentDescription } from "../../types/assignment";
import type { RubricCategory } from "../../types/grade";
import type { GradingAssistantRubricResponse } from "../../types/gradingAssistantRubric";
import type { TestRunJobStatusResponse } from "../../types/runTests";
import type { PublicTestCase } from "../../types/submission";

type GradingTabType = "description" | "tests" | "plagiarism" | "rubric";

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

/** Map GA rubric to RubricCategory[] for GradingRubricPanel */
function mapGARubricToCategories(rubric: GradingAssistantRubricResponse | null): RubricCategory[] {
  if (!rubric?.criteria?.length) return [];
  const points = rubric.criteria.reduce((sum, c) => sum + (c.maxScore ?? 0), 0);
  return [
    {
      name: rubric.name ?? "Rubric",
      points,
      criteria: rubric.criteria.map((c) => ({
        description: c.title ?? "Criterion",
        points: c.maxScore ?? 0,
      })),
    },
  ];
}

/** Build minimal AssignmentDetail for header when we only have GA assignment response. */
function buildAssignmentDetailFromGA(
  name: string,
  courseName: string,
  dueDate: string,
  options: { submissionMarks?: number | null; totalPoints?: number | null } = {}
): AssignmentDetail {
  const { submissionMarks = null, totalPoints = 0 } = options;
  return {
    id: "",
    title: name,
    course: courseName,
    courseCode: "",
    dueDate: formatDate(dueDate),
    status: submissionMarks != null ? "graded" : "submitted",
    points: { earned: submissionMarks ?? null, total: totalPoints ?? 0 },
    submissionsUsed: 0,
    submissionsAllowed: null,
    language: "Python",
    languageAllowedExtensions: null,
    hasStarterCode: false,
  };
}

export function AssignmentGradingPage() {
  const { classId, assignmentId, submissionId } = useParams();
  const navigate = useNavigate();
  const role = getAuthenticatedRole();
  const isFaculty = role === "FACULTY";
  const isGA = role === "GRADING_ASSISTANT";

  const [activeTab, setActiveTab] = useState<GradingTabType>("description");
  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null);
  const [description, setDescription] = useState<AssignmentDescription | null>(null);
  const [rubricCategories, setRubricCategories] = useState<RubricCategory[]>([]);
  const [submissionFiles, setSubmissionFiles] = useState<{ fileName: string; content: string }[]>([]);
  const [submissionFileLinks, setSubmissionFileLinks] = useState<{ fileName: string; downloadUrl: string | null }[]>([]);
  const [submissionLanguage, setSubmissionLanguage] = useState<string>("Python");
  const [studentName, setStudentName] = useState<string>("");
  const [studentEmail, setStudentEmail] = useState<string | null>(null);
  const [submittedAt, setSubmittedAt] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submissionMarks, setSubmissionMarks] = useState<number | null>(null);
  const [submissionFeedback, setSubmissionFeedback] = useState<string>("");
  const [gradeDialogOpen, setGradeDialogOpen] = useState(false);
  const [gradeSubmitting, setGradeSubmitting] = useState(false);
  const [runLoading, setRunLoading] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [runResult, setRunResult] = useState<TestRunJobStatusResponse | null>(null);

  const backToAssignmentUrl = isFaculty
    ? `/faculty/class/${classId}/assignment/${assignmentId}`
    : `/grading-assistant/class/${classId}/assignment/${assignmentId}`;
  const backLabel = "Back to assignment";

  const loadFacultyData = useCallback(async () => {
    if (!assignmentId || !submissionId) return;
    const aId = assignmentId;
    const sId = submissionId;
    const [assignData, descData, rubricData, rows] = await Promise.all([
      getAssignmentDetailById(aId),
      getAssignmentDescription(aId),
      listRubricCategories(aId),
      listFacultyAssignmentSubmissionFiles(aId),
    ]);
    const row = rows.find((r) => r.submissionId === sId) ?? rows.find((r) => String(r.submissionId) === String(sId));
    if (!row) {
      setError("Submission not found.");
      return;
    }
    setAssignment(assignData);
    setDescription(descData);
    setRubricCategories(rubricData);
    const files = row.files ?? [];
    if (!files.length) {
      setError("Submission or files not found.");
      return;
    }
    setStudentName(row.studentName);
    setSubmittedAt(formatDate(row.submittedAt));
    setSubmissionLanguage(resolvePreviewLanguage(files[0].fileName, assignData.language));
    setSubmissionMarks(row.marks ?? null);
    setSubmissionFeedback("");
    const filesWithContent = await Promise.all(
      files.map(async (f) => {
        const content = await fetchSubmissionFileText(f.downloadUrl ?? "", f.fileName);
        return { fileName: f.fileName, content };
      })
    );
    setSubmissionFiles(filesWithContent);
    setSubmissionFileLinks(
      files.map((f) => ({
        fileName: f.fileName,
        downloadUrl: f.downloadUrl ?? null,
      }))
    );
  }, [assignmentId, submissionId]);

  const loadGAData = useCallback(async () => {
    if (!classId || !assignmentId || !submissionId) return;
    const cId = Number(classId);
    const aId = Number(assignmentId);
    const sId = Number(submissionId);
    if (!cId || !aId || !sId) throw new Error("Invalid IDs");
    const [assignData, list] = await Promise.all([
      getAssignmentByCourse(cId, aId),
      listSubmissionsByAssignment(aId),
    ]);
    const sub = list.find((s) => s.id === sId) ?? null;
    if (!sub) {
      setError("Submission not found.");
      return;
    }
    const rubricId = assignData.rubricId ?? null;
    let totalPoints = assignData.totalPoints ?? null;
    if (rubricId != null) {
      const rubric = await getRubric(rubricId);
      setRubricCategories(mapGARubricToCategories(rubric));
      if (totalPoints == null && rubric?.criteria?.length) {
        totalPoints = rubric.criteria.reduce((sum, c) => sum + (c.maxScore ?? 0), 0);
      }
    } else {
      setRubricCategories([]);
    }
    setAssignment(
      buildAssignmentDetailFromGA(
        assignData.name,
        assignData.courseName ?? "",
        sub.submittedAt ?? assignData.dueDate ?? "",
        { submissionMarks: sub.marks ?? null, totalPoints }
      )
    );
    setDescription({
      problemDescription: [assignData.description ?? ""].filter(Boolean),
      requiredMethods: [],
      exampleCode: "",
      inputOutput: { input: "", output: "" },
      rubric: [],
      constraints: [],
    });
    setStudentName(sub.studentName ?? sub.studentEmail ?? `Submission #${sub.id}`);
    setStudentEmail(sub.studentEmail ?? null);
    setSubmittedAt(formatDate(sub.submittedAt ?? undefined));
    setSubmissionLanguage(assignData.languageName ?? "Python");
    setSubmissionMarks(sub.marks ?? null);
    setSubmissionFeedback(sub.feedback ?? "");
    const files = sub.files ?? [];
    if (files.length > 0) {
      const filesWithContent = await Promise.all(
        files.map(async (f) => {
          const url = f.downloadUrl ?? (f as { url?: string }).url;
          const content = url ? await (await fetch(url)).text() : "";
          return { fileName: f.fileName ?? "file", content };
        })
      );
      setSubmissionFiles(filesWithContent);
      setSubmissionFileLinks(
        files.map((f) => {
          const url = f.downloadUrl ?? (f as { url?: string }).url ?? null;
          return { fileName: f.fileName ?? "file", downloadUrl: url };
        })
      );
    } else {
      setSubmissionFiles([]);
    }
  }, [classId, assignmentId, submissionId]);

  useEffect(() => {
    if (!assignmentId || !submissionId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    (isFaculty ? loadFacultyData() : isGA ? loadGAData() : Promise.resolve())
      .catch(() => setError("Failed to load submission."))
      .finally(() => setLoading(false));
  }, [assignmentId, submissionId, isFaculty, isGA, loadFacultyData, loadGAData]);

  // Load latest test run for this submission (created on student submit or manual "Run tests").
  useEffect(() => {
    if (!submissionId) return;
    getRunTestsLatest(submissionId)
      .then((data) => data && setRunResult(data))
      .catch(() => setRunResult(null));
  }, [submissionId]);

  // Poll while queued/running so faculty/GA sees results as soon as the consumer finishes.
  useEffect(() => {
    if (!runResult || runResult.status === "COMPLETED" || runResult.status === "FAILED") return;
    const interval = setInterval(() => {
      getRunTestsLatest(submissionId!)
        .then((data) => data && setRunResult(data))
        .catch(() => {});
    }, 10000);
    return () => clearInterval(interval);
  }, [submissionId, runResult?.status]);

  const scoreItems = useMemo(
    () => [
      { label: "Plagiarism", value: null as number | null, percent: 0, color: "#FEB05D" },
      { label: "AI", value: null as number | null, percent: 0, color: "#5A7ACD" },
      { label: "AI Grader Score", value: null as number | null, percent: null, color: "#1E7A3F" },
    ],
    []
  );

  const handleRunTests = useCallback(
    async (files?: File[]) => {
      const hasFiles = files != null && files.length > 0;
      if (hasFiles && assignmentId) {
        setRunLoading(true);
        setRunError(null);
        try {
          const result = await runTestsWithFiles(assignmentId, files);
          setRunResult(result);
          setActiveTab("tests");
        } catch (e) {
          const message = e instanceof Error ? e.message : "Run tests failed.";
          setRunError(message);
          setRunResult(null);
        } finally {
          setRunLoading(false);
        }
        return;
      }
      if (!submissionId) return;
      setRunLoading(true);
      setRunError(null);
      try {
        await requestRunTests(submissionId);
        const job = await pollRunTestsUntilDone(submissionId);
        setRunResult(job);
        setActiveTab("tests");
      } catch (e) {
        const message = e instanceof Error ? e.message : "Run tests failed.";
        setRunError(message);
        setRunResult(null);
      } finally {
        setRunLoading(false);
      }
    },
    [assignmentId, submissionId]
  );

  const handleSaveGrade = useCallback(
    async (marks: number, feedback: string) => {
      if (!submissionId) return;
      setGradeSubmitting(true);
      try {
        if (isFaculty) {
          await submitFacultySubmissionGrade({
            submissionId,
            marks,
            feedback,
          });

          // If feedback is rubric JSON, also persist per-criterion grades.
          try {
            const parsed = JSON.parse(feedback) as {
              criteria?: Array<{
                criterionId?: number;
                score: number;
                comment?: string;
              }>;
            };
            if (parsed && Array.isArray(parsed.criteria) && parsed.criteria.length > 0) {
              const existing: FacultySubmissionGradeResponse[] =
                await (async () => {
                  // Backend may not support faculty submission-grades yet; fail silently if so.
                  try {
                    const { getFacultyGradesBySubmission } = await import(
                      "../../services/facultySubmissionGradeService"
                    );
                    return await getFacultyGradesBySubmission(submissionId);
                  } catch {
                    return [];
                  }
                })();
              const byCriteriaId = new Map<number, FacultySubmissionGradeResponse>();
              for (const g of existing) {
                byCriteriaId.set(g.rubricCriteriaId, g);
              }

              const tasks = parsed.criteria
                .filter((item) => typeof item.criterionId === "number")
                .map((item) => {
                  const criterionId = item.criterionId as number;
                  const payload = {
                    submissionId: Number(submissionId),
                    rubricCriteriaId: criterionId,
                    awardedScore: Math.max(0, Math.round(item.score)),
                    feedback: item.comment?.trim() || undefined,
                  };
                  const existingGrade = byCriteriaId.get(criterionId);
                  return existingGrade
                    ? updateFacultyGrade(existingGrade.id, payload)
                    : createFacultyGrade(payload);
                });

              if (tasks.length > 0) {
                await Promise.all(tasks);
              }
            }
          } catch {
            // If feedback is not JSON or the per-criterion API is unavailable, skip silently.
          }
        } else {
          await updateSubmissionGrade(Number(submissionId), { marks, feedback });
        }
        setSubmissionMarks(marks);
        setSubmissionFeedback(feedback);
        setAssignment((prev) =>
          prev
            ? {
                ...prev,
                status: "graded",
                points: { ...prev.points, earned: marks },
              }
            : prev,
        );
      } finally {
        setGradeSubmitting(false);
      }
    },
    [submissionId, isFaculty],
  );

  const codeWorkspaceAssignment = useMemo(
    () =>
      assignment
        ? {
            language: assignment.language,
            hasStarterCode: assignment.hasStarterCode,
            submissionsUsed: assignment.submissionsUsed,
            submissionsAllowed: assignment.submissionsAllowed,
          }
        : null,
    [assignment]
  );

  const facultyEditorPreviewPayload = useMemo(() => {
    if (!submissionLanguage || !submissionFiles.length) return null;
    const first = submissionFiles[0];
    return {
      optionId: `${submissionId ?? ""}-${first.fileName}`,
      fileName: first.fileName,
      language: submissionLanguage,
      content: first.content,
      files: submissionFiles,
    };
  }, [submissionFiles, submissionLanguage, submissionId]);

  const handleDownloadSubmissionFiles = useCallback(async () => {
    if (!submissionFileLinks.length) return;
    try {
      const zip = new JSZip();
      for (const file of submissionFileLinks) {
        if (!file.downloadUrl) continue;
        const response = await fetch(file.downloadUrl);
        if (!response.ok) continue;
        const blob = await response.blob();
        zip.file(file.fileName, blob);
      }
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      const safeStudentName = (studentName || "submission").replace(/[\\/:*?"<>|]/g, "_");
      a.href = url;
      a.download = `${safeStudentName}-files.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // Silent failure; download is a convenience action and should not break grading flow.
    }
  }, [submissionFileLinks, studentName]);

  if (!isFaculty && !isGA) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F5F2F2] text-[14px] text-gray-600">
        Access denied.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-[#F5F2F2]">
        <div className="bg-white border-b border-gray-200 px-6 py-3">
          <div className="h-4 w-56 rounded bg-gray-200 animate-pulse" />
        </div>
        <div className="flex flex-1 overflow-hidden gap-1 p-0">
          <div className="w-[35%] min-w-[320px] bg-white border-r border-gray-200 p-4 animate-pulse">
            <div className="h-7 w-52 rounded bg-gray-200 mb-4" />
            <div className="h-10 w-full rounded bg-gray-100 mb-4" />
            <div className="space-y-3">
              <div className="h-24 w-full rounded bg-gray-100" />
              <div className="h-24 w-full rounded bg-gray-100" />
            </div>
          </div>
          <div className="flex-1 p-4 animate-pulse">
            <div className="h-full w-full rounded-xl bg-gray-100" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F5F2F2]">
        <div className="text-center">
          <p className="text-[14px] text-red-600">{error ?? "Submission not found."}</p>
          <Link to={backToAssignmentUrl} className="mt-3 inline-block text-[13px] font-medium text-[#5A7ACD]">
            {backLabel}
          </Link>
        </div>
      </div>
    );
  }

  const mainContent = (
    <div
      className={
        isGA
          ? "flex flex-1 min-h-0 flex-col overflow-hidden bg-[#F5F2F2]"
          : "flex h-screen flex-col overflow-hidden bg-[#F5F2F2]"
      }
    >
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center gap-2 text-[13px]">
          <Link to={backToAssignmentUrl} className="text-gray-500 hover:text-[#2B2A2A] flex items-center gap-1">
            <ChevronLeft className="w-4 h-4" strokeWidth={2} />
            {backLabel}
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-[#2B2A2A] font-medium">Submission</span>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden w-full">
        <PanelGroup direction="horizontal" className="h-full w-full">
          <Panel defaultSize={35} minSize={28} className="h-full">
            <div className="h-full overflow-y-auto overflow-x-hidden bg-white border-r border-gray-200">
              <div className="min-h-full flex flex-col">
                <div className="flex-shrink-0">
                  <AssignmentHeader assignment={assignment} />
                </div>

                {/* Student info - below assignment title */}
                <div className="flex-shrink-0 border-b border-gray-200 px-6 py-3 bg-gray-50/80">
                  <div className="flex items-center gap-2 text-[13px]">
                    <User className="w-4 h-4 text-gray-500" strokeWidth={2} />
                    <span className="font-medium text-[#2B2A2A]">{studentName}</span>
                    {studentEmail && (
                      <>
                        <span className="text-gray-400">·</span>
                        <span className="text-gray-600">{studentEmail}</span>
                      </>
                    )}
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2 text-[12px] text-gray-500">
                    <span>Submitted: {submittedAt}</span>
                    {submissionFileLinks.length > 0 && (
                      <button
                        type="button"
                        onClick={handleDownloadSubmissionFiles}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-gray-300 bg-white text-[11px] font-medium text-[#2B2A2A] hover:bg-gray-50"
                      >
                        <Download className="w-3.5 h-3.5" strokeWidth={2} />
                        <span>Download files</span>
                      </button>
                    )}
                  </div>
                  <div className="mt-0.5 text-[11px] text-gray-500">
                    {submissionFiles.length <= 1
                      ? `File: ${submissionFiles[0]?.fileName ?? "—"}`
                      : `Files: ${submissionFiles.length} files`}
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex-shrink-0 border-b border-gray-200 px-6">
                  <div className="flex gap-6">
                    {(
                      [
                        { id: "description" as const, label: "Description" },
                        { id: "tests" as const, label: "Tests" },
                        { id: "plagiarism" as const, label: "Plagiarism" },
                        { id: "rubric" as const, label: "Grading Rubric" },
                      ] as const
                    ).map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`relative py-3 text-[14px] font-medium transition-colors ${
                          activeTab === tab.id ? "text-[#2B2A2A]" : "text-gray-500 hover:text-[#2B2A2A]"
                        }`}
                      >
                        {tab.label}
                        {activeTab === tab.id && (
                          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2B2A2A]" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tab content - grows with content, panel scrolls */}
                <div className="flex-1 min-h-0">
                  {activeTab === "description" && <DescriptionPanel description={description} />}
                  {activeTab === "tests" && (
                    <PublicTestsPanel
                      testCases={[]}
                      onRunTests={handleRunTests}
                      isRunning={runLoading}
                      runError={runError}
                      runResult={
                        runResult
                          ? {
                              passedCount: runResult.passedCount,
                              totalCount: runResult.totalCount,
                              results: runResult.results.map(
                                (r, i): PublicTestCase => ({
                                  id: r.testCaseId ?? i,
                                  name: r.testCaseTitle,
                                  passed: r.passed,
                                  input: "",
                                  inputFileName: null,
                                  expectedOutput: r.expectedOutput ?? "",
                                  actualOutput: r.actualOutput ?? r.errorMessage ?? "",
                                  executionTime: r.runtimeMs != null ? `${r.runtimeMs}ms` : undefined,
                                })
                              ),
                            }
                          : null
                      }
                      runStatus={runResult?.status ?? null}
                      showPublicNote={false}
                    />
                  )}
                  {activeTab === "plagiarism" && (
                    <div className="p-6 text-[14px] text-gray-500">Plagiarism report will appear here.</div>
                  )}
                  {activeTab === "rubric" && <GradingRubricPanel rubricCategories={rubricCategories} />}
                </div>

                {/* Scores - sticky to bottom of left panel so always visible */}
                <div className="sticky bottom-0 z-10 flex-shrink-0 mt-auto border-t border-gray-200 bg-white">
                  <div className="px-4 py-3 flex items-center justify-between gap-2 border-b border-gray-100">
                    <span className="text-[13px] font-medium text-[#2B2A2A]">Grade</span>
                    <button
                      type="button"
                      onClick={() => setGradeDialogOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2B2A2A] hover:bg-[#3a3939] text-white text-[13px] font-medium"
                    >
                      <CheckSquare className="w-3.5 h-3.5" strokeWidth={2} />
                      Grade
                    </button>
                  </div>
                  <CircularScorePanel items={scoreItems} title="Scores" />
                </div>
              </div>
            </div>
          </Panel>

          <PanelResizeHandle className="hidden lg:block w-1 bg-gray-200 hover:bg-[#5A7ACD] transition-colors relative group">
            <div className="absolute inset-y-0 -left-1 -right-1 flex items-center justify-center">
              <div className="w-1 h-12 bg-gray-300 group-hover:bg-[#5A7ACD] rounded-full flex items-center justify-center transition-colors">
                <GripVertical className="w-3 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </PanelResizeHandle>

          <Panel defaultSize={65} minSize={40} className="h-full">
            {codeWorkspaceAssignment && assignmentId ? (
              <CodeWorkspace
                assignmentId={assignmentId}
                assignment={codeWorkspaceAssignment}
                codeExamples={{}}
                onRunTests={handleRunTests}
                onSubmit={() => {}}
                showUploadControls={false}
                showFacultyGradeControls={false}
                facultyEditorPreviewPayload={facultyEditorPreviewPayload}
                runLoading={runLoading}
                runError={runError}
                runResult={runResult}
              />
            ) : (
              <div className="h-full flex items-center justify-center bg-[#1e1e1e] text-gray-400 text-[14px]">
                Loading…
              </div>
            )}
          </Panel>
        </PanelGroup>
      </div>

      <GradeSubmissionDialog
        open={gradeDialogOpen}
        onOpenChange={setGradeDialogOpen}
        hasRubric={rubricCategories.length > 0}
        rubricCategories={rubricCategories}
        maxPoints={assignment.points?.total ?? 100}
        currentMarks={submissionMarks}
        currentFeedback={submissionFeedback}
        onSubmit={handleSaveGrade}
        isSubmitting={gradeSubmitting}
      />
    </div>
  );

  if (isGA) {
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
    const goToSettingsSection = (section: SettingsSection) => {
      navigate(`/settings?section=${section}`);
    };
    const handleLogout = () => {
      clearAuthenticated();
      navigate("/signin", { replace: true });
    };
    return (
      <AuthShell
        roleView="gradingAssistant"
        topBar={
          <AuthTopBar
            roleView="gradingAssistant"
            profile={{ name: displayName, email: displayEmail, initials: displayInitials }}
            searchPlaceholder="Search..."
            onSettingsSectionSelect={goToSettingsSection}
            onLogout={handleLogout}
          />
        }
        mainContent={mainContent}
      />
    );
  }

  return mainContent;
}
