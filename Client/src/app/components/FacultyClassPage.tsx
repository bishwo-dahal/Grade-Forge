import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router";
import { 
  Settings, 
  ChevronLeft, 
  LayoutDashboard, 
  FileText, 
  Send, 
  BarChart3, 
  Users, 
  UsersRound,
  Plus,
  Upload,
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
} from "lucide-react";
import type {
  ClassHeader,
  ClassRecentActivity,
  FacultyAssignment,
  FacultyDashboardStat,
  FacultyStudentEmailSuggestion,
  FacultyRosterStats,
  FacultyRosterStudentRow,
  FacultyStudentSearchResult,
} from "../../types/class";
import type { ClassSubmissionItem, SpeedGradingAssignmentOption } from "../../types/submission";
import {
  dropStudentFromCourse,
  enrollStudentByEmail,
  getFacultyClassHeaderById,
  listClassRecentActivity,
  listFacultyAssignments,
  listFacultyStudentEmailSuggestions,
  listFacultyRosterRows,
  listFacultyDashboardStats,
  searchFacultyStudentByEmail,
  summarizeFacultyRosterStats,
} from "../../services/classService";
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
import { SegmentedFilter } from "./ui/SegmentedFilter";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "./ui/tooltip";

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
  if (error instanceof Error && error.message) {
    return error.message;
  }

  const apiMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
  if (typeof apiMessage === "string" && apiMessage.trim()) {
    return apiMessage;
  }

  return "Something went wrong. Please try again.";
}

export function FacultyClassPage() {
  const { classId, section: sectionParam } = useParams();
  const navigate = useNavigate();
  const resolvedClassId = classId ?? "1";
  const activeSection: SectionType = isValidSection(sectionParam) ? sectionParam : "dashboard";
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);

  // Redirect invalid section to dashboard
  useEffect(() => {
    if (sectionParam != null && !isValidSection(sectionParam)) {
      navigate(`/faculty/class/${resolvedClassId}/dashboard`, { replace: true });
    }
  }, [sectionParam, resolvedClassId, navigate]);

  // NOTE: Class header data now comes from backend-driven service mapping.
  const [classHeader, setClassHeader] = useState<ClassHeader | null>(null);

  useEffect(() => {
    const resolvedId = classId || "1";
    getFacultyClassHeaderById(resolvedId).then(setClassHeader);
  }, [classId]);

  useEffect(() => {
    // NOTE: Close add-student modal when user navigates away from Students section to avoid stale overlay state.
    if (activeSection !== "students") {
      setIsAddStudentModalOpen(false);
    }
  }, [activeSection]);

  // NOTE: Lightweight placeholder keeps layout stable during async load.
  const classData: ClassHeader = classHeader ?? {
    id: classId || "1",
    code: "",
    name: "",
    section: "",
    semester: "",
    instructor: "",
    role: "",
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
                  <Upload className="w-4 h-4" strokeWidth={2} />
                  <span>Export Roster</span>
                </button>
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
            {activeSection === 'dashboard' && <DashboardSection />}
            {activeSection === 'assignments' && <AssignmentsSection />}
            {activeSection === 'grades' && (
              <GradesSection
                courseFullName={classData.code && classData.name ? `${classData.code}: ${classData.name}` : classData.name || classData.code || ""}
                facultyName={classData.instructor || ""}
              />
            )}
            {activeSection === 'students' && (
              <StudentsSection
                isAddStudentModalOpen={isAddStudentModalOpen}
                onCloseAddStudentModal={() => setIsAddStudentModalOpen(false)}
              />
            )}
            {activeSection === 'assistants' && <AssistantsSection />}
            {activeSection === 'groups' && <GroupsSection />}
            {/* CLEANUP: Removed Rubrics/Tests/Integrity/Announcements section rendering per updated faculty class management scope. */}
            {activeSection === 'settings' && <SettingsSection />}
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
          ${active
            ? 'bg-[#5A7ACD] text-white'
            : 'text-gray-700 hover:bg-gray-100'
          }
        `}
      >
        <div className="flex items-center gap-3">
          {icon}
          <span>{label}</span>
        </div>
        {badge !== undefined && badge > 0 && (
          <span className={`
            px-2 py-0.5 text-[11px] font-semibold rounded-full
            ${active ? 'bg-white text-[#5A7ACD]' : 'bg-[#FEB05D] text-white'}
          `}>
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
  const navigate = useNavigate();
  const resolvedClassId = classId || "1";
  const [selectedAssignments, setSelectedAssignments] = useState<string[]>([]);
  // NOTE: Assignments now load from backend-driven class service mapping.
  const [assignments, setAssignments] = useState<FacultyAssignment[]>([]);
  const [isAssignmentsLoading, setIsAssignmentsLoading] = useState(true);
  // NOTE: Speed grading still depends on submission data because the queue is built from submitted work, not assignment headers alone.
  const [submissions, setSubmissions] = useState<ClassSubmissionItem[]>([]);
  const [isSpeedGradingModalOpen, setIsSpeedGradingModalOpen] = useState(false);
  const [isSpeedGradingLoading, setIsSpeedGradingLoading] = useState(false);
  const [speedGradingError, setSpeedGradingError] = useState<string | null>(null);
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
        assignmentName: submission.assignmentName,
        totalSubmissions: 1,
        ungradedSubmissions: submission.status === "ungraded" ? 1 : 0,
      });
    }

    return Array.from(groupedAssignments.values()).sort((left, right) => {
      if (left.ungradedSubmissions !== right.ungradedSubmissions) {
        return right.ungradedSubmissions - left.ungradedSubmissions;
      }
      return left.assignmentName.localeCompare(right.assignmentName);
    });
  }, [submissions]);

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

  const loadSpeedGradingOptions = useCallback(async () => {
    // NOTE: The speed grading launcher needs latest submission status counts before faculty picks an assignment queue.
    setIsSpeedGradingLoading(true);
    setSpeedGradingError(null);
    try {
      const rows = await listClassSubmissions(resolvedClassId);
      setSubmissions(rows);
    } catch (error) {
      setSpeedGradingError(getErrorMessage(error));
    } finally {
      setIsSpeedGradingLoading(false);
    }
  }, [resolvedClassId]);

  useEffect(() => {
    void loadAssignments();
  }, [loadAssignments]);

  useEffect(() => {
    if (!isSpeedGradingModalOpen) {
      return;
    }

    const selectedExists = speedGradingOptions.some((option) => option.assignmentId === selectedSpeedAssignmentId);
    if (!selectedExists) {
      setSelectedSpeedAssignmentId(speedGradingOptions[0]?.assignmentId ?? "");
    }
  }, [isSpeedGradingModalOpen, selectedSpeedAssignmentId, speedGradingOptions]);

  const handleOpenSpeedGradingModal = () => {
    setIsSpeedGradingModalOpen(true);
    void loadSpeedGradingOptions();
  };

  const handleStartSpeedGrading = () => {
    if (!selectedSpeedAssignmentId) {
      return;
    }

    // NOTE: Speed grading stays assignment-scoped so faculty grade one queue at a time from the assignments workspace.
    navigate(`/faculty/class/${resolvedClassId}/speed-grading/${selectedSpeedAssignmentId}`);
    setIsSpeedGradingModalOpen(false);
  };

  return (
    <div>
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

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
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
                    <div className="flex items-center justify-end gap-2">
                      {/* Accessibility: icon-only action buttons need labels for screen readers. */}
                      <Link
                        aria-label="Open assignment detail"
                        to={`/faculty/class/${resolvedClassId}/assignment/${assignment.id}`}
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4 text-gray-500" strokeWidth={2} />
                      </Link>
                      <button aria-label="Duplicate assignment" className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                        <Copy className="w-4 h-4 text-gray-500" strokeWidth={2} />
                      </button>
                      <button aria-label="More assignment actions" className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                        <MoreVertical className="w-4 h-4 text-gray-500" strokeWidth={2} />
                      </button>
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

      <div className="mt-5 flex flex-wrap items-center justify-end gap-3">
        <button
          type="button"
          onClick={handleOpenSpeedGradingModal}
          disabled={isSpeedGradingLoading}
          className="flex items-center gap-2 px-3 py-2 bg-[#2B2A2A] hover:bg-[#3a3939] rounded-lg text-[13px] font-medium text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Clock className="w-4 h-4" strokeWidth={2} />
          <span>{isSpeedGradingLoading ? "Loading..." : "Speed Grading"}</span>
        </button>
        <button
          type="button"
          onClick={() => void loadAssignments()}
          disabled={isAssignmentsLoading}
          className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg text-[13px] font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <RefreshCcw className={`w-4 h-4 ${isAssignmentsLoading ? "animate-spin" : ""}`} strokeWidth={2} />
          <span>{isAssignmentsLoading ? "Refreshing..." : "Refresh"}</span>
        </button>
        <button
          type="button"
          className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg text-[13px] font-medium transition-colors"
        >
          <Filter className="w-4 h-4" strokeWidth={2} />
          <span>Filter</span>
        </button>
      </div>

      {isSpeedGradingModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111827]/45 px-4">
          <div className="w-full max-w-[540px] rounded-[20px] bg-white shadow-[0_32px_80px_rgba(17,24,39,0.22)]">
            <div className="flex items-start justify-between border-b border-[#E5E7EB] px-6 py-5">
              <div>
                <h3 className="text-[16px] font-semibold text-[#2B2A2A]">Start Speed Grading</h3>
                <p className="mt-1 text-[13px] text-[#6B7280]">
                  Pick an assignment queue to open the read-only grading workspace.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSpeedGradingModalOpen(false)}
                className="rounded-full p-1 text-[#6B7280] transition-colors hover:bg-[#F3F4F6] hover:text-[#2B2A2A]"
                aria-label="Close speed grading modal"
              >
                <X className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>

            <div className="space-y-4 px-6 py-5">
              {speedGradingError ? (
                <div className="rounded-lg border border-[#F2C9CC] bg-[#FFF5F5] px-3 py-2 text-[12px] text-[#C23A42]">
                  {speedGradingError}
                </div>
              ) : null}

              <label className="block">
                <span className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.08em] text-[#8D97AC]">
                  Assignment queue
                </span>
                <select
                  value={selectedSpeedAssignmentId}
                  onChange={(event) => setSelectedSpeedAssignmentId(event.target.value)}
                  disabled={isSpeedGradingLoading || speedGradingOptions.length === 0}
                  className="w-full rounded-xl border border-[#D4D7DE] bg-white px-3 py-3 text-[14px] text-[#2B2A2A] outline-none transition focus:border-[#5A7ACD] focus:ring-2 focus:ring-[#DCE5F8] disabled:cursor-not-allowed disabled:bg-[#F9FAFB] disabled:text-[#9CA3AF]"
                >
                  {speedGradingOptions.length === 0 ? (
                    <option value="">
                      {isSpeedGradingLoading ? "Loading submissions..." : "No submitted assignments available"}
                    </option>
                  ) : (
                    speedGradingOptions.map((option) => (
                      <option key={option.assignmentId} value={option.assignmentId}>
                        {option.assignmentName} ({option.ungradedSubmissions} ungraded / {option.totalSubmissions} submitted)
                      </option>
                    ))
                  )}
                </select>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-[#E5E7EB] px-6 py-4">
              <button
                type="button"
                onClick={() => setIsSpeedGradingModalOpen(false)}
                className="rounded-lg border border-[#D4D7DE] px-4 py-2 text-[13px] font-medium text-[#374151] transition-colors hover:bg-[#F9FAFB]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStartSpeedGrading}
                disabled={!selectedSpeedAssignmentId}
                className="rounded-lg bg-[#2B2A2A] px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#3A3939] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Open Speed Grading
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
                            {student.studentName}
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
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[13px] text-[#2B2A2A] tabular-nums">
        {assignment.score != null
          ? `${assignment.score.toFixed(2)} / ${assignment.maxScore.toFixed(1)}`
          : "— / " + assignment.maxScore.toFixed(1)}
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

  const resetAddStudentState = () => {
    // CLEANUP: Reset modal state each time it closes to avoid stale results/messages.
    setLookupEmail("");
    setLookupResult(null);
    setEmailSuggestions([]);
    setSuggestionError(null);
    setFeedbackMessage(null);
    setIsSuggestionLoading(false);
    setIsLookupLoading(false);
    setIsEnrollLoading(false);
  };

  const closeAddStudentModal = () => {
    resetAddStudentState();
    onCloseAddStudentModal();
  };

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
    if (!isAddStudentModalOpen) {
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
  }, [isAddStudentModalOpen, lookupEmail, resolvedId]);

  const rosterStats: FacultyRosterStats = useMemo(() => summarizeFacultyRosterStats(rosterRows), [rosterRows]);

  const filterItems = useMemo(() => {
    const activeCount = rosterRows.filter((row) => row.status === "active").length;
    const inactiveCount = rosterRows.filter((row) => row.status === "inactive").length;
    const unassignedCount = rosterRows.filter((row) => row.status === "unassigned").length;
    return [
      { id: "all", label: "All", count: rosterRows.length },
      { id: "active", label: "Active", count: activeCount },
      { id: "inactive", label: "Inactive", count: inactiveCount },
      { id: "unassigned", label: "Unassigned", count: unassignedCount },
    ] as const;
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

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        <RosterStatCard
          icon={<Users className="w-4 h-4 text-[#5A7ACD]" strokeWidth={2} />}
          iconBg="bg-[#5A7ACD]/10"
          value={String(rosterStats.totalStudents)}
          label="Total Students"
        />
        <RosterStatCard
          icon={<UserPlus className="w-4 h-4 text-green-600" strokeWidth={2} />}
          iconBg="bg-green-50"
          value={String(rosterStats.activeStudents)}
          label="Active"
        />
        <RosterStatCard
          icon={<UserMinus className="w-4 h-4 text-red-500" strokeWidth={2} />}
          iconBg="bg-red-50"
          value={String(rosterStats.inactiveStudents)}
          label="Inactive"
        />
        <RosterStatCard
          icon={<BarChart3 className="w-4 h-4 text-[#F0A561]" strokeWidth={2} />}
          iconBg="bg-[#F0A561]/10"
          value={`${rosterStats.avgScore}%`}
          label="Avg Score"
        />
        <RosterStatCard
          icon={<CheckCircle2 className="w-4 h-4 text-[#5A7ACD]" strokeWidth={2} />}
          iconBg="bg-[#5A7ACD]/10"
          value={`${rosterStats.completion}%`}
          label="Completion"
        />
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full md:max-w-xl">
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
            className="ml-auto"
            items={filterItems}
            value={activeFilter}
            onValueChange={(value) => setActiveFilter(value)}
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
                    <p className="text-[14px] font-medium text-[#2B2A2A]">{student.name}</p>
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
                    {student.avgScore}%
                  </td>
                  <td className="px-4 py-4 text-[13px] text-gray-600">{student.lastActivity}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button aria-label="Schedule student meeting" className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                        <Calendar className="w-4 h-4 text-gray-500" strokeWidth={2} />
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

      {isAddStudentModalOpen ? (
        <div className="fixed inset-0 z-40 bg-black/35 flex items-center justify-center p-4" onClick={closeAddStudentModal}>
          <div
            // REFACTOR: Wider modal keeps search and suggestion content readable without cramped wrapping.
            className="w-full max-w-3xl rounded-2xl border border-gray-200 bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h3 className="text-[18px] font-semibold text-[#2B2A2A]">Add Student</h3>
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
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ?? err?.message ?? "Failed to assign assistant.";
      setAssignError(msg);
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
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ?? err?.message ?? "Failed to remove assistant.";
      setErrorDialog(msg);
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
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-[18px] font-semibold text-[#2B2A2A] mb-2">Groups</h2>
        <p className="text-[13px] text-gray-600">Create and manage student groups for assignments</p>
      </div>

      {/* NOTE: This placeholder section was re-added to prevent runtime crashes from missing component references. */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <p className="text-[14px] text-gray-600">Group management UI will be displayed here.</p>
      </div>
    </div>
  );
}

function SettingsSection() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-[18px] font-semibold text-[#2B2A2A] mb-2">Class Settings</h2>
        <p className="text-[13px] text-gray-600">Manage class-level preferences and visibility options</p>
      </div>

      {/* NOTE: Placeholder preserves settings tab behavior until class-setting controls are integrated. */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <p className="text-[14px] text-gray-600">Class settings controls will be displayed here.</p>
      </div>
    </div>
  );
}
