import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { AlertCircle, ArrowRight, CheckCircle2, ChevronLeft, Loader2 } from "lucide-react";
import { CodeWorkspace } from "./assignment/CodeWorkspace";
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
  FacultyEditorPreviewPayload,
  FacultyAssignmentSubmissionRow,
  SpeedGradingTestSummary,
} from "../../types/submission";
import { getApiErrorMessage } from "../../utils/apiErrorMessage";

interface RubricScoreField {
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
  return getApiErrorMessage(error, "Unable to complete this action.");
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

function distributeMarksAcrossRubrics(rubrics: RubricScoreField[], totalMarks: number): number[] {
  const maxTotal = rubrics.reduce((sum, rubric) => sum + rubric.maxPoints, 0);
  if (maxTotal <= 0 || totalMarks <= 0) {
    return rubrics.map(() => 0);
  }

  const seeded = rubrics.map((rubric) => {
    const weighted = (rubric.maxPoints / maxTotal) * totalMarks;
    return Math.min(rubric.maxPoints, Math.floor(weighted));
  });

  let remainder = totalMarks - seeded.reduce((sum, score) => sum + score, 0);
  for (let index = 0; remainder > 0 && index < rubrics.length; index += 1) {
    const remainingCap = rubrics[index].maxPoints - seeded[index];
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

function buildQueueStats(rows: FacultyAssignmentSubmissionRow[]): { total: number; graded: number; ungraded: number } {
  const graded = rows.filter((row) => !isUngradedSubmission(row)).length;
  return {
    total: rows.length,
    graded,
    ungraded: rows.length - graded,
  };
}

export function FacultySpeedGradingPage() {
  const { classId, assignmentId } = useParams();
  const navigate = useNavigate();
  const resolvedClassId = classId ?? "1";
  const resolvedAssignmentId = assignmentId ?? "";

  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null);
  const [rubricCategories, setRubricCategories] = useState<RubricCategory[]>([]);
  const [allSubmissionRows, setAllSubmissionRows] = useState<FacultyAssignmentSubmissionRow[]>([]);
  const [queueRows, setQueueRows] = useState<FacultyAssignmentSubmissionRow[]>([]);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string>("");
  const [workspacePreviewPayload, setWorkspacePreviewPayload] = useState<FacultyEditorPreviewPayload | null>(null);
  const [isWorkspacePreviewLoading, setIsWorkspacePreviewLoading] = useState(false);
  const [workspacePreviewError, setWorkspacePreviewError] = useState<string | null>(null);

  const [testSummary, setTestSummary] = useState<SpeedGradingTestSummary>({
    hasRun: false,
    publicPassed: 0,
    publicTotal: 0,
    privatePassed: 0,
    privateTotal: 0,
  });
  const [isTestSummaryLoading, setIsTestSummaryLoading] = useState(false);
  const [testSummaryError, setTestSummaryError] = useState<string | null>(null);

  const [rubricScores, setRubricScores] = useState<number[]>([]);
  const [directMarksInput, setDirectMarksInput] = useState<string>("");
  const [feedbackInput, setFeedbackInput] = useState<string>("");
  const [gradeError, setGradeError] = useState<string | null>(null);
  const [gradeStatusMessage, setGradeStatusMessage] = useState<string | null>(null);
  const [isGradeSubmitting, setIsGradeSubmitting] = useState(false);
  const [isRegradeConfirmOpen, setIsRegradeConfirmOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  const rubricScoreFields = useMemo<RubricScoreField[]>(() => {
    // FIX: Speed grading scores each rubric criterion separately, even when assignment service returns one flattened rubric category.
    // FIX: For weighted rubrics, sub-criterion maxScore is on its own scale (e.g. 0-10), not the assignment point scale.
    // Compute each criterion's effective max as Math.round(weight × totalPoints) so rubricMaxPoints == assignment.points.total.
    return rubricCategories.flatMap((category, categoryIndex) =>
      category.criteria.map((criterion, criterionIndex) => ({
        id: `rubric-${categoryIndex}-${criterionIndex}`,
        label:
          rubricCategories.length > 1
            ? `${category.name}: ${criterion.description}`
            : criterion.description,
        maxPoints:
          criterion.weight != null && assignment != null
            ? Math.round(criterion.weight * assignment.points.total)
            : criterion.points,
      })),
    );
  }, [rubricCategories, assignment]);

  const rubricMaxPoints = useMemo(
    () => rubricScoreFields.reduce((sum, rubric) => sum + rubric.maxPoints, 0),
    [rubricScoreFields],
  );

  const queueStats = useMemo(() => buildQueueStats(queueRows), [queueRows]);

  const selectedSubmission = useMemo(
    () => allSubmissionRows.find((row) => row.submissionId === selectedSubmissionId) ?? null,
    [allSubmissionRows, selectedSubmissionId],
  );

  const studentAttemptOptions = useMemo(() => {
    if (!selectedSubmission) {
      return [];
    }

    const normalizedStudentName = selectedSubmission.studentName.trim().toLowerCase();
    return allSubmissionRows
      .filter((row) => row.studentName.trim().toLowerCase() === normalizedStudentName)
      .map((row, index, rows) => ({
        submissionId: row.submissionId,
        label: `Attempt ${rows.length - index}`,
      }));
  }, [allSubmissionRows, selectedSubmission]);

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

  const computedRubricMarks = useMemo(
    () => rubricScores.reduce((sum, score) => sum + score, 0),
    [rubricScores],
  );

  const directMarks = useMemo(() => {
    const parsed = Number.parseFloat(directMarksInput);
    return Number.isFinite(parsed) ? parsed : Number.NaN;
  }, [directMarksInput]);

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
    setAllSubmissionRows(rows);
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
        setAllSubmissionRows([]);
        setQueueRows([]);
        setSelectedSubmissionId("");
      })
      .finally(() => setIsLoading(false));
  }, [loadSpeedGradingData]);

  useEffect(() => {
    if (!selectedSubmission) {
      setWorkspacePreviewPayload(null);
      setWorkspacePreviewError(null);
      setTestSummary({
        hasRun: false,
        publicPassed: 0,
        publicTotal: 0,
        privatePassed: 0,
        privateTotal: 0,
      });
      return;
    }

    const marks = selectedSubmission.marks;
    if (rubricScoreFields.length > 0) {
      if (marks != null && marks > 0) {
        // NOTE: Existing submission marks are distributed across rubric rows so faculty see an editable starting state.
        setRubricScores(distributeMarksAcrossRubrics(rubricScoreFields, Math.round(marks)));
      } else {
        setRubricScores(rubricScoreFields.map(() => 0));
      }
      setDirectMarksInput("");
    } else {
      setRubricScores([]);
      setDirectMarksInput(marks != null ? String(marks) : "");
    }

    setFeedbackInput("");
    setGradeError(null);
    setGradeStatusMessage(null);
  }, [selectedSubmission, rubricScoreFields]);

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
    if (!selectedSubmission) {
      setWorkspacePreviewPayload(null);
      setWorkspacePreviewError(null);
      return;
    }

    const downloadableFiles = selectedSubmission.files.filter((file) => Boolean(file.downloadUrl));
    if (downloadableFiles.length === 0) {
      setWorkspacePreviewPayload(null);
      setWorkspacePreviewError("No downloadable files are available for this submission.");
      return;
    }

    let cancelled = false;
    setIsWorkspacePreviewLoading(true);
    setWorkspacePreviewError(null);

    // FIX: Load all submission files into the shared assignment workspace so speed grading matches the normal editor with file tabs and tree navigation.
    Promise.all(
      downloadableFiles.map(async (file) => ({
        fileName: file.fileName,
        content: await fetchSubmissionFileText(file.downloadUrl as string, file.fileName),
      })),
    )
      .then((previewFiles) => {
        if (cancelled || previewFiles.length === 0) {
          return;
        }

        const primaryFile = previewFiles[0];
        setWorkspacePreviewPayload({
          optionId: selectedSubmission.submissionId,
          fileName: primaryFile.fileName,
          language: resolvePreviewLanguage(primaryFile.fileName, assignment?.language ?? "Python"),
          content: primaryFile.content,
          files: previewFiles,
        });
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }
        setWorkspacePreviewPayload(null);
        setWorkspacePreviewError(getErrorMessage(error));
      })
      .finally(() => {
        if (!cancelled) {
          setIsWorkspacePreviewLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [assignment?.language, selectedSubmission]);

  const handleGoToNextStudent = useCallback(() => {
    if (!nextUngradedSubmissionId) {
      setGradeStatusMessage("No ungraded students left in this assignment queue.");
      return;
    }
    setSelectedSubmissionId(nextUngradedSubmissionId);
    setGradeStatusMessage(null);
  }, [nextUngradedSubmissionId]);

  const persistGrade = useCallback(async () => {
    if (!assignment || !selectedSubmission) {
      setGradeError("Select a submission before grading.");
      return;
    }

    const marks = rubricScoreFields.length > 0 ? computedRubricMarks : directMarks;
    const maxMarks = rubricScoreFields.length > 0 ? rubricMaxPoints : assignment.points.total;

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
      let nextAllRows: FacultyAssignmentSubmissionRow[] = [];
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
      setAllSubmissionRows((previousRows) => {
        nextAllRows = previousRows.map((row) =>
          row.submissionId === selectedSubmission.submissionId
            ? {
                ...row,
                marks,
              }
            : row,
        );
        return nextAllRows;
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
    directMarks,
    feedbackInput,
    rubricScoreFields.length,
    rubricMaxPoints,
    selectedSubmission,
  ]);

  const handleSubmitGrade = useCallback(async () => {
    if (selectedSubmission?.marks != null) {
      // FIX: Re-grading is destructive to the previous manual mark, so require explicit confirmation before overwriting it.
      setIsRegradeConfirmOpen(true);
      return;
    }

    await persistGrade();
  }, [persistGrade, selectedSubmission?.marks]);

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
            to={`/faculty/class/${resolvedClassId}/assignment/${resolvedAssignmentId}`}
            className="mt-3 inline-flex items-center gap-1 text-[13px] font-medium text-[#5A7ACD]"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={2} />
            Back to assignment
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
              to={`/faculty/class/${resolvedClassId}/assignment/${resolvedAssignmentId}`}
              className="flex items-center gap-1 text-gray-500 hover:text-[#2B2A2A]"
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={2} />
              Assignment
            </Link>
            <span className="text-gray-300">/</span>
            <span className="font-medium text-[#2B2A2A]">Speed Grading</span>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={selectedSubmission?.studentName ?? ""}
              onChange={(event) => {
                const nextQueueRow = queueRows.find((row) => row.studentName === event.target.value);
                if (nextQueueRow) {
                  setSelectedSubmissionId(nextQueueRow.submissionId);
                }
              }}
              className="h-9 min-w-[210px] rounded-lg border border-gray-300 bg-white px-3 text-[12px] text-[#2B2A2A] focus:border-[#5A7ACD] focus:outline-none focus:ring-1 focus:ring-[#5A7ACD]/30"
            >
              {queueRows.map((row) => (
                <option key={row.submissionId} value={row.studentName}>
                  {row.studentName}
                </option>
              ))}
            </select>
            <select
              value={selectedSubmissionId}
              onChange={(event) => setSelectedSubmissionId(event.target.value)}
              disabled={studentAttemptOptions.length === 0}
              className="h-9 min-w-[130px] rounded-lg border border-gray-300 bg-white px-3 text-[12px] text-[#2B2A2A] focus:border-[#5A7ACD] focus:outline-none focus:ring-1 focus:ring-[#5A7ACD]/30 disabled:cursor-not-allowed disabled:bg-gray-100"
            >
              {studentAttemptOptions.length === 0 ? <option value="">No attempts</option> : null}
              {studentAttemptOptions.map((attempt) => (
                <option key={attempt.submissionId} value={attempt.submissionId}>
                  {attempt.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => navigate(`/faculty/class/${resolvedClassId}/assignment/${resolvedAssignmentId}`)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-[12px] font-medium text-[#2B2A2A] hover:bg-gray-50"
            >
              Assignment details
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden p-4">
        <div className="grid h-full grid-cols-1 gap-4 xl:grid-cols-[1.95fr_0.7fr]">
          <section className="min-h-0 overflow-hidden rounded-[22px] border border-gray-200 bg-[#111827] shadow-[0_26px_70px_rgba(15,23,42,0.28)]">
            {isWorkspacePreviewLoading ? (
              <div className="flex h-full items-center justify-center text-[13px] text-gray-300">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" strokeWidth={2} />
                Loading submission workspace...
              </div>
            ) : workspacePreviewError ? (
              <div className="flex h-full items-center justify-center p-4">
                <div className="max-w-md rounded-lg border border-[#5a2327] bg-[#2d1f21] px-4 py-3 text-[13px] text-red-300">
                  {workspacePreviewError}
                </div>
              </div>
            ) : workspacePreviewPayload ? (
              <CodeWorkspace
                assignmentId={`speed-grading-${resolvedAssignmentId}-${selectedSubmissionId}`}
                assignment={{
                  language: assignment.language,
                  hasStarterCode: false,
                  submissionsUsed: 0,
                  submissionsAllowed: null,
                }}
                codeExamples={{}}
                // NOTE: Speed grading reuses the same workspace shell as the assignment page, but grading actions stay in the right-hand review panel.
                onRunTests={() => {}}
                onSubmit={async () => {}}
                facultyEditorPreviewPayload={workspacePreviewPayload}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-[13px] text-gray-300">
                Select a submission to load the workspace.
              </div>
            )}
          </section>

          <section className="min-h-0 rounded-[22px] border border-gray-200 bg-white p-4 shadow-[0_20px_55px_rgba(15,23,42,0.08)]">
            <div className="flex h-full min-h-0 flex-col gap-4">
              <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1.15fr_0.85fr]">
                <div className="rounded-xl border border-gray-200 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[12px] font-semibold uppercase tracking-wide text-gray-500">Progress</p>
                    <button
                      type="button"
                      onClick={handleGoToNextStudent}
                      disabled={!nextUngradedSubmissionId}
                      className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 text-[11px] font-medium text-[#2B2A2A] hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
                      Next
                    </button>
                  </div>

                  <div className="mt-2 grid grid-cols-3 gap-2">
                    <div className="rounded-lg bg-[#F8FAFC] px-3 py-2">
                      <p className="text-[10px] uppercase tracking-wide text-gray-500">Total</p>
                      <p className="mt-1 text-[14px] font-semibold text-[#2B2A2A]">{queueStats.total}</p>
                    </div>
                    <div className="rounded-lg bg-[#F4FBF6] px-3 py-2">
                      <p className="text-[10px] uppercase tracking-wide text-gray-500">Graded</p>
                      <p className="mt-1 text-[14px] font-semibold text-[#1E7A3F]">{queueStats.graded}</p>
                    </div>
                    <div className="rounded-lg bg-[#FFF8ED] px-3 py-2">
                      <p className="text-[10px] uppercase tracking-wide text-gray-500">Left</p>
                      <p className="mt-1 text-[14px] font-semibold text-[#B26A00]">{queueStats.ungraded}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 p-3">
                  <p className="text-[12px] font-semibold uppercase tracking-wide text-gray-500">Test results</p>
                  {isTestSummaryLoading ? (
                    <div className="mt-2 flex h-10 items-center text-[12px] text-gray-600">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" strokeWidth={2} />
                      Loading latest run...
                    </div>
                  ) : testSummaryError ? (
                    <p className="mt-2 text-[12px] text-[#C23A42]">{testSummaryError}</p>
                  ) : testSummary.hasRun ? (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <div className="rounded-lg bg-[#EEF3FF] px-3 py-2">
                        <p className="text-[10px] uppercase tracking-wide text-gray-600">Public</p>
                        <p className="text-[13px] font-semibold text-[#2B2A2A]">
                          {testSummary.publicPassed}/{testSummary.publicTotal}
                        </p>
                      </div>
                      <div className="rounded-lg bg-[#FFF3E3] px-3 py-2">
                        <p className="text-[10px] uppercase tracking-wide text-gray-600">Private</p>
                        <p className="text-[13px] font-semibold text-[#2B2A2A]">
                          {testSummary.privatePassed}/{testSummary.privateTotal}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-2 text-[12px] text-gray-600">No test run available yet.</p>
                  )}
                </div>
              </div>

              <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-gray-200">
                <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-3 py-3">
                  <div>
                    <p className="text-[12px] font-semibold uppercase tracking-wide text-gray-500">
                      {rubricScoreFields.length > 0 ? "Rubric grading" : "Direct grading"}
                    </p>
                    <p className="mt-1 text-[12px] text-gray-600">
                      {rubricScoreFields.length > 0
                        ? "Score rubric rows, scroll through the full list, and submit once the total looks right."
                        : "This assignment has no rubric, so enter the final score directly and submit."}
                    </p>
                  </div>
                </div>

                {rubricScoreFields.length > 0 ? (
                  <div className="flex-1 overflow-y-auto px-3 py-3">
                    <div className="space-y-2">
                      {rubricScoreFields.map((rubric, index) => (
                        <div
                          key={rubric.id}
                          className="grid grid-cols-[minmax(0,1fr)_78px_96px] items-center gap-3 rounded-xl border border-gray-100 bg-[#FBFCFE] px-3 py-3"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-medium text-[#2B2A2A]">{rubric.label}</p>
                          </div>
                          <p className="text-right text-[12px] text-gray-500">/ {rubric.maxPoints}</p>
                          <input
                            type="number"
                            min={0}
                            max={rubric.maxPoints}
                            value={rubricScores[index] ?? 0}
                            onChange={(event) => {
                              const parsed = Number.parseInt(event.target.value, 10);
                              setRubricScores((previousScores) => {
                                const nextScores = [...previousScores];
                                nextScores[index] = Number.isFinite(parsed)
                                  ? Math.max(0, Math.min(rubric.maxPoints, parsed))
                                  : 0;
                                return nextScores;
                              });
                            }}
                            className="h-10 w-full rounded-lg border border-gray-300 px-3 text-right text-[13px] text-[#2B2A2A] focus:border-[#5A7ACD] focus:outline-none focus:ring-2 focus:ring-[#DCE5F8]"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 px-3 py-3">
                    <div className="rounded-xl border border-gray-100 bg-[#FBFCFE] px-3 py-3">
                      <label className="block text-[12px] font-medium text-[#2B2A2A]">Grade</label>
                      <div className="mt-2 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                        <input
                          type="number"
                          min={0}
                          max={assignment.points.total}
                          step="0.01"
                          value={directMarksInput}
                          onChange={(event) => setDirectMarksInput(event.target.value)}
                          className="h-10 w-full rounded-lg border border-gray-300 px-3 text-[13px] text-[#2B2A2A] focus:border-[#5A7ACD] focus:outline-none focus:ring-2 focus:ring-[#DCE5F8]"
                          placeholder="Enter grade"
                        />
                        <p className="text-[12px] text-gray-500">/ {assignment.points.total}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="border-t border-gray-200 bg-white px-3 py-3">
                  <div className="flex items-end justify-between gap-3">
                    <div className="rounded-xl border border-[#E4E7EC] bg-[#F8FAFC] px-3 py-2">
                      <p className="text-[10px] uppercase tracking-wide text-gray-500">Auto total</p>
                      <p className="text-[18px] font-semibold text-[#2B2A2A]">
                        {rubricScoreFields.length > 0
                          ? computedRubricMarks
                          : Number.isFinite(directMarks)
                            ? directMarks
                            : 0}{" "}
                        / {rubricMaxPoints || assignment.points.total}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleSubmitGrade()}
                      disabled={!selectedSubmission || isGradeSubmitting}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#2B2A2A] px-5 text-[13px] font-medium text-white hover:bg-[#3a3939] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isGradeSubmitting ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} /> : null}
                      <span>{isGradeSubmitting ? "Saving..." : "Grade"}</span>
                    </button>
                  </div>

                  <div className="mt-3 space-y-2">
                    <label className="block text-[12px] font-medium text-[#2B2A2A]">Feedback</label>
                    <textarea
                      rows={3}
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
                </div>
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

      {isRegradeConfirmOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111827]/45 px-4">
          <div className="w-full max-w-[420px] rounded-[20px] bg-white shadow-[0_32px_80px_rgba(17,24,39,0.22)]">
            <div className="border-b border-[#E5E7EB] px-6 py-5">
              <h3 className="text-[16px] font-semibold text-[#2B2A2A]">Update existing grade?</h3>
              <p className="mt-1 text-[13px] text-[#6B7280]">
                This submission was already graded. Do you want to update the saved grade?
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4">
              <button
                type="button"
                onClick={() => setIsRegradeConfirmOpen(false)}
                className="rounded-lg border border-[#D4D7DE] px-4 py-2 text-[13px] font-medium text-[#374151] transition-colors hover:bg-[#F9FAFB]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsRegradeConfirmOpen(false);
                  void persistGrade();
                }}
                className="rounded-lg bg-[#2B2A2A] px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#3A3939]"
              >
                Update grade
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
