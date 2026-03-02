import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { ChevronLeft, GripVertical, User } from "lucide-react";
import { AssignmentHeader } from "./assignment/AssignmentHeader";
import { DescriptionPanel } from "./assignment/DescriptionPanel";
import { PublicTestsPanel } from "./assignment/PublicTestsPanel";
import { GradingRubricPanel } from "./assignment/GradingRubricPanel";
import { CircularScorePanel } from "./assignment/CircularScorePanel";
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
} from "../../services/submissionService";
import { getAssignmentByCourse } from "../../services/gradingAssistantAssignmentService";
import { getRubric } from "../../services/gradingAssistantRubricService";
import { listSubmissionsByAssignment } from "../../services/gradingAssistantSubmissionService";
import { clearAuthenticated, getAuthenticatedUser, getAuthenticatedRole } from "../auth";
import { AuthShell } from "./layout/AuthShell";
import { AuthTopBar } from "./layout/AuthTopBar";
import type { SettingsSection } from "./layout/AuthTopBar";
import type { AssignmentDetail, AssignmentDescription } from "../../types/assignment";
import type { RubricCategory } from "../../types/grade";
import type { GradingAssistantRubricResponse } from "../../types/gradingAssistantRubric";

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

/** Build minimal AssignmentDetail for header when we only have GA assignment response */
function buildAssignmentDetailFromGA(
  name: string,
  courseName: string,
  dueDate: string
): AssignmentDetail {
  return {
    id: "",
    title: name,
    course: courseName,
    courseCode: "",
    dueDate: formatDate(dueDate),
    status: "submitted",
    points: { earned: null, total: 0 },
    submissionsUsed: 0,
    submissionsAllowed: null,
    language: "Python",
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
  const [submissionCode, setSubmissionCode] = useState<string>("");
  const [submissionFileName, setSubmissionFileName] = useState<string>("main.py");
  const [submissionLanguage, setSubmissionLanguage] = useState<string>("Python");
  const [studentName, setStudentName] = useState<string>("");
  const [studentEmail, setStudentEmail] = useState<string | null>(null);
  const [submittedAt, setSubmittedAt] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    setAssignment(assignData);
    setDescription(descData);
    setRubricCategories(rubricData);
    const row = rows.find((r) => r.submissionId === sId) ?? rows.find((r) => String(r.submissionId) === String(sId));
    if (!row?.files?.length) {
      setError("Submission or files not found.");
      return;
    }
    const firstFile = row.files[0];
    setStudentName(row.studentName);
    setSubmittedAt(formatDate(row.submittedAt));
    setSubmissionFileName(firstFile.fileName);
    setSubmissionLanguage(resolvePreviewLanguage(firstFile.fileName, assignData.language));
    const content = await fetchSubmissionFileText(firstFile.downloadUrl ?? "", firstFile.fileName);
    setSubmissionCode(content);
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
    setAssignment(
      buildAssignmentDetailFromGA(
        assignData.name,
        assignData.courseName ?? "",
        sub.submittedAt ?? assignData.dueDate ?? ""
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
    if (assignData.rubricId != null) {
      const rubric = await getRubric(assignData.rubricId);
      setRubricCategories(mapGARubricToCategories(rubric));
    } else {
      setRubricCategories([]);
    }
    const files = sub.files ?? [];
    const firstFile = files[0];
    if (firstFile) {
      const url = firstFile.downloadUrl ?? (firstFile as { url?: string }).url;
      setSubmissionFileName(firstFile.fileName ?? "file");
      if (url) {
        const res = await fetch(url);
        const text = await res.text();
        setSubmissionCode(text);
      }
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

  const scoreItems = useMemo(
    () => [
      { label: "Plagiarism", value: null as number | null, percent: 0, color: "#FEB05D" },
      { label: "AI", value: null as number | null, percent: 0, color: "#5A7ACD" },
      { label: "AI Grader Score", value: null as number | null, percent: null, color: "#1E7A3F" },
    ],
    []
  );

  const handleRunTests = useCallback(() => {
    console.log("Run tests for submission", submissionId);
  }, [submissionId]);

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

  const facultyEditorPreviewPayload = useMemo(
    () =>
      submissionCode !== undefined && submissionFileName && submissionLanguage
        ? {
            optionId: `${submissionId ?? ""}-${submissionFileName}`,
            fileName: submissionFileName,
            language: submissionLanguage,
            content: submissionCode,
          }
        : null,
    [submissionCode, submissionFileName, submissionLanguage, submissionId]
  );

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
    <div className="flex h-screen flex-col overflow-hidden bg-[#F5F2F2]">
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
                  <div className="mt-1 text-[12px] text-gray-500">Submitted: {submittedAt}</div>
                  <div className="mt-0.5 text-[11px] text-gray-500">File: {submissionFileName}</div>
                </div>

                {/* Tabs */}
                <div className="flex-shrink-0 border-b border-gray-200 px-6">
                  <div className="flex gap-6">
                    {(
                      [
                        { id: "description" as const, label: "Description" },
                        { id: "tests" as const, label: "Public Tests" },
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
                  {activeTab === "tests" && <PublicTestsPanel testCases={[]} />}
                  {activeTab === "plagiarism" && (
                    <div className="p-6 text-[14px] text-gray-500">Plagiarism report will appear here.</div>
                  )}
                  {activeTab === "rubric" && <GradingRubricPanel rubricCategories={rubricCategories} />}
                </div>

                {/* Scores - sticky to bottom of left panel so always visible */}
                <div className="sticky bottom-0 z-10 flex-shrink-0 mt-auto border-t border-gray-200 bg-white">
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
              />
            ) : (
              <div className="h-full flex items-center justify-center bg-[#1e1e1e] text-gray-400 text-[14px]">
                Loading…
              </div>
            )}
          </Panel>
        </PanelGroup>
      </div>
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
