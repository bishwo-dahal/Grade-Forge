import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
  BarChart3,
  Download,
  FileText,
  LayoutDashboard,
  Plus,
  Settings,
  UserPlus,
  Users,
  UsersRound,
} from "lucide-react";
import type { AssignmentDescription, AssignmentDetail } from "../../types/assignment";
import type { FacultyAssignmentSubmissionRow } from "../../types/submission";
import type { Rubric } from "../../types/rubric";
import {
  getAssignmentDescription,
  getAssignmentDetailById,
} from "../../services/assignmentService";
import { listFacultyAssignmentSubmissionFiles } from "../../services/submissionService";
import { getRubric } from "../../services/rubricService";
import { clearAuthenticated, getAuthenticatedUser } from "../auth";
import { AuthTopBar } from "./layout/AuthTopBar";
import type { SettingsSection } from "./layout/AuthTopBar";
import { SidebarPinnedCollapseFooter } from "./layout/SidebarPinnedCollapseFooter";
import { useSidebarPinnedCollapsed } from "./layout/useSidebarPinnedCollapsed";
import { getFacultyClassHeaderById } from "../../services/classService";
import type { ClassHeader } from "../../types/class";
import {
  AssignmentDetailPage,
  formatSubmissionDisplayDate,
  type AssignmentDetailPageAssignment,
  type AssignmentDetailPageRubricSection,
  type AssignmentDetailPageSubmissionRow,
  type AssignmentDetailPageTestSuiteSection,
} from "./AssignmentDetailPage";
import { getTestSuiteByAssignment } from "../../services/testSuiteService";
import { getApiErrorMessage } from "../../utils/apiErrorMessage";

function extractErrorMessage(error: unknown): string {
  return getApiErrorMessage(error, "Unable to load grading details.");
}

function mapToAssignment(assignment: AssignmentDetail | null, description: AssignmentDescription | null): AssignmentDetailPageAssignment | null {
  if (!assignment) return null;
  return {
    id: assignment.id,
    title: assignment.title,
    courseName: `${assignment.courseCode} • ${assignment.course}`,
    description: description?.problemDescription?.length
      ? description.problemDescription.join("\n\n")
      : null,
    dueDate: assignment.dueDate,
    totalPoints: assignment.points.total,
    language: assignment.language,
    submissionType: assignment.submissionType ?? null,
    availableFrom: assignment.availableFrom ?? null,
    lateDueDate: assignment.lateDueDate ?? null,
    starterCodeUrl: assignment.starterCodeUrl ?? null,
    starterCodeFiles: assignment.starterCodeFiles,
    rubricName: assignment.rubricName ?? null,
  };
}

function mapToRubricSection(rubric: Rubric | null, loading: boolean): AssignmentDetailPageRubricSection | null {
  if (!rubric && !loading) return null;
  const criteria = rubric?.criteria ?? [];
  const hasNested = criteria.some((c) => (c.subCriteria?.length ?? 0) > 0);
  return {
    name: rubric?.name ?? null,
    description: rubric?.description ?? null,
    criteria: hasNested
      ? []
      : criteria.map((c) => ({
          title: c.title ?? "Criterion",
          maxScore: c.maxScore ?? null,
          description: c.description ?? null,
          weight: c.weight ?? null,
        })),
    criteriaNested: hasNested
      ? criteria
          .filter((c) => (c.subCriteria?.length ?? 0) > 0)
          .map((c) => ({
            title: c.title ?? "Criterion",
            subCriteria: (c.subCriteria ?? []).map((s) => ({
              description: s.description ?? null,
              maxScore: s.maxScore,
              weight: s.weight ?? null,
            })),
          }))
      : null,
    loading,
  };
}

function mapToSubmissionRows(rows: FacultyAssignmentSubmissionRow[]): AssignmentDetailPageSubmissionRow[] {
  return rows.map((row) => {
    const files = row.files ?? [];
    const primary = files[0];
    const filesWithUrls = files
      .filter((f): f is typeof f & { downloadUrl: string } => Boolean(f.downloadUrl))
      .map((f) => ({ fileName: f.fileName, downloadUrl: f.downloadUrl }));
    return {
      submissionId: row.submissionId,
      studentId: row.studentId ?? null,
      studentName: row.studentName,
      subGroupName: row.subGroupName ?? null,
      submittedAt: formatSubmissionDisplayDate(row.submittedAt),
      status: row.marks == null ? "Ungraded" : "Graded",
      marks: row.marks,
      primaryFileName: primary?.fileName ?? null,
      additionalFileCount: Math.max(0, files.length - 1),
      primaryDownloadUrl: primary?.downloadUrl ?? null,
      files: filesWithUrls.length > 0 ? filesWithUrls : undefined,
    };
  });
}

function mapToTestSuiteSection(suite: Awaited<ReturnType<typeof getTestSuiteByAssignment>>): AssignmentDetailPageTestSuiteSection | null {
  if (!suite) return null;
  return {
    title: suite.title ?? "Test Suite",
    description: suite.description ?? null,
    testCases: (suite.testCases ?? []).map((tc) => ({
      title: tc.title ?? "Untitled",
      isPrivate: Boolean(tc.isPrivate),
    })),
    loading: false,
  };
}

export function FacultyGradingAssignmentDetailPage() {
  const { classId, assignmentId } = useParams();
  const navigate = useNavigate();
  const resolvedClassId = classId ?? "";
  const resolvedAssignmentId = assignmentId ?? "";

  const user = getAuthenticatedUser();
  const displayName = user?.name ?? "Dr. Sarah Miller";
  const displayEmail = user?.email ?? "smiller@university.edu";
  const displayInitials = useMemo(() => {
    return (
      displayName
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("") || "GF"
    );
  }, [displayName]);

  const [classHeader, setClassHeader] = useState<ClassHeader | null>(null);
  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null);
  const [description, setDescription] = useState<AssignmentDescription | null>(null);
  const [rubric, setRubric] = useState<Rubric | null>(null);
  const [rubricLoading, setRubricLoading] = useState(false);
  const [submissions, setSubmissions] = useState<FacultyAssignmentSubmissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [testSuite, setTestSuite] = useState<Awaited<ReturnType<typeof getTestSuiteByAssignment>>>(null);
  const [testSuiteLoading, setTestSuiteLoading] = useState(false);

  const goToSettingsSection = (section: SettingsSection) => {
    navigate(`/settings?section=${section}`);
  };

  const handleLogout = () => {
    clearAuthenticated();
    navigate("/signin", { replace: true });
  };

  useEffect(() => {
    if (!resolvedClassId.trim()) {
      setClassHeader(null);
      return;
    }
    getFacultyClassHeaderById(resolvedClassId)
      .then(setClassHeader)
      .catch(() => setClassHeader(null));
  }, [resolvedClassId]);

  const loadAll = useCallback(async () => {
    if (!resolvedAssignmentId.trim()) {
      setErrorMessage("Invalid assignment.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setErrorMessage(null);
    try {
      const [assignmentData, descriptionData, submissionRows] = await Promise.all([
        getAssignmentDetailById(resolvedAssignmentId),
        getAssignmentDescription(resolvedAssignmentId),
        listFacultyAssignmentSubmissionFiles(resolvedAssignmentId),
      ]);
      setAssignment(assignmentData);
      setDescription(descriptionData);
      setSubmissions(submissionRows);
      if (assignmentData?.rubricId != null) {
        setRubricLoading(true);
        getRubric(assignmentData.rubricId)
          .then(setRubric)
          .catch(() => setRubric(null))
          .finally(() => setRubricLoading(false));
      } else {
        setRubric(null);
        setRubricLoading(false);
      }
    } catch (error) {
      setErrorMessage(extractErrorMessage(error));
      setAssignment(null);
      setDescription(null);
      setRubric(null);
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  }, [resolvedAssignmentId]);

  useEffect(() => {
    if (!resolvedAssignmentId.trim()) return;
    setTestSuiteLoading(true);
    getTestSuiteByAssignment(resolvedAssignmentId)
      .then(setTestSuite)
      .catch(() => setTestSuite(null))
      .finally(() => setTestSuiteLoading(false));
  }, [resolvedAssignmentId]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const reloadSubmissions = useCallback(async () => {
    if (!resolvedAssignmentId.trim()) return;
    setSubmissionsLoading(true);
    try {
      const rows = await listFacultyAssignmentSubmissionFiles(resolvedAssignmentId);
      setSubmissions(rows);
    } catch {
      setSubmissions([]);
    } finally {
      setSubmissionsLoading(false);
    }
  }, [resolvedAssignmentId]);

  const pageAssignment = useMemo(
    () => mapToAssignment(assignment, description),
    [assignment, description]
  );
  const pageRubric = useMemo(() => mapToRubricSection(rubric, rubricLoading), [rubric, rubricLoading]);
  const latestSubmissionsPerStudent = useMemo(() => {
    const seen = new Set<string>();
    return submissions.filter((row) => {
      if (seen.has(row.studentName)) return false;
      seen.add(row.studentName);
      return true;
    });
  }, [submissions]);
  const pageSubmissions = useMemo(
    () => mapToSubmissionRows(latestSubmissionsPerStudent),
    [latestSubmissionsPerStudent]
  );
  const pageTestSuiteSection = useMemo((): AssignmentDetailPageTestSuiteSection | null => {
    if (testSuiteLoading && !testSuite) {
      return { title: "", description: null, testCases: [], loading: true };
    }
    return mapToTestSuiteSection(testSuite);
  }, [testSuite, testSuiteLoading]);

  const classData: ClassHeader = classHeader ?? {
    id: resolvedClassId || "1",
    code: "",
    name: "",
    section: "",
    semester: "",
    instructor: "",
    role: "Instructor",
  };

  const { pinnedCollapsed } = useSidebarPinnedCollapsed();

  const sidebarNav = [
    { key: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" strokeWidth={2} />, to: `/faculty/class/${resolvedClassId}/dashboard` },
    { key: "assignments", label: "Assignments", icon: <FileText className="w-4 h-4" strokeWidth={2} />, to: `/faculty/class/${resolvedClassId}/assignments` },
    { key: "grades", label: "Grades", icon: <BarChart3 className="w-4 h-4" strokeWidth={2} />, to: `/faculty/class/${resolvedClassId}/grades` },
    { key: "students", label: "Students", icon: <Users className="w-4 h-4" strokeWidth={2} />, to: `/faculty/class/${resolvedClassId}/students` },
    { key: "assistants", label: "Grading Assistants", icon: <UserPlus className="w-4 h-4" strokeWidth={2} />, to: `/faculty/class/${resolvedClassId}/assistants` },
    { key: "groups", label: "Groups", icon: <UsersRound className="w-4 h-4" strokeWidth={2} />, to: `/faculty/class/${resolvedClassId}/groups` },
    { key: "settings", label: "Settings", icon: <Settings className="w-4 h-4" strokeWidth={2} />, to: `/faculty/class/${resolvedClassId}/settings` },
  ] as const;

  return (
    <div className="flex h-screen bg-[#F5F4F6]">
      {/* Left Sidebar Navigation (match /faculty/class/:id/assignments) */}
      <aside
        className={`flex flex-shrink-0 flex-col border-r border-[#65101F] bg-[#7A1226] transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          pinnedCollapsed ? "w-[78px]" : "w-64"
        }`}
      >
        <div className="flex min-h-0 flex-1 flex-col">
          <div
            className={`flex h-[76px] items-center border-b border-[#65101F] bg-white ${
              pinnedCollapsed ? "justify-center px-0" : "px-6"
            }`}
          >
            <Link
              to="/dashboard"
              className={`flex items-center transition-opacity hover:opacity-90 ${
                pinnedCollapsed ? "h-12 w-12 justify-center rounded-[14px]" : "gap-3"
              }`}
              aria-label="Go to dashboard"
            >
              <img
                src="/favicon.svg"
                alt={pinnedCollapsed ? "" : "Grade Forge"}
                className="h-8 w-8 flex-shrink-0 rounded-[10px] border border-[#C9C4C9]"
              />
              {!pinnedCollapsed ? (
                <div className="leading-tight">
                  <div className="text-[15px] font-semibold text-[#2B2A2A]">Grade Forge</div>
                  <div className="text-[11px] font-medium text-[#6D7B91]">Faculty</div>
                </div>
              ) : null}
            </Link>
          </div>

          <nav className={`min-h-0 flex-1 overflow-y-auto overflow-x-hidden py-4 ${pinnedCollapsed ? "px-1" : "px-3"}`}>
            <ul className="space-y-1">
              {sidebarNav.map((item) => (
                <li key={item.key}>
                  <Link
                    to={item.to}
                    title={pinnedCollapsed ? item.label : undefined}
                    className={[
                      "relative flex w-full items-center rounded-lg text-[13px] font-medium transition-colors",
                      pinnedCollapsed ? "justify-center px-0 py-2.5" : "justify-between gap-3 px-3 py-2.5",
                      item.key === "assignments"
                        ? "bg-white text-[#7A1226] shadow-[0_8px_18px_rgba(0,0,0,0.16)]"
                        : "text-[#F5E5E8] hover:text-white hover:bg-[#8A1E33]",
                    ].join(" ")}
                  >
                    <div className={`flex items-center ${pinnedCollapsed ? "justify-center" : "gap-3"}`}>
                      {item.icon}
                      {pinnedCollapsed ? <span className="sr-only">{item.label}</span> : <span>{item.label}</span>}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <SidebarPinnedCollapseFooter variant="maroon" rail={pinnedCollapsed} expandedInset="flush" />
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <AuthTopBar
          roleView="faculty"
          profile={{ name: displayName, email: displayEmail, initials: displayInitials }}
          searchPlaceholder="Search calendar, assignments..."
          onSettingsSectionSelect={goToSettingsSection}
          onLogout={handleLogout}
        />

        <header className="bg-white border-b border-gray-200 px-8 py-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-[24px] font-semibold text-[#2B2A2A]">
                  {classData.code}: {classData.name}
                </h1>
                <span className="px-3 py-1 bg-[#5A7ACD] text-white text-[11px] font-semibold rounded uppercase">
                  {classData.role || "Instructor"}
                </span>
              </div>
              <div className="flex items-center gap-4 text-[13px] text-gray-600">
                <span>{classData.instructor || "Instructor"}</span>
                <span className="text-gray-300">&bull;</span>
                <span>{classData.semester}</span>
                <span className="text-gray-300">&bull;</span>
                <span>{classData.section}</span>
              </div>
            </div>

            {classHeader?.parentCourseId != null && classHeader.parentCourse ? (
              <div className="flex shrink-0 flex-col items-end gap-2 border-r-2 border-amber-400 pr-2.5">
                <p className="text-right text-[12px] leading-snug text-amber-950">
                  <strong>Linked section</strong> of{" "}
                  <strong>
                    {classHeader.parentCourse.courseCode}: {classHeader.parentCourse.name}
                  </strong>
                </p>
                <div className="flex w-full justify-end pt-0.5">
                  <Link
                    to={`/faculty/class/${classHeader.parentCourse.id}/assignments`}
                    className="inline-flex items-center rounded-lg bg-[#2B2A2A] px-3 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-[#3a3939]"
                  >
                    Open main course
                  </Link>
                </div>
              </div>
            ) : null}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-8 py-6">
            <AssignmentDetailPage
              assignment={pageAssignment}
              rubricSection={pageRubric}
              submissions={pageSubmissions}
              backLink={{ to: `/faculty/class/${resolvedClassId}/assignments`, label: "Back to assignments" }}
              getSubmissionLink={(id) =>
                `/faculty/class/${resolvedClassId}/assignment/${resolvedAssignmentId}/submission/${id}`
              }
              loading={loading}
              submissionsLoading={submissionsLoading}
              error={errorMessage}
              onRefreshSubmissions={reloadSubmissions}
              submissionsSectionSubtitle="Open a submission to review code and submit a grade."
              submissionsCountLabel={`${latestSubmissionsPerStudent.length} submitted`}
              speedGradingLink={{
                to: `/faculty/class/${resolvedClassId}/speed-grading/${resolvedAssignmentId}`,
                label: "Speed Grading",
              }}
              testCasesLink={{
                to: `/faculty/assignment/${resolvedAssignmentId}?tab=tests`,
                label: "Edit test cases",
              }}
              testSuiteSection={pageTestSuiteSection}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
