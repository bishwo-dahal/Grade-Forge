import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
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
import { FacultyClassSidebar } from "./layout/FacultyClassSidebar";
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

  return (
    <div className="flex h-screen bg-[#F5F4F6]">
      <FacultyClassSidebar classId={resolvedClassId} activeSection="assignments" />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AuthTopBar
          roleView="faculty"
          profile={{ name: displayName, email: displayEmail, initials: displayInitials }}
          showSearch={false}
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
                to: `/faculty/class/${resolvedClassId}/assignments/${resolvedAssignmentId}/edit`,
                label: "Edit test cases",
              }}
              testSuiteSection={pageTestSuiteSection}
              editAssignmentLink={{
                to: `/faculty/class/${resolvedClassId}/assignments/${resolvedAssignmentId}/edit`,
                label: "Edit assignment",
              }}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
