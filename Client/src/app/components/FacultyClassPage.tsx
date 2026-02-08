import React, { useEffect, useState } from "react";
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
  ClipboardList,
  FlaskConical,
  ShieldAlert,
  Megaphone,
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
  Calendar
} from "lucide-react";
import type {
  ClassHeader,
  ClassRecentActivity,
  ClassStudent,
  FacultyAssignment,
  FacultyDashboardStat,
} from "../../types/class";
import type { ClassSubmissionItem } from "../../types/submission";
import {
  getFacultyClassHeaderById,
  listClassRecentActivity,
  listFacultyAssignments,
  listFacultyClassStudents,
  listFacultyDashboardStats,
} from "../../services/classService";
import { listClassSubmissions } from "../../services/submissionService";

type SectionType = 'dashboard' | 'assignments' | 'submissions' | 'grades' | 'students' | 'groups' | 'rubrics' | 'tests' | 'integrity' | 'announcements' | 'settings';

export function FacultyClassPage() {
  const { classId } = useParams();
  const [activeSection, setActiveSection] = useState<SectionType>('dashboard');

  // NOTE: Class header data now comes from the mock service.
  const [classHeader, setClassHeader] = useState<ClassHeader | null>(null);

  useEffect(() => {
    const resolvedId = classId || "cs-2400";
    getFacultyClassHeaderById(resolvedId).then(setClassHeader);
  }, [classId]);

  // NOTE: Lightweight placeholder keeps layout stable during async load.
  const classData: ClassHeader = classHeader ?? {
    id: classId || "cs-2400",
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
                badge={12}
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
              <NavItem
                icon={<ClipboardList className="w-4 h-4" strokeWidth={2} />}
                label="Rubrics"
                active={activeSection === 'rubrics'}
                onClick={() => setActiveSection('rubrics')}
              />
              <NavItem
                icon={<FlaskConical className="w-4 h-4" strokeWidth={2} />}
                label="Tests"
                active={activeSection === 'tests'}
                onClick={() => setActiveSection('tests')}
              />
              <NavItem
                icon={<ShieldAlert className="w-4 h-4" strokeWidth={2} />}
                label="Integrity"
                active={activeSection === 'integrity'}
                onClick={() => setActiveSection('integrity')}
              />
              <NavItem
                icon={<Megaphone className="w-4 h-4" strokeWidth={2} />}
                label="Announcements"
                active={activeSection === 'announcements'}
                onClick={() => setActiveSection('announcements')}
              />
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
          <div className="flex items-start justify-between">
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
            
            {/* Primary Action Buttons */}
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-[#2B2A2A] rounded-lg text-[13px] font-medium transition-colors">
                <Upload className="w-4 h-4" strokeWidth={2} />
                <span>Import Students</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2.5 bg-[#2B2A2A] hover:bg-[#3a3939] text-white rounded-lg text-[13px] font-medium transition-colors">
                <Plus className="w-4 h-4" strokeWidth={2} />
                <span>Create Assignment</span>
              </button>
            </div>
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
            {activeSection === 'rubrics' && <RubricsSection />}
            {activeSection === 'tests' && <TestsSection />}
            {activeSection === 'integrity' && <IntegritySection />}
            {activeSection === 'announcements' && <AnnouncementsSection />}
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
  // NOTE: Dashboard stats and activity now load from mock services.
  const [recentActivity, setRecentActivity] = useState<ClassRecentActivity[]>([]);
  const [stats, setStats] = useState<FacultyDashboardStat[]>([]);

  useEffect(() => {
    const resolvedId = classId || "cs-2400";
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
          {recentActivity.map((activity) => {
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
          })}
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
  // NOTE: Assignments now load from the mock class service.
  const [assignments, setAssignments] = useState<FacultyAssignment[]>([]);

  useEffect(() => {
    const resolvedId = classId || "cs-2400";
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
            {assignments.map((assignment, index) => (
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SubmissionsSection() {
  const { classId } = useParams();
  // NOTE: Submissions now load from the mock submission service.
  const [submissions, setSubmissions] = useState<ClassSubmissionItem[]>([]);

  useEffect(() => {
    const resolvedId = classId || "cs-2400";
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
            {submissions.map((submission, index) => (
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
            ))}
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
  // NOTE: Students now load from the mock class service.
  const [students, setStudents] = useState<ClassStudent[]>([]);

  useEffect(() => {
    const resolvedId = classId || "cs-2400";
    listFacultyClassStudents(resolvedId).then(setStudents);
  }, [classId]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-[18px] font-semibold text-[#2B2A2A] mb-2">Students</h2>
          <p className="text-[13px] text-gray-600">
            Manage enrolled students ({students.length} total)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg text-[13px] font-medium transition-colors">
            <Upload className="w-4 h-4" strokeWidth={2} />
            <span>Import Students</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#2B2A2A] hover:bg-[#3a3939] text-white rounded-lg text-[13px] font-medium transition-colors">
            <Plus className="w-4 h-4" strokeWidth={2} />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-6 py-3 text-[12px] font-semibold text-gray-600 uppercase tracking-wide">
                Name
              </th>
              <th className="text-left px-6 py-3 text-[12px] font-semibold text-gray-600 uppercase tracking-wide">
                Email
              </th>
              <th className="text-left px-6 py-3 text-[12px] font-semibold text-gray-600 uppercase tracking-wide">
                Status
              </th>
              <th className="text-left px-6 py-3 text-[12px] font-semibold text-gray-600 uppercase tracking-wide">
                Group
              </th>
              <th className="text-right px-6 py-3 text-[12px] font-semibold text-gray-600 uppercase tracking-wide">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {students.map((student, index) => (
              <tr
                key={student.id}
                className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${index === students.length - 1 ? 'border-b-0' : ''}`}
              >
                <td className="px-6 py-4">
                  <span className="text-[14px] font-medium text-[#2B2A2A]">
                    {student.name}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <a
                    href={`mailto:${student.email}`}
                    className="text-[13px] text-gray-600 hover:text-[#5A7ACD] transition-colors"
                  >
                    {student.email}
                  </a>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-[12px] font-medium px-2 py-1 rounded-md ${
                    student.status === 'Active'
                      ? 'bg-green-50 text-green-600'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {student.status || 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-[13px] text-gray-600">{student.group || 'Unassigned'}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {/* Accessibility: icon-only action buttons need labels for screen readers. */}
                    <button aria-label="Email student" className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                      <Mail className="w-4 h-4 text-gray-500" strokeWidth={2} />
                    </button>
                    <button aria-label="Remove student" className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                      <UserMinus className="w-4 h-4 text-gray-500" strokeWidth={2} />
                    </button>
                    <button aria-label="More student actions" className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                      <MoreVertical className="w-4 h-4 text-gray-500" strokeWidth={2} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
