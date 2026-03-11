import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { AlertCircle, ArrowRight, CheckCircle2, ChevronLeft, Loader2 } from "lucide-react";
import { MonacoEditor } from "./editors";
import { getAssignmentDetailById, listRubricCategories } from "../../services/assignmentService";
import {
  fetchSubmissionFileText,
  listFacultyAssignmentSubmissionFiles,
  resolvePreviewLanguage,
  submitFacultySubmissionGrade,
} from "../../services/submissionService";
import { getRunTestsLatest } from "../../services/runTestsService";
import type { AssignmentDetail } from "../../types/assignment";
import type { RubricCategory } from "../../types/grade";
import type {
  FacultyAssignmentSubmissionRow,
  SpeedGradingQueueStats,
  SpeedGradingTestSummary,
} from "../../types/submission";

interface RubricCriterionField {
  id: string;
  label: string;
  maxPoints: number;
}

interface SubmissionFileOption {
  id: string;
  fileName: string;
  downloadUrl: string | null;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  const apiMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
  if (typeof apiMessage === "string" && apiMessage.trim()) {
    return apiMessage;
  }
  return "Unable to complete this action.";
}

function isUngradedSubmission(row: FacultyAssignmentSubmissionRow): boolean {
  return row.marks === null || row.marks === undefined;
}

function buildLatestSubmissionQueue(rows: FacultyAssignmentSubmissionRow[]): FacultyAssignmentSubmissionRow[] {
  const seenStudentKeys = new Set<string>();
  // NOTE: Speed grading uses one latest submission per student to keep queue progression predictable.
  return rows.filter((row) => {
    const studentKey = row.studentName.trim().toLowerCase();
    if (seenStudentKeys.has(studentKey)) {
      return false;
    }
    seenStudentKeys.add(studentKey);
    return true;
  });
}

function buildQueueStats(rows: FacultyAssignmentSubmissionRow[]): SpeedGradingQueueStats {
  const graded = rows.filter((row) => !isUngradedSubmission(row)).length;
  return {
    total: rows.length,
    graded,
    ungraded: rows.length - graded,
  };
}

function findNextUngradedSubmissionId(
  rows: FacultyAssignmentSubmissionRow[],
  currentSubmissionId: string,
): string | null {
  if (!rows.length) {
    return null;
  }

  const currentIndex = rows.findIndex((row) => row.submissionId === currentSubmissionId);
  if (currentIndex === -1) {
    return rows.find((row) => isUngradedSubmission(row))?.submissionId ?? null;
  }

  const tailMatch = rows.slice(currentIndex + 1).find((row) => isUngradedSubmission(row));
  if (tailMatch) {
    return tailMatch.submissionId;
  }

  const headMatch = rows.slice(0, currentIndex).find((row) => isUngradedSubmission(row));
  return headMatch?.submissionId ?? null;
}

function distributeMarksAcrossCriteria(criteria: RubricCriterionField[], totalMarks: number): number[] {
  const maxTotal = criteria.reduce((sum, criterion) => sum + criterion.maxPoints, 0);
  if (maxTotal <= 0 || totalMarks <= 0) {
    return criteria.map(() => 0);
  }

  const seeded = criteria.map((criterion) => {
    const weighted = (criterion.maxPoints / maxTotal) * totalMarks;
    return Math.min(criterion.maxPoints, Math.floor(weighted));
  });

  let remainder = totalMarks - seeded.reduce((sum, score) => sum + score, 0);
  for (let index = 0; remainder > 0 && index < criteria.length; index += 1) {
    const remainingCap = criteria[index].maxPoints - seeded[index];
    const additional = Math.min(remainder, remainingCap);
    if (additional > 0) {
      seeded[index] += additional;
      remainder -= additional;
    }
  }

  return seeded;
}

function buildTestSummaryFromRun(run: Awaited<ReturnType<typeof getRunTestsLatest>>): SpeedGradingTestSummary {
  if (!run) {
    return {
      hasRun: false,
      publicPassed: 0,
      publicTotal: 0,
      privatePassed: 0,
      privateTotal: 0,
    };
  }

  const publicResults = run.results.filter((result) => !result.isPrivate);
  const privateResults = run.results.filter((result) => Boolean(result.isPrivate));

  return {
    hasRun: true,
    publicPassed: publicResults.filter((result) => result.passed).length,
    publicTotal: publicResults.length,
    privatePassed: privateResults.filter((result) => result.passed).length,
    privateTotal: privateResults.length,
  };
}

export function FacultySpeedGradingPage() {
  const { classId, assignmentId } = useParams();
  const navigate = useNavigate();
  const resolvedClassId = classId ?? "1";
  const resolvedAssignmentId = assignmentId ?? "";

  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null);
  const [rubricCategories, setRubricCategories] = useState<RubricCategory[]>([]);
  const [queueRows, setQueueRows] = useState<FacultyAssignmentSubmissionRow[]>([]);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string>("");
  const [selectedFileId, setSelectedFileId] = useState<string>("");

  const [editorFileName, setEditorFileName] = useState<string | null>(null);
  const [editorLanguage, setEditorLanguage] = useState<string>("Python");
  const [editorContent, setEditorContent] = useState<string>("");
  const [isEditorLoading, setIsEditorLoading] = useState(false);
  const [editorError, setEditorError] = useState<string | null>(null);

  const [testSummary, setTestSummary] = useState<SpeedGradingTestSummary>({
    hasRun: false,
    publicPassed: 0,
    publicTotal: 0,
    privatePassed: 0,
    privateTotal: 0,
  });
  const [isTestSummaryLoading, setIsTestSummaryLoading] = useState(false);
  const [testSummaryError, setTestSummaryError] = useState<string | null>(null);

  const [criterionScores, setCriterionScores] = useState<number[]>([]);
  const [marksInput, setMarksInput] = useState<string>("");
  const [feedbackInput, setFeedbackInput] = useState<string>("");
  const [gradeError, setGradeError] = useState<string | null>(null);
  const [gradeStatusMessage, setGradeStatusMessage] = useState<string | null>(null);
  const [isGradeSubmitting, setIsGradeSubmitting] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  const rubricCriteria = useMemo<RubricCriterionField[]>(() => {
    return rubricCategories.flatMap((category, categoryIndex) =>
      category.criteria.map((criterion, criterionIndex) => ({
        id: `${categoryIndex}-${criterionIndex}`,
        label: criterion.description,
        maxPoints: criterion.points,
      })),
    );
  }, [rubricCategories]);

  const rubricMaxPoints = useMemo(
    () => rubricCriteria.reduce((sum, criterion) => sum + criterion.maxPoints, 0),
    [rubricCriteria],
  );

  const queueStats = useMemo(() => buildQueueStats(queueRows), [queueRows]);

  const selectedSubmission = useMemo(
    () => queueRows.find((row) => row.submissionId === selectedSubmissionId) ?? null,
    [queueRows, selectedSubmissionId],
  );

  const fileOptions = useMemo<SubmissionFileOption[]>(() => {
    if (!selectedSubmission) {
      return [];
    }
    return selectedSubmission.files.map((file) => ({
      id: file.id,
      fileName: file.fileName,
      downloadUrl: file.downloadUrl,
    }));
  }, [selectedSubmission]);

  const selectedFile = useMemo(
    () => fileOptions.find((file) => file.id === selectedFileId) ?? null,
    [fileOptions, selectedFileId],
  );

  const computedRubricMarks = useMemo(
    () => criterionScores.reduce((sum, score) => sum + score, 0),
    [criterionScores],
  );

  const nextUngradedSubmissionId = useMemo(
    () => findNextUngradedSubmissionId(queueRows, selectedSubmissionId),
    [queueRows, selectedSubmissionId],
  );

  const loadSpeedGradingData = useCallback(async () => {
    if (!resolvedAssignmentId.trim()) {
      throw new Error("Invalid assignment.");
    }

    const [assignmentData, rubricData, rows] = await Promise.all([
      getAssignmentDetailById(resolvedAssignmentId),
      listRubricCategories(resolvedAssignmentId),
      listFacultyAssignmentSubmissionFiles(resolvedAssignmentId),
    ]);

    const queue = buildLatestSubmissionQueue(rows);
    setAssignment(assignmentData);
    setRubricCategories(rubricData);
    setQueueRows(queue);

    const initialSelection = queue.find((row) => isUngradedSubmission(row)) ?? queue[0] ?? null;
    setSelectedSubmissionId(initialSelection?.submissionId ?? "");
  }, [resolvedAssignmentId]);

  useEffect(() => {
    setIsLoading(true);
    setPageError(null);
    // NOTE: Speed grading page is container-driven and hydrates all queue data before rendering controls.
    loadSpeedGradingData()
      .catch((error) => {
        setPageError(getErrorMessage(error));
        setAssignment(null);
        setRubricCategories([]);
        setQueueRows([]);
        setSelectedSubmissionId("");
      })
      .finally(() => setIsLoading(false));
  }, [loadSpeedGradingData]);

  useEffect(() => {
    if (!selectedSubmission) {
      setSelectedFileId("");
      setEditorContent("");
      setEditorFileName(null);
      setTestSummary({
        hasRun: false,
        publicPassed: 0,
        publicTotal: 0,
        privatePassed: 0,
        privateTotal: 0,
      });
      return;
    }

    const defaultFileId =
      selectedSubmission.files.find((file) => Boolean(file.downloadUrl))?.id ??
      selectedSubmission.files[0]?.id ??
      "";
    setSelectedFileId((previous) => {
      const exists = selectedSubmission.files.some((file) => file.id === previous);
      return exists ? previous : defaultFileId;
    });

    const marks = selectedSubmission.marks;
    if (rubricCriteria.length > 0) {
      if (marks != null && marks > 0) {
        setCriterionScores(distributeMarksAcrossCriteria(rubricCriteria, Math.round(marks)));
      } else {
        setCriterionScores(rubricCriteria.map(() => 0));
      }
      setMarksInput("");
    } else {
      setCriterionScores([]);
      setMarksInput(marks != null ? String(Math.round(marks)) : "");
    }

    setFeedbackInput("");
    setGradeError(null);
    setGradeStatusMessage(null);
  }, [selectedSubmission, rubricCriteria]);

  useEffect(() => {
    if (!selectedSubmissionId) {
      setTestSummaryError(null);
      setTestSummary({
        hasRun: false,
        publicPassed: 0,
        publicTotal: 0,
        privatePassed: 0,
        privateTotal: 0,
      });
      return;
    }

    setIsTestSummaryLoading(true);
    setTestSummaryError(null);
    // NOTE: Latest run lookup provides fast public/private pass counters without adding backend endpoints.
    getRunTestsLatest(selectedSubmissionId)
      .then((latestRun) => {
        setTestSummary(buildTestSummaryFromRun(latestRun));
      })
      .catch((error) => {
        setTestSummaryError(getErrorMessage(error));
        setTestSummary({
          hasRun: false,
          publicPassed: 0,
          publicTotal: 0,
          privatePassed: 0,
          privateTotal: 0,
        });
      })
      .finally(() => setIsTestSummaryLoading(false));
  }, [selectedSubmissionId]);

  useEffect(() => {
    if (!selectedFile) {
      setEditorContent("");
      setEditorFileName(null);
      setEditorError(null);
      return;
    }

    if (!selectedFile.downloadUrl) {
      setEditorContent("");
      setEditorFileName(selectedFile.fileName);
      setEditorError("Download link is unavailable for this file.");
      return;
    }

    setIsEditorLoading(true);
    setEditorError(null);
    // FIX: Always fetch selected submission file text from presigned URL so faculty previews the exact uploaded source.
    fetchSubmissionFileText(selectedFile.downloadUrl, selectedFile.fileName)
      .then((content) => {
        setEditorFileName(selectedFile.fileName);
        setEditorLanguage(resolvePreviewLanguage(selectedFile.fileName, assignment?.language ?? "Python"));
        setEditorContent(content);
      })
      .catch((error) => {
        setEditorFileName(selectedFile.fileName);
        setEditorContent("");
        setEditorError(getErrorMessage(error));
      })
      .finally(() => setIsEditorLoading(false));
  }, [assignment?.language, selectedFile]);

  const handleGoToNextStudent = useCallback(() => {
    if (!nextUngradedSubmissionId) {
      setGradeStatusMessage("No ungraded students left in this assignment queue.");
      return;
    }
    setSelectedSubmissionId(nextUngradedSubmissionId);
    setGradeStatusMessage(null);
  }, [nextUngradedSubmissionId]);

  const handleSubmitGrade = useCallback(async () => {
    if (!assignment || !selectedSubmission) {
      setGradeError("Select a submission before grading.");
      return;
    }

    const marks = rubricCriteria.length > 0 ? computedRubricMarks : Number.parseFloat(marksInput);
    const maxMarks = rubricCriteria.length > 0 ? rubricMaxPoints : assignment.points.total;

    if (!Number.isFinite(marks) || marks < 0) {
      setGradeError("Enter a valid grade (0 or higher).");
      return;
    }

    if (marks > maxMarks) {
      setGradeError(`Grade cannot exceed ${maxMarks}.`);
      return;
    }

    setIsGradeSubmitting(true);
    setGradeError(null);
    try {
      await submitFacultySubmissionGrade({
        submissionId: selectedSubmission.submissionId,
        marks,
        feedback: feedbackInput.trim(),
      });

      let nextSubmissionId: string | null = null;
      setQueueRows((previousRows) => {
        const updatedRows = previousRows.map((row) =>
          row.submissionId === selectedSubmission.submissionId
            ? {
                ...row,
                marks,
              }
            : row,
        );
        nextSubmissionId = findNextUngradedSubmissionId(updatedRows, selectedSubmission.submissionId);
        return updatedRows;
      });

      setGradeStatusMessage("Grade saved successfully.");
      // NOTE: Auto-advance keeps grading momentum and avoids extra clicks for instructors.
      if (nextSubmissionId) {
        setSelectedSubmissionId(nextSubmissionId);
      }
    } catch (error) {
      setGradeError(getErrorMessage(error));
    } finally {
      setIsGradeSubmitting(false);
    }
  }, [
    assignment,
    computedRubricMarks,
    feedbackInput,
    marksInput,
    rubricCriteria.length,
    rubricMaxPoints,
    selectedSubmission,
  ]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F5F2F2]">
        <div className="flex items-center gap-2 text-[14px] text-gray-600">
          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
          <span>Loading speed grading...</span>
        </div>
      </div>
    );
  }

  if (pageError || !assignment) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F5F2F2] px-4">
        <div className="max-w-md rounded-xl border border-[#F2C9CC] bg-white p-5 text-center">
          <p className="text-[14px] text-[#C23A42]">{pageError ?? "Unable to load speed grading."}</p>
          <Link
            to={`/faculty/class/${resolvedClassId}/submissions`}
            className="mt-3 inline-flex items-center gap-1 text-[13px] font-medium text-[#5A7ACD]"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={2} />
            Back to submissions
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-[#F5F2F2]">
      <div className="border-b border-gray-200 bg-white px-6 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[13px]">
            <Link
              to={`/faculty/class/${resolvedClassId}/submissions`}
              className="flex items-center gap-1 text-gray-500 hover:text-[#2B2A2A]"
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={2} />
              Submissions
            </Link>
            <span className="text-gray-300">/</span>
            <span className="font-medium text-[#2B2A2A]">Speed Grading</span>
          </div>
          <button
            type="button"
            onClick={() => navigate(`/faculty/class/${resolvedClassId}/assignment/${resolvedAssignmentId}`)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-[12px] font-medium text-[#2B2A2A] hover:bg-gray-50"
          >
            Assignment details
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden p-4">
        <div className="grid h-full grid-cols-1 gap-4 xl:grid-cols-[1.45fr_0.95fr]">
          <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-gray-200 bg-[#1e1e1e]">
            <div className="flex items-center justify-between gap-3 border-b border-[#3c3c3c] bg-[#252526] px-4 py-2">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium text-gray-200">{assignment.title}</p>
                <p className="truncate text-[11px] text-gray-400">
                  {selectedSubmission ? selectedSubmission.studentName : "No student selected"}
                  {editorFileName ? ` - ${editorFileName}` : ""}
                </p>
              </div>
              <span className="rounded-full border border-[#3c3c3c] px-2 py-0.5 text-[11px] font-medium text-gray-300">
                Read-only
              </span>
            </div>
            <div className="flex-1 min-h-0">
              {isEditorLoading ? (
                <div className="flex h-full items-center justify-center text-[13px] text-gray-400">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" strokeWidth={2} />
                  Loading file preview...
                </div>
              ) : editorError ? (
                <div className="flex h-full items-center justify-center p-4">
                  <div className="max-w-md rounded-lg border border-[#5a2327] bg-[#2d1f21] px-4 py-3 text-[13px] text-red-300">
                    {editorError}
                  </div>
                </div>
              ) : (
                <MonacoEditor
                  value={editorContent}
                  language={editorLanguage}
                  readOnly
                  height="100%"
                  className="h-full"
                />
              )}
            </div>
          </section>

          <section className="min-h-0 overflow-y-auto rounded-xl border border-gray-200 bg-white p-4">
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg border border-gray-200 bg-[#F9FAFC] px-3 py-2">
                <p className="text-[11px] uppercase tracking-wide text-gray-500">Total</p>
                <p className="mt-1 text-[18px] font-semibold text-[#2B2A2A]">{queueStats.total}</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-[#F4FBF6] px-3 py-2">
                <p className="text-[11px] uppercase tracking-wide text-gray-500">Graded</p>
                <p className="mt-1 text-[18px] font-semibold text-[#1E7A3F]">{queueStats.graded}</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-[#FFF8ED] px-3 py-2">
                <p className="text-[11px] uppercase tracking-wide text-gray-500">Left</p>
                <p className="mt-1 text-[18px] font-semibold text-[#B26A00]">{queueStats.ungraded}</p>
              </div>
            </div>

            <div className="mt-4 space-y-4">
              <div className="rounded-xl border border-gray-200 p-3">
                <p className="text-[12px] font-semibold uppercase tracking-wide text-gray-500">Queue</p>

                <div className="mt-3 space-y-2">
                  <label className="block text-[12px] font-medium text-[#2B2A2A]">Student</label>
                  <select
                    value={selectedSubmissionId}
                    onChange={(event) => setSelectedSubmissionId(event.target.value)}
                    className="h-10 w-full rounded-lg border border-gray-300 px-3 text-[13px] text-[#2B2A2A] focus:border-[#5A7ACD] focus:outline-none focus:ring-1 focus:ring-[#5A7ACD]/30"
                  >
                    {queueRows.map((row) => (
                      <option key={row.submissionId} value={row.submissionId}>
                        {row.studentName} - {isUngradedSubmission(row) ? "Ungraded" : "Graded"}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mt-3 space-y-2">
                  <label className="block text-[12px] font-medium text-[#2B2A2A]">File</label>
                  <select
                    value={selectedFileId}
                    onChange={(event) => setSelectedFileId(event.target.value)}
                    disabled={fileOptions.length === 0}
                    className="h-10 w-full rounded-lg border border-gray-300 px-3 text-[13px] text-[#2B2A2A] focus:border-[#5A7ACD] focus:outline-none focus:ring-1 focus:ring-[#5A7ACD]/30 disabled:cursor-not-allowed disabled:bg-gray-100"
                  >
                    {fileOptions.length === 0 ? <option value="">No files</option> : null}
                    {fileOptions.map((file) => (
                      <option key={file.id} value={file.id}>
                        {file.fileName}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleGoToNextStudent}
                  disabled={!nextUngradedSubmissionId}
                  className="mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white text-[12px] font-medium text-[#2B2A2A] hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <ArrowRight className="h-4 w-4" strokeWidth={2} />
                  Next ungraded student
                </button>
              </div>

              <div className="rounded-xl border border-gray-200 p-3">
                <p className="text-[12px] font-semibold uppercase tracking-wide text-gray-500">Test results</p>
                {isTestSummaryLoading ? (
                  <div className="mt-3 flex items-center text-[12px] text-gray-600">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" strokeWidth={2} />
                    Loading latest run...
                  </div>
                ) : testSummaryError ? (
                  <p className="mt-3 text-[12px] text-[#C23A42]">{testSummaryError}</p>
                ) : testSummary.hasRun ? (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-[#EEF3FF] px-3 py-2">
                      <p className="text-[11px] text-gray-600">Public</p>
                      <p className="text-[14px] font-semibold text-[#2B2A2A]">
                        {testSummary.publicPassed}/{testSummary.publicTotal}
                      </p>
                    </div>
                    <div className="rounded-lg bg-[#FFF3E3] px-3 py-2">
                      <p className="text-[11px] text-gray-600">Private</p>
                      <p className="text-[14px] font-semibold text-[#2B2A2A]">
                        {testSummary.privatePassed}/{testSummary.privateTotal}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="mt-3 text-[12px] text-gray-600">No test run available for this submission yet.</p>
                )}
              </div>

              <div className="rounded-xl border border-gray-200 p-3">
                <p className="text-[12px] font-semibold uppercase tracking-wide text-gray-500">Grade submission</p>

                {rubricCriteria.length > 0 ? (
                  <div className="mt-3 space-y-2 max-h-56 overflow-y-auto pr-1">
                    {rubricCriteria.map((criterion, index) => (
                      <div key={criterion.id} className="rounded-lg border border-gray-100 px-2.5 py-2">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-[12px] text-[#2B2A2A]">{criterion.label}</p>
                          <input
                            type="number"
                            min={0}
                            max={criterion.maxPoints}
                            value={criterionScores[index] ?? 0}
                            onChange={(event) => {
                              const parsed = Number.parseInt(event.target.value, 10);
                              if (!Number.isFinite(parsed)) {
                                return;
                              }
                              setCriterionScores((previousScores) => {
                                const nextScores = [...previousScores];
                                nextScores[index] = Math.max(0, Math.min(criterion.maxPoints, parsed));
                                return nextScores;
                              });
                            }}
                            className="h-8 w-16 rounded-md border border-gray-300 px-2 text-right text-[12px] focus:border-[#5A7ACD] focus:outline-none"
                          />
                        </div>
                        <p className="mt-1 text-[11px] text-gray-500">max {criterion.maxPoints} pts</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-3 space-y-2">
                    <label className="block text-[12px] font-medium text-[#2B2A2A]">
                      Marks (max {assignment.points.total})
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={assignment.points.total}
                      value={marksInput}
                      onChange={(event) => setMarksInput(event.target.value)}
                      className="h-10 w-full rounded-lg border border-gray-300 px-3 text-[13px] text-[#2B2A2A] focus:border-[#5A7ACD] focus:outline-none"
                    />
                  </div>
                )}

                <div className="mt-3 rounded-lg bg-gray-50 px-3 py-2">
                  <p className="text-[12px] text-gray-600">Total</p>
                  <p className="text-[15px] font-semibold text-[#2B2A2A]">
                    {rubricCriteria.length > 0
                      ? `${computedRubricMarks} / ${rubricMaxPoints}`
                      : `${marksInput.trim() || 0} / ${assignment.points.total}`}
                  </p>
                </div>

                <div className="mt-3 space-y-2">
                  <label className="block text-[12px] font-medium text-[#2B2A2A]">Feedback</label>
                  <textarea
                    rows={4}
                    value={feedbackInput}
                    onChange={(event) => setFeedbackInput(event.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-[13px] text-[#2B2A2A] focus:border-[#5A7ACD] focus:outline-none"
                    placeholder="Add feedback for the student..."
                  />
                </div>

                {gradeError ? <p className="mt-3 text-[12px] text-[#C23A42]">{gradeError}</p> : null}
                {gradeStatusMessage ? (
                  <p className="mt-3 inline-flex items-center gap-1.5 text-[12px] text-[#1E7A3F]">
                    <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2} />
                    {gradeStatusMessage}
                  </p>
                ) : null}

                <button
                  type="button"
                  onClick={() => void handleSubmitGrade()}
                  disabled={!selectedSubmission || isGradeSubmitting}
                  className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#2B2A2A] text-[13px] font-medium text-white hover:bg-[#3a3939] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isGradeSubmitting ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} /> : null}
                  <span>{isGradeSubmitting ? "Saving..." : "Grade"}</span>
                </button>
              </div>

              {queueRows.length === 0 ? (
                <div className="rounded-xl border border-[#F2C9CC] bg-[#FFF5F5] px-3 py-2 text-[12px] text-[#C23A42]">
                  <span className="inline-flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" strokeWidth={2} />
                    No submissions found for this assignment.
                  </span>
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
