import React, { useCallback, useEffect, useMemo, useState } from "react";
import JSZip from "jszip";
import { Link, useNavigate, useParams } from "react-router";
import {
  ChevronLeft,
  CloudUpload,
  Download,
  FileText,
  Inbox,
  ListChecks,
  Pencil,
  RefreshCcw,
  Zap,
} from "lucide-react";
import {
  getGraderReportLatest,
  pollGraderReportUntilDone,
  requestGraderReport,
} from "../../services/graderReportService";
import type { GraderReportResultPayload } from "../../types/graderReport";
import { getLlmReportBanner, type LlmReportBanner } from "../../utils/llmReportBanner";
import type { AssignmentDetailResponse } from "../../types/gradingAssistantAssignment";
import type { GradingAssistantRubricResponse } from "../../types/gradingAssistantRubric";
import { roundTo2 } from "../../utils/number";
import type { GradingAssistantSubmissionResponse } from "../../types/gradingAssistantSubmission";
import { getAssignmentByCourse } from "../../services/gradingAssistantAssignmentService";
import { getRubric } from "../../services/gradingAssistantRubricService";
import { listSubmissionsByAssignment } from "../../services/gradingAssistantSubmissionService";
import { getTestSuiteByAssignment } from "../../services/testSuiteService";
import { toast } from "sonner";
import { clearAuthenticated, getAuthenticatedUser } from "../auth";
import { AuthShell } from "./layout/AuthShell";
import { AuthTopBar } from "./layout/AuthTopBar";
import type { SettingsSection } from "./layout/AuthTopBar";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";

/** Normalized assignment summary for shared AssignmentDetailPage (Faculty + Grading Assistant). */
export interface AssignmentDetailPageAssignment {
  id?: string | null;
  title: string;
  courseName: string;
  description?: string | null;
  dueDate: string;
  totalPoints?: number | null;
  language?: string | null;
  submissionType?: string | null;
  availableFrom?: string | null;
  lateDueDate?: string | null;
  starterCodeUrl?: string | null;
  /** Presigned download links for starter files (multipart uploads). */
  starterCodeFiles?: Array<{ fileName: string; downloadUrl: string }>;
  /** Linked rubric name (assignment-level); rubric criteria shown in rubricSection. */
  rubricName?: string | null;
}

/** Single rubric criterion for display (flat, used when no subCriteria). */
export interface AssignmentDetailPageRubricCriterion {
  title: string;
  maxScore?: number | null;
  description?: string | null;
  weight?: number | null;
}

/** Sub-criterion for hierarchical rubric display. */
export interface AssignmentDetailPageRubricSubCriterion {
  description?: string | null;
  maxScore: number;
  weight?: number | null;
}

/** Criterion with nested sub-criteria (faculty rubric from API). */
export interface AssignmentDetailPageRubricCriterionNested {
  title: string;
  subCriteria: AssignmentDetailPageRubricSubCriterion[];
}

/** Rubric section passed from either faculty (categories) or GA (criteria) API. */
export interface AssignmentDetailPageRubricSection {
  name?: string | null;
  description?: string | null;
  /** Flat criteria (GA or legacy). */
  criteria: AssignmentDetailPageRubricCriterion[];
  /** Nested criteria (faculty rubric with criteria → subCriteria). When set, UI shows hierarchy. */
  criteriaNested?: AssignmentDetailPageRubricCriterionNested[] | null;
  loading?: boolean;
}

/** Test case summary for assignment detail (title + private flag). */
export interface AssignmentDetailPageTestCaseItem {
  title: string;
  isPrivate: boolean;
}

/** Test suite section for assignment detail page. */
export interface AssignmentDetailPageTestSuiteSection {
  title: string;
  description?: string | null;
  testCases: AssignmentDetailPageTestCaseItem[];
  loading?: boolean;
}

/** Normalized submission row for the submissions table. */
export interface AssignmentDetailPageSubmissionRow {
  submissionId: string;
  /** Maps to grader pipeline `student_id` (stringified). */
  studentId?: string | null;
  studentName: string;
  subGroupName?: string | null;
  submittedAt: string;
  status: string;
  marks: number | null;
  primaryFileName: string | null;
  additionalFileCount: number;
  primaryDownloadUrl: string | null;
  /** All files for this submission; used for "Download all" (zip by student). */
  files?: { fileName: string; downloadUrl: string }[];
}

export interface AssignmentDetailPageProps {
  assignment: AssignmentDetailPageAssignment | null;
  rubricSection: AssignmentDetailPageRubricSection | null;
  submissions: AssignmentDetailPageSubmissionRow[];
  backLink: { to: string; label: string };
  getSubmissionLink: (submissionId: string) => string;
  loading: boolean;
  submissionsLoading: boolean;
  error: string | null;
  onRefreshSubmissions: () => void;
  /** Optional subtitle under "Submissions" heading. */
  submissionsSectionSubtitle?: string;
  /** Optional speed-grading entry for faculty assignment detail pages. */
  speedGradingLink?: { to: string; label: string };
  /** Optional compact submissions count shown next to speed grading entry. */
  submissionsCountLabel?: string;
  /** Optional link for faculty to manage test cases (opens assignment workspace). */
  testCasesLink?: { to: string; label: string };
  /** Optional test suite to display (like rubric section). */
  testSuiteSection?: AssignmentDetailPageTestSuiteSection | null;
  /** Optional edit entry for faculty assignment detail pages. */
  editAssignmentLink?: { to: string; label?: string };
  /** Optional: publish/sync assignment definition to Canvas (faculty assignment detail). */
  onSyncAssignmentWithCanvas?: () => Promise<void>;
  /** Optional: post one row's grade to Canvas (faculty). */
  onPostSubmissionGradeToCanvas?: (row: AssignmentDetailPageSubmissionRow) => Promise<void>;
  /** Optional: bulk post graded rows with student id to Canvas (faculty). */
  onPostBulkGradesToCanvas?: (rows: AssignmentDetailPageSubmissionRow[]) => Promise<void>;
}

type AssignmentDetailSection =
  | "description"
  | "details"
  | "rubric"
  | "tests"
  | "submissions";

/** Per-student slice of the latest grader report (similarity + AI authorship risk). */
type GraderReportStudentSummary = {
  similarityScore: number;
  matchesCount?: number;
  warning?: string | null;
  aiRiskScore: number;
  aiRiskLevel: "none" | "low" | "medium" | "high";
};

function formatAiRiskLevelLabel(level: GraderReportStudentSummary["aiRiskLevel"]): string {
  if (level === "high") return "High";
  if (level === "medium") return "Medium";
  if (level === "low") return "Low";
  return "None";
}

export function AssignmentDetailPage({
  assignment,
  rubricSection,
  submissions,
  backLink,
  getSubmissionLink,
  loading,
  submissionsLoading,
  error,
  onRefreshSubmissions,
  submissionsSectionSubtitle = "Review and grade student submissions for this assignment.",
  speedGradingLink,
  submissionsCountLabel,
  testCasesLink,
  testSuiteSection,
  editAssignmentLink,
  onSyncAssignmentWithCanvas,
  onPostSubmissionGradeToCanvas,
  onPostBulkGradesToCanvas,
}: AssignmentDetailPageProps) {
  const [activeSection, setActiveSection] = useState<AssignmentDetailSection>("description");
  const [plagSummary, setPlagSummary] = useState<{
    byStudent: Record<string, GraderReportStudentSummary>;
    loading: boolean;
    error: string | null;
    llmErrorBanner: LlmReportBanner | null;
  } | null>(null);
  const [plagRefreshKey, setPlagRefreshKey] = useState(0);
  const [plagRunStatus, setPlagRunStatus] = useState<
    "idle" | "requesting" | "running" | "completed" | "failed"
  >("idle");
  const [plagRunMessage, setPlagRunMessage] = useState<string | null>(null);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [postingCanvasBySubmissionId, setPostingCanvasBySubmissionId] = useState<Record<string, boolean>>({});
  const [isPostingBulkGradesToCanvas, setIsPostingBulkGradesToCanvas] = useState(false);
  const [isBulkCanvasConfirmOpen, setIsBulkCanvasConfirmOpen] = useState(false);
  const [isSyncCanvasConfirmOpen, setIsSyncCanvasConfirmOpen] = useState(false);
  const [isSyncingAssignmentWithCanvas, setIsSyncingAssignmentWithCanvas] = useState(false);

  const handleDownloadAll = useCallback(async () => {
    const rowsWithFiles = submissions.filter(
      (r) => (r.files && r.files.length > 0) || r.primaryDownloadUrl,
    );
    if (!rowsWithFiles.length) return;
    setDownloadingAll(true);
    try {
      const zip = new JSZip();
      await Promise.all(
        rowsWithFiles.map(async (row) => {
          const nameBase = (row.studentName || `submission-${row.submissionId}`)
            .replace(/[\\/:*?"<>|]/g, "_")
            .trim() || "student";
          const safeStudentName = row.studentId ? `${nameBase}_${row.studentId}` : nameBase;
          const folder = zip.folder(safeStudentName);
          if (!folder) return;
          const files =
            row.files && row.files.length > 0
              ? row.files
              : row.primaryDownloadUrl && row.primaryFileName
                ? [{ fileName: row.primaryFileName, downloadUrl: row.primaryDownloadUrl }]
                : [];
          await Promise.all(
            files.map(async (f) => {
              try {
                const res = await fetch(f.downloadUrl);
                if (!res.ok) return;
                const blob = await res.blob();
                folder.file(f.fileName, blob);
              } catch {
                // Skip files that fail to fetch.
              }
            }),
          );
        }),
      );
      const safeTitle = (assignment?.title || "submissions").replace(/[\\/:*?"<>|]/g, "_");
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${safeTitle}-all-submissions.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // Silent failure; download is a convenience action.
    } finally {
      setDownloadingAll(false);
    }
  }, [submissions, assignment?.title]);

  useEffect(() => {
    if (!assignment?.id) {
      setPlagSummary(null);
      return;
    }
    const assignmentIdNumeric = Number(assignment.id);
    if (!Number.isFinite(assignmentIdNumeric) || assignmentIdNumeric <= 0) {
      setPlagSummary(null);
      return;
    }
    let cancelled = false;
    setPlagSummary({ byStudent: {}, loading: true, error: null, llmErrorBanner: null });
    (async () => {
      try {
        const report = await getGraderReportLatest(assignmentIdNumeric);
        if (!report || !report.result || report.status !== "COMPLETED") {
          if (!cancelled) {
            setPlagSummary({ byStudent: {}, loading: false, error: null, llmErrorBanner: null });
          }
          return;
        }
        let payload: GraderReportResultPayload | null = null;
        try {
          payload = JSON.parse(report.result) as GraderReportResultPayload;
        } catch {
          if (!cancelled) {
            setPlagSummary({
              byStudent: {},
              loading: false,
              error: "Failed to parse Plagiarism & AI report.",
              llmErrorBanner: null,
            });
          }
          return;
        }
        const llmErrorBanner = getLlmReportBanner(payload);
        const map: Record<string, GraderReportStudentSummary> = {};
        for (const row of payload.results) {
          const rawLevel = row.ai_features?.risk_level;
          const aiRiskLevel: GraderReportStudentSummary["aiRiskLevel"] =
            rawLevel === "high" || rawLevel === "medium" || rawLevel === "low" || rawLevel === "none"
              ? rawLevel
              : "none";
          const rs = row.ai_features?.risk_score;
          const aiRiskScore =
            typeof rs === "number" && Number.isFinite(rs) ? Math.max(0, Math.min(1, rs)) : 0;
          map[row.student_id] = {
            similarityScore: row.similarity_score ?? 0,
            matchesCount: row.matches_count,
            warning: row.similarity_warning ?? null,
            aiRiskScore,
            aiRiskLevel,
          };
        }
        if (!cancelled) {
          setPlagSummary({ byStudent: map, loading: false, error: null, llmErrorBanner });
        }
      } catch {
        if (!cancelled) {
          setPlagSummary({ byStudent: {}, loading: false, error: null, llmErrorBanner: null });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [assignment?.id, plagRefreshKey]);
  const hasGroupColumn = useMemo(
    () => submissions.some((row) => Boolean(row.subGroupName && row.subGroupName.trim())),
    [submissions],
  );

  const bulkCanvasEligibleCount = useMemo(
    () =>
      submissions.filter(
        (row) => row.marks != null && row.studentId != null && row.studentId.trim().length > 0,
      ).length,
    [submissions],
  );

  const handleConfirmBulkCanvasPost = useCallback(async () => {
    if (!onPostBulkGradesToCanvas) return;
    setIsPostingBulkGradesToCanvas(true);
    try {
      await onPostBulkGradesToCanvas(submissions);
      toast.success("Posted to Canvas.");
      setIsBulkCanvasConfirmOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Canvas post failed.");
      setIsBulkCanvasConfirmOpen(false);
    } finally {
      setIsPostingBulkGradesToCanvas(false);
    }
  }, [onPostBulkGradesToCanvas, submissions]);

  const handleConfirmSyncAssignmentWithCanvas = useCallback(async () => {
    if (!onSyncAssignmentWithCanvas) return;
    setIsSyncingAssignmentWithCanvas(true);
    try {
      await onSyncAssignmentWithCanvas();
    } finally {
      setIsSyncingAssignmentWithCanvas(false);
      setIsSyncCanvasConfirmOpen(false);
    }
  }, [onSyncAssignmentWithCanvas]);

  const sectionTabs: Array<{ id: AssignmentDetailSection; label: string }> = [
    { id: "description", label: "Description" },
    { id: "details", label: "Assignment Details" },
    { id: "rubric", label: "Rubric" },
    { id: "tests", label: "Test Cases" },
    { id: "submissions", label: "Submissions" },
  ];
  if (loading) {
    return (
      <main className="flex-1 overflow-y-auto bg-[#F5F2F2]">
        <div className="2xl:max-w-7xl 2xl:mx-auto px-8 py-6">
          <div className="h-7 w-60 rounded bg-gray-200 animate-pulse mb-4" />
          <div className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse space-y-4">
            <div className="h-6 w-72 rounded bg-gray-200" />
            <div className="h-4 w-full rounded bg-gray-100" />
            <div className="h-4 w-[85%] rounded bg-gray-100" />
            <div className="h-4 w-[65%] rounded bg-gray-100" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <>
    <main className="flex-1 overflow-y-auto bg-[#F5F2F2]">
      <div className="2xl:max-w-7xl 2xl:mx-auto px-8 py-6">
        <Link
          to={backLink.to}
          className="inline-flex items-center gap-1.5 text-[13px] text-gray-600 hover:text-[#2B2A2A] transition-colors mb-4"
        >
          <ChevronLeft className="w-4 h-4" strokeWidth={2} />
          {backLink.label}
        </Link>
        {testCasesLink && assignment?.id ? (
          <Link
            to={testCasesLink.to}
            className="inline-flex items-center gap-1.5 text-[13px] text-[#5A7ACD] hover:text-[#4a6abb] transition-colors mb-4 ml-4"
          >
            <ListChecks className="w-4 h-4" strokeWidth={2} />
            {testCasesLink.label}
          </Link>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <p className="text-[14px] text-red-600">{error}</p>
          </div>
        ) : null}

        {assignment ? (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#EEF3FF] flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-[#5A7ACD]" strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-[22px] font-semibold text-[#2B2A2A] truncate">
                      {assignment.title}
                    </h1>
                    <p className="text-[13px] text-gray-600 mt-0.5">{assignment.courseName}</p>
                  </div>
                </div>
                {editAssignmentLink ? (
                  <div className="flex flex-shrink-0 flex-col items-end gap-2">
                    <Link
                      to={editAssignmentLink.to}
                      aria-label={editAssignmentLink.label ?? "Edit assignment"}
                      title={editAssignmentLink.label ?? "Edit assignment"}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition-colors hover:border-gray-300 hover:bg-gray-50 hover:text-[#2B2A2A]"
                    >
                      <Pencil className="h-4 w-4" strokeWidth={2} />
                    </Link>
                    {onSyncAssignmentWithCanvas ? (
                      <button
                        type="button"
                        onClick={() => setIsSyncCanvasConfirmOpen(true)}
                        disabled={isSyncingAssignmentWithCanvas}
                        aria-label="Sync assignment with Canvas"
                        title="Sync assignment with Canvas"
                        className="whitespace-nowrap rounded-lg border border-[#D6DDF5] bg-[#F8FAFF] px-3 py-1.5 text-[11px] font-medium text-[#5A7ACD] hover:bg-[#EEF2FC] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Sync with Canvas
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="border-b border-gray-200 px-6 py-3">
              <div className="flex flex-wrap gap-2">
                {sectionTabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveSection(tab.id)}
                    className={`rounded-full px-4 py-2 text-[13px] font-medium transition-colors ${
                      activeSection === tab.id
                        ? "bg-[#2B2A2A] text-white"
                        : "border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:text-[#2B2A2A]"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {activeSection !== "submissions" ? (
            <div className="px-6 py-5 space-y-5">
              {activeSection === "description" ? (
                <div>
                  <h3 className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Description
                  </h3>
                  {assignment.description ? (
                    <p className="text-[14px] text-[#2B2A2A] whitespace-pre-wrap">
                      {assignment.description}
                    </p>
                  ) : (
                    <p className="text-[14px] text-gray-500">No description was provided for this assignment.</p>
                  )}
                </div>
              ) : null}

              {activeSection === "details" ? (
              <div className="pt-2 border-t border-gray-100">
                <h3 className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Assignment details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {assignment.id != null && assignment.id !== "" ? (
                    <div>
                      <h4 className="text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-0.5">
                        Assignment ID
                      </h4>
                      <p className="text-[14px] text-[#2B2A2A] font-mono">{assignment.id}</p>
                    </div>
                  ) : null}
                  <div>
                    <h4 className="text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-0.5">
                      Total points
                    </h4>
                    <p className="text-[14px] text-[#2B2A2A]">
                      {assignment.totalPoints != null ? assignment.totalPoints : "—"}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-0.5">
                      Language
                    </h4>
                    <p className="text-[14px] text-[#2B2A2A]">{assignment.language ?? "—"}</p>
                  </div>
                  <div>
                    <h4 className="text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-0.5">
                      Submission type
                    </h4>
                    <p className="text-[14px] text-[#2B2A2A]">
                      {assignment.submissionType ? assignment.submissionType.replace(/_/g, " ") : "—"}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-0.5">
                      Due date
                    </h4>
                    <p className="text-[14px] text-[#2B2A2A]">{assignment.dueDate}</p>
                  </div>
                  <div>
                    <h4 className="text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-0.5">
                      Available from
                    </h4>
                    <p className="text-[14px] text-[#2B2A2A]">{assignment.availableFrom ?? "—"}</p>
                  </div>
                  <div>
                    <h4 className="text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-0.5">
                      Late due date
                    </h4>
                    <p className="text-[14px] text-[#2B2A2A]">{assignment.lateDueDate ?? "—"}</p>
                  </div>
                  <div>
                    <h4 className="text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-0.5">
                      Starter code
                    </h4>
                    {(assignment.starterCodeFiles?.length ?? 0) > 0 ? (
                      <ul className="space-y-1.5">
                        {assignment.starterCodeFiles!.map((f, idx) => (
                          <li key={`${f.fileName}-${idx}`}>
                            <a
                              href={f.downloadUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-[14px] text-[#5A7ACD] hover:underline break-all"
                            >
                              <Download className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                              <span>{f.fileName}</span>
                            </a>
                          </li>
                        ))}
                      </ul>
                    ) : assignment.starterCodeUrl ? (
                      <a
                        href={assignment.starterCodeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[14px] text-[#5A7ACD] hover:underline break-all"
                      >
                        {assignment.starterCodeUrl}
                      </a>
                    ) : (
                      <p className="text-[14px] text-[#2B2A2A]">—</p>
                    )}
                  </div>
                  <div>
                    <h4 className="text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-0.5">
                      Linked rubric
                    </h4>
                    <p className="text-[14px] text-[#2B2A2A]">{assignment.rubricName ?? "—"}</p>
                  </div>
                </div>
              </div>
              ) : null}

              {activeSection === "rubric" ? (
                <div className="pt-2 border-t border-gray-100">
                  <h3 className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Rubric
                  </h3>
                  {!rubricSection ? (
                    <p className="text-[14px] text-gray-500">No rubric is attached to this assignment.</p>
                  ) : rubricSection.loading ? (
                    <p className="text-[14px] text-gray-500">Loading rubric…</p>
                  ) : (rubricSection.criteriaNested?.length ?? 0) > 0 ? (
                    <div className="space-y-4">
                      {rubricSection.name ? (
                        <p className="text-[14px] font-medium text-[#2B2A2A]">{rubricSection.name}</p>
                      ) : null}
                      {rubricSection.description ? (
                        <p className="text-[13px] text-gray-600">{rubricSection.description}</p>
                      ) : null}
                      <div className="space-y-5">
                        {(rubricSection.criteriaNested ?? []).map((criterion, cIdx) => (
                          <div
                            key={cIdx}
                            className="rounded-xl border-2 border-[#E4E7EC] bg-white shadow-sm overflow-hidden"
                          >
                            <div className="px-4 py-3 bg-[#F3F6FB] border-b-2 border-[#E4E7EC]">
                              <span className="text-[14px] font-semibold text-[#1F2430]">
                                {criterion.title || `Criterion ${cIdx + 1}`}
                              </span>
                            </div>
                            <div className="px-4 py-3">
                              <ul className="space-y-3">
                                {criterion.subCriteria.map((sub, sIdx) => (
                                  <li
                                    key={sIdx}
                                    className="text-[13px] text-[#2B2A2A] pl-3 border-l-2 border-[#EEF3FF]"
                                  >
                                    {sub.description ? (
                                      <p className="text-[#2B2A2A]">{sub.description}</p>
                                    ) : null}
                                    <p className="mt-0.5 text-[12px] text-gray-500">
                                      Max {sub.maxScore} pts
                                      {sub.weight != null ? (
                                        <span> · Weight {roundTo2(sub.weight)}%</span>
                                      ) : null}
                                    </p>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : rubricSection.criteria.length > 0 ? (
                    <div className="space-y-3">
                      {rubricSection.name ? (
                        <p className="text-[14px] font-medium text-[#2B2A2A]">{rubricSection.name}</p>
                      ) : null}
                      {rubricSection.description ? (
                        <p className="text-[13px] text-gray-600">{rubricSection.description}</p>
                      ) : null}
                      <ul className="space-y-2">
                        {rubricSection.criteria.map((c) => (
                          <li
                            key={c.title}
                            className="text-[13px] text-[#2B2A2A] border-l-2 border-[#EEF3FF] pl-3"
                          >
                            <span className="font-medium">{c.title}</span>
                            {c.maxScore != null && (
                              <span className="text-gray-500"> — max {c.maxScore} pts</span>
                            )}
                            {c.weight != null && (
                              <span className="text-gray-500"> (weight {roundTo2(c.weight)})</span>
                            )}
                            {c.description ? (
                              <p className="text-gray-600 mt-0.5">{c.description}</p>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : rubricSection.name ? (
                    <p className="text-[14px] text-[#2B2A2A]">{rubricSection.name}</p>
                  ) : (
                    <p className="text-[14px] text-gray-500">No rubric details are available yet.</p>
                  )}
                </div>
              ) : null}

              {activeSection === "tests" ? (
                <div className="pt-2 border-t border-gray-100">
                  <h3 className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Test cases
                  </h3>
                  {!testSuiteSection ? (
                    <p className="text-[14px] text-gray-500">No test cases are attached to this assignment.</p>
                  ) : testSuiteSection.loading ? (
                    <p className="text-[14px] text-gray-500">Loading test cases…</p>
                  ) : testSuiteSection.testCases.length > 0 ? (
                    <div className="space-y-3">
                      {testSuiteSection.title ? (
                        <p className="text-[14px] font-medium text-[#2B2A2A]">{testSuiteSection.title}</p>
                      ) : null}
                      {testSuiteSection.description ? (
                        <p className="text-[13px] text-gray-600">{testSuiteSection.description}</p>
                      ) : null}
                      <ul className="space-y-2">
                        {testSuiteSection.testCases.map((c, i) => (
                          <li
                            key={c.title || i}
                            className="text-[13px] text-[#2B2A2A] border-l-2 border-[#EEF3FF] pl-3"
                          >
                            <span className="font-medium">{c.title || "Untitled"}</span>
                            {c.isPrivate && (
                              <span className="ml-2 text-[11px] font-medium text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                                Private
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                      {testCasesLink && assignment?.id ? (
                        <Link
                          to={testCasesLink.to}
                          className="inline-flex items-center gap-1.5 text-[13px] text-[#5A7ACD] hover:underline mt-2"
                        >
                          <ListChecks className="w-4 h-4" strokeWidth={2} />
                          {testCasesLink.label}
                        </Link>
                      ) : null}
                    </div>
                  ) : testSuiteSection.title ? (
                    <p className="text-[14px] text-[#2B2A2A]">{testSuiteSection.title} — no cases yet.</p>
                  ) : (
                    <p className="text-[14px] text-gray-500">No test cases are available yet.</p>
                  )}
                </div>
              ) : null}
            </div>
            ) : null}
          </div>
        ) : null}

        {activeSection === "submissions" ? (
        <div className="mt-6 bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Inbox className="w-5 h-5 text-[#5A7ACD]" strokeWidth={2} />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-[16px] font-semibold text-[#2B2A2A]">Submissions</h2>
                  {submissionsCountLabel ? (
                    <span className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-[12px] font-medium text-[#2B2A2A]">
                      {submissionsCountLabel}
                    </span>
                  ) : null}
                </div>
                <p className="text-[13px] text-gray-600">{submissionsSectionSubtitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onRefreshSubmissions}
                disabled={submissionsLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-[12px] font-medium text-[#2B2A2A] hover:bg-gray-50 disabled:opacity-60"
              >
                <RefreshCcw
                  className={`w-4 h-4 ${submissionsLoading ? "animate-spin" : ""}`}
                  strokeWidth={2}
                />
                <span>{submissionsLoading ? "Refreshing…" : "Refresh"}</span>
              </button>
              <button
                type="button"
                onClick={() => void handleDownloadAll()}
                disabled={downloadingAll || submissions.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-[12px] font-medium text-[#2B2A2A] hover:bg-gray-50 disabled:opacity-60"
              >
                <Download
                  className={`w-4 h-4 ${downloadingAll ? "animate-pulse" : ""}`}
                  strokeWidth={2}
                />
                <span>{downloadingAll ? "Preparing…" : "Download All"}</span>
              </button>
              {onPostBulkGradesToCanvas ? (
                <button
                  type="button"
                  title="Post every graded submission (with student id) to Canvas in one request."
                  disabled={submissionsLoading || bulkCanvasEligibleCount < 1}
                  onClick={() => setIsBulkCanvasConfirmOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-[12px] font-medium text-[#2B2A2A] hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <CloudUpload className="w-4 h-4" strokeWidth={2} />
                  <span>Post all grades to Canvas</span>
                </button>
              ) : null}
              {speedGradingLink ? (
                <Link
                  to={speedGradingLink.to}
                  // NOTE: Faculty launches speed grading from the assignment detail page so the queue is anchored to the current assignment.
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#7A1226] rounded-lg text-[12px] font-medium text-white transition-colors hover:bg-[#65101F]"
                >
                  <span>{speedGradingLink.label}</span>
                </Link>
              ) : null}
              <button
                type="button"
                disabled={!assignment?.id}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2B2A2A] border border-[#2B2A2A] rounded-lg text-[12px] font-medium text-white hover:bg-[#3a3939] disabled:opacity-60"
                onClick={async () => {
                  if (!assignment?.id) return;
                  const id = Number(assignment.id);
                  if (!Number.isFinite(id) || id <= 0) return;
                  setPlagRunStatus("requesting");
                  setPlagRunMessage(null);
                  try {
                    await requestGraderReport(id);
                    setPlagRunStatus("running");
                    setPlagRunMessage("Queued. Generating Plagiarism & AI report…");
                    const done = await pollGraderReportUntilDone(id, { intervalMs: 3000, timeoutMs: 300000 });
                    if (done.status === "COMPLETED") {
                      setPlagRunStatus("completed");
                      setPlagRunMessage("Plagiarism & AI report completed.");
                      setPlagRefreshKey((k) => k + 1);
                    } else {
                      setPlagRunStatus("failed");
                      setPlagRunMessage(done.errorMessage ?? "Plagiarism & AI report failed.");
                    }
                  } catch (e) {
                    setPlagRunStatus("failed");
                    setPlagRunMessage(e instanceof Error ? e.message : "Failed to run Plagiarism & AI report.");
                  }
                }}
              >
                <Zap className="w-4 h-4" strokeWidth={2} />
                <span>
                  {plagRunStatus === "requesting" || plagRunStatus === "running"
                    ? "Running…"
                    : "Run Plagiarism & AI report"}
                </span>
              </button>
            </div>
          </div>
          {plagSummary?.llmErrorBanner ? (
            <div className="px-6 py-3 border-b border-amber-100 bg-amber-50 text-[12px] text-amber-900">
              {plagSummary.llmErrorBanner.text}
            </div>
          ) : null}
          {plagRunMessage && (
            <div
              className={
                "px-6 py-2 text-[12px] " +
                (plagRunStatus === "failed" ? "text-red-700 bg-red-50" : "text-gray-700 bg-gray-50")
              }
            >
              {plagRunMessage}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-[12px] font-semibold text-gray-500 uppercase tracking-wide">
                  <th className="px-6 py-3">Student</th>
                  {hasGroupColumn ? <th className="px-6 py-3">Group</th> : null}
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Score</th>
                  <th className="px-6 py-3">Plagiarism</th>
                  <th className="px-6 py-3">AI risk</th>
                  <th className="px-6 py-3">Submitted</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {submissionsLoading && submissions.length === 0 ? (
                  Array.from({ length: 4 }).map((_, index) => (
                    <tr
                      key={`submissions-skeleton-${index}`}
                      className="border-b border-gray-100 last:border-b-0"
                    >
                      <td className="px-6 py-4">
                        <div className="h-4 w-32 rounded bg-gray-200 animate-pulse" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-6 w-20 rounded-md bg-gray-100 animate-pulse" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 w-10 rounded bg-gray-200 animate-pulse" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 w-28 rounded bg-gray-200 animate-pulse" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 w-24 rounded bg-gray-200 animate-pulse" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 w-24 rounded bg-gray-200 animate-pulse" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="ml-auto h-8 w-20 rounded-lg bg-gray-100 animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : submissions.length > 0 ? (
                  submissions.map((row, index) => {
                    const isUngraded =
                      row.status.toLowerCase() === "ungraded" || row.marks == null;
                    const openHref = getSubmissionLink(row.submissionId);
                    const plag =
                      (row.studentId ? plagSummary?.byStudent[row.studentId] : undefined) ??
                      null;
                    const simPct = plag ? Math.round((plag.similarityScore ?? 0) * 100) : 0;
                    const riskLevel =
                      simPct >= 75 ? "High" : simPct >= 40 ? "Medium" : simPct > 0 ? "Low" : "None";
                    const aiPct = plag ? Math.round((plag.aiRiskScore ?? 0) * 100) : 0;
                    const aiLabel = plag ? formatAiRiskLevelLabel(plag.aiRiskLevel) : "None";
                    const aiColorClass =
                      aiPct >= 85
                        ? "text-red-700"
                        : aiPct >= 60
                          ? "text-amber-700"
                          : aiPct > 0
                            ? "text-emerald-700"
                            : "text-gray-700";

                    return (
                      <tr
                        key={row.submissionId}
                        className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                          index === submissions.length - 1 ? "border-b-0" : ""
                        }`}
                      >
                        <td className="px-6 py-4">
                          <Link
                            to={openHref}
                            className="text-[14px] font-medium text-[#2B2A2A] hover:text-[#5A7ACD] transition-colors"
                          >
                            {row.studentName}
                          </Link>
                        </td>
                        {hasGroupColumn ? (
                          <td className="px-6 py-4 text-[13px] text-[#2B2A2A]">
                            {row.subGroupName ?? "—"}
                          </td>
                        ) : null}
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-md text-[12px] font-medium ${
                              isUngraded
                                ? "bg-orange-50 text-orange-600"
                                : "bg-green-50 text-green-600"
                            }`}
                          >
                            {row.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-[13px] text-[#2B2A2A]">
                          {row.marks != null ? String(row.marks) : "—"}
                        </td>
                        <td className="px-6 py-4">
                          {plagSummary?.loading ? (
                            <span className="text-[12px] text-gray-400">Loading…</span>
                          ) : plag ? (
                            <div className="flex flex-col gap-0.5">
                              <span
                                className={
                                  "text-[13px] font-medium " +
                                  (riskLevel === "High"
                                    ? "text-red-700"
                                    : riskLevel === "Medium"
                                    ? "text-amber-700"
                                    : "text-gray-700")
                                }
                              >
                                {simPct}% {riskLevel !== "None" ? `(${riskLevel})` : ""}
                              </span>
                              {plag.matchesCount != null && (
                                <span className="text-[11px] text-gray-500">
                                  {plag.matchesCount} match
                                  {plag.matchesCount === 1 ? "" : "es"}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[12px] text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {plagSummary?.loading ? (
                            <span className="text-[12px] text-gray-400">Loading…</span>
                          ) : plag ? (
                            <span className={`text-[13px] font-medium ${aiColorClass}`}>
                              {aiPct}%
                              {aiLabel !== "None" ? ` (${aiLabel})` : ""}
                            </span>
                          ) : (
                            <span className="text-[12px] text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-[13px] text-[#2B2A2A]">
                          {row.submittedAt ?? "—"}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {row.primaryDownloadUrl ? (
                              <a
                                href={row.primaryDownloadUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={`Download ${row.primaryFileName ?? "submission file"}`}
                                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                              >
                                <Download className="w-4 h-4 text-gray-500" strokeWidth={2} />
                              </a>
                            ) : (
                              <button
                                type="button"
                                aria-label="No downloadable file"
                                disabled
                                className="p-1.5 rounded-lg text-gray-300 cursor-not-allowed"
                              >
                                <Download className="w-4 h-4" strokeWidth={2} />
                              </button>
                            )}
                            {row.subGroupName ? (
                              <Link
                                to={`${openHref}?tab=group`}
                                aria-label="Open group details"
                                className="px-2 py-1 text-[11px] font-medium rounded-md bg-[#EEF3FF] text-[#3355AA] hover:bg-[#DFE9FF] transition-colors"
                              >
                                Group
                              </Link>
                            ) : null}
                            {onPostSubmissionGradeToCanvas ? (
                              <button
                                type="button"
                                title="Send this row's grade to Canvas"
                                aria-label="Send this row's grade to Canvas"
                                disabled={
                                  row.marks == null ||
                                  !row.studentId?.trim() ||
                                  Boolean(postingCanvasBySubmissionId[row.submissionId])
                                }
                                onClick={async () => {
                                  if (!onPostSubmissionGradeToCanvas || row.marks == null) return;
                                  setPostingCanvasBySubmissionId((previous) => ({
                                    ...previous,
                                    [row.submissionId]: true,
                                  }));
                                  try {
                                    await onPostSubmissionGradeToCanvas(row);
                                    toast.success("Posted to Canvas.");
                                  } catch (error) {
                                    toast.error(
                                      error instanceof Error ? error.message : "Canvas post failed.",
                                    );
                                  } finally {
                                    setPostingCanvasBySubmissionId((previous) => ({
                                      ...previous,
                                      [row.submissionId]: false,
                                    }));
                                  }
                                }}
                                className="px-2 py-1 text-[11px] font-medium rounded-md border border-gray-300 bg-white text-[#2B2A2A] hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {postingCanvasBySubmissionId[row.submissionId] ? "Sending…" : "Canvas"}
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={hasGroupColumn ? 7 : 6}
                      className="px-6 py-6 text-center text-[13px] text-gray-600"
                    >
                      No submissions yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        ) : null}
      </div>
    </main>
    <AlertDialog
      open={isBulkCanvasConfirmOpen}
      onOpenChange={(open) => {
        if (!open && isPostingBulkGradesToCanvas) return;
        setIsBulkCanvasConfirmOpen(open);
      }}
    >
      <AlertDialogContent
        onEscapeKeyDown={(event) => {
          if (isPostingBulkGradesToCanvas) event.preventDefault();
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>Post all grades to Canvas?</AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPostingBulkGradesToCanvas}>Cancel</AlertDialogCancel>
          <button
            type="button"
            onClick={() => void handleConfirmBulkCanvasPost()}
            disabled={isPostingBulkGradesToCanvas}
            className="inline-flex h-9 items-center justify-center rounded-md bg-[#2B2A2A] px-4 text-sm font-medium text-white transition-colors hover:bg-[#3A3939] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPostingBulkGradesToCanvas ? "Posting…" : "Confirm"}
          </button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    <AlertDialog
      open={isSyncCanvasConfirmOpen}
      onOpenChange={(open) => {
        if (!open && isSyncingAssignmentWithCanvas) return;
        setIsSyncCanvasConfirmOpen(open);
      }}
    >
      <AlertDialogContent
        onEscapeKeyDown={(event) => {
          if (isSyncingAssignmentWithCanvas) event.preventDefault();
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>Sync this assignment with Canvas?</AlertDialogTitle>
          <AlertDialogDescription>
            This publishes the assignment to the Canvas course linked to this class. Continue only if you intend
            to update Canvas.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSyncingAssignmentWithCanvas}>Cancel</AlertDialogCancel>
          <button
            type="button"
            onClick={() => void handleConfirmSyncAssignmentWithCanvas()}
            disabled={isSyncingAssignmentWithCanvas}
            className="inline-flex h-9 items-center justify-center rounded-md bg-[#2B2A2A] px-4 text-sm font-medium text-white transition-colors hover:bg-[#3A3939] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSyncingAssignmentWithCanvas ? "Syncing…" : "Sync"}
          </button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}

// ----- Grading Assistant route: uses AssignmentDetailPage with GA APIs -----

/** Shared submission date/time format so Faculty and GA tables look the same. */
export function formatSubmissionDisplayDate(iso: string | null | undefined): string {
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

function formatDateGA(iso: string | null | undefined): string {
  return formatSubmissionDisplayDate(iso);
}

function mapGAAssignment(a: AssignmentDetailResponse | null): AssignmentDetailPageAssignment | null {
  if (!a) return null;
  const starterCodeFiles =
    a.starterCodeFiles
      ?.map((f) =>
        f.downloadUrl && f.fileName ? { fileName: f.fileName, downloadUrl: f.downloadUrl } : null,
      )
      .filter((item): item is { fileName: string; downloadUrl: string } => item !== null) ?? [];
  return {
    id: String(a.id),
    title: a.name,
    courseName: a.courseName ?? "—",
    description: a.description ?? null,
    dueDate: formatDateGA(a.dueDate),
    totalPoints: a.totalPoints ?? null,
    language: a.languageName ?? null,
    submissionType: a.submissionType ?? null,
    availableFrom: formatDateGA(a.availableFrom),
    lateDueDate: formatDateGA(a.lateDueDate),
    starterCodeUrl: a.starterCodeUrl ?? null,
    starterCodeFiles: starterCodeFiles.length > 0 ? starterCodeFiles : undefined,
    rubricName: a.rubricName ?? null,
  };
}

function mapGARubric(
  rubric: GradingAssistantRubricResponse | null,
  loading: boolean
): AssignmentDetailPageRubricSection | null {
  if (!rubric && !loading) return null;
  return {
    name: rubric?.name ?? null,
    description: rubric?.description ?? null,
    criteria:
      rubric?.criteria?.map((c) => ({
        title: c.title ?? "Criterion",
        maxScore: c.maxScore ?? null,
        description: c.description ?? null,
        weight: c.weight ?? null,
      })) ?? [],
    loading,
  };
}

function mapGATestSuite(
  suite: Awaited<ReturnType<typeof getTestSuiteByAssignment>> | null,
  loading: boolean,
): AssignmentDetailPageTestSuiteSection | null {
  if (!suite && !loading) return null;
  return {
    title: suite?.title ?? "Test Suite",
    description: suite?.description ?? null,
    testCases:
      suite?.testCases?.map((testCase) => ({
        title: testCase.title ?? "Untitled",
        isPrivate: Boolean(testCase.isPrivate),
      })) ?? [],
    loading,
  };
}

function mapGASubmissions(
  list: GradingAssistantSubmissionResponse[]
): AssignmentDetailPageSubmissionRow[] {
  const sorted = [...list].sort((a, b) => {
    const at = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
    const bt = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
    return bt - at;
  });
  const seenStudentIds = new Set<number>();
  const latestPerStudent = sorted.filter((s) => {
    if (seenStudentIds.has(s.studentId)) return false;
    seenStudentIds.add(s.studentId);
    return true;
  });
  return latestPerStudent.map((s) => {
    const files = s.files ?? [];
    const primary = files[0];
    const filesWithUrls = files
      .map((f) => ({
        fileName: f.fileName ?? "file",
        downloadUrl: f.downloadUrl ?? f.url ?? "",
      }))
      .filter((f) => Boolean(f.downloadUrl));
    const status = (s.marks ?? s.grade) == null ? "Ungraded" : "Graded";
    const subId = s.submissionId ?? s.id;
    return {
      submissionId: String(subId ?? ""),
      studentId: String(s.studentId),
      studentName: s.studentName ?? s.studentEmail ?? `Submission #${subId ?? "?"}`,
      submittedAt: formatSubmissionDisplayDate(s.submittedAt ?? undefined),
      status,
      marks: s.marks ?? s.grade ?? null,
      primaryFileName: primary?.fileName ?? null,
      additionalFileCount: Math.max(0, files.length - 1),
      primaryDownloadUrl: primary?.downloadUrl ?? primary?.url ?? null,
      files: filesWithUrls.length > 0 ? filesWithUrls : undefined,
    };
  });
}

/** Grading Assistant assignment detail route: fetches GA data and renders AssignmentDetailPage. */
export function GradingAssistantAssignmentDetailPage() {
  const { classId, assignmentId } = useParams();
  const navigate = useNavigate();
  const user = getAuthenticatedUser();
  const displayName = user?.name ?? "Grading Assistant";
  const displayEmail = user?.email ?? "";
  const displayInitials = useMemo(
    () =>
      displayName
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("") || "GA",
    [displayName]
  );

  const [assignment, setAssignment] = useState<AssignmentDetailResponse | null>(null);
  const [rubric, setRubric] = useState<GradingAssistantRubricResponse | null>(null);
  const [submissions, setSubmissions] = useState<GradingAssistantSubmissionResponse[]>([]);
  const [testSuite, setTestSuite] = useState<Awaited<ReturnType<typeof getTestSuiteByAssignment>> | null>(null);
  const [testSuiteLoading, setTestSuiteLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rubricLoading, setRubricLoading] = useState(false);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!classId || !assignmentId) {
      setLoading(false);
      return;
    }
    const courseId = Number(classId);
    const aId = Number(assignmentId);
    if (!courseId || !aId) {
      setLoading(false);
      setError("Invalid course or assignment.");
      return;
    }
    setLoading(true);
    setError(null);
    getAssignmentByCourse(courseId, aId)
      .then(setAssignment)
      .catch(() => setError("Failed to load assignment."))
      .finally(() => setLoading(false));
  }, [classId, assignmentId]);

  useEffect(() => {
    if (!assignment?.rubricId) {
      setRubric(null);
      return;
    }
    setRubricLoading(true);
    getRubric(assignment.rubricId)
      .then(setRubric)
      .catch(() => setRubric(null))
      .finally(() => setRubricLoading(false));
  }, [assignment?.rubricId]);

  useEffect(() => {
    if (!assignmentId) return;
    const aId = Number(assignmentId);
    if (!aId) return;
    setTestSuiteLoading(true);
    getTestSuiteByAssignment(String(aId))
      .then(setTestSuite)
      .catch(() => setTestSuite(null))
      .finally(() => setTestSuiteLoading(false));
  }, [assignmentId]);

  useEffect(() => {
    if (!assignmentId) return;
    const aId = Number(assignmentId);
    if (!aId) return;
    setSubmissionsLoading(true);
    listSubmissionsByAssignment(aId)
      .then(setSubmissions)
      .catch(() => setSubmissions([]))
      .finally(() => setSubmissionsLoading(false));
  }, [assignmentId]);

  const reloadSubmissions = useCallback(() => {
    if (!assignmentId) return;
    const aId = Number(assignmentId);
    if (!aId) return;
    setSubmissionsLoading(true);
    listSubmissionsByAssignment(aId)
      .then(setSubmissions)
      .catch(() => setSubmissions([]))
      .finally(() => setSubmissionsLoading(false));
  }, [assignmentId]);

  const goToSettingsSection = (section: SettingsSection) => {
    navigate(`/settings?section=${section}`);
  };

  const handleLogout = () => {
    clearAuthenticated();
    navigate("/signin", { replace: true });
  };

  const pageAssignment = useMemo(() => mapGAAssignment(assignment), [assignment]);
  const pageRubric = useMemo(() => mapGARubric(rubric, rubricLoading), [rubric, rubricLoading]);
  const pageTestSuite = useMemo(
    () => mapGATestSuite(testSuite, testSuiteLoading),
    [testSuite, testSuiteLoading],
  );
  const pageSubmissions = useMemo(() => mapGASubmissions(submissions), [submissions]);

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
      mainContent={
        <AssignmentDetailPage
          assignment={pageAssignment}
          rubricSection={pageRubric}
          submissions={pageSubmissions}
          backLink={{
            to: `/grading-assistant/class/${classId}`,
            label: "Back to course",
          }}
          getSubmissionLink={(id) =>
            `/grading-assistant/class/${classId}/assignment/${assignmentId}/submission/${id}`
          }
          loading={loading}
          submissionsLoading={submissionsLoading}
          error={error}
          testSuiteSection={pageTestSuite}
          onRefreshSubmissions={reloadSubmissions}
          submissionsSectionSubtitle="Review and grade student submissions for this assignment."
        />
      }
    />
  );
}
