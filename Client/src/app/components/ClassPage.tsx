import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { Settings, ChevronLeft, Book, FileText, Megaphone, BarChart3, FolderOpen, Users, CheckCircle2, Clock, AlertCircle, Download, Mail } from "lucide-react";
import type {
  ClassAnnouncement,
  ClassAssignment,
  ClassHeader,
  ClassImportantDate,
  ClassOverviewStat,
  ClassResource,
  ClassStudent,
  InstructorProfile,
  TeachingAssistantProfile,
} from "../../types/class";
import type { CategoryStat, GradeRow, OverallGradeSummary } from "../../types/grade";
import {
  getClassHeaderById,
  getClassPeople,
  listClassAnnouncements,
  listClassAssignments,
  listClassImportantDates,
  listClassOverviewStats,
  listClassResources,
} from "../../services/classService";
import { getOverallGradeSummary, listCategoryStats, listGradeRows } from "../../services/resultService";

type SectionType = 'overview' | 'assignments' | 'announcements' | 'grades' | 'resources' | 'people';

export function ClassPage() {
  const { classId } = useParams();
  const [activeSection, setActiveSection] = useState<SectionType>('overview');

  // NOTE: Class header data now comes from the mock service.
  const [classHeader, setClassHeader] = useState<ClassHeader | null>(null);

  useEffect(() => {
    const resolvedId = classId || "cs-2400";
    getClassHeaderById(resolvedId).then(setClassHeader);
  }, [classId]);

  // NOTE: Lightweight placeholder keeps layout stable during async load.
  const classData: ClassHeader = classHeader ?? {
    id: classId || "cs-2400",
    code: "",
    name: "",
    section: "",
    semester: "",
    instructor: "",
    instructorEmail: "",
  };


  return (
    <div className="flex h-screen bg-[#F5F2F2]">
      {/* Left Sidebar Navigation */}
      <aside className="w-64 bg-white border-r border-gray-200 flex-shrink-0">
        <div className="h-full flex flex-col">
          {/* Back to Dashboard Link */}
          <div className="px-4 py-4 border-b border-gray-200">
            <Link 
              to="/"
              className="flex items-center gap-2 text-[13px] text-gray-600 hover:text-[#2B2A2A] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" strokeWidth={2} />
              <span>Back to Dashboard</span>
            </Link>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 px-3 py-4">
            <ul className="space-y-1">
              <NavItem
                icon={<Book className="w-4 h-4" strokeWidth={2} />}
                label="Overview"
                active={activeSection === 'overview'}
                onClick={() => setActiveSection('overview')}
              />
              <NavItem
                icon={<FileText className="w-4 h-4" strokeWidth={2} />}
                label="Assignments"
                active={activeSection === 'assignments'}
                onClick={() => setActiveSection('assignments')}
              />
              <NavItem
                icon={<Megaphone className="w-4 h-4" strokeWidth={2} />}
                label="Announcements"
                active={activeSection === 'announcements'}
                onClick={() => setActiveSection('announcements')}
                badge={2}
              />
              <NavItem
                icon={<BarChart3 className="w-4 h-4" strokeWidth={2} />}
                label="Grades"
                active={activeSection === 'grades'}
                onClick={() => setActiveSection('grades')}
              />
              <NavItem
                icon={<FolderOpen className="w-4 h-4" strokeWidth={2} />}
                label="Resources"
                active={activeSection === 'resources'}
                onClick={() => setActiveSection('resources')}
              />
              <NavItem
                icon={<Users className="w-4 h-4" strokeWidth={2} />}
                label="People"
                active={activeSection === 'people'}
                onClick={() => setActiveSection('people')}
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
          <div className="max-w-7xl mx-auto px-8 py-6">
            {activeSection === 'overview' && <OverviewSection />}
            {activeSection === 'assignments' && <AssignmentsSection />}
            {activeSection === 'announcements' && <AnnouncementsSection />}
            {activeSection === 'grades' && <GradesSection />}
            {activeSection === 'resources' && <ResourcesSection />}
            {activeSection === 'people' && <PeopleSection />}
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

// Placeholder sections - will be implemented next
function OverviewSection() {
  const { classId } = useParams();
  // NOTE: Overview data now loads from mock services for backend readiness.
  const [importantDates, setImportantDates] = useState<ClassImportantDate[]>([]);
  const [overviewStats, setOverviewStats] = useState<ClassOverviewStat[]>([]);
  const [announcements, setAnnouncements] = useState<ClassAnnouncement[]>([]);

  useEffect(() => {
    const resolvedId = classId || "cs-2400";
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
          {importantDates.map((item) => (
            <DateItem
              key={item.id}
              date={item.date}
              title={item.title}
              description={item.description}
              type={item.type}
            />
          ))}
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
          {previewAnnouncements.map((announcement) => (
            <AnnouncementPreview
              key={announcement.id}
              title={announcement.title}
              date={announcement.date}
              preview={announcement.content.split("\n")[0]}
              unread={announcement.unread}
            />
          ))}
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
    const resolvedId = classId || "cs-2400";
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
                Status
              </th>
              <th className="text-right px-6 py-3 text-[12px] font-semibold text-gray-600 uppercase tracking-wide">
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
                <td className="px-6 py-4">
                  <Link
                    to={`/assignment/${assignment.id}`}
                    className="text-[14px] font-medium text-[#2B2A2A] hover:text-[#5A7ACD] transition-colors"
                  >
                    {assignment.title}
                  </Link>
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
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${
                    assignment.status === 'graded'
                      ? 'bg-green-50 text-green-600'
                      : assignment.status === 'submitted'
                      ? 'bg-blue-50 text-blue-600'
                      : 'bg-orange-50 text-orange-600'
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

function AnnouncementsSection() {
  const { classId } = useParams();
  // NOTE: Announcements now load from the mock class service.
  const [announcements, setAnnouncements] = useState<ClassAnnouncement[]>([]);

  useEffect(() => {
    const resolvedId = classId || "cs-2400";
    listClassAnnouncements(resolvedId).then(setAnnouncements);
  }, [classId]);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-[18px] font-semibold text-[#2B2A2A] mb-2">Announcements</h2>
        <p className="text-[13px] text-gray-600">
          Important updates and information for this course
        </p>
      </div>

      <div className="space-y-4">
        {announcements.map((announcement) => (
          <div
            key={announcement.id}
            className={`bg-white rounded-lg border p-6 ${
              announcement.unread ? 'border-[#FEB05D]' : 'border-gray-200'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3">
                {announcement.unread && (
                  <div className="mt-1.5 w-2 h-2 bg-[#FEB05D] rounded-full flex-shrink-0"></div>
                )}
                <div>
                  <h3 className={`text-[16px] ${announcement.unread ? 'font-semibold' : 'font-medium'} text-[#2B2A2A] mb-1`}>
                    {announcement.title}
                  </h3>
                  <div className="flex items-center gap-3 text-[12px] text-gray-600">
                    <span>{announcement.author}</span>
                    <span className="text-gray-300">&bull;</span>
                    <span>{announcement.date} at {announcement.time}</span>
                  </div>
                </div>
              </div>
              {announcement.unread && (
                <span className="px-2.5 py-1 bg-[#FEB05D] text-white text-[11px] font-semibold rounded uppercase">
                  New
                </span>
              )}
            </div>
            <p className="text-[14px] text-gray-700 leading-relaxed whitespace-pre-line">
              {announcement.content}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function GradesSection() {
  const { classId } = useParams();
  // NOTE: Grades now load from the mock results service.
  const [grades, setGrades] = useState<GradeRow[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([]);
  const [overallSummary, setOverallSummary] = useState<OverallGradeSummary | null>(null);

  useEffect(() => {
    const resolvedId = classId || "cs-2400";
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

function ResourcesSection() {
  const { classId } = useParams();
  // NOTE: Resources now load from the class service for backend handoff.
  const [resources, setResources] = useState<ClassResource[]>([]);

  useEffect(() => {
    const resolvedId = classId || "cs-2400";
    listClassResources(resolvedId).then(setResources);
  }, [classId]);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-[18px] font-semibold text-[#2B2A2A] mb-2">Resources</h2>
        <p className="text-[13px] text-gray-600">
          Course materials, lecture slides, and reference documents
        </p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-6 py-3 text-[12px] font-semibold text-gray-600 uppercase tracking-wide">
                Name
              </th>
              <th className="text-left px-6 py-3 text-[12px] font-semibold text-gray-600 uppercase tracking-wide">
                Category
              </th>
              <th className="text-left px-6 py-3 text-[12px] font-semibold text-gray-600 uppercase tracking-wide">
                Size
              </th>
              <th className="text-left px-6 py-3 text-[12px] font-semibold text-gray-600 uppercase tracking-wide">
                Uploaded
              </th>
              <th className="text-right px-6 py-3 text-[12px] font-semibold text-gray-600 uppercase tracking-wide">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {resources.map((resource, index) => (
              <tr
                key={resource.id}
                className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${index === resources.length - 1 ? 'border-b-0' : ''}`}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-medium text-[#2B2A2A]">{resource.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-[13px] text-gray-600">{resource.category}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-[13px] text-gray-600">{resource.size}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-[13px] text-gray-600">{resource.uploadedDate}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#5A7ACD] hover:bg-[#4a6abd] text-white rounded-lg text-[12px] font-medium transition-colors">
                    <Download className="w-3.5 h-3.5" strokeWidth={2} />
                    <span>Download</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PeopleSection() {
  const { classId } = useParams();
  // NOTE: People data now comes from the mock class service.
  const [instructor, setInstructor] = useState<InstructorProfile | null>(null);
  const [teachingAssistants, setTeachingAssistants] = useState<TeachingAssistantProfile[]>([]);
  const [students, setStudents] = useState<ClassStudent[]>([]);

  useEffect(() => {
    const resolvedId = classId || "cs-2400";
    getClassPeople(resolvedId).then((people) => {
      setInstructor(people.instructor);
      setTeachingAssistants(people.teachingAssistants);
      setStudents(people.students);
    });
  }, [classId]);

  if (!instructor) {
    return null;
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-[18px] font-semibold text-[#2B2A2A] mb-2">People</h2>
        <p className="text-[13px] text-gray-600">
          Instructor, teaching assistants, and enrolled students
        </p>
      </div>

      {/* Instructor */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h3 className="text-[15px] font-semibold text-[#2B2A2A] mb-4">Instructor</h3>
        <div className="flex items-start justify-between">
          <div>
            <h4 className="text-[16px] font-semibold text-[#2B2A2A] mb-2">{instructor.name}</h4>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-[13px] text-gray-600">
                <Mail className="w-4 h-4" strokeWidth={2} />
                <a href={`mailto:${instructor.email}`} className="hover:text-[#5A7ACD] transition-colors">
                  {instructor.email}
                </a>
              </div>
              <div className="text-[13px] text-gray-600">
                <strong>Office Hours:</strong> {instructor.officeHours}
              </div>
              <div className="text-[13px] text-gray-600">
                <strong>Office:</strong> {instructor.office}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Teaching Assistants */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h3 className="text-[15px] font-semibold text-[#2B2A2A] mb-4">Teaching Assistants</h3>
        <div className="space-y-4">
          {teachingAssistants.map((ta) => (
            <div key={ta.id} className="pb-4 border-b border-gray-100 last:border-b-0 last:pb-0">
              <h4 className="text-[14px] font-semibold text-[#2B2A2A] mb-2">{ta.name}</h4>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[13px] text-gray-600">
                  <Mail className="w-3.5 h-3.5" strokeWidth={2} />
                  <a href={`mailto:${ta.email}`} className="hover:text-[#5A7ACD] transition-colors">
                    {ta.email}
                  </a>
                </div>
                <div className="text-[12px] text-gray-600">
                  <strong>Office Hours:</strong> {ta.officeHours} &bull; <strong>Office:</strong> {ta.office}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Students */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-[15px] font-semibold text-[#2B2A2A]">Enrolled Students ({students.length})</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-6 py-3 text-[12px] font-semibold text-gray-600 uppercase tracking-wide">
                Name
              </th>
              <th className="text-left px-6 py-3 text-[12px] font-semibold text-gray-600 uppercase tracking-wide">
                Email
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
                  <span className="text-[14px] font-medium text-[#2B2A2A]">{student.name}</span>
                </td>
                <td className="px-6 py-4">
                  <a
                    href={`mailto:${student.email}`}
                    className="text-[13px] text-gray-600 hover:text-[#5A7ACD] transition-colors"
                  >
                    {student.email}
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
