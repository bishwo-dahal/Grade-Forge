import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { 
  Settings, 
  ChevronLeft, 
  LayoutDashboard, 
  FileText, 
  Send, 
  BarChart3, 
  Plus,
  Upload,
  Users,
  UsersRound,
  CheckCircle2,
  Clock,
  AlertCircle,
  UserPlus,
  Edit,
  Copy,
  Trash2,
  MoreVertical,
  Filter,
  Download,
  Mail,
  UserMinus,
  Calendar,
  Search,
  X,
  RefreshCcw,
  ChevronRight,
  FileUp
} from "lucide-react";
import type {
  ClassHeader,
  ClassCreateFormData,
  ClassRecentActivity,
  FacultyAssignment,
  FacultyDashboardStat,
  FacultyStudentEmailSuggestion,
  FacultyRosterStats,
  FacultyRosterStudentRow,
  FacultyStudentSearchResult,
  FacultySemesterOption,
} from "../../types/class";
import type { MainGroupResponse } from "../../types/courseGroup";
import type { ClassSubmissionItem, SpeedGradingAssignmentOption } from "../../types/submission";
import {
  dropStudentFromCourse,
  enrollStudentByEmail,
  getFacultyClassHeaderById,
  deleteFacultyCourse,
  getFacultyCourseDetailsById,
  listClassRecentActivity,
  listFacultyAssignments,
  listFacultySemesters,
  listFacultyStudentEmailSuggestions,
  listFacultyRosterRows,
  listFacultyDashboardStats,
  searchFacultyStudentByEmail,
  toggleFacultyCourseActive,
  updateFacultyCourse,
  deleteFacultyAssignment,
} from "../../services/classService";

import type { CourseApiResponse } from "../../services/classService";
import { createFacultyMainGroup, listFacultyCourseGroups } from "../../services/courseGroupService";
import { listClassSubmissions } from "../../services/submissionService";
import {
  listCourseAssistants,
  assignCourseAssistant,
  removeCourseAssistant,
} from "../../services/courseAssistantService";
import { getAllGradingAssistants } from "../../services/gradingAssistantService";
import {
  getCourseGradeReport,
  getAssignmentGradeReport,
} from "../../services/gradeReportService";
import type {
  CourseGradeReportResponse,
  CourseGradeReportStudent,
  AssignmentGradeReportResponse,
} from "../../types/gradeReport";
import type { GradingAssistantResponse } from "../../types/gradingAssistant";
import type { CourseAssistantResponse } from "../../types/courseAssistant";
import { SegmentedFilter, type SegmentedFilterItem } from "./ui/SegmentedFilter";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "./ui/tooltip";
import { toast } from "sonner";
import { getApiErrorMessage } from "../../utils/apiErrorMessage";
import { clearAuthenticated, getAuthenticatedUser } from "../auth";
import { AuthTopBar } from "./layout/AuthTopBar";
import type { SettingsSection as TopBarSettingsSection } from "./layout/AuthTopBar";

const SECTION_PATH_SEGMENTS = [
  "dashboard",
  "assignments",
  "grades",
  "students",
  "assistants",
  "groups",
  "settings",
] as const;

type SectionType = (typeof SECTION_PATH_SEGMENTS)[number];
type RosterFilter = "all" | "active" | "inactive" | "unassigned";

function isValidSection(segment: string | undefined): segment is SectionType {
  return segment != null && SECTION_PATH_SEGMENTS.includes(segment as SectionType);
}

function getErrorMessage(error: unknown): string {
  // Prefer backend `message` (axios puts it on response.data, not error.message).
  return getApiErrorMessage(error, "Error");
}

export function FacultyClassPage() {
  const { classId, section: sectionParam } = useParams();
  const navigate = useNavigate();
  const resolvedClassId = classId ?? "1";
  const activeSection: SectionType = isValidSection(sectionParam) ? sectionParam : "dashboard";
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [classHeader, setClassHeader] = useState<ClassHeader | null>(null);

  // Redirect invalid section to dashboard
  useEffect(() => {
    if (sectionParam != null && !isValidSection(sectionParam)) {
      navigate(`/faculty/class/${resolvedClassId}/dashboard`, { replace: true });
    }
  }, [sectionParam, resolvedClassId, navigate]);

  useEffect(() => {
    // NOTE: Close add-student modal when user navigates away from Students section to avoid stale overlay state.
    if (activeSection !== "students") {
      setIsAddStudentModalOpen(false);
    }
  }, [activeSection]);

  useEffect(() => {
    const resolvedId = classId || "1";
    getFacultyClassHeaderById(resolvedId)
      .then(setClassHeader)
      .catch(() => setClassHeader(null));
  }, [classId]);

  const courseFullName =
    classHeader?.code && classHeader?.name
      ? `${classHeader.code}: ${classHeader.name}`
      : classHeader?.name || classHeader?.code || "";
  const facultyName = classHeader?.instructor || "";
  const classData: ClassHeader = classHeader ?? {
    id: classId || "1",
    code: "",
    name: "",
    section: "",
    semester: "",
    instructor: "",
    role: "",
  };
  const loggedInUser = getAuthenticatedUser();
  const displayName = loggedInUser?.name ?? "Dr. Sarah Miller";
  const displayEmail = loggedInUser?.email ?? "smiller@university.edu";
  const displayInitials =
    displayName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "GF";

  const goToSettingsSection = (section: TopBarSettingsSection) => {
    navigate(`/settings?section=${section}`);
  };

  const handleLogout = () => {
    clearAuthenticated();
    navigate("/signin", { replace: true });
  };

  return (
    <div className="flex h-screen bg-[#F5F2F2]">
      {/* Left Sidebar Navigation */}
      <aside className="w-64 bg-white border-r border-gray-200 flex-shrink-0">
        <div className="h-full flex flex-col">
          {/* Back to Dashboard Link */}
          <div className="px-4 py-4 border-b border-gray-200">
            <Link
              to="/dashboard"
              className="flex items-center gap-2 text-[13px] text-gray-600 hover:text-[#2B2A2A] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" strokeWidth={2} />
              <span>Back to Dashboard</span>
            </Link>
          </div>

          {/* Navigation Menu - each item has its own route */}
          <nav className="flex-1 px-3 py-4 overflow-y-auto">
            <ul className="space-y-1">
              <NavItem
                icon={<LayoutDashboard className="w-4 h-4" strokeWidth={2} />}
                label="Dashboard"
                active={activeSection === "dashboard"}
                to={`/faculty/class/${resolvedClassId}/dashboard`}
              />
              <NavItem
                icon={<FileText className="w-4 h-4" strokeWidth={2} />}
                label="Assignments"
                active={activeSection === "assignments"}
                to={`/faculty/class/${resolvedClassId}/assignments`}
              />
              <NavItem
                icon={<BarChart3 className="w-4 h-4" strokeWidth={2} />}
                label="Grades"
                active={activeSection === "grades"}
                to={`/faculty/class/${resolvedClassId}/grades`}
              />
              <NavItem
                icon={<Users className="w-4 h-4" strokeWidth={2} />}
                label="Students"
                active={activeSection === "students"}
                to={`/faculty/class/${resolvedClassId}/students`}
              />
              <NavItem
                icon={<UserPlus className="w-4 h-4" strokeWidth={2} />}
                label="Grading Assistants"
                active={activeSection === "assistants"}
                to={`/faculty/class/${resolvedClassId}/assistants`}
              />
              <NavItem
                icon={<UsersRound className="w-4 h-4" strokeWidth={2} />}
                label="Groups"
                active={activeSection === "groups"}
                to={`/faculty/class/${resolvedClassId}/groups`}
              />
              <NavItem
                icon={<Settings className="w-4 h-4" strokeWidth={2} />}
                label="Settings"
                active={activeSection === "settings"}
                to={`/faculty/class/${resolvedClassId}/settings`}
              />
            </ul>
          </nav>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <AuthTopBar
          roleView="faculty"
          profile={{ name: displayName, email: displayEmail, initials: displayInitials }}
          searchPlaceholder="Search calendar, assignments..."
          onSettingsSectionSelect={goToSettingsSection}
          onLogout={handleLogout}
        />

        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-[24px] font-semibold text-[#2B2A2A]">
                  {classData.code}: {classData.name}
                </h1>
                <span className="px-3 py-1 bg-[#5A7ACD] text-white text-[11px] font-semibold rounded uppercase">
                  {classData.role}
                </span>
              </div>
              <div className="flex items-center gap-4 text-[13px] text-gray-600">
                <span>{classData.semester}</span>
                <span className="text-gray-300">&bull;</span>
                <span>{classData.section}</span>
              </div>
            </div>
            {/* NOTE: Student-roster actions live in the top header so they align with the page-level action position. */}
            {activeSection === "students" ? (
              <div className="flex flex-wrap items-center gap-2">
                <button className="flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-[#2B2A2A] rounded-lg text-[13px] font-medium transition-colors">
                  <Download className="w-4 h-4" strokeWidth={2} />
                  <span>Import from Canvas</span>
                </button>
                <button
                  onClick={() => setIsAddStudentModalOpen(true)}
                  className="flex items-center gap-2 px-3.5 py-2 bg-[#2B2A2A] hover:bg-[#3a3939] text-white rounded-lg text-[13px] font-medium transition-colors"
                >
                  <Plus className="w-4 h-4" strokeWidth={2} />
                  <span>Add Student</span>
                </button>
              </div>
            ) : null}
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-8 py-6">
            {activeSection === "dashboard" && <DashboardSection />}
            {activeSection === "assignments" && <AssignmentsSection />}
            {activeSection === "grades" && (
              <GradesSection courseFullName={courseFullName} facultyName={facultyName} />
            )}
            {activeSection === "students" && (
              <StudentsSection
                isAddStudentModalOpen={isAddStudentModalOpen}
                onCloseAddStudentModal={() => setIsAddStudentModalOpen(false)}
              />
            )}
            {activeSection === "assistants" && <AssistantsSection />}
            {activeSection === "groups" && <GroupsSection />}
            {activeSection === "settings" && <SettingsSection classId={resolvedClassId} />}
          </div>
        </main>
      </div>
    </div>
  );
}

// Navigation Item Component - links to section route
function NavItem({
  icon,
  label,
  active,
  to,
  badge,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  to: string;
  badge?: number;
}) {
  return (
    <li>
      <Link
        to={to}
        className={`
          w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors
          ${active ? "bg-[#5A7ACD] text-white" : "text-gray-700 hover:bg-gray-100"}
        `}
      >
        <div className="flex items-center gap-3">
          {icon}
          <span>{label}</span>
        </div>
        {badge !== undefined && badge > 0 && (
          <span
            className={`
              px-2 py-0.5 text-[11px] font-semibold rounded-full
              ${active ? "bg-white text-[#5A7ACD]" : "bg-[#FEB05D] text-white"}
            `}
          >
            {badge}
          </span>
        )}
      </Link>
    </li>
  );
}

// Placeholder sections - will be implemented
function DashboardSection() {
  const { classId } = useParams();
  // NOTE: Dashboard stats and activity now load from backend-driven service calls.
  const [recentActivity, setRecentActivity] = useState<ClassRecentActivity[]>([]);
  const [stats, setStats] = useState<FacultyDashboardStat[]>([]);

  useEffect(() => {
    const resolvedId = classId || "1";
    listClassRecentActivity(resolvedId).then(setRecentActivity);
    listFacultyDashboardStats(resolvedId).then(setStats);
  }, [classId]);

  const activityIconMap = {
    send: Send,
    check: CheckCircle2,
    "user-plus": UserPlus,
  } as const;

  const statIconMap = {
    users: Users,
    "file-text": FileText,
    clock: Clock,
    alert: AlertCircle,
  } as const;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-[18px] font-semibold text-[#2B2A2A] mb-2">Class Dashboard</h2>
        <p className="text-[13px] text-gray-600">
          Overview of your class activity and statistics
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat) => {
          const StatIcon = statIconMap[stat.iconKey];
          return (
            <StatCard
              key={stat.label}
              label={stat.label}
              value={stat.value}
              icon={<StatIcon className="w-5 h-5" strokeWidth={2} />}
              iconBg={stat.iconBg}
              iconColor={stat.iconColor}
              badge={stat.badge}
            />
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[15px] font-semibold text-[#2B2A2A]">Recent Activity</h3>
          <button className="text-[12px] text-gray-500 hover:text-[#2B2A2A]">View All</button>
        </div>
        <div className="space-y-4">
          {recentActivity.length > 0 ? (
            recentActivity.map((activity) => {
              const ActivityIcon = activityIconMap[activity.iconKey];
              return (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 pb-4 border-b border-gray-100 last:border-b-0 last:pb-0"
                >
                  <div className={`mt-0.5 w-8 h-8 ${activity.iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <ActivityIcon className={`w-4 h-4 ${activity.iconColor}`} strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] text-[#2B2A2A]">{activity.message}</p>
                    <p className="text-[12px] text-gray-500 mt-0.5">{activity.time}</p>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-[13px] text-gray-600">No recent class activity yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  iconBg,
  iconColor,
  badge,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  badge?: boolean;
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 ${iconBg} rounded-lg flex items-center justify-center`}>
          <span className={iconColor}>{icon}</span>
        </div>
        {badge && (
          <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-semibold rounded uppercase">
            Action Needed
          </span>
        )}
      </div>
      <div className="text-[28px] font-semibold text-[#2B2A2A] mb-1">{value}</div>
      <div className="text-[13px] text-gray-600">{label}</div>
    </div>
  );
}

function AssignmentsSection() {
  const { classId } = useParams();
  const resolvedClassId = classId || "1";
  const [selectedAssignments, setSelectedAssignments] = useState<string[]>([]);
  // NOTE: Assignments now load from backend-driven class service mapping.
  const [assignments, setAssignments] = useState<FacultyAssignment[]>([]);
  const [isAssignmentsLoading, setIsAssignmentsLoading] = useState(true);
  const [openAssignmentActionsId, setOpenAssignmentActionsId] = useState<string | null>(null);
  const [assignmentDeleteTarget, setAssignmentDeleteTarget] = useState<FacultyAssignment | null>(null);
  const [isDeletingAssignment, setIsDeletingAssignment] = useState(false);

  const loadAssignments = useCallback(async () => {
    // FIX: Centralize assignment reload so header/footer actions reuse the same backend-driven refresh path.
    setIsAssignmentsLoading(true);
    try {
      const rows = await listFacultyAssignments(resolvedClassId);
      setAssignments(rows);
    } catch {
      setAssignments([]);
    } finally {
      setIsAssignmentsLoading(false);
    }
  }, [resolvedClassId]);

  useEffect(() => {
    void loadAssignments();
  }, [loadAssignments]);

  async function handleDeleteAssignment() {
    if (!assignmentDeleteTarget) {
      return;
    }
    const deletingAssignment = assignmentDeleteTarget;
    setAssignmentDeleteTarget(null);
    setIsDeletingAssignment(true);
    try {
      await deleteFacultyAssignment(deletingAssignment.id);
      setSelectedAssignments((prev) => prev.filter((id) => id !== deletingAssignment.id));
      toast.success("Assignment deleted successfully.");
      await loadAssignments();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsDeletingAssignment(false);
    }
  }

  return (
    <div onClick={() => setOpenAssignmentActionsId(null)}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-[18px] font-semibold text-[#2B2A2A] mb-2">Assignments</h2>
          <p className="text-[13px] text-gray-600">
            Create, publish, and manage course assignments
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg text-[13px] font-medium transition-colors">
            <Upload className="w-4 h-4" strokeWidth={2} />
            <span>Import</span>
          </button>
          <button
            type="button"
            onClick={() => void loadAssignments()}
            disabled={isAssignmentsLoading}
            // FIX: Keep assignment refresh in the primary header actions so faculty does not have to hunt for it below the table.
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg text-[13px] font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <RefreshCcw className={`w-4 h-4 ${isAssignmentsLoading ? "animate-spin" : ""}`} strokeWidth={2} />
            <span>{isAssignmentsLoading ? "Refreshing..." : "Refresh"}</span>
          </button>
          <Link
            to={`/faculty/class/${resolvedClassId}/assignments/create`}
            // NOTE: Assignment creation now uses a standalone page route so faculty can manage the full form flow.
            className="flex items-center gap-2 px-4 py-2 bg-[#2B2A2A] hover:bg-[#3a3939] text-white rounded-lg text-[13px] font-medium transition-colors"
          >
            <Plus className="w-4 h-4" strokeWidth={2} />
            <span>Create Assignment</span>
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-visible">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-6 py-3 text-[12px] font-semibold text-gray-600 uppercase tracking-wide">
                Assignment
              </th>
              <th className="text-left px-6 py-3 text-[12px] font-semibold text-gray-600 uppercase tracking-wide">
                Language
              </th>
              <th className="text-left px-6 py-3 text-[12px] font-semibold text-gray-600 uppercase tracking-wide">
                Due Date
              </th>
              <th className="text-left px-6 py-3 text-[12px] font-semibold text-gray-600 uppercase tracking-wide">
                Submissions
              </th>
              <th className="text-left px-6 py-3 text-[12px] font-semibold text-gray-600 uppercase tracking-wide">
                Status
              </th>
              <th className="text-right px-6 py-3 text-[12px] font-semibold text-gray-600 uppercase tracking-wide">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {isAssignmentsLoading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <tr key={`faculty-assignments-skeleton-${index}`} className="border-b border-gray-100 last:border-b-0">
                  {/* NOTE: Skeleton rows keep assignment table structure visible while assignments are fetching. */}
                  <td className="px-6 py-4">
                    <div className="h-4 w-44 rounded bg-gray-200 animate-pulse" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-6 w-20 rounded-md bg-gray-100 animate-pulse" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 w-28 rounded bg-gray-200 animate-pulse" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 w-16 rounded bg-gray-200 animate-pulse" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-6 w-20 rounded-md bg-gray-100 animate-pulse" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <div className="h-7 w-7 rounded-lg bg-gray-100 animate-pulse" />
                      <div className="h-7 w-7 rounded-lg bg-gray-100 animate-pulse" />
                      <div className="h-7 w-7 rounded-lg bg-gray-100 animate-pulse" />
                    </div>
                  </td>
                </tr>
              ))
            ) : assignments.length > 0 ? (
              assignments.map((assignment, index) => (
                <tr
                  key={assignment.id}
                  className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${index === assignments.length - 1 ? 'border-b-0' : ''}`}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedAssignments.includes(assignment.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedAssignments([...selectedAssignments, assignment.id]);
                          } else {
                            setSelectedAssignments(selectedAssignments.filter(id => id !== assignment.id));
                          }
                        }}
                        className="rounded border-gray-300 text-[#5A7ACD] focus:ring-[#5A7ACD]"
                      />
                      <Link
                        to={`/faculty/class/${resolvedClassId}/assignment/${assignment.id}`}
                        className="text-[14px] font-medium text-[#2B2A2A] hover:text-[#5A7ACD] transition-colors"
                      >
                        {assignment.name}
                      </Link>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-gray-100 text-[12px] font-medium text-gray-700">
                      {assignment.language}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[13px] text-gray-600">{assignment.dueDate}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[13px] text-gray-600">
                      {assignment.submissions}/{assignment.totalStudents}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[12px] font-medium ${
                      assignment.status === 'published'
                        ? 'bg-green-50 text-green-600'
                        : assignment.status === 'closed'
                        ? 'bg-gray-100 text-gray-600'
                        : 'bg-orange-50 text-orange-600'
                    }`}>
                      {assignment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div
                      className="relative flex items-center justify-end gap-2"
                      onClick={(event) => event.stopPropagation()}
                    >
                      {/* Accessibility: icon-only action buttons need labels for screen readers. */}
                      <Link
                        aria-label="Open assignment detail"
                        to={`/faculty/class/${resolvedClassId}/assignments/${assignment.id}/edit`}
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4 text-gray-500" strokeWidth={2} />
                      </Link>
                      <button aria-label="Duplicate assignment" className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                        <Copy className="w-4 h-4 text-gray-500" strokeWidth={2} />
                      </button>
                      <button
                        aria-label="More assignment actions"
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                        onClick={(event) => {
                          event.stopPropagation();
                          setOpenAssignmentActionsId((prev) => (prev === assignment.id ? null : assignment.id))
                        }}
                      >
                        <MoreVertical className="w-4 h-4 text-gray-500" strokeWidth={2} />
                      </button>
                      {openAssignmentActionsId === assignment.id ? (
                        <div
                          className="absolute right-0 top-9 z-20 w-44 rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setOpenAssignmentActionsId(null);
                              setAssignmentDeleteTarget(assignment);
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-[#C23A42] hover:bg-[#FFF5F5]"
                          >
                            <Trash2 className="h-4 w-4" strokeWidth={2} />
                            Delete Assignment
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-6 text-center text-[13px] text-gray-600">
                  No assignments found for this class.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {assignmentDeleteTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-xl">
            <div className="border-b border-gray-200 px-5 py-4">
              <h3 className="text-[16px] font-semibold text-[#2B2A2A]">Delete Assignment</h3>
              <p className="mt-1 text-[13px] text-gray-600">
                This action will permanently remove the assignment from this course.
              </p>
            </div>
            <div className="px-5 py-4">
              <p className="rounded-lg border border-[#F2C9CC] bg-[#FFF5F5] px-3 py-2 text-[13px] text-[#C23A42]">
                {assignmentDeleteTarget.name}
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-gray-200 bg-gray-50 px-5 py-4">
              <button
                type="button"
                onClick={() => !isDeletingAssignment && setAssignmentDeleteTarget(null)}
                disabled={isDeletingAssignment}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-[13px] font-medium text-[#2B2A2A] hover:bg-gray-100 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleDeleteAssignment()}
                disabled={isDeletingAssignment}
                className="rounded-lg bg-[#C23A42] px-4 py-2 text-[13px] font-medium text-white hover:bg-[#a92f36] disabled:opacity-60"
              >
                {isDeletingAssignment ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SubmissionsSection() {
  const { classId } = useParams();
  const navigate = useNavigate();
  // NOTE: Submissions now load from backend-driven submission service mapping.
  const [submissions, setSubmissions] = useState<ClassSubmissionItem[]>([]);
  const [isSubmissionsLoading, setIsSubmissionsLoading] = useState(false);
  const [submissionsError, setSubmissionsError] = useState<string | null>(null);
  const [isSpeedGradingModalOpen, setIsSpeedGradingModalOpen] = useState(false);
  const [selectedSpeedAssignmentId, setSelectedSpeedAssignmentId] = useState("");

  const speedGradingOptions = useMemo<SpeedGradingAssignmentOption[]>(() => {
    const groupedAssignments = new Map<string, SpeedGradingAssignmentOption>();

    for (const submission of submissions) {
      const existingOption = groupedAssignments.get(submission.assignmentId);
      if (existingOption) {
        existingOption.totalSubmissions += 1;
        if (submission.status === "ungraded") {
          existingOption.ungradedSubmissions += 1;
        }
        continue;
      }

      groupedAssignments.set(submission.assignmentId, {
        assignmentId: submission.assignmentId,
        assignmentName: submission.assignment,
        totalSubmissions: 1,
        ungradedSubmissions: submission.status === "ungraded" ? 1 : 0,
      });
    }

    // NOTE: Prioritize assignments with the highest ungraded count to reduce grading queue friction.
    return Array.from(groupedAssignments.values()).sort((left, right) => {
      if (left.ungradedSubmissions !== right.ungradedSubmissions) {
        return right.ungradedSubmissions - left.ungradedSubmissions;
      }
      return left.assignmentName.localeCompare(right.assignmentName);
    });
  }, [submissions]);

  const loadSubmissions = useCallback(async () => {
    const resolvedId = classId || "1";
    setIsSubmissionsLoading(true);
    setSubmissionsError(null);
    try {
      const rows = await listClassSubmissions(resolvedId);
      setSubmissions(rows);
    } catch (error) {
      setSubmissionsError(getErrorMessage(error));
    } finally {
      setIsSubmissionsLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    void loadSubmissions();
    // NOTE: Polling keeps faculty submission table fresh when student uploads arrive in another tab/session.
    const refreshInterval = window.setInterval(() => {
      void loadSubmissions();
    }, 15000);
    return () => window.clearInterval(refreshInterval);
  }, [loadSubmissions]);

  useEffect(() => {
    if (!isSpeedGradingModalOpen) {
      return;
    }
    const selectedExists = speedGradingOptions.some(
      (option) => option.assignmentId === selectedSpeedAssignmentId,
    );
    if (!selectedExists) {
      setSelectedSpeedAssignmentId(speedGradingOptions[0]?.assignmentId ?? "");
    }
  }, [isSpeedGradingModalOpen, selectedSpeedAssignmentId, speedGradingOptions]);

  const handleOpenSpeedGradingModal = () => {
    setIsSpeedGradingModalOpen(true);
    void loadSubmissions();
  };

  const handleStartSpeedGrading = () => {
    if (!selectedSpeedAssignmentId) {
      return;
    }
    const resolvedClassId = classId || "1";
    // NOTE: Launching from class submissions keeps speed grading scoped to one assignment queue at a time.
    navigate(`/faculty/class/${resolvedClassId}/speed-grading/${selectedSpeedAssignmentId}`);
    setIsSpeedGradingModalOpen(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-[18px] font-semibold text-[#2B2A2A] mb-2">Submissions</h2>
          <p className="text-[13px] text-gray-600">
            Review and grade student submissions
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleOpenSpeedGradingModal}
            disabled={isSubmissionsLoading}
            className="flex items-center gap-2 px-3 py-2 bg-[#2B2A2A] hover:bg-[#3a3939] rounded-lg text-[13px] font-medium text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Clock className="w-4 h-4" strokeWidth={2} />
            <span>Speed Grading</span>
          </button>
          <button
            onClick={() => void loadSubmissions()}
            disabled={isSubmissionsLoading}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg text-[13px] font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <RefreshCcw className={`w-4 h-4 ${isSubmissionsLoading ? "animate-spin" : ""}`} strokeWidth={2} />
            <span>{isSubmissionsLoading ? "Refreshing..." : "Refresh"}</span>
          </button>
          <button className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg text-[13px] font-medium transition-colors">
            <Filter className="w-4 h-4" strokeWidth={2} />
            <span>Filter</span>
          </button>
        </div>
      </div>
      {submissionsError ? (
        <div className="mb-4 rounded-lg border border-[#F2C9CC] bg-[#FFF5F5] px-3 py-2 text-[12px] text-[#C23A42]">
          {submissionsError}
        </div>
      ) : null}

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-6 py-3 text-[12px] font-semibold text-gray-600 uppercase tracking-wide">
                Student
              </th>
              <th className="text-left px-6 py-3 text-[12px] font-semibold text-gray-600 uppercase tracking-wide">
                Assignment
              </th>
              <th className="text-left px-6 py-3 text-[12px] font-semibold text-gray-600 uppercase tracking-wide">
                Submitted
              </th>
              <th className="text-left px-6 py-3 text-[12px] font-semibold text-gray-600 uppercase tracking-wide">
                Files
              </th>
              <th className="text-left px-6 py-3 text-[12px] font-semibold text-gray-600 uppercase tracking-wide">
                Status
              </th>
              <th className="text-right px-6 py-3 text-[12px] font-semibold text-gray-600 uppercase tracking-wide">
                Score
              </th>
              <th className="text-right px-6 py-3 text-[12px] font-semibold text-gray-600 uppercase tracking-wide">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {isSubmissionsLoading && submissions.length === 0 ? (
              Array.from({ length: 4 }).map((_, index) => (
                <tr key={`faculty-submissions-skeleton-${index}`} className="border-b border-gray-100 last:border-b-0">
                  {/* NOTE: Skeleton rows avoid a blank submissions table during refresh/load cycles. */}
                  <td className="px-6 py-4"><div className="h-4 w-24 rounded bg-gray-200 animate-pulse" /></td>
                  <td className="px-6 py-4"><div className="h-4 w-44 rounded bg-gray-200 animate-pulse" /></td>
                  <td className="px-6 py-4"><div className="h-4 w-28 rounded bg-gray-200 animate-pulse" /></td>
                  <td className="px-6 py-4"><div className="h-4 w-20 rounded bg-gray-200 animate-pulse" /></td>
                  <td className="px-6 py-4"><div className="h-6 w-16 rounded bg-gray-100 animate-pulse" /></td>
                  <td className="px-6 py-4"><div className="ml-auto h-4 w-10 rounded bg-gray-200 animate-pulse" /></td>
                  <td className="px-6 py-4"><div className="ml-auto h-7 w-20 rounded bg-gray-100 animate-pulse" /></td>
                </tr>
              ))
            ) : submissions.length > 0 ? (
              submissions.map((submission, index) => (
                <tr
                  key={submission.id}
                  className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${index === submissions.length - 1 ? 'border-b-0' : ''}`}
                >
                  <td className="px-6 py-4">
                    <Link
                      to={`/faculty/class/${classId || "1"}/assignment/${submission.assignmentId}/submission/${submission.id}`}
                      className="text-[14px] font-medium text-[#2B2A2A] hover:text-[#5A7ACD] transition-colors"
                    >
                      {submission.student}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      to={`/faculty/class/${classId || "1"}/assignment/${submission.assignmentId}/submission/${submission.id}`}
                      className="text-[13px] text-gray-600 hover:text-[#5A7ACD] transition-colors"
                    >
                      {submission.assignment}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[13px] text-gray-600">
                      {submission.submittedAt}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {submission.primaryFileName ? (
                      <div className="flex flex-col">
                        <span className="text-[13px] text-[#2B2A2A]">{submission.primaryFileName}</span>
                        {submission.additionalFileCount > 0 ? (
                          <span className="text-[11px] text-gray-500">+{submission.additionalFileCount} more</span>
                        ) : null}
                      </div>
                    ) : (
                      <span className="text-[13px] text-gray-400">&mdash;</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {submission.status === 'ungraded' ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-orange-50">
                        <span className="text-[12px] font-medium text-orange-600">Ungraded</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-green-50">
                        <span className="text-[12px] font-medium text-green-600">Graded</span>
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {submission.score !== undefined ? (
                      <span className="text-[13px] font-semibold text-[#2B2A2A]">{submission.score}</span>
                    ) : (
                      <span className="text-[13px] text-gray-400">&mdash;</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {submission.primaryDownloadUrl ? (
                        <a
                          // FIX: Faculty class table now surfaces a direct primary-file download action.
                          href={submission.primaryDownloadUrl}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`Download ${submission.primaryFileName ?? "submission file"}`}
                          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Download className="w-4 h-4 text-gray-500" strokeWidth={2} />
                        </a>
                      ) : (
                        <button
                          aria-label="No downloadable file for this submission"
                          disabled
                          className="p-1.5 rounded-lg text-gray-300 cursor-not-allowed"
                        >
                          <Download className="w-4 h-4" strokeWidth={2} />
                        </button>
                      )}
                      <Link
                        to={`/faculty/class/${classId || "1"}/assignment/${submission.assignmentId}/submission/${submission.id}`}
                        aria-label="Open submission in workspace"
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4 text-gray-500" strokeWidth={2} />
                      </Link>
                      <button aria-label="More submission actions" className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                        <MoreVertical className="w-4 h-4 text-gray-500" strokeWidth={2} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-6 text-center text-[13px] text-gray-600">
                  No submissions found for this class.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isSpeedGradingModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white shadow-xl">
            <div className="border-b border-gray-200 px-5 py-4">
              <h3 className="text-[16px] font-semibold text-[#2B2A2A]">Start Speed Grading</h3>
              <p className="mt-1 text-[12px] text-gray-600">
                Choose an assignment queue. The editor will open in read-only grading mode.
              </p>
            </div>

            <div className="px-5 py-4">
              {speedGradingOptions.length > 0 ? (
                <div className="space-y-2">
                  <label className="block text-[12px] font-medium text-[#2B2A2A]">Assignment</label>
                  <select
                    value={selectedSpeedAssignmentId}
                    onChange={(event) => setSelectedSpeedAssignmentId(event.target.value)}
                    className="h-10 w-full rounded-lg border border-gray-300 px-3 text-[13px] text-[#2B2A2A] focus:border-[#5A7ACD] focus:outline-none focus:ring-1 focus:ring-[#5A7ACD]/30"
                  >
                    {speedGradingOptions.map((option) => (
                      <option key={option.assignmentId} value={option.assignmentId}>
                        {option.assignmentName} ({option.ungradedSubmissions} ungraded / {option.totalSubmissions} submitted)
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <p className="text-[13px] text-gray-600">No assignment submissions available for speed grading yet.</p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-gray-200 bg-gray-50 px-5 py-4">
              <button
                type="button"
                onClick={() => setIsSpeedGradingModalOpen(false)}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-[13px] font-medium text-[#2B2A2A] hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStartSpeedGrading}
                disabled={!selectedSpeedAssignmentId}
                className="rounded-lg bg-[#2B2A2A] px-4 py-2 text-[13px] font-medium text-white hover:bg-[#3a3939] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Open Queue
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

type GradeViewMode = "course" | "assignment";
type GradeStatusFilter = "all" | "NOT_SUBMITTED" | "SUBMITTED" | "GRADED";

function GradesSection({
  courseFullName,
  facultyName,
}: {
  courseFullName: string;
  facultyName: string;
}) {
  const { classId } = useParams();
  const courseId = useMemo(() => Number(classId || "0") || 0, [classId]);

  const [courseReport, setCourseReport] = useState<CourseGradeReportResponse | null>(null);
  const [assignmentReport, setAssignmentReport] = useState<AssignmentGradeReportResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<GradeViewMode>("course");
  const [statusFilter, setStatusFilter] = useState<GradeStatusFilter>("all");
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<number | null>(null);
  const [assignmentReportLoading, setAssignmentReportLoading] = useState(false);

  // Load course grade report only when Grades section is shown (component mounted).
  useEffect(() => {
    if (courseId <= 0) return;
    setIsLoading(true);
    setLoadError(null);
    getCourseGradeReport(courseId)
      .then((data) => {
        setCourseReport(data);
        if (data.students.length > 0 && data.students[0].assignments.length > 0 && selectedAssignmentId == null) {
          setSelectedAssignmentId(data.students[0].assignments[0].assignmentId);
        }
      })
      .catch((err) => setLoadError(getErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }, [courseId]);

  // Load assignment-specific report when view is "assignment" and an assignment is selected.
  useEffect(() => {
    if (viewMode !== "assignment" || selectedAssignmentId == null || courseId <= 0) {
      setAssignmentReport(null);
      return;
    }
    setAssignmentReportLoading(true);
    getAssignmentGradeReport(courseId, selectedAssignmentId)
      .then(setAssignmentReport)
      .catch(() => setAssignmentReport(null))
      .finally(() => setAssignmentReportLoading(false));
  }, [viewMode, selectedAssignmentId, courseId]);

  const assignmentOptions = useMemo(() => {
    if (!courseReport?.students?.length) return [];
    const first = courseReport.students[0];
    return first.assignments ?? [];
  }, [courseReport]);

  const filteredStudentsCourse = useMemo(() => {
    if (!courseReport?.students) return [];
    let list = courseReport.students;
    const q = studentSearch.trim().toLowerCase();
    if (q) {
      list = list.filter((s) => s.studentName.toLowerCase().includes(q));
    }
    return list;
  }, [courseReport, studentSearch]);

  const filteredStudentsAssignment = useMemo(() => {
    if (!assignmentReport?.students) return [];
    let list = assignmentReport.students;
    const q = studentSearch.trim().toLowerCase();
    if (q) {
      list = list.filter((s) => s.studentName.toLowerCase().includes(q));
    }
    if (statusFilter !== "all") {
      list = list.filter((s) => s.status === statusFilter);
    }
    return list;
  }, [assignmentReport, studentSearch, statusFilter]);

  const statusLabel: Record<string, string> = {
    NOT_SUBMITTED: "Not submitted",
    SUBMITTED: "Submitted",
    GRADED: "Graded",
  };

  const exportGradesCsv = useCallback(() => {
    const escapeCsv = (value: string | number): string => {
      const s = String(value);
      if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };

    const downloadCsv = (csvContent: string, filename: string) => {
      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    };

    const safeName = (name: string) => name.replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").slice(0, 80) || "grades";
    const date = new Date().toISOString().slice(0, 10);

    const courseAndFacultyHeader = [
      [escapeCsv("Course"), escapeCsv(courseFullName)].join(","),
      [escapeCsv("Faculty"), escapeCsv(facultyName)].join(","),
      "",
    ].join("\r\n");

    if (viewMode === "course" && courseReport && assignmentOptions.length > 0) {
      const headers = ["Student", ...assignmentOptions.map((a) => a.assignmentName)];
      const rows = filteredStudentsCourse.map((s) => {
        const cells = [s.studentName];
        s.assignments.forEach((a) => {
          const scoreStr = a.score != null ? a.score.toFixed(2) : "—";
          const statusStr = statusLabel[a.status] ?? a.status;
          cells.push(`${scoreStr} / ${a.maxScore.toFixed(1)} (${statusStr})`);
        });
        return cells.map(escapeCsv).join(",");
      });
      const tableCsv = [headers.map(escapeCsv).join(","), ...rows].join("\r\n");
      const csv = courseAndFacultyHeader + "\r\n" + tableCsv;
      const filename = `grades-${safeName(courseReport.courseName)}-overview-${date}.csv`;
      downloadCsv(csv, filename);
      return;
    }

    if (viewMode === "assignment" && assignmentReport) {
      const titleRow = escapeCsv(assignmentReport.assignmentName);
      const headers = ["Student", "Score", "Max", "Status"];
      const rows = filteredStudentsAssignment.map((s) => [
        s.studentName,
        s.score != null ? s.score.toFixed(2) : "—",
        s.maxScore.toFixed(1),
        statusLabel[s.status] ?? s.status,
      ]);
      const tableCsv = [titleRow, headers.map(escapeCsv).join(","), ...rows.map((r) => r.map(escapeCsv).join(","))].join("\r\n");
      const csv = courseAndFacultyHeader + "\r\n" + tableCsv;
      const filename = `grades-${safeName(courseReport?.courseName ?? "course")}-${safeName(assignmentReport.assignmentName)}-${date}.csv`;
      downloadCsv(csv, filename);
    }
  }, [
    viewMode,
    courseReport,
    assignmentReport,
    assignmentOptions,
    filteredStudentsCourse,
    filteredStudentsAssignment,
    statusLabel,
    courseFullName,
    facultyName,
  ]);

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h2 className="text-[18px] font-semibold text-[#2B2A2A] mb-2">Grades</h2>
          <p className="text-[13px] text-gray-600">
            View and manage student grades for this course
          </p>
        </div>
        <button
          type="button"
          onClick={exportGradesCsv}
          disabled={!courseReport || (viewMode === "assignment" && !assignmentReport)}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg text-[13px] font-medium transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" strokeWidth={2} />
          <span>Export Grades</span>
        </button>
      </div>

      {loadError && (
        <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 text-[13px] text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={2} />
          {loadError}
        </div>
      )}

      {isLoading ? (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-8 flex flex-col items-center justify-center gap-3">
            <RefreshCcw className="w-8 h-8 text-gray-400 animate-spin" strokeWidth={2} />
            <p className="text-[14px] text-gray-600">Loading grade report…</p>
          </div>
        </div>
      ) : courseReport ? (
        <>
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-5 shadow-sm">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">View</span>
                <SegmentedFilter
                  items={[
                    { id: "course" as const, label: "Course overview" },
                    { id: "assignment" as const, label: "By assignment" },
                  ]}
                  value={viewMode}
                  onValueChange={(v) => setViewMode(v)}
                />
              </div>
              {viewMode === "assignment" && assignmentOptions.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Assignment</span>
                  <select
                    value={selectedAssignmentId ?? ""}
                    onChange={(e) => setSelectedAssignmentId(Number(e.target.value) || null)}
                    className="min-w-[220px] px-3 py-2 border border-gray-200 rounded-lg text-[13px] text-[#2B2A2A] bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]/30 focus:border-[#5A7ACD] focus:bg-white"
                  >
                    <option value="">Select assignment</option>
                    {assignmentOptions.map((a) => (
                      <option key={a.assignmentId} value={a.assignmentId}>
                        {a.assignmentName}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {viewMode === "assignment" && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Status</span>
                  <SegmentedFilter
                    items={[
                      { id: "all" as const, label: "All" },
                      { id: "NOT_SUBMITTED" as const, label: "Not submitted" },
                      { id: "SUBMITTED" as const, label: "Submitted" },
                      { id: "GRADED" as const, label: "Graded" },
                    ]}
                    value={statusFilter}
                    onValueChange={(v) => setStatusFilter(v)}
                  />
                </div>
              )}
              <div className="flex-1 min-w-[180px] max-w-[280px] relative ml-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" strokeWidth={2} />
                <input
                  type="text"
                  placeholder="Search students…"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-[13px] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]/30 focus:border-[#5A7ACD] bg-gray-50/50 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {viewMode === "course" && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] border-collapse">
                  <thead>
                    <tr className="border-b-2 border-gray-200 bg-[#F8F9FB]">
                      <th className="text-left px-5 py-4 text-[12px] font-semibold text-gray-600 uppercase tracking-wide sticky left-0 bg-[#F8F9FB] z-10 min-w-[200px] shadow-[2px_0_4px_-2px_rgba(0,0,0,0.06)] border-r border-gray-200">
                        Student
                      </th>
                      {assignmentOptions.map((a) => (
                        <th
                          key={a.assignmentId}
                          className="text-left px-4 py-4 text-[12px] font-semibold text-gray-600 min-w-[140px] max-w-[220px] align-top border-r border-gray-200 last:border-r-0"
                        >
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="block line-clamp-3 text-gray-700 cursor-help py-0.5">
                                {a.assignmentName}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-[320px] text-left whitespace-normal">
                              {a.assignmentName}
                            </TooltipContent>
                          </Tooltip>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudentsCourse.length === 0 ? (
                      <tr>
                        <td
                          colSpan={(assignmentOptions.length ?? 0) + 1}
                          className="px-5 py-12 text-center"
                        >
                          <p className="text-[14px] text-gray-500">No students match the current filters.</p>
                          <p className="text-[12px] text-gray-400 mt-1">Try changing the search or status filter.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredStudentsCourse.map((student, idx) => (
                        <tr
                          key={student.studentId}
                          className={`border-b border-gray-100 transition-colors hover:bg-[#F8F9FB]/80 ${idx % 2 === 1 ? "bg-gray-50/40" : ""}`}
                        >
                          <td className="px-5 py-3.5 text-[13px] font-medium text-[#2B2A2A] sticky left-0 bg-inherit z-10 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.04)] border-r border-gray-200">
                            <Link
                              to={`/faculty/class/${classId || "1"}/students/${student.studentId}`}
                              className="hover:text-[#5A7ACD] transition-colors"
                            >
                              {student.studentName}
                            </Link>
                          </td>
                          {student.assignments.map((a) => (
                            <td key={a.assignmentId} className="px-4 py-3.5 border-r border-gray-200 last:border-r-0">
                              <GradeCell assignment={a} statusLabel={statusLabel} />
                            </td>
                          ))}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {viewMode === "assignment" && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              {assignmentReportLoading ? (
                <div className="p-12 flex flex-col items-center justify-center gap-3 text-[13px] text-gray-600">
                  <RefreshCcw className="w-8 h-8 text-gray-400 animate-spin" strokeWidth={2} />
                  <span>Loading assignment grades…</span>
                </div>
              ) : assignmentReport && selectedAssignmentId != null ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b-2 border-gray-200 bg-[#F8F9FB]">
                        <th className="text-left px-5 py-4 text-[12px] font-semibold text-gray-600 uppercase tracking-wide min-w-[200px] border-r border-gray-200">
                          Student
                        </th>
                        <th className="text-right px-5 py-4 text-[12px] font-semibold text-gray-600 uppercase tracking-wide w-24 border-r border-gray-200">
                          Score
                        </th>
                        <th className="text-right px-5 py-4 text-[12px] font-semibold text-gray-600 uppercase tracking-wide w-20 border-r border-gray-200">
                          Max
                        </th>
                        <th className="text-left px-5 py-4 text-[12px] font-semibold text-gray-600 uppercase tracking-wide w-32">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudentsAssignment.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-5 py-12 text-center">
                            <p className="text-[14px] text-gray-500">No students match the current filters.</p>
                            <p className="text-[12px] text-gray-400 mt-1">Try a different search.</p>
                          </td>
                        </tr>
                      ) : (
                        filteredStudentsAssignment.map((s, idx) => (
                          <tr
                            key={s.studentId}
                            className={`border-b border-gray-100 transition-colors hover:bg-[#F8F9FB]/80 ${idx % 2 === 1 ? "bg-gray-50/40" : ""}`}
                          >
                            <td className="px-5 py-3.5 text-[13px] font-medium text-[#2B2A2A] border-r border-gray-200">
                              {s.studentName}
                            </td>
                            <td className="px-5 py-3.5 text-right text-[13px] font-medium text-[#2B2A2A] border-r border-gray-200">
                              {s.score != null ? s.score.toFixed(2) : "—"}
                            </td>
                            <td className="px-5 py-3.5 text-right text-[13px] text-gray-600 border-r border-gray-200">
                              {s.maxScore.toFixed(1)}
                            </td>
                            <td className="px-5 py-3.5">
                              <StatusPill status={s.status} statusLabel={statusLabel} />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-12 text-center">
                  <p className="text-[14px] text-gray-500">Select an assignment above to view grades by student.</p>
                </div>
              )}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}

function GradeCell({
  assignment,
  statusLabel,
}: {
  assignment: { score: number | null; maxScore: number; status: string };
  statusLabel: Record<string, string>;
}) {
  const max = Number.isFinite(assignment.maxScore) ? assignment.maxScore : 0;
  const score = assignment.score;
  const displayScore =
    score != null && Number.isFinite(score)
      ? score.toFixed(2)
      : assignment.status === "GRADED"
        ? "—"
        : "—";
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[13px] text-[#2B2A2A] tabular-nums">
        {max > 0 ? `${displayScore} / ${max.toFixed(1)}` : displayScore}
      </span>
      <StatusPill status={assignment.status} statusLabel={statusLabel} />
    </div>
  );
}

function StatusPill({
  status,
  statusLabel,
}: {
  status: string;
  statusLabel: Record<string, string>;
}) {
  const label = statusLabel[status] ?? status;
  const style =
    status === "GRADED"
      ? "bg-emerald-100 text-emerald-800"
      : status === "SUBMITTED"
        ? "bg-amber-100 text-amber-800"
        : "bg-gray-100 text-gray-600";
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium w-fit ${style}`}
    >
      {label}
    </span>
  );
}

/** Parse a file (CSV or plain text) into rows of { name, email }. Supports "name,email" or "email,name" or one email per line. */
function parseStudentFile(text: string): { name: string; email: string }[] {
  const rows: { name: string; email: string }[] = [];
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    const parts = line.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      const hasEmail = (s: string) => /@/.test(s);
      const emailPart = parts.find(hasEmail);
      const namePart = parts.find((p) => !hasEmail(p)) ?? parts[0];
      if (emailPart) {
        rows.push({ name: namePart === emailPart ? emailPart : namePart, email: emailPart });
      }
    } else if (parts.length === 1 && /@/.test(parts[0])) {
      rows.push({ name: parts[0], email: parts[0] });
    }
  }
  return rows;
}

const SAMPLE_STUDENT_CSV = `name,email
Jane Doe,jane.doe@example.edu
John Smith,john.smith@example.edu
Alex Johnson,alex.johnson@example.edu`;

function downloadSampleStudentCsv(): void {
  const blob = new Blob([SAMPLE_STUDENT_CSV], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "student_roster_template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

type AddStudentMode = "choice" | "manual" | "csv";

function StudentGradesModal({
  student,
  studentReport,
  isLoading,
  errorMessage,
  onClose,
}: {
  student: FacultyRosterStudentRow | null;
  studentReport: CourseGradeReportStudent | null;
  isLoading: boolean;
  errorMessage: string | null;
  onClose: () => void;
}) {
  if (!student) {
    return null;
  }

  const statusLabel: Record<string, string> = {
    NOT_SUBMITTED: "Not submitted",
    SUBMITTED: "Submitted",
    GRADED: "Graded",
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/35 p-4" onClick={onClose}>
      <div
        className="flex max-h-[calc(100vh-2rem)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-6 py-5">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#8D97AC]">Student grades</p>
            <h3 className="mt-1 text-[22px] font-semibold text-[#2B2A2A]">{student.name}</h3>
            <p className="mt-1 text-[13px] text-[#5D6A80]">{student.email}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-[#2B2A2A]"
            aria-label="Close student grades"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {errorMessage ? (
            <div className="mb-5 rounded-xl border border-[#F2C9CC] bg-[#FFF5F5] px-4 py-3 text-[13px] text-[#C23A42]">
              {errorMessage}
            </div>
          ) : null}

          <div className="overflow-hidden rounded-xl border border-gray-200">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-4 py-3 text-[12px] font-semibold uppercase tracking-wide text-gray-600">Assignment</th>
                  <th className="px-4 py-3 text-[12px] font-semibold uppercase tracking-wide text-gray-600">Score</th>
                  <th className="px-4 py-3 text-[12px] font-semibold uppercase tracking-wide text-gray-600">Max score</th>
                  <th className="px-4 py-3 text-[12px] font-semibold uppercase tracking-wide text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <tr key={`student-grade-skeleton-${index}`} className="border-t border-gray-100">
                      <td className="px-4 py-4"><div className="h-4 w-36 animate-pulse rounded bg-gray-200" /></td>
                      <td className="px-4 py-4"><div className="h-4 w-20 animate-pulse rounded bg-gray-200" /></td>
                      <td className="px-4 py-4"><div className="h-4 w-16 animate-pulse rounded bg-gray-200" /></td>
                      <td className="px-4 py-4"><div className="h-6 w-20 animate-pulse rounded-md bg-gray-100" /></td>
                    </tr>
                  ))
                ) : studentReport?.assignments.length ? (
                  studentReport.assignments.map((assignment) => (
                    <tr key={assignment.assignmentId} className="border-t border-gray-100">
                      <td className="px-4 py-4 text-[13px] font-medium text-[#2B2A2A]">{assignment.assignmentName}</td>
                      <td className="px-4 py-4 text-[13px] text-[#2B2A2A]">
                        {assignment.score != null ? assignment.score.toFixed(2) : "—"}
                      </td>
                      <td className="px-4 py-4 text-[13px] text-gray-600">{assignment.maxScore.toFixed(1)}</td>
                      <td className="px-4 py-4">
                        <StatusPill status={assignment.status} statusLabel={statusLabel} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-[13px] text-gray-600">
                      No assignment grades found for this student.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}


function StudentsSection({
  isAddStudentModalOpen,
  onCloseAddStudentModal,
}: {
  isAddStudentModalOpen: boolean;
  onCloseAddStudentModal: () => void;
}) {
  const { classId } = useParams();
  const resolvedId = classId || "1";

  // NOTE: Main page search only filters existing roster rows.
  const [rosterRows, setRosterRows] = useState<FacultyRosterStudentRow[]>([]);
  const [activeFilter, setActiveFilter] = useState<RosterFilter>("all");
  const [rosterSearchValue, setRosterSearchValue] = useState("");
  const [isRosterLoading, setIsRosterLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [avgMode, setAvgMode] = useState<"gradedOnly" | "includeMissing">("gradedOnly");

  // NOTE: Add-student flow is isolated in modal state so it does not interfere with roster filtering.
  const [lookupEmail, setLookupEmail] = useState("");
  const [lookupResult, setLookupResult] = useState<FacultyStudentSearchResult | null>(null);
  const [isLookupLoading, setIsLookupLoading] = useState(false);
  const [isEnrollLoading, setIsEnrollLoading] = useState(false);
  const [isSuggestionLoading, setIsSuggestionLoading] = useState(false);
  const [emailSuggestions, setEmailSuggestions] = useState<FacultyStudentEmailSuggestion[]>([]);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ tone: "success" | "error" | "info"; text: string } | null>(null);
  const [dropConfirm, setDropConfirm] = useState<FacultyRosterStudentRow | null>(null);
  const [dropping, setDropping] = useState(false);
  const [dropError, setDropError] = useState<string | null>(null);
  const [selectedGradeStudent, setSelectedGradeStudent] = useState<FacultyRosterStudentRow | null>(null);
  const [studentGradeReport, setStudentGradeReport] = useState<CourseGradeReportResponse | null>(null);
  const [isStudentGradeReportLoading, setIsStudentGradeReportLoading] = useState(false);
  const [studentGradeReportError, setStudentGradeReportError] = useState<string | null>(null);

  // Add student modal mode: choice → manual search or csv file
  const [addMode, setAddMode] = useState<AddStudentMode>("choice");

  // Add students from file: parsed rows and batch enroll results
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [parsedFileRows, setParsedFileRows] = useState<{ name: string; email: string }[] | null>(null);
  const [fileImportResults, setFileImportResults] = useState<{ email: string; name: string; status: "success" | "error"; message?: string }[]>([]);
  const [isFileImporting, setIsFileImporting] = useState(false);

  const courseId = useMemo(() => Number(resolvedId) || 0, [resolvedId]);

  const loadRoster = async () => {
    setIsRosterLoading(true);
    setErrorMessage(null);
    try {
      const rows = await listFacultyRosterRows(resolvedId);
      setRosterRows(rows);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsRosterLoading(false);
    }
  };

  const handleOpenStudentGrades = async (student: FacultyRosterStudentRow) => {
    if (courseId <= 0) {
      return;
    }

    setSelectedGradeStudent(student);
    setIsStudentGradeReportLoading(true);
    setStudentGradeReportError(null);
    try {
      // NOTE: Reuse the course grade report endpoint so the roster modal stays aligned with the main grades page data source.
      const report = await getCourseGradeReport(courseId);
      setStudentGradeReport(report);
    } catch (error) {
      setStudentGradeReport(null);
      setStudentGradeReportError(getErrorMessage(error));
    } finally {
      setIsStudentGradeReportLoading(false);
    }
  };

  const resetAddStudentState = () => {
    setAddMode("choice");
    setLookupEmail("");
    setLookupResult(null);
    setEmailSuggestions([]);
    setSuggestionError(null);
    setFeedbackMessage(null);
    setIsSuggestionLoading(false);
    setIsLookupLoading(false);
    setIsEnrollLoading(false);
    setParsedFileRows(null);
    setFileImportResults([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const closeAddStudentModal = () => {
    resetAddStudentState();
    onCloseAddStudentModal();
  };

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const rows = parseStudentFile(text);
      setParsedFileRows(rows);
      setFileImportResults([]);
    };
    reader.readAsText(file, "UTF-8");
    event.target.value = "";
  }, []);

  const handleEnrollFromFile = useCallback(async () => {
    if (!parsedFileRows?.length) return;
    setIsFileImporting(true);
    setFileImportResults([]);
    const results: { email: string; name: string; status: "success" | "error"; message?: string }[] = [];
    for (const row of parsedFileRows) {
      try {
        await enrollStudentByEmail(resolvedId, row.email);
        results.push({ email: row.email, name: row.name, status: "success" });
      } catch (err) {
        results.push({ email: row.email, name: row.name, status: "error", message: getErrorMessage(err) });
      }
    }
    setFileImportResults(results);
    setIsFileImporting(false);
    await loadRoster();
  }, [parsedFileRows, resolvedId]);

  useEffect(() => {
    void loadRoster();
  }, [resolvedId]);

  const handleDropConfirm = async () => {
    if (!dropConfirm?.studentId || !courseId) return;
    setDropping(true);
    setDropError(null);
    try {
      await dropStudentFromCourse(dropConfirm.studentId, courseId);
      setDropConfirm(null);
      await loadRoster();
    } catch (error) {
      setDropError(getErrorMessage(error));
    } finally {
      setDropping(false);
    }
  };

  useEffect(() => {
    if (!isAddStudentModalOpen || addMode !== "manual") {
      return;
    }

    const trimmedQuery = lookupEmail.trim();
    if (trimmedQuery.length < 1) {
      setEmailSuggestions([]);
      setIsSuggestionLoading(false);
      setSuggestionError(null);
      return;
    }

    let isCancelled = false;
    // NOTE: Debounced typeahead avoids firing a backend request on every single keystroke.
    const timer = window.setTimeout(async () => {
      setIsSuggestionLoading(true);
      setSuggestionError(null);
      try {
        const suggestions = await listFacultyStudentEmailSuggestions(resolvedId, trimmedQuery);
        if (!isCancelled) {
          setEmailSuggestions(suggestions);
        }
      } catch (error) {
        if (!isCancelled) {
          setEmailSuggestions([]);
          // FIX: Show suggestion fetch errors instead of silently hiding them to make debugging easier.
          setSuggestionError(getErrorMessage(error));
        }
      } finally {
        if (!isCancelled) {
          setIsSuggestionLoading(false);
        }
      }
    }, 200);

    return () => {
      isCancelled = true;
      window.clearTimeout(timer);
    };
  }, [isAddStudentModalOpen, addMode, lookupEmail, resolvedId]);

  const getDisplayedAvgScore = useCallback(
    (row: FacultyRosterStudentRow): number => {
      if (avgMode === "includeMissing") {
        return row.avgScoreIncludingMissing ?? row.avgScore;
      }
      return row.avgScoreGradedOnly ?? row.avgScore;
    },
    [avgMode],
  );

  const rosterStats: FacultyRosterStats = useMemo(() => {
    const totalStudents = rosterRows.length;
    const activeStudents = rosterRows.filter((row) => row.status === "active").length;
    const inactiveStudents = rosterRows.filter((row) => row.status === "inactive").length;
    const avgScore =
      totalStudents > 0
        ? Math.round(rosterRows.reduce((sum, row) => sum + getDisplayedAvgScore(row), 0) / totalStudents)
        : 0;
    const completion =
      totalStudents > 0
        ? Math.round(rosterRows.reduce((sum, row) => sum + row.completionPercent, 0) / totalStudents)
        : 0;
    return {
      totalStudents,
      activeStudents,
      inactiveStudents,
      avgScore,
      completion,
    };
  }, [rosterRows, getDisplayedAvgScore]);

  const filterItems = useMemo<SegmentedFilterItem<RosterFilter>[]>(() => {
    const activeCount = rosterRows.filter((row) => row.status === "active").length;
    const inactiveCount = rosterRows.filter((row) => row.status === "inactive").length;
    const unassignedCount = rosterRows.filter((row) => row.status === "unassigned").length;
    return [
      { id: "all", label: "All", count: rosterRows.length },
      { id: "active", label: "Active", count: activeCount },
      { id: "inactive", label: "Inactive", count: inactiveCount },
      { id: "unassigned", label: "Unassigned", count: unassignedCount },
    ];
  }, [rosterRows]);

  const filteredRows = useMemo(() => {
    const normalizedQuery = rosterSearchValue.trim().toLowerCase();
    return rosterRows.filter((row) => {
      const filterMatches = activeFilter === "all" ? true : row.status === activeFilter;
      if (!filterMatches) {
        return false;
      }
      if (!normalizedQuery) {
        return true;
      }
      return row.name.toLowerCase().includes(normalizedQuery) || row.email.toLowerCase().includes(normalizedQuery);
    });
  }, [activeFilter, rosterRows, rosterSearchValue]);

  const selectedStudentGradeRow = useMemo(() => {
    if (!selectedGradeStudent || !studentGradeReport) {
      return null;
    }

    return (
      studentGradeReport.students.find((student) => selectedGradeStudent.studentId != null && student.studentId === selectedGradeStudent.studentId) ??
      studentGradeReport.students.find((student) => student.studentName.trim().toLowerCase() === selectedGradeStudent.name.trim().toLowerCase()) ??
      null
    );
  }, [selectedGradeStudent, studentGradeReport]);

  useEffect(() => {
    if (!selectedGradeStudent) {
      return;
    }

    // FIX: Lock background page scroll while the student grade modal is open so wheel and trackpad scrolling stay inside the dialog.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedGradeStudent]);

  const handleLookup = async (suggestedEmail?: string) => {
    const resolvedEmail = (suggestedEmail ?? lookupEmail).trim();
    if (!resolvedEmail) {
      setLookupResult(null);
      setFeedbackMessage({ tone: "error", text: "Enter a student email to search." });
      return;
    }

    setLookupEmail(resolvedEmail);
    setSuggestionError(null);
    setIsLookupLoading(true);
    setFeedbackMessage(null);
    try {
      const result = await searchFacultyStudentByEmail(resolvedId, resolvedEmail);
      setLookupResult(result);
      if (!result.canEnroll) {
        setFeedbackMessage({ tone: "info", text: result.reason });
      }
    } catch (error) {
      setLookupResult(null);
      const statusCode = (error as { response?: { status?: number } })?.response?.status;
      // FIX: Convert lookup 400 responses into user-friendly not-found feedback instead of raw transport-style error text.
      if (statusCode === 400) {
        setFeedbackMessage({ tone: "info", text: "User not found." });
      } else {
        setFeedbackMessage({ tone: "error", text: getErrorMessage(error) });
      }
    } finally {
      setIsLookupLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!lookupResult?.studentEmail) {
      return;
    }

    setIsEnrollLoading(true);
    setFeedbackMessage(null);
    try {
      await enrollStudentByEmail(resolvedId, lookupResult.studentEmail);
      setFeedbackMessage({ tone: "success", text: `${lookupResult.studentName} was enrolled successfully.` });
      await loadRoster();
      closeAddStudentModal();
    } catch (error) {
      setFeedbackMessage({ tone: "error", text: getErrorMessage(error) });
    } finally {
      setIsEnrollLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-[18px] font-semibold text-[#2B2A2A]">Student Roster</h2>
        {/* CLEANUP: Removed extra helper sentence under Student Roster heading per current UI copy direction. */}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-5">
        <div className="flex flex-wrap items-center gap-3 md:flex-nowrap">
          <div className="relative w-full md:w-auto md:flex-1 md:max-w-[460px]">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" strokeWidth={2} />
            <input
              value={rosterSearchValue}
              onChange={(event) => setRosterSearchValue(event.target.value)}
              type="text"
              placeholder="Search students in this class by name or email..."
              className="w-full h-11 rounded-xl border border-gray-300 bg-white pl-10 pr-3 text-[14px] text-[#2B2A2A] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]/25"
            />
          </div>
          <SegmentedFilter
            className="md:ml-1"
            items={filterItems}
            value={activeFilter}
            onValueChange={(value) => setActiveFilter(value)}
          />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Avg mode</span>
          <SegmentedFilter
            items={[
              { id: "gradedOnly" as const, label: "Graded only" },
              { id: "includeMissing" as const, label: "Include missing as 0" },
            ]}
            value={avgMode}
            onValueChange={(value) => setAvgMode(value)}
          />
        </div>
      </div>

      {errorMessage ? (
        <div className="mb-4 rounded-xl border border-[#F2C9CC] bg-[#FFF5F5] p-3 text-[13px] text-[#C23A42]">
          {errorMessage}
        </div>
      ) : null}

      <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
        <table className="w-full min-w-[980px]">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-4 py-3 w-10">
                <input type="checkbox" className="rounded border-gray-300 text-[#5A7ACD] focus:ring-[#5A7ACD]" />
              </th>
              <th className="text-left px-4 py-3 text-[12px] font-semibold text-gray-600 uppercase tracking-wide">Student</th>
              <th className="text-left px-4 py-3 text-[12px] font-semibold text-gray-600 uppercase tracking-wide">Email</th>
              <th className="text-left px-4 py-3 text-[12px] font-semibold text-gray-600 uppercase tracking-wide">Status</th>
              <th className="text-left px-4 py-3 text-[12px] font-semibold text-gray-600 uppercase tracking-wide">Group</th>
              <th className="text-left px-4 py-3 text-[12px] font-semibold text-gray-600 uppercase tracking-wide">Progress</th>
              <th className="text-left px-4 py-3 text-[12px] font-semibold text-gray-600 uppercase tracking-wide">Avg Score</th>
              <th className="text-left px-4 py-3 text-[12px] font-semibold text-gray-600 uppercase tracking-wide">Last Activity</th>
              <th className="text-right px-4 py-3 text-[12px] font-semibold text-gray-600 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isRosterLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <tr key={`faculty-roster-skeleton-${index}`} className="border-b border-gray-100 last:border-b-0">
                  {/* NOTE: Skeleton roster rows keep full table structure visible while roster data is fetching. */}
                  <td className="px-4 py-4">
                    <div className="h-4 w-4 rounded bg-gray-200 animate-pulse" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="space-y-2 animate-pulse">
                      <div className="h-4 w-28 rounded bg-gray-200" />
                      <div className="h-3 w-24 rounded bg-gray-200" />
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-4 w-40 rounded bg-gray-200 animate-pulse" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-6 w-16 rounded-md bg-gray-100 animate-pulse" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-4 w-20 rounded bg-gray-200 animate-pulse" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="space-y-2 animate-pulse">
                      <div className="h-2 w-28 rounded-full bg-gray-100" />
                      <div className="h-3 w-20 rounded bg-gray-200" />
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-4 w-10 rounded bg-gray-200 animate-pulse" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-4 w-20 rounded bg-gray-200 animate-pulse" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <div className="h-7 w-7 rounded-lg bg-gray-100 animate-pulse" />
                      <div className="h-7 w-7 rounded-lg bg-gray-100 animate-pulse" />
                      <div className="h-7 w-7 rounded-lg bg-gray-100 animate-pulse" />
                    </div>
                  </td>
                </tr>
              ))
            ) : filteredRows.length > 0 ? (
              filteredRows.map((student) => (
                <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4">
                    <input type="checkbox" className="rounded border-gray-300 text-[#5A7ACD] focus:ring-[#5A7ACD]" />
                  </td>
                  <td className="px-4 py-4">
                    {student.studentId != null ? (
                      <Link
                        to={`/faculty/class/${resolvedId}/students/${student.studentId}`}
                        className="text-[14px] font-medium text-[#2B2A2A] hover:text-[#5A7ACD] transition-colors"
                      >
                        {student.name}
                      </Link>
                    ) : (
                      <p className="text-[14px] font-medium text-[#2B2A2A]">{student.name}</p>
                    )}
                    <p className="text-[12px] text-gray-500 mt-1">{student.enrolledLabel}</p>
                  </td>
                  <td className="px-4 py-4">
                    <a href={`mailto:${student.email}`} className="text-[13px] text-[#5D6A80] hover:text-[#5A7ACD] transition-colors">
                      {student.email}
                    </a>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-md text-[12px] font-medium ${
                        student.status === "active"
                          ? "bg-green-50 text-green-600"
                          : student.status === "inactive"
                            ? "bg-gray-100 text-gray-600"
                            : "bg-[#F4F5F9] text-[#5D6A80]"
                      }`}
                    >
                      {student.status === "active" ? "Active" : student.status === "inactive" ? "Inactive" : "Unassigned"}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-[13px] text-gray-700">{student.group}</span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="w-28 h-2 bg-gray-100 rounded-full overflow-hidden mb-1">
                      <div className="h-full bg-[#5A7ACD]" style={{ width: `${Math.min(100, student.completionPercent)}%` }} />
                    </div>
                    <p className="text-[12px] text-[#5D6A80]">
                      {student.progressSubmitted}/{student.progressTotal} submitted
                    </p>
                  </td>
                  <td className="px-4 py-4 text-[13px] font-semibold text-[#2B2A2A]">
                    {getDisplayedAvgScore(student)}%
                  </td>
                  <td className="px-4 py-4 text-[13px] text-gray-600">{student.lastActivity}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        aria-label="View student grades"
                        onClick={() => void handleOpenStudentGrades(student)}
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <BarChart3 className="w-4 h-4 text-gray-500" strokeWidth={2} />
                      </button>
                      <button aria-label="Email student" className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                        <Mail className="w-4 h-4 text-gray-500" strokeWidth={2} />
                      </button>
                      <button
                        aria-label="Drop student from course"
                        onClick={() => student.studentId != null && setDropConfirm(student)}
                        disabled={student.studentId == null}
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <UserMinus className="w-4 h-4 text-gray-500" strokeWidth={2} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} className="px-6 py-6 text-center text-[13px] text-gray-600">
                  No students found for this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedGradeStudent ? (
        <StudentGradesModal
          student={selectedGradeStudent}
          studentReport={selectedStudentGradeRow}
          isLoading={isStudentGradeReportLoading}
          errorMessage={studentGradeReportError}
          onClose={() => {
            // CLEANUP: Reset modal-scoped grade report state when the student grade view closes.
            setSelectedGradeStudent(null);
            setStudentGradeReportError(null);
          }}
        />
      ) : null}

      {isAddStudentModalOpen ? (
        <div className="fixed inset-0 z-40 bg-black/35 flex items-center justify-center p-4" onClick={closeAddStudentModal}>
          <div
            className="w-full max-w-3xl rounded-2xl border border-gray-200 bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                {addMode !== "choice" ? (
                  <button
                    type="button"
                    onClick={() => setAddMode("choice")}
                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                    aria-label="Back to add options"
                  >
                    <ChevronLeft className="w-4 h-4 text-gray-500" strokeWidth={2} />
                  </button>
                ) : null}
                <h3 className="text-[18px] font-semibold text-[#2B2A2A]">Add Student</h3>
              </div>
              <button
                type="button"
                onClick={closeAddStudentModal}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Close add student dialog"
              >
                <X className="w-4 h-4 text-gray-500" strokeWidth={2} />
              </button>
            </div>

            <div className="p-5">
              {addMode === "choice" ? (
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    type="button"
                    onClick={() => setAddMode("manual")}
                    className="flex-1 flex flex-col items-start gap-2 p-5 rounded-xl border border-gray-200 bg-white hover:bg-[#F9FAFC] hover:border-[#5A7ACD]/30 transition-colors text-left"
                  >
                    <div className="p-2.5 rounded-lg bg-[#5A7ACD]/10">
                      <Search className="w-5 h-5 text-[#5A7ACD]" strokeWidth={2} />
                    </div>
                    <h4 className="text-[15px] font-semibold text-[#2B2A2A]">Add students manually</h4>
                    <p className="text-[13px] text-gray-600">Search by email, name, or CWID to add one student at a time</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddMode("csv")}
                    className="flex-1 flex flex-col items-start gap-2 p-5 rounded-xl border border-gray-200 bg-white hover:bg-[#F9FAFC] hover:border-[#5A7ACD]/30 transition-colors text-left"
                  >
                    <div className="p-2.5 rounded-lg bg-[#5A7ACD]/10">
                      <FileUp className="w-5 h-5 text-[#5A7ACD]" strokeWidth={2} />
                    </div>
                    <h4 className="text-[15px] font-semibold text-[#2B2A2A]">Add from CSV file</h4>
                    <p className="text-[13px] text-gray-600">Upload a CSV with student information to add multiple students</p>
                  </button>
                </div>
              ) : addMode === "manual" ? (
                <>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[260px]">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" strokeWidth={2} />
                  <input
                    value={lookupEmail}
                    onChange={(event) => {
                      setLookupEmail(event.target.value);
                      setLookupResult(null);
                      setSuggestionError(null);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void handleLookup();
                      }
                    }}
                    type="text"
                    // NOTE: Teammate search supports email, name, and CWID keywords.
                    placeholder="Search by email, name, or CWID..."
                    className="w-full h-11 rounded-xl border border-gray-300 bg-white pl-10 pr-3 text-[14px] text-[#2B2A2A] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]/25"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => void handleLookup()}
                  disabled={isLookupLoading}
                  className="h-11 px-4 rounded-xl bg-[#2B2A2A] text-white text-[13px] font-medium hover:bg-[#3a3939] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isLookupLoading ? "Searching..." : "Search Email"}
                </button>
              </div>

              {lookupEmail.trim().length >= 1 ? (
                // NOTE: Suggestions now render in normal flow under the search row so modal grows naturally.
                <div className="mt-3 overflow-hidden rounded-xl border border-gray-200 bg-white">
                  {isSuggestionLoading ? (
                    <div className="px-3 py-2.5 space-y-2 animate-pulse">
                      {/* NOTE: Suggestion skeleton avoids a blank modal body during live-search fetches. */}
                      <div className="h-4 w-full rounded bg-gray-200" />
                      <div className="h-4 w-[88%] rounded bg-gray-200" />
                    </div>
                  ) : emailSuggestions.length > 0 ? (
                    emailSuggestions.map((suggestion) => (
                      <button
                        key={suggestion.email}
                        type="button"
                        onClick={() => {
                          setLookupEmail(suggestion.email);
                          void handleLookup(suggestion.email);
                        }}
                        className="w-full px-3 py-2.5 text-left hover:bg-[#F4F6FB] transition-colors border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" strokeWidth={2} />
                            <div className="min-w-0">
                              <p className="truncate text-[13px] font-medium text-[#2B2A2A]">{suggestion.name}</p>
                              <p className="truncate text-[12px] text-[#5D6A80]">{suggestion.email}</p>
                              <p className="truncate text-[11px] text-[#7A8599]">
                                CWID: {suggestion.cwid} • Major: {suggestion.major} • Canvas: {suggestion.canvasUserId}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`text-[11px] px-2 py-0.5 rounded-full ${
                              suggestion.alreadyInCourse
                                ? "bg-[#EEF2FA] text-[#5D6A80]"
                                : "bg-[#EAF8EE] text-[#219653]"
                            }`}
                          >
                            {suggestion.alreadyInCourse ? "Already in class" : "Can add"}
                          </span>
                        </div>
                      </button>
                    ))
                  ) : suggestionError ? (
                    <p className="px-3 py-2 text-[12px] text-[#C23A42]">{suggestionError}</p>
                  ) : (
                    <p className="px-3 py-2 text-[12px] text-gray-500">No matching student emails.</p>
                  )}
                </div>
              ) : null}

              {lookupResult ? (
                <div className="mt-4 rounded-xl border border-gray-200 bg-[#F9FAFC] px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[14px] font-semibold text-[#2B2A2A]">{lookupResult.studentName}</p>
                    <p className="text-[13px] text-gray-600">{lookupResult.studentEmail}</p>
                    {/* NOTE: Detailed profile fields are shown here so faculty can confirm the correct student before enrolling. */}
                    <p className="mt-1 text-[12px] text-[#5D6A80]">
                      CWID: {lookupResult.cwid} • Major: {lookupResult.major} • Canvas: {lookupResult.canvasUserId}
                    </p>
                    <p className="text-[12px] text-[#5D6A80]">Status: {lookupResult.currentStatus}</p>
                    <p className="text-[12px] text-gray-500 mt-1">{lookupResult.reason}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleEnroll()}
                    disabled={!lookupResult.canEnroll || isEnrollLoading}
                    className="h-10 px-4 rounded-lg bg-[#5A7ACD] text-white text-[13px] font-medium hover:bg-[#4e6fbd] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isEnrollLoading ? "Enrolling..." : "Enroll"}
                  </button>
                </div>
              ) : null}

              {feedbackMessage ? (
                <p
                  className={`mt-3 text-[13px] ${
                    feedbackMessage.tone === "success"
                      ? "text-green-700"
                      : feedbackMessage.tone === "error"
                        ? "text-red-600"
                        : "text-[#5D6A80]"
                  }`}
                >
                  {feedbackMessage.text}
                </p>
              ) : null}
                </>
              ) : (
                <div className="overflow-y-auto max-h-[70vh]">
                  <p className="text-[13px] text-gray-600 mb-3">
                    Upload a CSV or text file with one student per line. Use <strong>name, email</strong> or <strong>email</strong> only. Header row (e.g. &quot;name,email&quot;) is ignored.
                  </p>
                  <button
                    type="button"
                    onClick={downloadSampleStudentCsv}
                    className="flex items-center gap-2 text-[13px] text-[#5A7ACD] hover:underline mb-4"
                  >
                    <Download className="w-4 h-4" strokeWidth={2} />
                    Download sample CSV template
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.txt,text/csv,text/plain"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  {!parsedFileRows ? (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-xl text-[14px] font-medium text-[#2B2A2A] hover:bg-gray-50 transition-colors"
                    >
                      <FileUp className="w-4 h-4" strokeWidth={2} />
                      Choose file
                    </button>
                  ) : (
                    <>
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <span className="text-[13px] text-gray-600">{parsedFileRows.length} student(s) found</span>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-[13px] text-[#5A7ACD] hover:underline"
                        >
                          Choose another file
                        </button>
                      </div>
                      <ul className="mb-4 max-h-48 overflow-y-auto rounded-xl border border-gray-200 divide-y divide-gray-100">
                        {parsedFileRows.map((row, i) => (
                          <li key={i} className="px-3 py-2 flex justify-between items-center text-[13px]">
                            <span className="text-[#2B2A2A]">{row.name}</span>
                            <span className="text-gray-500 truncate ml-2">{row.email}</span>
                          </li>
                        ))}
                      </ul>
                      <button
                        type="button"
                        onClick={() => void handleEnrollFromFile()}
                        disabled={isFileImporting}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#5A7ACD] text-white rounded-xl text-[14px] font-medium hover:bg-[#4e6fbd] disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {isFileImporting ? "Enrolling…" : "Enroll all"}
                      </button>
                      {fileImportResults.length > 0 && (
                        <div className="mt-4 rounded-xl border border-gray-200 divide-y divide-gray-100 max-h-40 overflow-y-auto">
                          {fileImportResults.map((r, i) => (
                            <div key={i} className="px-3 py-2 flex items-center justify-between gap-2 text-[13px]">
                              <span className="truncate text-[#2B2A2A]">{r.name}</span>
                              {r.status === "success" ? (
                                <span className="flex items-center gap-1 text-green-700 shrink-0">
                                  <CheckCircle2 className="w-4 h-4" strokeWidth={2} />
                                  Enrolled
                                </span>
                              ) : (
                                <span className="text-red-600 shrink-0" title={r.message}>{r.message ?? "Failed"}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {dropConfirm !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white shadow-xl p-5">
            <h3 className="text-[16px] font-semibold text-[#2B2A2A]">Drop student from course?</h3>
            <p className="mt-2 text-[14px] text-gray-600">
              <span className="font-medium text-[#2B2A2A]">{dropConfirm.name}</span> will be removed from this course and will no longer have access to course materials or assignments.
            </p>
            {dropError && (
              <p className="mt-2 text-[13px] text-red-600">{dropError}</p>
            )}
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => { setDropConfirm(null); setDropError(null); }}
                disabled={dropping}
                className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-[14px] font-medium text-[#2B2A2A] hover:bg-gray-50 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleDropConfirm()}
                disabled={dropping}
                className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-[14px] font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {dropping ? "Dropping…" : "Drop"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RosterStatCard({
  icon,
  iconBg,
  value,
  label,
}: {
  icon: React.ReactNode;
  iconBg: string;
  value: string;
  label: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 px-4 py-3">
      <div className={`w-9 h-9 rounded-lg ${iconBg} flex items-center justify-center mb-2`}>{icon}</div>
      <p className="text-[30px] leading-none font-semibold text-[#2B2A2A]">{value}</p>
      <p className="text-[13px] text-[#5D6A80] mt-1">{label}</p>
    </div>
  );
}

function AssistantsSection() {
  const { classId } = useParams();
  const courseId = useMemo(() => (classId ? Number(classId) : 0), [classId]);

  const [courseAssistants, setCourseAssistants] = useState<CourseAssistantResponse[]>([]);
  const [gradingAssistants, setGradingAssistants] = useState<GradingAssistantResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedGradingAssistantId, setSelectedGradingAssistantId] = useState<number | "">("");
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [removeConfirm, setRemoveConfirm] = useState<CourseAssistantResponse | null>(null);
  const [removing, setRemoving] = useState(false);
  const [errorDialog, setErrorDialog] = useState<string | null>(null);

  const loadData = useCallback(() => {
    if (!courseId) return;
    setLoading(true);
    Promise.all([
      listCourseAssistants(courseId),
      getAllGradingAssistants(),
    ])
      .then(([assistants, grading]) => {
        setCourseAssistants(assistants);
        setGradingAssistants(grading);
      })
      .catch(() => {
        setCourseAssistants([]);
        setGradingAssistants([]);
      })
      .finally(() => setLoading(false));
  }, [courseId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const assignedGradingIds = useMemo(
    () => new Set(courseAssistants.map((a) => a.gradingAssistantId)),
    [courseAssistants]
  );
  const availableToAssign = useMemo(
    () => gradingAssistants.filter((g) => !assignedGradingIds.has(g.id)),
    [gradingAssistants, assignedGradingIds]
  );

  const handleAssign = async () => {
    if (selectedGradingAssistantId === "" || !courseId) return;
    setAssigning(true);
    setAssignError(null);
    try {
      await assignCourseAssistant({
        courseId,
        gradingAssistantId: selectedGradingAssistantId as number,
      });
      setAssignModalOpen(false);
      setSelectedGradingAssistantId("");
      loadData();
    } catch (err: unknown) {
      setAssignError(getApiErrorMessage(err, "Failed to assign assistant."));
    } finally {
      setAssigning(false);
    }
  };

  const handleRemoveClick = (assistant: CourseAssistantResponse) => {
    setRemoveConfirm(assistant);
  };

  const handleRemoveConfirm = async () => {
    if (!removeConfirm) return;
    setRemoving(true);
    setErrorDialog(null);
    try {
      await removeCourseAssistant(removeConfirm.id);
      setRemoveConfirm(null);
      loadData();
    } catch (err: unknown) {
      setErrorDialog(getApiErrorMessage(err, "Failed to remove assistant."));
    } finally {
      setRemoving(false);
    }
  };

  const formatAssignedAt = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return iso;
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-[18px] font-semibold text-[#2B2A2A] mb-2">Grading Assistants</h2>
          <p className="text-[13px] text-gray-600">
            Assign grading assistants to this course. They can help grade submissions.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setAssignModalOpen(true);
            setAssignError(null);
            setSelectedGradingAssistantId(availableToAssign.length ? availableToAssign[0].id : "");
          }}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 bg-[#5A7ACD] hover:bg-[#4a6abd] disabled:opacity-60 text-white rounded-lg text-[13px] font-medium transition-colors"
        >
          <UserPlus className="w-4 h-4" strokeWidth={2} />
          Assign Assistant
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-[14px] text-gray-600">Loading assistants…</p>
        </div>
      ) : courseAssistants.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
          <p className="text-[14px] text-gray-600 mb-4">
            No grading assistants assigned to this course yet.
          </p>
          <p className="text-[13px] text-gray-500 mb-4">
            Create grading assistants from the dashboard, then assign them here.
          </p>
          <Link
            to="/faculty/grading-assistants"
            className="inline-flex items-center gap-2 text-[13px] font-medium text-[#5A7ACD] hover:text-[#4a6abd]"
          >
            Manage Grading Assistants
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full min-w-[520px]">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-4 text-[12px] font-semibold text-[#2B2A2A] uppercase tracking-wide">
                  Name
                </th>
                <th className="text-left py-3 px-4 text-[12px] font-semibold text-[#2B2A2A] uppercase tracking-wide">
                  Email
                </th>
                <th className="text-left py-3 px-4 text-[12px] font-semibold text-[#2B2A2A] uppercase tracking-wide">
                  Assigned
                </th>
                <th className="text-right py-3 px-4 text-[12px] font-semibold text-[#2B2A2A] uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {courseAssistants.map((row) => (
                <tr key={row.id} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50">
                  <td className="py-3 px-4 text-[14px] text-[#2B2A2A]">
                    {row.gradingAssistantName}
                  </td>
                  <td className="py-3 px-4 text-[14px] text-gray-600">
                    {row.gradingAssistantEmail}
                  </td>
                  <td className="py-3 px-4 text-[13px] text-gray-600">
                    {formatAssignedAt(row.assignedAt)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => handleRemoveClick(row)}
                      className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-[12px] font-medium text-red-600 hover:bg-red-100"
                    >
                      <UserMinus className="w-3.5 h-3.5" strokeWidth={2} />
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Assign modal */}
      {assignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white shadow-xl p-5">
            <h3 className="text-[16px] font-semibold text-[#2B2A2A]">Assign grading assistant</h3>
            <p className="mt-1 text-[13px] text-gray-600">
              Choose an assistant to assign to this course.
            </p>
            {availableToAssign.length === 0 ? (
              <p className="mt-4 text-[13px] text-amber-600">
                {gradingAssistants.length === 0
                  ? "No grading assistants available. Create some from "
                  : "All your grading assistants are already assigned to this course. Create more from "}
                <Link to="/faculty/grading-assistants" className="text-[#5A7ACD] font-medium">
                  Grading Assistants
                </Link>
                .
              </p>
            ) : (
              <>
                <div className="mt-4">
                  <label htmlFor="assistants-select" className="mb-1.5 block text-[13px] font-medium text-[#1F2430]">
                    Assistant
                  </label>
                  <select
                    id="assistants-select"
                    value={selectedGradingAssistantId}
                    onChange={(e) => setSelectedGradingAssistantId(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-[14px] text-[#2B2A2A] focus:border-[#5A7ACD] focus:outline-none focus:ring-1 focus:ring-[#5A7ACD]"
                  >
                    <option value="">Select…</option>
                    {availableToAssign.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} ({g.email})
                      </option>
                    ))}
                  </select>
                </div>
                {assignError && (
                  <p className="mt-2 text-[13px] text-red-600">{assignError}</p>
                )}
              </>
            )}
            <div className="mt-5 flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setAssignModalOpen(false)}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-[14px] font-medium text-[#2B2A2A] hover:bg-gray-50"
              >
                Cancel
              </button>
              {availableToAssign.length > 0 && (
                <button
                  type="button"
                  onClick={handleAssign}
                  disabled={assigning || selectedGradingAssistantId === ""}
                  className="rounded-xl bg-[#5A7ACD] px-4 py-2.5 text-[14px] font-semibold text-white hover:bg-[#4a6abd] disabled:opacity-60"
                >
                  {assigning ? "Assigning…" : "Assign"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Remove confirmation */}
      {removeConfirm !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white shadow-xl p-5">
            <h3 className="text-[16px] font-semibold text-[#2B2A2A]">Remove from course?</h3>
            <p className="mt-2 text-[14px] text-gray-600">
              <span className="font-medium text-[#2B2A2A]">{removeConfirm.gradingAssistantName}</span> will no longer be assigned to this course.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => !removing && setRemoveConfirm(null)}
                disabled={removing}
                className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-[14px] font-medium text-[#2B2A2A] hover:bg-gray-50 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRemoveConfirm}
                disabled={removing}
                className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-[14px] font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {removing ? "Removing…" : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error dialog */}
      {errorDialog !== null && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white shadow-xl p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                <AlertCircle className="h-5 w-5" strokeWidth={2} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-[16px] font-semibold text-[#2B2A2A]">Could not remove assistant</h3>
                <p className="mt-2 text-[14px] text-gray-600 whitespace-pre-wrap">{errorDialog}</p>
              </div>
            </div>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setErrorDialog(null)}
                className="rounded-xl bg-[#5A7ACD] px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-[#4a6abd]"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function GroupsSection() {
  const { classId } = useParams();
  const resolvedClassId = classId ?? "1";
  const [groups, setGroups] = useState<MainGroupResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mainModalOpen, setMainModalOpen] = useState(false);
  const [mainName, setMainName] = useState("");
  const [actionBusy, setActionBusy] = useState(false);

  const loadGroups = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listFacultyCourseGroups(resolvedClassId);
      setGroups(data);
    } catch (err) {
      setError(getErrorMessage(err));
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, [resolvedClassId]);

  useEffect(() => {
    void loadGroups();
  }, [loadGroups]);

  const handleCreateMain = async () => {
    const trimmed = mainName.trim();
    if (!trimmed) {
      return;
    }
    setActionBusy(true);
    setError(null);
    try {
      await createFacultyMainGroup(resolvedClassId, trimmed);
      setMainName("");
      setMainModalOpen(false);
      await loadGroups();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionBusy(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-[18px] font-semibold text-[#2B2A2A] mb-2">Main groups</h2>
          <p className="text-[13px] text-gray-600">
            Open a group to create subgroups and assign students by dragging them from the roster.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void loadGroups()}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-[13px] font-medium text-[#2B2A2A] transition-colors hover:bg-gray-50 disabled:opacity-60"
          >
            <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} strokeWidth={2} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => {
              setMainName("");
              setMainModalOpen(true);
            }}
            className="flex items-center gap-2 rounded-lg bg-[#2B2A2A] px-3.5 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#3a3939]"
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
            New main group
          </button>
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded-lg border border-[#F2C9CC] bg-[#FFF5F5] px-3 py-2 text-[13px] text-[#C23A42]">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="space-y-4">
          {[0, 1].map((i) => (
            <div
              key={`groups-skel-${i}`}
              className="animate-pulse rounded-lg border border-gray-200 bg-white p-5"
            >
              <div className="mb-4 h-5 w-48 rounded bg-gray-200" />
              <div className="h-12 rounded-lg bg-gray-100" />
            </div>
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-10 text-center">
          <UsersRound className="mx-auto mb-3 h-10 w-10 text-gray-300" strokeWidth={1.5} />
          <p className="text-[14px] font-medium text-[#2B2A2A]">No main groups yet</p>
          <p className="mt-1 text-[13px] text-gray-600">
            Create a main group, open it, then add subgroups and drag students in from the list.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {groups.map((main) => {
            const studentTotal = main.subGroups.reduce((acc, s) => acc + s.students.length, 0);
            return (
              <li key={main.id}>
                <Link
                  to={`/faculty/class/${resolvedClassId}/groups/${main.id}`}
                  className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white px-4 py-4 shadow-sm transition-colors hover:border-[#5A7ACD]/40 hover:bg-[#FAFBFF]"
                >
                  <div className="min-w-0">
                    <h3 className="text-[15px] font-semibold text-[#2B2A2A]">{main.name}</h3>
                    <p className="mt-0.5 text-[12px] text-gray-500">
                      {main.subGroups.length} subgroup{main.subGroups.length === 1 ? "" : "s"}
                      <span className="text-gray-300"> · </span>
                      {studentTotal} student{studentTotal === 1 ? "" : "s"} assigned
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 flex-shrink-0 text-gray-400" strokeWidth={2} aria-hidden />
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {mainModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-5 shadow-xl">
            <h3 className="text-[16px] font-semibold text-[#2B2A2A]">New main group</h3>
            <p className="mt-1 text-[13px] text-gray-600">
              Main group names must be unique within this course (for example &ldquo;Lab sections&rdquo; or &ldquo;Project
              teams&rdquo;).
            </p>
            <label className="mt-4 block text-[12px] font-medium text-gray-600" htmlFor="gf-main-group-name">
              Name
            </label>
            <input
              id="gf-main-group-name"
              value={mainName}
              onChange={(e) => setMainName(e.target.value)}
              placeholder="e.g. Project teams"
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-[14px] outline-none ring-[#5A7ACD] focus:ring-2"
            />
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => !actionBusy && setMainModalOpen(false)}
                disabled={actionBusy}
                className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-[14px] font-medium text-[#2B2A2A] hover:bg-gray-50 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleCreateMain()}
                disabled={actionBusy || !mainName.trim()}
                className="flex-1 rounded-xl bg-[#2B2A2A] px-4 py-2.5 text-[14px] font-semibold text-white hover:bg-[#3a3939] disabled:opacity-60"
              >
                {actionBusy ? "Creating…" : "Create"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SettingsSection({ classId }: { classId: string }) {
  const navigate = useNavigate();

  const EMPTY_CLASS_FORM: ClassCreateFormData = {
    name: "",
    courseCode: "",
    section: "",
    description: "",
    imageUrl: "",
    canvasCourseId: "",
    semesterId: "",
    isPublished: false,
    active: true,
  };

  const [isLoading, setIsLoading] = useState(true);
  const [course, setCourse] = useState<CourseApiResponse | null>(null);
  const [semesters, setSemesters] = useState<FacultySemesterOption[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isTogglingActive, setIsTogglingActive] = useState(false);

  const [form, setForm] = useState<ClassCreateFormData>(EMPTY_CLASS_FORM);

  function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
      <div className="flex items-start justify-between gap-4">
        <span className="text-[12px] font-semibold text-gray-600">{label}</span>
        <span className="text-[13px] text-gray-800 text-right break-words">{value}</span>
      </div>
    );
  }

  useEffect(() => {
    let isCancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const [semesterList, courseDetail] = await Promise.all([
          listFacultySemesters(),
          getFacultyCourseDetailsById(classId),
        ]);

        if (isCancelled) return;
        setSemesters(semesterList);
        setCourse(courseDetail);
        setForm({
          name: courseDetail.name ?? "",
          courseCode: courseDetail.courseCode ?? "",
          section: courseDetail.section ?? "",
          description: courseDetail.description ?? "",
          imageUrl: courseDetail.imageUrl ?? "",
          canvasCourseId: courseDetail.canvasCourseId ?? "",
          semesterId: courseDetail.semester?.id ? String(courseDetail.semester.id) : "",
          isPublished: Boolean(courseDetail.isPublished),
          active: Boolean(courseDetail.active),
        });
      } catch (err) {
        if (isCancelled) return;
        setCourse(null);
        setError(getErrorMessage(err));
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      isCancelled = true;
    };
  }, [classId]);

  async function handleSave() {
    setIsSaving(true);
    setError(null);
    try {
      const updated = await updateFacultyCourse(classId, form);
      setCourse(updated);
      setIsEditOpen(false);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleToggleActive() {
    if (!course) return;
    setIsTogglingActive(true);
    setError(null);
    try {
      // Make the change using the same toggle API call.
      await toggleFacultyCourseActive(classId);

      // Re-fetch to avoid any chance of stale UI state.
      const refreshed = await getFacultyCourseDetailsById(classId);
      setCourse(refreshed);

      // Keep edit modal form in sync so the next edit uses latest active state.
      setForm((prev) => ({
        ...prev,
        active: Boolean(refreshed.active),
      }));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsTogglingActive(false);
    }
  }

  async function handleDelete() {
    setIsDeleteConfirmOpen(false);

    setIsDeleting(true);
    setError(null);
    try {
      await deleteFacultyCourse(classId);
      toast.success("Course deleted successfully.");
      navigate("/faculty/my-classes");
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-[18px] font-semibold text-[#2B2A2A] mb-2">Class Settings</h2>
        <p className="text-[13px] text-gray-600">Edit course metadata and control visibility</p>
      </div>

      {error ? (
        <div className="mb-4 rounded-xl border border-[#F3CDD1] bg-[#FDEBEC] px-3 py-2 text-[13px] text-[#C23A42]">
          {error}
        </div>
      ) : null}

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {isLoading || !course ? (
          <p className="text-[14px] text-gray-600">Loading course settings...</p>
        ) : (
          <>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h3 className="text-[18px] font-semibold text-[#2B2A2A] truncate">
                  {course.courseCode}: {course.name}
                </h3>
                <p className="mt-1 text-[13px] text-gray-600">
                  Semester: {course.semester?.name ?? "TBD"} &bull; Section: {course.section ?? "TBD"}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <span
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold ${
                      course.active
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700"
                        : "border-red-500/30 bg-red-500/10 text-red-700"
                    }`}
                  >
                    {course.active ? <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2} /> : <AlertCircle className="h-3.5 w-3.5" strokeWidth={2} />}
                    {course.active ? "Active" : "Disabled"}
                  </span>

                  <span
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold ${
                      course.isPublished
                        ? "border-[#5A7ACD]/30 bg-[#5A7ACD]/10 text-[#2B2A2A]"
                        : "border-[#FEB05D]/30 bg-[#FEB05D]/10 text-[#2B2A2A]"
                    }`}
                  >
                    <FileText className="h-3.5 w-3.5" strokeWidth={2} />
                    {course.isPublished ? "Published" : "Draft"}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => void handleToggleActive()}
                  disabled={isSaving || isDeleting || isTogglingActive}
                  className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-[#2B2A2A] hover:bg-gray-50 disabled:opacity-60"
                  aria-label="Toggle course active status"
                >
                  <span
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      course.active ? "bg-[#5A7ACD]" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                        course.active ? "translate-x-5" : "translate-x-1"
                      }`}
                    />
                  </span>
                  <span>{course.active ? "Active" : "Disabled"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsEditOpen(true)}
                  disabled={isSaving || isDeleting}
                  className="flex items-center gap-2 rounded-xl bg-[#5A7ACD] px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-[#4a6abd] disabled:opacity-60"
                >
                  <Edit className="w-4 h-4" strokeWidth={2} />
                  Edit Course
                </button>
                <button
                  type="button"
                  onClick={() => setIsDeleteConfirmOpen(true)}
                  disabled={isSaving || isDeleting}
                  className="flex items-center gap-2 rounded-xl border border-red-300 bg-white px-4 py-2.5 text-[13px] font-semibold text-[#C23A42] hover:bg-[#FDEBEC] disabled:opacity-60"
                >
                  <Trash2 className="w-4 h-4" strokeWidth={2} />
                  Delete Course
                </button>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 lg:col-span-1">
                <p className="text-[13px] font-semibold text-[#2B2A2A]">Overview</p>

                <div className="mt-3 aspect-[16/9] w-full overflow-hidden rounded-lg border border-gray-200 bg-white">
                  {course.imageUrl ? (
                    <img
                      src={course.imageUrl}
                      alt="Course cover"
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-[#5A7ACD]/10 to-[#FEB05D]/10" />
                  )}
                </div>

                <div className="mt-4 space-y-3">
                  <DetailRow label="Course ID" value={course.id} />
                  <DetailRow label="Course Code" value={course.courseCode ?? "TBD"} />
                  <DetailRow label="Canvas Course ID" value={course.canvasCourseId ?? "N/A"} />
                  <DetailRow label="Active" value={course.active ? "Yes" : "No"} />
                  <DetailRow label="Published" value={course.isPublished ? "Yes" : "No"} />
                </div>

                <div className="mt-4">
                  <p className="text-[12px] font-semibold text-gray-600">Description</p>
                  <p className="mt-2 text-[13px] text-gray-700 whitespace-pre-wrap">
                    {course.description?.trim() ? course.description : "No description provided."}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-4 lg:col-span-1">
                <p className="text-[13px] font-semibold text-[#2B2A2A]">Semester & Status</p>

                <div className="mt-3 space-y-3">
                  <DetailRow label="Semester" value={course.semester?.name ?? "TBD"} />
                  <DetailRow label="Section" value={course.section ?? "TBD"} />
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <div className="flex items-center gap-2 text-[12px] font-semibold text-gray-700">
                      <Calendar className="h-4 w-4" strokeWidth={2} />
                      Date Range
                    </div>
                    <div className="mt-2 space-y-2 text-[13px] text-gray-800">
                      <div className="flex items-start justify-between gap-4">
                        <span className="text-[12px] font-semibold text-gray-600">Start</span>
                        <span className="text-right break-words">{course.semester?.startDate ?? "TBD"}</span>
                      </div>
                      <div className="flex items-start justify-between gap-4">
                        <span className="text-[12px] font-semibold text-gray-600">End</span>
                        <span className="text-right break-words">{course.semester?.endDate ?? "TBD"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-4 lg:col-span-1">
                <p className="text-[13px] font-semibold text-[#2B2A2A]">Faculty</p>

                {course.faculty ? (
                  <div className="mt-3 space-y-3">
                    <DetailRow label="Faculty Name" value={course.faculty.name ?? "TBD"} />
                    <DetailRow
                      label="Email"
                      value={
                        course.faculty.email ? (
                          <span className="inline-flex items-center gap-2">
                            <Mail className="h-3.5 w-3.5" strokeWidth={2} />
                            {course.faculty.email}
                          </span>
                        ) : (
                          "N/A"
                        )
                      }
                    />
                    <DetailRow label="Department" value={course.faculty.department ?? "TBD"} />
                    <DetailRow
                      label="Qualifications"
                      value={course.faculty.qualifications?.trim() ? course.faculty.qualifications : "N/A"}
                    />
                  </div>
                ) : (
                  <p className="mt-3 text-[13px] text-gray-600">Faculty information not available.</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {isEditOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white shadow-xl">
            <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-6 py-4">
              <div>
                <h3 className="text-[16px] font-semibold text-[#2B2A2A]">Edit Course</h3>
                <p className="text-[13px] text-gray-600">Update course metadata shown to students</p>
              </div>
              <button
                type="button"
                onClick={() => !isSaving && setIsEditOpen(false)}
                disabled={isSaving}
                className="rounded-xl border border-gray-200 bg-white p-2 hover:bg-gray-50 disabled:opacity-60"
                aria-label="Close"
              >
                <X className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>

            <div className="px-6 py-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="gf-course-name" className="mb-1.5 block text-[13px] font-medium text-[#1F2430]">
                    Class Name
                  </label>
                  <input
                    id="gf-course-name"
                    value={form.name}
                    onChange={(event) => setForm({ ...form, name: event.target.value })}
                    placeholder="e.g., Data Structures and Algorithms"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-[14px] text-[#1F2430] placeholder:text-[#9CA6B6] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]"
                    disabled={isSaving}
                  />
                </div>

                <div>
                  <label htmlFor="gf-course-code" className="mb-1.5 block text-[13px] font-medium text-[#1F2430]">
                    Course Code
                  </label>
                  <input
                    id="gf-course-code"
                    value={form.courseCode}
                    onChange={(event) => setForm({ ...form, courseCode: event.target.value })}
                    placeholder="e.g., CS-301"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-[14px] text-[#1F2430] placeholder:text-[#9CA6B6] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]"
                    disabled={isSaving}
                  />
                </div>

                <div>
                  <label htmlFor="gf-course-section" className="mb-1.5 block text-[13px] font-medium text-[#1F2430]">
                    Section
                  </label>
                  <input
                    id="gf-course-section"
                    value={form.section}
                    onChange={(event) => setForm({ ...form, section: event.target.value })}
                    placeholder="e.g., Section 001"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-[14px] text-[#1F2430] placeholder:text-[#9CA6B6] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]"
                    disabled={isSaving}
                  />
                </div>

                <div>
                  <label htmlFor="gf-course-semester" className="mb-1.5 block text-[13px] font-medium text-[#1F2430]">
                    Semester
                  </label>
                  <select
                    id="gf-course-semester"
                    value={form.semesterId}
                    onChange={(event) => setForm({ ...form, semesterId: event.target.value })}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-[14px] text-[#1F2430] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]"
                    disabled={isSaving || semesters.length === 0}
                  >
                    {semesters.length === 0 ? <option value="">Loading semesters...</option> : null}
                    {semesters.map((semester) => (
                      <option key={semester.id} value={String(semester.id)}>
                        {semester.name} ({semester.startDate} - {semester.endDate})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="gf-course-description" className="mb-1.5 block text-[13px] font-medium text-[#1F2430]">
                    Description
                  </label>
                  <textarea
                    id="gf-course-description"
                    value={form.description}
                    onChange={(event) => setForm({ ...form, description: event.target.value })}
                    rows={3}
                    placeholder="Optional course description"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-[14px] text-[#1F2430] placeholder:text-[#9CA6B6] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]"
                    disabled={isSaving}
                  />
                </div>

                <div>
                  <label htmlFor="gf-course-image" className="mb-1.5 block text-[13px] font-medium text-[#1F2430]">
                    Image URL
                  </label>
                  <input
                    id="gf-course-image"
                    value={form.imageUrl}
                    onChange={(event) => setForm({ ...form, imageUrl: event.target.value })}
                    placeholder="Optional cover image URL"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-[14px] text-[#1F2430] placeholder:text-[#9CA6B6] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]"
                    disabled={isSaving}
                  />
                </div>

                <div>
                  <label htmlFor="gf-course-canvas-id" className="mb-1.5 block text-[13px] font-medium text-[#1F2430]">
                    Canvas Course ID
                  </label>
                  <input
                    id="gf-course-canvas-id"
                    value={form.canvasCourseId}
                    onChange={(event) => setForm({ ...form, canvasCourseId: event.target.value })}
                    placeholder="Optional LMS id"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-[14px] text-[#1F2430] placeholder:text-[#9CA6B6] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]"
                    disabled={isSaving}
                  />
                </div>

                <div className="sm:col-span-2">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <label className="inline-flex items-center gap-2 text-[14px] text-[#1F2430]">
                      <input
                        type="checkbox"
                        checked={form.active}
                        onChange={(event) => setForm({ ...form, active: event.target.checked })}
                        className="h-4 w-4 rounded border-gray-300 text-[#5A7ACD] focus:ring-[#5A7ACD]"
                        disabled={isSaving}
                      />
                      Active
                    </label>
                    <label className="inline-flex items-center gap-2 text-[14px] text-[#1F2430]">
                      <input
                        type="checkbox"
                        checked={form.isPublished}
                        onChange={(event) => setForm({ ...form, isPublished: event.target.checked })}
                        className="h-4 w-4 rounded border-gray-300 text-[#5A7ACD] focus:ring-[#5A7ACD]"
                        disabled={isSaving}
                      />
                      Published
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
              <button
                type="button"
                onClick={() => !isSaving && setIsEditOpen(false)}
                disabled={isSaving}
                className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-[14px] font-medium text-[#2B2A2A] hover:bg-gray-50 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={isSaving || !form.semesterId}
                className="rounded-xl bg-[#5A7ACD] px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-[#4a6abd] disabled:opacity-60"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isDeleteConfirmOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white shadow-xl">
            <div className="flex items-start justify-between gap-3 border-b border-gray-200 px-6 py-4">
              <div className="pt-1">
                <h3 className="text-[16px] font-semibold text-[#2B2A2A]">Delete Course</h3>
                <p className="mt-1 text-[13px] text-gray-600">
                  This will permanently delete the course and remove it from your faculty classes.
                </p>
              </div>
              <button
                type="button"
                onClick={() => !isDeleting && setIsDeleteConfirmOpen(false)}
                disabled={isDeleting}
                className="rounded-xl border border-gray-200 bg-white p-2 hover:bg-gray-50 disabled:opacity-60"
                aria-label="Close"
              >
                <X className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>

            <div className="px-6 py-5">
              <div className="rounded-xl border border-red-200 bg-[#FDEBEC] px-4 py-3">
                <p className="text-[13px] text-[#C23A42]">
                  Course: <span className="font-semibold">{course?.courseCode ?? classId}</span>
                  {course?.name ? ` — ${course.name}` : null}
                </p>
              </div>

              <div className="mt-5 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => !isDeleting && setIsDeleteConfirmOpen(false)}
                  disabled={isDeleting}
                  className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-[14px] font-medium text-[#2B2A2A] hover:bg-gray-50 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete()}
                  disabled={isDeleting}
                  className="rounded-xl bg-[#C23A42] px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-[#a92f36] disabled:opacity-60"
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
