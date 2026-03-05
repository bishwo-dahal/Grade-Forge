import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, Link, useSearchParams } from "react-router";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { AssignmentHeader } from "./assignment/AssignmentHeader";
import { TabNavigation } from "./assignment/TabNavigation";
import { DescriptionPanel } from "./assignment/DescriptionPanel";
import { PublicTestsPanel } from "./assignment/PublicTestsPanel";
import { TestSuiteFormPanel } from "./assignment/TestSuiteFormPanel";
import { GradingRubricPanel } from "./assignment/GradingRubricPanel";
import { ResultsPanel } from "./assignment/ResultsPanel";
import { CodeWorkspace } from "./assignment/CodeWorkspace";
import { ChevronLeft, GripVertical } from "lucide-react";
import type { AssignmentDescription, AssignmentDetail, EditorCodeExamples } from "../../types/assignment";
import type { PublicTestCase } from "../../types/submission";
import type { AssignmentResult, RubricCategory } from "../../types/grade";
import {
  getAssignmentDescription,
  getAssignmentDetailById,
  getEditorCodeExamples,
  invalidateAssignmentWorkspaceCache,
  listRubricCategories,
} from "../../services/assignmentService";
import { getAssignmentResult, invalidateAssignmentResultCache } from "../../services/resultService";
import {
  fetchSubmissionFileText,
  listFacultyAssignmentSubmissionFiles,
  resolvePreviewLanguage,
  submitFacultySubmissionGrade,
  submitStudentAssignmentFiles,
} from "../../services/submissionService";
import {
  getTestSuiteByAssignment,
  getTestSuiteByCourseAndAssignment,
} from "../../services/testSuiteService";
import { requestRunTests, runTestsWithFiles, pollRunTestsUntilDone } from "../../services/runTestsService";
import { getAuthenticatedRole } from "../auth";
import React from "react";
import type {
  FacultyAssignmentSubmissionRow,
  FacultyEditorPreviewPayload,
  FacultySubmissionGradePayload,
} from "../../types/submission";
import type { TestSuiteDetail } from "../../types/testSuite";
import type { TestRunJobStatusResponse } from "../../types/runTests";

type TabType = 'description' | 'tests' | 'rubric' | 'results';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  const apiMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
  if (typeof apiMessage === "string" && apiMessage.trim()) {
    return apiMessage;
  }
  return "Unable to save changes.";
}

export function AssignmentPage() {
  const { assignmentId, submissionId } = useParams();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const authenticatedRole = getAuthenticatedRole();
  const isStudentRole = authenticatedRole === "STUDENT";
  const isFacultyRole = authenticatedRole === "FACULTY";

  const [activeTab, setActiveTab] = useState<TabType>(() => {
    if (tabParam === "tests") return "tests";
    if (isFacultyRole && submissionId) return "results";
    return "description";
  });
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submissionFeedback, setSubmissionFeedback] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  // NOTE: Load all assignment-related data here so child panels remain presentation-only.
  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null);
  const [description, setDescription] = useState<AssignmentDescription | null>(null);
  const [rubricCategories, setRubricCategories] = useState<RubricCategory[]>([]);
  const [results, setResults] = useState<AssignmentResult | null>(null);
  const [facultySubmissionRows, setFacultySubmissionRows] = useState<FacultyAssignmentSubmissionRow[]>([]);
  const [facultyEditorPreviewPayload, setFacultyEditorPreviewPayload] = useState<FacultyEditorPreviewPayload | null>(null);
  const [facultyPreviewLoadingOptionId, setFacultyPreviewLoadingOptionId] = useState<string | null>(null);
  const [facultyPreviewErrorMessage, setFacultyPreviewErrorMessage] = useState<string | null>(null);
  const [editorCodeExamples, setEditorCodeExamples] = useState<EditorCodeExamples>({});
  const [isLoading, setIsLoading] = useState(true);
  const [testSuite, setTestSuite] = useState<TestSuiteDetail | null>(null);
  const [testSuiteSaveInProgress, setTestSuiteSaveInProgress] = useState(false);
  const [runLoading, setRunLoading] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [runResult, setRunResult] = useState<TestRunJobStatusResponse | null>(null);

  const facultySubmissionFileOptions = useMemo(() => {
    if (!isFacultyRole) {
      return [];
    }
    // NOTE: Flatten faculty submission rows into selector options so workspace component stays presentation-focused.
    return facultySubmissionRows.flatMap((row) =>
      row.files.map((file) => ({
        optionId: `${row.submissionId}:${file.id}`,
        submissionId: row.submissionId,
        studentName: row.studentName,
        fileName: file.fileName,
        submittedAt: row.submittedAt,
        downloadUrl: file.downloadUrl,
        label: `${row.studentName} - ${file.fileName} - ${row.submittedAt}`,
      })),
    );
  }, [facultySubmissionRows, isFacultyRole]);

  const loadAssignmentWorkspace = useCallback(async (resolvedId: string) => {
    // FIX: Invalidate assignment/result caches before loading so newly submitted files appear immediately in faculty/student views.
    invalidateAssignmentWorkspaceCache(resolvedId);
    invalidateAssignmentResultCache(resolvedId);
    const [assignmentData, descriptionData, rubricData, resultsData, codeExamplesData, facultyRows] = await Promise.all([
      getAssignmentDetailById(resolvedId),
      getAssignmentDescription(resolvedId),
      listRubricCategories(resolvedId),
      getAssignmentResult(resolvedId),
      getEditorCodeExamples(resolvedId),
      isFacultyRole ? listFacultyAssignmentSubmissionFiles(resolvedId) : Promise.resolve([]),
    ]);

    setAssignment(assignmentData);
    setDescription(descriptionData);
    setRubricCategories(rubricData);
    setResults(resultsData);
    setEditorCodeExamples(codeExamplesData);
    // NOTE: Faculty results tab receives full submission-file rows from faculty submissions endpoint.
    setFacultySubmissionRows(facultyRows);
    // FIX: Results tab now reflects whether at least one real submission exists for this assignment.
    setHasSubmitted(assignmentData.submissionsUsed > 0);
    // Load test suite: faculty by assignment id, student by course + assignment (student needs courseId from assignment).
    try {
      const suite = isFacultyRole
        ? await getTestSuiteByAssignment(resolvedId)
        : await getTestSuiteByCourseAndAssignment(
            String(assignmentData.courseId ?? ""),
            resolvedId,
          );
      setTestSuite(suite ?? null);
    } catch {
      setTestSuite(null);
    }
  }, [isFacultyRole]);

  useEffect(() => {
    const resolvedId = assignmentId || "1";
    setErrorMessage(null);
    setIsLoading(true);
    // CLEANUP: Reset submission-preview transient state when assignment changes.
    setFacultyEditorPreviewPayload(null);
    setFacultyPreviewLoadingOptionId(null);
    setFacultyPreviewErrorMessage(null);
    // NOTE: Keep data loading centralized in page container so assignment panels remain presentation-only.
    loadAssignmentWorkspace(resolvedId)
      .catch(() => {
        setErrorMessage("Unable to load assignment data.");
      })
      .finally(() => setIsLoading(false));
  }, [assignmentId, loadAssignmentWorkspace]);

  useEffect(() => {
    if (!isFacultyRole || activeTab !== "results") {
      return;
    }
    const resolvedId = assignmentId || "1";
    // NOTE: Faculty results tab refreshes periodically so new student submissions/files appear without manual reload.
    const refreshInterval = window.setInterval(() => {
      void loadAssignmentWorkspace(resolvedId);
    }, 15000);
    return () => window.clearInterval(refreshInterval);
  }, [activeTab, assignmentId, isFacultyRole, loadAssignmentWorkspace]);

  const handleStudentSubmit = async (files: File[]) => {
    const resolvedId = assignmentId || "1";
    setSubmissionFeedback(null);
    try {
      await submitStudentAssignmentFiles(resolvedId, files);
      invalidateAssignmentWorkspaceCache(resolvedId);
      invalidateAssignmentResultCache(resolvedId);
      await loadAssignmentWorkspace(resolvedId);
      setSubmissionFeedback({
        tone: "success",
        text: files.length === 1 ? "File submitted successfully." : `${files.length} files submitted successfully.`,
      });
    } catch (error) {
      setSubmissionFeedback({ tone: "error", text: getErrorMessage(error) });
      throw error;
    }
  };

  const requestFacultyEditorPreview = useCallback(
    async (optionId: string): Promise<FacultyEditorPreviewPayload> => {
      const matchedOption = facultySubmissionFileOptions.find((option) => option.optionId === optionId);
      if (!matchedOption) {
        throw new Error("Selected submission file was not found.");
      }

      const content = await fetchSubmissionFileText(matchedOption.downloadUrl ?? "", matchedOption.fileName);
      return {
        optionId: matchedOption.optionId,
        fileName: matchedOption.fileName,
        language: resolvePreviewLanguage(matchedOption.fileName, assignment?.language || "Python"),
        content,
      };
    },
    [facultySubmissionFileOptions, assignment?.language],
  );

  const handleFacultyPreviewFromSubmissions = useCallback(
    async (optionId: string) => {
      // NOTE: Preview fetching is coordinated by the page container so left/right panes stay loosely coupled.
      setFacultyPreviewErrorMessage(null);
      setFacultyPreviewLoadingOptionId(optionId);
      try {
        const previewPayload = await requestFacultyEditorPreview(optionId);
        setFacultyEditorPreviewPayload(previewPayload);
      } catch (error) {
        setFacultyPreviewErrorMessage(getErrorMessage(error));
      } finally {
        setFacultyPreviewLoadingOptionId(null);
      }
    },
    [requestFacultyEditorPreview],
  );

  useEffect(() => {
    if (!isFacultyRole || !submissionId || facultySubmissionFileOptions.length === 0) {
      return;
    }
    const match = facultySubmissionFileOptions.find(
      (opt) => String(opt.submissionId) === String(submissionId),
    );
    if (!match) {
      return;
    }
    void handleFacultyPreviewFromSubmissions(match.optionId);
  }, [isFacultyRole, submissionId, facultySubmissionFileOptions, handleFacultyPreviewFromSubmissions]);

  const handleFacultySubmissionGrade = async (payload: FacultySubmissionGradePayload) => {
    const resolvedId = assignmentId || "1";
    setSubmissionFeedback(null);
    try {
      await submitFacultySubmissionGrade(payload);
      invalidateAssignmentWorkspaceCache(resolvedId);
      invalidateAssignmentResultCache(resolvedId);
      // FIX: Refresh assignment/result panels after grading so faculty and student see latest marks immediately.
      await loadAssignmentWorkspace(resolvedId);
      setSubmissionFeedback({ tone: "success", text: "Grade submitted successfully." });
    } catch (error) {
      setSubmissionFeedback({ tone: "error", text: getErrorMessage(error) });
      throw error;
    }
  };

  const handleRunTests = useCallback(
    async (files?: File[]) => {
      const assignmentIdForRun = assignmentId ?? assignment?.id;
      const hasFiles = files != null && files.length > 0;
      const submissionIdForRun = results?.latestSubmissionId ?? null;

      if (hasFiles && assignmentIdForRun) {
        setRunLoading(true);
        setRunError(null);
        try {
          const result = await runTestsWithFiles(assignmentIdForRun, files);
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

      if (submissionIdForRun != null) {
        setRunLoading(true);
        setRunError(null);
        try {
          await requestRunTests(submissionIdForRun);
          const job = await pollRunTestsUntilDone(submissionIdForRun);
          setRunResult(job);
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

      setRunError("Add code or upload a file, then run tests.");
      setActiveTab("tests");
    },
    [assignmentId, assignment?.id, results?.latestSubmissionId]
  );

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen bg-[#F5F2F2]">
        {/* NOTE: Skeleton shell keeps assignment workspace visible while backend data initializes. */}
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

  if (!assignment) {
    if (errorMessage) {
      return (
        <div className="flex h-screen items-center justify-center bg-[#F5F2F2] text-[14px] text-[#C23A42]">
          {errorMessage}
        </div>
      );
    }
    return (
      <div className="flex h-screen items-center justify-center bg-[#F5F2F2] text-[14px] text-gray-600">
        Assignment not found.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#F5F2F2]">
      {/* Top Navigation Breadcrumb */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center gap-2 text-[13px]">
          <Link to="/dashboard" className="text-gray-500 hover:text-[#2B2A2A] flex items-center gap-1">
            <ChevronLeft className="w-4 h-4" strokeWidth={2} />
            Dashboard
          </Link>
          <span className="text-gray-300">/</span>
          <Link to="/dashboard" className="text-gray-500 hover:text-[#2B2A2A]">{assignment.courseCode}</Link>
          <span className="text-gray-300">/</span>
          <span className="text-[#2B2A2A] font-medium">Assignments</span>
        </div>
      </div>

      {/* Main Content Area - Two Panel Layout */}
      <div className="flex flex-1 overflow-hidden">
        <PanelGroup direction="horizontal">
          {/* Left Panel - Assignment Content */}
          <Panel defaultSize={35} minSize={30}>
            <div className="h-full flex flex-col bg-white border-r border-gray-200 overflow-hidden">
              {/* Assignment Header */}
              <AssignmentHeader assignment={assignment} />
              {submissionFeedback ? (
                <div
                  className={`mx-4 mt-3 rounded-lg border px-3 py-2 text-[12px] ${
                    submissionFeedback.tone === "success"
                      ? "border-[#C6E8CF] bg-[#F4FBF6] text-[#1E7A3F]"
                      : "border-[#F2C9CC] bg-[#FFF5F5] text-[#C23A42]"
                  }`}
                >
                  {submissionFeedback.text}
                </div>
              ) : null}

              {/* Tab Navigation */}
              <TabNavigation 
                activeTab={activeTab} 
                onTabChange={setActiveTab}
                hasResults={hasSubmitted}
                isFacultyView={isFacultyRole}
              />

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto">
                {activeTab === 'description' && <DescriptionPanel description={description} />}
                {activeTab === 'tests' && (
                  isFacultyRole ? (
                    <TestSuiteFormPanel
                      assignmentId={assignmentId ?? assignment.id}
                      existingSuite={testSuite}
                      onSaved={async () => {
                        setTestSuiteSaveInProgress(true);
                        try {
                          const suite = await getTestSuiteByAssignment(assignmentId ?? assignment.id);
                          setTestSuite(suite ?? null);
                        } finally {
                          setTestSuiteSaveInProgress(false);
                        }
                      }}
                      isSubmitting={testSuiteSaveInProgress}
                      errorMessage={null}
                    />
                  ) : testSuite ? (
                    <PublicTestsPanel
                      testCases={testSuite.testCases
                        .filter((tc) => !tc.isPrivate)
                        .map(
                          (tc, i): PublicTestCase => ({
                            id: tc.id ?? i,
                            name: tc.title,
                            passed: false,
                            input: tc.input ?? "",
                            inputFileName: tc.fileName ?? null,
                            expectedOutput: tc.output ?? "",
                            actualOutput: "",
                          })
                        )}
                      onRunTests={handleRunTests}
                      isRunning={runLoading}
                      runError={runError}
                      runResult={
                        runResult
                          ? (() => {
                              const suiteCases = testSuite.testCases.filter((tc) => !tc.isPrivate);
                              return {
                                passedCount: runResult.passedCount,
                                totalCount: runResult.totalCount,
                                results: runResult.results.map(
                                  (r, i): PublicTestCase => {
                                    const suiteCase = suiteCases.find(
                                      (tc) => tc.id === r.testCaseId || Number(tc.id) === Number(r.testCaseId)
                                    );
                                    return {
                                      id: r.testCaseId ?? i,
                                      name: r.testCaseTitle,
                                      passed: r.passed,
                                      input: suiteCase?.input ?? "",
                                      inputFileName: suiteCase?.fileName ?? null,
                                      expectedOutput: r.expectedOutput ?? suiteCase?.output ?? "",
                                      actualOutput: r.actualOutput ?? r.errorMessage ?? "",
                                      executionTime: r.runtimeMs != null ? `${r.runtimeMs}ms` : undefined,
                                    };
                                  }
                                ),
                              };
                            })()
                          : null
                      }
                    />
                  ) : (
                    <div className="p-6">
                      <h2 className="text-lg font-semibold text-[#2B2A2A]">Test Cases</h2>
                      <p className="mt-2 text-[13px] text-gray-600">
                        No test cases have been defined for this assignment yet.
                      </p>
                    </div>
                  )
                )}
                {activeTab === 'rubric' && <GradingRubricPanel rubricCategories={rubricCategories} />}
                {activeTab === 'results' && (
                  <ResultsPanel
                    results={results}
                    facultySubmissionRows={isFacultyRole ? facultySubmissionRows : undefined}
                    onPreviewFacultyFile={isFacultyRole ? handleFacultyPreviewFromSubmissions : undefined}
                    facultyPreviewLoadingOptionId={isFacultyRole ? facultyPreviewLoadingOptionId : null}
                    facultyPreviewErrorMessage={isFacultyRole ? facultyPreviewErrorMessage : null}
                  />
                )}
              </div>
            </div>
          </Panel>

          {/* Resize Handle */}
          <PanelResizeHandle className="hidden lg:block w-1 bg-gray-200 hover:bg-[#5A7ACD] transition-colors relative group">
            <div className="absolute inset-y-0 -left-1 -right-1 flex items-center justify-center">
              <div className="w-1 h-12 bg-gray-300 group-hover:bg-[#5A7ACD] rounded-full flex items-center justify-center transition-colors">
                <GripVertical className="w-3 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </PanelResizeHandle>

          {/* Right Panel - Code Workspace */}
          <Panel defaultSize={65} minSize={40}>
            <CodeWorkspace
              assignmentId={assignmentId ?? assignment.id}
              assignment={assignment}
              codeExamples={editorCodeExamples}
              onRunTests={handleRunTests}
              onSubmit={handleStudentSubmit}
              showUploadControls={isStudentRole}
              showFacultyGradeControls={isFacultyRole}
              facultySubmissionRows={isFacultyRole ? facultySubmissionRows : undefined}
              onSubmitFacultyGrade={isFacultyRole ? handleFacultySubmissionGrade : undefined}
              maxGradePoints={assignment.points.total}
              facultyEditorPreviewPayload={isFacultyRole ? facultyEditorPreviewPayload : null}
              runLoading={runLoading}
              runError={runError}
              runResult={runResult}
            />
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}
