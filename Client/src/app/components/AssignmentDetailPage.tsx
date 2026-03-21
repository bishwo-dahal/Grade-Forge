import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
  ChevronLeft,
  Download,
  FileText,
  Filter,
  Inbox,
  ListChecks,
  MoreVertical,
  RefreshCcw,
  Zap,
} from "lucide-react";
import {
  getGraderReportLatest,
  pollGraderReportUntilDone,
  requestGraderReport,
} from "../../services/graderReportService";
import type { GraderReportResultPayload } from "../../types/graderReport";
import type { AssignmentDetailResponse } from "../../types/gradingAssistantAssignment";
import type { GradingAssistantRubricResponse } from "../../types/gradingAssistantRubric";
import { roundTo2 } from "../../utils/number";
import type { GradingAssistantSubmissionResponse } from "../../types/gradingAssistantSubmission";
import { getAssignmentByCourse } from "../../services/gradingAssistantAssignmentService";
import { getRubric } from "../../services/gradingAssistantRubricService";
import { listSubmissionsByAssignment } from "../../services/gradingAssistantSubmissionService";
import { clearAuthenticated, getAuthenticatedUser } from "../auth";
import { AuthShell } from "./layout/AuthShell";
import { AuthTopBar } from "./layout/AuthTopBar";
import type { SettingsSection } from "./layout/AuthTopBar";

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
  /** Optional link for faculty to manage test cases (opens assignment workspace). */
  testCasesLink?: { to: string; label: string };
  /** Optional test suite to display (like rubric section). */
  testSuiteSection?: AssignmentDetailPageTestSuiteSection | null;
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
  testCasesLink,
  testSuiteSection,
}: AssignmentDetailPageProps) {
  const [plagSummary, setPlagSummary] = useState<
    | {
        byStudent: Record<
          string,
          { similarityScore: number; matchesCount?: number; warning?: string | null }
        >;
        loading: boolean;
        error: string | null;
      }
    | null
  >(null);
  const [plagRefreshKey, setPlagRefreshKey] = useState(0);
  const [plagRunStatus, setPlagRunStatus] = useState<
    "idle" | "requesting" | "running" | "completed" | "failed"
  >("idle");
  const [plagRunMessage, setPlagRunMessage] = useState<string | null>(null);

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
    setPlagSummary({ byStudent: {}, loading: true, error: null });
    (async () => {
      try {
        const report = await getGraderReportLatest(assignmentIdNumeric);
        if (!report || !report.result || report.status !== "COMPLETED") {
          if (!cancelled) {
            setPlagSummary({ byStudent: {}, loading: false, error: null });
          }
          return;
        }
        let payload: GraderReportResultPayload | null = null;
        try {
          payload = JSON.parse(report.result) as GraderReportResultPayload;
        } catch {
          if (!cancelled) {
            setPlagSummary({ byStudent: {}, loading: false, error: "Failed to parse plagiarism report." });
          }
          return;
        }
        const map: Record<
          string,
          { similarityScore: number; matchesCount?: number; warning?: string | null }
        > = {};
        for (const row of payload.results) {
          map[row.student_id] = {
            similarityScore: row.similarity_score ?? 0,
            matchesCount: row.matches_count,
            warning: row.similarity_warning ?? null,
          };
        }
        if (!cancelled) {
          setPlagSummary({ byStudent: map, loading: false, error: null });
        }
      } catch {
        if (!cancelled) {
          setPlagSummary({ byStudent: {}, loading: false, error: null });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [assignment?.id, plagRefreshKey]);
  if (loading) {
    return (
      <main className="flex-1 overflow-y-auto bg-[#F5F2F2]">
        <div className="max-w-7xl mx-auto px-8 py-6">
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
    <main className="flex-1 overflow-y-auto bg-[#F5F2F2]">
      <div className="max-w-7xl mx-auto px-8 py-6">
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
              <div className="flex items-start gap-3">
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
            </div>

            <div className="px-6 py-5 space-y-5">
              {assignment.description ? (
                <div>
                  <h3 className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Description
                  </h3>
                  <p className="text-[14px] text-[#2B2A2A] whitespace-pre-wrap">
                    {assignment.description}
                  </p>
                </div>
              ) : null}

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
                    {assignment.starterCodeUrl ? (
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

              {rubricSection ? (
                <div className="pt-2 border-t border-gray-100">
                  <h3 className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Rubric
                  </h3>
                  {rubricSection.loading ? (
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
                  ) : null}
                </div>
              ) : null}

              {testSuiteSection ? (
                <div className="pt-2 border-t border-gray-100">
                  <h3 className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Test cases
                  </h3>
                  {testSuiteSection.loading ? (
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
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="mt-6 bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Inbox className="w-5 h-5 text-[#5A7ACD]" strokeWidth={2} />
              <div>
                <h2 className="text-[16px] font-semibold text-[#2B2A2A]">Submissions</h2>
                <p className="text-[13px] text-gray-600">{submissionsSectionSubtitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {speedGradingLink ? (
                <Link
                  to={speedGradingLink.to}
                  // NOTE: Faculty launches speed grading from the assignment detail page so the queue is anchored to the current assignment.
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2B2A2A] rounded-lg text-[12px] font-medium text-white transition-colors hover:bg-[#3A3939]"
                >
                  <span>{speedGradingLink.label}</span>
                </Link>
              ) : null}
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
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-[12px] font-medium text-[#2B2A2A] hover:bg-gray-50"
              >
                <Filter className="w-4 h-4" strokeWidth={2} />
                <span>Filter</span>
              </button>
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
                    setPlagRunMessage("Queued. Generating report…");
                    const done = await pollGraderReportUntilDone(id, { intervalMs: 3000, timeoutMs: 300000 });
                    if (done.status === "COMPLETED") {
                      setPlagRunStatus("completed");
                      setPlagRunMessage("Plagiarism report completed.");
                      setPlagRefreshKey((k) => k + 1);
                    } else {
                      setPlagRunStatus("failed");
                      setPlagRunMessage(done.errorMessage ?? "Plagiarism report failed.");
                    }
                  } catch (e) {
                    setPlagRunStatus("failed");
                    setPlagRunMessage(e instanceof Error ? e.message : "Failed to run plagiarism check.");
                  }
                }}
              >
                <Zap className="w-4 h-4" strokeWidth={2} />
                <span>
                  {plagRunStatus === "requesting" || plagRunStatus === "running"
                    ? "Running…"
                    : "Run plagiarism check"}
                </span>
              </button>
            </div>
          </div>
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
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-[12px] font-semibold text-gray-500 uppercase tracking-wide">
                  <th className="px-6 py-3">Student</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Score</th>
                  <th className="px-6 py-3">Plagiarism</th>
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
                            <Link
                              to={openHref}
                              aria-label="Open submission"
                              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <FileText className="w-4 h-4 text-gray-500" strokeWidth={2} />
                            </Link>
                            <button
                              type="button"
                              aria-label="More submission actions"
                              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <MoreVertical className="w-4 h-4 text-gray-500" strokeWidth={2} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={5}
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
      </div>
    </main>
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
          onRefreshSubmissions={reloadSubmissions}
          submissionsSectionSubtitle="Review and grade student submissions for this assignment."
        />
      }
    />
  );
}
