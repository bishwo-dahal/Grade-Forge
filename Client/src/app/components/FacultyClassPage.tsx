import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
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
  Eye,
  EyeOff,
  Trash2,
  MoreVertical,
  Filter,
  Download,
  Mail,
  UserMinus,
  Calendar,
  Search
} from "lucide-react";
import type {
  ClassHeader,
  ClassRecentActivity,
  FacultyAssignment,
  FacultyDashboardStat,
  FacultyRosterStats,
  FacultyRosterStudentRow,
  FacultyStudentSearchResult,
} from "../../types/class";
import type { ClassSubmissionItem } from "../../types/submission";
import {
  enrollStudentByEmail,
  getFacultyClassHeaderById,
  listClassRecentActivity,
  listFacultyAssignments,
  listFacultyRosterRows,
  listFacultyDashboardStats,
  searchFacultyStudentByEmail,
  summarizeFacultyRosterStats,
} from "../../services/classService";
import { listClassSubmissions } from "../../services/submissionService";
import { SegmentedFilter } from "./ui/SegmentedFilter";

type SectionType = 'dashboard' | 'assignments' | 'submissions' | 'grades' | 'students' | 'groups' | 'settings';
type RosterFilter = "all" | "active" | "inactive" | "unassigned";

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
  const { classId } = useParams();
  const [activeSection, setActiveSection] = useState<SectionType>('dashboard');
  const [submissionBadgeCount, setSubmissionBadgeCount] = useState(0);

  // NOTE: Class header data now comes from backend-driven service mapping.
  const [classHeader, setClassHeader] = useState<ClassHeader | null>(null);

  useEffect(() => {
    const resolvedId = classId || "1";
    getFacultyClassHeaderById(resolvedId).then(setClassHeader);
  }, [classId]);

  useEffect(() => {
    const resolvedId = classId || "1";
    // NOTE: Sidebar submissions badge now reflects live ungraded submission count for this class.
    listClassSubmissions(resolvedId).then((submissions) => {
      setSubmissionBadgeCount(submissions.filter((submission) => submission.status === "ungraded").length);
    });
  }, [classId]);

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

          {/* Navigation Menu */}
          <nav className="flex-1 px-3 py-4 overflow-y-auto">
            <ul className="space-y-1">
              <NavItem
                icon={<LayoutDashboard className="w-4 h-4" strokeWidth={2} />}
                label="Dashboard"
                active={activeSection === 'dashboard'}
                onClick={() => setActiveSection('dashboard')}
              />
              <NavItem
                icon={<FileText className="w-4 h-4" strokeWidth={2} />}
                label="Assignments"
                active={activeSection === 'assignments'}
                onClick={() => setActiveSection('assignments')}
              />
              <NavItem
                icon={<Send className="w-4 h-4" strokeWidth={2} />}
                label="Submissions"
                active={activeSection === 'submissions'}
                onClick={() => setActiveSection('submissions')}
                badge={submissionBadgeCount > 0 ? submissionBadgeCount : undefined}
              />
              <NavItem
                icon={<BarChart3 className="w-4 h-4" strokeWidth={2} />}
                label="Grades"
                active={activeSection === 'grades'}
                onClick={() => setActiveSection('grades')}
              />
              <NavItem
                icon={<Users className="w-4 h-4" strokeWidth={2} />}
                label="Students"
                active={activeSection === 'students'}
                onClick={() => setActiveSection('students')}
              />
              <NavItem
                icon={<UsersRound className="w-4 h-4" strokeWidth={2} />}
                label="Groups"
                active={activeSection === 'groups'}
                onClick={() => setActiveSection('groups')}
              />
              {/* CLEANUP: Removed Rubrics/Tests/Integrity/Announcements tabs from faculty class navigation per scope update. */}
              <NavItem
                icon={<Settings className="w-4 h-4" strokeWidth={2} />}
                label="Settings"
                active={activeSection === 'settings'}
                onClick={() => setActiveSection('settings')}
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
                <button className="flex items-center gap-2 px-3.5 py-2 bg-[#2B2A2A] hover:bg-[#3a3939] text-white rounded-lg text-[13px] font-medium transition-colors">
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
            {activeSection === 'submissions' && <SubmissionsSection />}
            {activeSection === 'grades' && <GradesSection />}
            {activeSection === 'students' && <StudentsSection />}
            {activeSection === 'groups' && <GroupsSection />}
            {/* CLEANUP: Removed Rubrics/Tests/Integrity/Announcements section rendering per updated faculty class management scope. */}
            {activeSection === 'settings' && <SettingsSection />}
          </div>
        </main>
      </div>
    </div>
  );
}

// Navigation Item Component
function NavItem({ 
  icon, 
  label, 
  active, 
  onClick,
  badge 
}: { 
  icon: React.ReactNode; 
  label: string; 
  active: boolean; 
  onClick: () => void;
  badge?: number;
}) {
  return (
    <li>
      <button
        onClick={onClick}
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
      </button>
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
  const [selectedAssignments, setSelectedAssignments] = useState<string[]>([]);
  // NOTE: Assignments now load from backend-driven class service mapping.
  const [assignments, setAssignments] = useState<FacultyAssignment[]>([]);

  useEffect(() => {
    const resolvedId = classId || "1";
    listFacultyAssignments(resolvedId).then(setAssignments);
  }, [classId]);

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
          <button className="flex items-center gap-2 px-4 py-2 bg-[#2B2A2A] hover:bg-[#3a3939] text-white rounded-lg text-[13px] font-medium transition-colors">
            <Plus className="w-4 h-4" strokeWidth={2} />
            <span>Create Assignment</span>
          </button>
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
            {assignments.length > 0 ? (
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
                      <span className="text-[14px] font-medium text-[#2B2A2A]">
                        {assignment.name}
                      </span>
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
                      <button aria-label="Edit assignment" className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                        <Edit className="w-4 h-4 text-gray-500" strokeWidth={2} />
                      </button>
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
    </div>
  );
}

function SubmissionsSection() {
  const { classId } = useParams();
  // NOTE: Submissions now load from backend-driven submission service mapping.
  const [submissions, setSubmissions] = useState<ClassSubmissionItem[]>([]);

  useEffect(() => {
    const resolvedId = classId || "1";
    listClassSubmissions(resolvedId).then(setSubmissions);
  }, [classId]);

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
          <button className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg text-[13px] font-medium transition-colors">
            <Filter className="w-4 h-4" strokeWidth={2} />
            <span>Filter</span>
          </button>
        </div>
      </div>

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
            {submissions.length > 0 ? (
              submissions.map((submission, index) => (
                <tr
                  key={submission.id}
                  className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${index === submissions.length - 1 ? 'border-b-0' : ''}`}
                >
                  <td className="px-6 py-4">
                    <span className="text-[14px] font-medium text-[#2B2A2A]">
                      {submission.student}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[13px] text-gray-600">
                      {submission.assignment}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[13px] text-gray-600">
                      {submission.submittedAt}
                    </span>
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
                      {/* Accessibility: icon-only action buttons need labels for screen readers. */}
                      <button aria-label="View submission" className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                        <Eye className="w-4 h-4 text-gray-500" strokeWidth={2} />
                      </button>
                      <button aria-label="Edit submission" className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                        <Edit className="w-4 h-4 text-gray-500" strokeWidth={2} />
                      </button>
                      <button aria-label="More submission actions" className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                        <MoreVertical className="w-4 h-4 text-gray-500" strokeWidth={2} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-6 text-center text-[13px] text-gray-600">
                  No submissions found for this class.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function GradesSection() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-[18px] font-semibold text-[#2B2A2A] mb-2">Grades</h2>
          <p className="text-[13px] text-gray-600">
            View and manage student grades
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg text-[13px] font-medium transition-colors">
          <Download className="w-4 h-4" strokeWidth={2} />
          <span>Export Grades</span>
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <p className="text-[14px] text-gray-600">Spreadsheet-style gradebook will be displayed here</p>
      </div>
    </div>
  );
}

function StudentsSection() {
  const { classId } = useParams();
  const resolvedId = classId || "1";

  // NOTE: This section acts as a container; all backend data is loaded here and passed directly to rendered UI rows.
  const [rosterRows, setRosterRows] = useState<FacultyRosterStudentRow[]>([]);
  const [activeFilter, setActiveFilter] = useState<RosterFilter>("all");
  const [searchValue, setSearchValue] = useState("");
  const [lookupResult, setLookupResult] = useState<FacultyStudentSearchResult | null>(null);
  const [isRosterLoading, setIsRosterLoading] = useState(false);
  const [isLookupLoading, setIsLookupLoading] = useState(false);
  const [isEnrollLoading, setIsEnrollLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ tone: "success" | "error" | "info"; text: string } | null>(null);

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

  useEffect(() => {
    void loadRoster();
  }, [resolvedId]);

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
    const normalizedQuery = searchValue.trim().toLowerCase();
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
  }, [activeFilter, rosterRows, searchValue]);

  const handleLookup = async () => {
    if (!searchValue.trim()) {
      setLookupResult(null);
      setFeedbackMessage({ tone: "error", text: "Enter a student email to search." });
      return;
    }

    setIsLookupLoading(true);
    setFeedbackMessage(null);
    try {
      const result = await searchFacultyStudentByEmail(resolvedId, searchValue);
      setLookupResult(result);
      if (!result.canEnroll) {
        setFeedbackMessage({ tone: "info", text: result.reason });
      }
    } catch (error) {
      setLookupResult(null);
      setFeedbackMessage({ tone: "error", text: getErrorMessage(error) });
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
      setLookupResult(null);
      setSearchValue("");
      await loadRoster();
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
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void handleLookup();
                }
              }}
              type="text"
              placeholder="Search students by email to enroll, or by name/email to filter..."
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
          <SegmentedFilter
            className="ml-auto"
            items={filterItems}
            value={activeFilter}
            onValueChange={(value) => setActiveFilter(value)}
          />
        </div>

        {lookupResult ? (
          <div className="mt-4 rounded-xl border border-gray-200 bg-[#F9FAFC] px-4 py-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[14px] font-semibold text-[#2B2A2A]">{lookupResult.studentName}</p>
              <p className="text-[13px] text-gray-600">{lookupResult.studentEmail}</p>
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
              <tr>
                <td colSpan={9} className="px-6 py-6 text-center text-[13px] text-gray-600">
                  Loading roster...
                </td>
              </tr>
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
                      <button aria-label="Remove student" className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
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
