import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { Settings, ChevronLeft, Book, FileText, BarChart3, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import type {
  ClassAnnouncement,
  ClassAssignment,
  ClassHeader,
  ClassImportantDate,
  ClassOverviewStat,
} from "../../types/class";
import type { CategoryStat, GradeRow, OverallGradeSummary } from "../../types/grade";
import {
  getClassHeaderById,
  listClassAnnouncements,
  listClassAssignments,
  listClassImportantDates,
  listClassOverviewStats,
} from "../../services/classService";
import { getOverallGradeSummary, listCategoryStats, listGradeRows } from "../../services/resultService";
import React from "react";
import { clearAuthenticated, getAuthenticatedUser } from "../auth";
import { AuthTopBar } from "./layout/AuthTopBar";
import type { SettingsSection } from "./layout/AuthTopBar";
import { GradeForgeSidebar } from "./GradeForgeSidebar";

type SectionType = 'overview' | 'assignments' | 'grades';

export function ClassPage() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<SectionType>('overview');
  // NOTE: Class header data now comes from backend-driven service mapping.
  const [classHeader, setClassHeader] = useState<ClassHeader | null>(null);

  useEffect(() => {
    const resolvedId = classId || "1";
    getClassHeaderById(resolvedId).then(setClassHeader);
  }, [classId]);

  // NOTE: Lightweight placeholder keeps layout stable during async load.
  const classData: ClassHeader = classHeader ?? {
    id: classId || "1",
    code: "",
    name: "",
    section: "",
    semester: "",
    instructor: "",
    instructorEmail: "",
  };
  const loggedInUser = getAuthenticatedUser();
  const displayName = loggedInUser?.name ?? "Alex Johnson";
  const displayEmail = loggedInUser?.email ?? "alex@university.edu";
  const displayInitials =
    displayName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "GF";

  const goToSettingsSection = (section: SettingsSection) => {
    navigate(`/settings?section=${section}`);
  };

  const handleLogout = () => {
    clearAuthenticated();
    navigate("/signin", { replace: true });
  };


  return (
    <div className="flex h-screen bg-[#F5F4F6]">
      <GradeForgeSidebar viewMode="student" />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <AuthTopBar
          roleView="student"
          profile={{ name: displayName, email: displayEmail, initials: displayInitials }}
          searchPlaceholder="Search calendar, assignments..."
          onSettingsSectionSelect={goToSettingsSection}
          onLogout={handleLogout}
        />

        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-[24px] font-semibold text-[#2B2A2A]">
                  {classData.code}: {classData.name}
                </h1>
              </div>
              <div className="flex items-center gap-4 text-[13px] text-gray-600">
                <span>{classData.semester}</span>
                <span className="text-gray-300">&bull;</span>
                <span>{classData.section}</span>
                <span className="text-gray-300">&bull;</span>
                <span>Instructor: {classData.instructor}</span>
              </div>
            </div>
            {/* Accessibility: icon-only button needs an accessible label. */}
            <button aria-label="Class settings" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Settings className="w-5 h-5 text-gray-600" strokeWidth={2} />
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="2xl:max-w-7xl 2xl:mx-auto px-8 py-6">
            <div className="mb-4">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 text-[13px] text-[#5D667A] hover:text-[#1F2430] transition-colors"
              >
                <ChevronLeft className="w-4 h-4" strokeWidth={2} />
                <span>Back to Dashboard</span>
              </Link>
            </div>

            <section className="mb-6 rounded-xl border border-[#C9C4C9] bg-white p-2">
              <div className="flex flex-wrap gap-2">
                <SectionTab
                  icon={<Book className="w-4 h-4" strokeWidth={2} />}
                  label="Overview"
                  active={activeSection === "overview"}
                  onClick={() => setActiveSection("overview")}
                />
                <SectionTab
                  icon={<FileText className="w-4 h-4" strokeWidth={2} />}
                  label="Assignments"
                  active={activeSection === "assignments"}
                  onClick={() => setActiveSection("assignments")}
                />
                <SectionTab
                  icon={<BarChart3 className="w-4 h-4" strokeWidth={2} />}
                  label="Grades"
                  active={activeSection === "grades"}
                  onClick={() => setActiveSection("grades")}
                />
              </div>
            </section>

            {activeSection === 'overview' && <OverviewSection />}
            {activeSection === 'assignments' && <AssignmentsSection />}
            {activeSection === 'grades' && <GradesSection />}
          </div>
        </main>
      </div>
    </div>
  );
}

// Navigation Item Component
function SectionTab({
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
    <button
      onClick={onClick}
      className={`
        inline-flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors
        ${active ? "bg-[#7A1226] text-white" : "text-[#44506B] hover:bg-[#F1EEF1]"}
      `}
    >
      <div className="flex items-center gap-2">
        {icon}
        <span>{label}</span>
      </div>
      {badge !== undefined && badge > 0 && (
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${active ? "bg-white text-[#7A1226]" : "bg-[#9F3549] text-white"}`}>
          {badge}
        </span>
      )}
    </button>
  );
}

// Placeholder sections - will be implemented next
function OverviewSection() {
  const { classId } = useParams();
  // NOTE: Overview data now loads from backend-driven service calls.
  const [importantDates, setImportantDates] = useState<ClassImportantDate[]>([]);
  const [overviewStats, setOverviewStats] = useState<ClassOverviewStat[]>([]);
  const [announcements, setAnnouncements] = useState<ClassAnnouncement[]>([]);

  useEffect(() => {
    const resolvedId = classId || "1";
    listClassImportantDates(resolvedId).then(setImportantDates);
    listClassOverviewStats(resolvedId).then(setOverviewStats);
    listClassAnnouncements(resolvedId).then(setAnnouncements);
  }, [classId]);

  const previewAnnouncements = announcements.slice(0, 2);

  return (
    <div className="space-y-6">
      {/* Important Dates */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-[18px] font-semibold text-[#2B2A2A] mb-4">Important Dates</h2>
        <div className="space-y-3">
          {importantDates.length > 0 ? (
            importantDates.map((item) => (
              <DateItem
                key={item.id}
                date={item.date}
                title={item.title}
                description={item.description}
                type={item.type}
              />
            ))
          ) : (
            <p className="text-[13px] text-gray-600">No important dates available yet.</p>
          )}
        </div>
      </div>

      {/* Course Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {overviewStats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="text-[13px] text-gray-600 mb-1">{stat.label}</div>
            <div className={`text-[28px] font-semibold ${stat.valueColor ?? "text-[#2B2A2A]"}`}>
              {stat.value}
            </div>
            <div className={`text-[12px] ${stat.subtitleColor ?? "text-gray-500"} mt-1`}>
              {stat.subtitle}
            </div>
          </div>
        ))}
      </div>

      {/* Recent Announcements Preview */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[18px] font-semibold text-[#2B2A2A]">Recent Announcements</h2>
          <Link
            to="#"
            className="text-[13px] text-[#5A7ACD] hover:text-[#4a6abd] font-medium"
          >
            View All
          </Link>
        </div>
        <div className="space-y-4">
          {previewAnnouncements.length > 0 ? (
            previewAnnouncements.map((announcement) => (
              <AnnouncementPreview
                key={announcement.id}
                title={announcement.title}
                date={announcement.date}
                preview={announcement.content.split("\n")[0]}
                unread={announcement.unread}
              />
            ))
          ) : (
            <p className="text-[13px] text-gray-600">No recent announcements available yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function DateItem({ 
  date, 
  title, 
  description, 
  type 
}: { 
  date: string; 
  title: string; 
  description: string; 
  type: 'assignment' | 'exam';
}) {
  return (
    <div className="flex items-start gap-4 pb-3 border-b border-gray-100 last:border-b-0 last:pb-0">
      <div className="text-center flex-shrink-0">
        <div className="text-[11px] text-gray-500 uppercase tracking-wide">
          {new Date(date).toLocaleDateString('en-US', { month: 'short' })}
        </div>
        <div className="text-[18px] font-semibold text-[#2B2A2A]">
          {new Date(date).getDate()}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-[14px] font-semibold text-[#2B2A2A]">{title}</h3>
          <span className={`
            px-2 py-0.5 text-[10px] font-medium rounded uppercase
            ${type === 'assignment' ? 'bg-blue-50 text-[#5A7ACD]' : 'bg-orange-50 text-[#FEB05D]'}
          `}>
            {type}
          </span>
        </div>
        <p className="text-[13px] text-gray-600">{description}</p>
      </div>
    </div>
  );
}

function AnnouncementPreview({ 
  title, 
  date, 
  preview, 
  unread 
}: { 
  title: string; 
  date: string; 
  preview: string; 
  unread: boolean;
}) {
  return (
    <div className={`pb-4 border-b border-gray-100 last:border-b-0 last:pb-0 ${unread ? 'relative' : ''}`}>
      {unread && (
        <div className="absolute left-0 top-1 w-2 h-2 bg-[#FEB05D] rounded-full"></div>
      )}
      <div className={unread ? 'pl-4' : ''}>
        <div className="flex items-start justify-between mb-1">
          <h3 className={`text-[14px] ${unread ? 'font-semibold' : 'font-medium'} text-[#2B2A2A]`}>
            {title}
          </h3>
          <span className="text-[12px] text-gray-500">{date}</span>
        </div>
        <p className="text-[13px] text-gray-600 line-clamp-2">{preview}</p>
      </div>
    </div>
  );
}

function AssignmentsSection() {
  const { classId } = useParams();
  // NOTE: Assignments now load from the class service for backend handoff.
  const [assignments, setAssignments] = useState<ClassAssignment[]>([]);

  useEffect(() => {
    const resolvedId = classId || "1";
    listClassAssignments(resolvedId).then(setAssignments);
  }, [classId]);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-[18px] font-semibold text-[#2B2A2A] mb-2">Assignments</h2>
        <p className="text-[13px] text-gray-600">
          All programming assignments for this course
        </p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
        <table className="w-full min-w-[1080px]">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-center px-6 py-3 text-[12px] font-semibold text-gray-600 uppercase tracking-wide">
                Assignment
              </th>
              <th className="text-center px-6 py-3 text-[12px] font-semibold text-gray-600 uppercase tracking-wide">
                Language
              </th>
              <th className="w-[200px] text-center px-6 py-3 text-[12px] font-semibold text-gray-600 uppercase tracking-wide">
                Available From
              </th>
              <th className="w-[200px] text-center px-6 py-3 text-[12px] font-semibold text-gray-600 uppercase tracking-wide">
                Due Date
              </th>
              <th className="w-[200px] text-center px-6 py-3 text-[12px] font-semibold text-gray-600 uppercase tracking-wide">
                Late Due Date
              </th>
              <th className="w-[92px] text-center px-3 py-3 text-[12px] font-semibold text-gray-600 uppercase tracking-wide">
                Total Points
              </th>
              <th className="w-[112px] text-center px-3 py-3 text-[12px] font-semibold text-gray-600 uppercase tracking-wide">
                Status
              </th>
              <th className="w-[100px] text-right px-6 py-3 text-[12px] font-semibold text-gray-600 uppercase tracking-wide">
                Grade
              </th>
            </tr>
          </thead>
          <tbody>
            {assignments.map((assignment, index) => (
              <tr
                key={assignment.id}
                className={`
                  border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer
                  ${index === assignments.length - 1 ? 'border-b-0' : ''}
                `}
              >
                <td className="px-6 py-4 text-center">
                  <Link
                    to={`/assignment/${assignment.id}`}
                    className="text-[14px] font-medium text-[#2B2A2A] hover:text-[#5A7ACD] transition-colors"
                  >
                    {assignment.title}
                  </Link>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="inline-flex items-center text-[12px] font-medium text-gray-700">
                    {assignment.language}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="text-[13px] text-gray-600">{assignment.availableFrom}</span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="text-[13px] text-gray-600">{assignment.dueDate}</span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="text-[13px] text-gray-600">{assignment.lateDueDate}</span>
                </td>
                <td className="px-3 py-4 text-center">
                  <span className="text-[13px] font-medium text-[#2B2A2A] whitespace-nowrap">{assignment.totalPoints}</span>
                </td>
                <td className="px-3 py-4 text-center">
                  <span className={`inline-flex items-center gap-1.5 whitespace-nowrap text-[11px] font-medium ${
                    assignment.status === 'graded'
                      ? 'text-green-600'
                      : assignment.status === 'submitted'
                      ? 'text-blue-600'
                      : 'text-orange-600'
                  }`}>
                    {assignment.status === 'graded' && <CheckCircle2 className="w-3 h-3" strokeWidth={2} />}
                    {assignment.status === 'submitted' && <Clock className="w-3 h-3" strokeWidth={2} />}
                    {assignment.status === 'upcoming' && <AlertCircle className="w-3 h-3" strokeWidth={2} />}
                    {assignment.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  {assignment.grade !== null ? (
                    <span className="text-[14px] font-semibold text-[#2B2A2A]">
                      {assignment.grade}/{assignment.totalPoints}
                    </span>
                  ) : (
                    <span className="text-[13px] text-gray-400">&mdash;</span>
                  )}
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
  const { classId } = useParams();
  // NOTE: Grades now load from backend-driven results service mapping.
  const [grades, setGrades] = useState<GradeRow[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([]);
  const [overallSummary, setOverallSummary] = useState<OverallGradeSummary | null>(null);

  useEffect(() => {
    const resolvedId = classId || "1";
    listGradeRows(resolvedId).then(setGrades);
    listCategoryStats(resolvedId).then(setCategoryStats);
    getOverallGradeSummary(resolvedId).then(setOverallSummary);
  }, [classId]);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-[18px] font-semibold text-[#2B2A2A] mb-2">Grades</h2>
        <p className="text-[13px] text-gray-600">
          Your performance and grade breakdown for this course
        </p>
      </div>

      {/* Overall Grade Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[14px] text-gray-600 mb-1">Current Overall Grade</div>
            <div className="flex items-baseline gap-3">
              <span className="text-[36px] font-semibold text-[#2B2A2A]">{overallSummary?.current}</span>
              <span className="text-[20px] font-semibold text-green-600">{overallSummary?.letter}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[13px] text-gray-600 mb-1">Class Average</div>
            <div className="text-[24px] font-semibold text-gray-500">{overallSummary?.classAverage}</div>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-white rounded-lg border border-gray-200 mb-6 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-[15px] font-semibold text-[#2B2A2A]">Grade Breakdown by Category</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-6 py-3 text-[12px] font-semibold text-gray-600 uppercase tracking-wide">
                Category
              </th>
              <th className="text-left px-6 py-3 text-[12px] font-semibold text-gray-600 uppercase tracking-wide">
                Weight
              </th>
              <th className="text-left px-6 py-3 text-[12px] font-semibold text-gray-600 uppercase tracking-wide">
                Completed
              </th>
              <th className="text-right px-6 py-3 text-[12px] font-semibold text-gray-600 uppercase tracking-wide">
                Average
              </th>
            </tr>
          </thead>
          <tbody>
            {categoryStats.map((stat, index) => (
              <tr
                key={stat.category}
                className={`border-b border-gray-100 ${index === categoryStats.length - 1 ? 'border-b-0' : ''}`}
              >
                <td className="px-6 py-4">
                  <span className="text-[14px] font-medium text-[#2B2A2A]">{stat.category}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-[13px] text-gray-600">{stat.weight}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-[13px] text-gray-600">{stat.completed}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="text-[14px] font-semibold text-[#2B2A2A]">{stat.average}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Individual Grades */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-[15px] font-semibold text-[#2B2A2A]">Individual Grades</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-6 py-3 text-[12px] font-semibold text-gray-600 uppercase tracking-wide">
                Assignment
              </th>
              <th className="text-left px-6 py-3 text-[12px] font-semibold text-gray-600 uppercase tracking-wide">
                Category
              </th>
              <th className="text-right px-6 py-3 text-[12px] font-semibold text-gray-600 uppercase tracking-wide">
                Score
              </th>
              <th className="text-right px-6 py-3 text-[12px] font-semibold text-gray-600 uppercase tracking-wide">
                Weight
              </th>
            </tr>
          </thead>
          <tbody>
            {grades.map((grade, index) => (
              <tr
                key={grade.id}
                className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${index === grades.length - 1 ? 'border-b-0' : ''}`}
              >
                <td className="px-6 py-4">
                  <span className="text-[14px] font-medium text-[#2B2A2A]">{grade.name}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-[13px] text-gray-600">{grade.category}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className={`text-[14px] font-semibold ${
                    grade.score >= 90 ? 'text-green-600' : grade.score >= 70 ? 'text-[#FEB05D]' : 'text-red-500'
                  }`}>
                    {grade.score}/{grade.total}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="text-[13px] text-gray-600">{grade.weight}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

