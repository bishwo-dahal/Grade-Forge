import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import {
  Settings,
  ChevronLeft,
  LayoutDashboard,
  FileText,
  BarChart3,
  Users,
  UsersRound,
  UserPlus,
} from "lucide-react";
import { getCourseGradeReport, getStudentCourseStats } from "../../../services/gradeReportService";
import type { CourseGradeReportStudent } from "../../../types/gradeReport";
import type { StudentCourseStats } from "../../../types/studentCourseStats";
import { SegmentedFilter } from "../ui/SegmentedFilter";

type AvgMode = "gradedOnly" | "includeMissing";

function computeOverallPercent(student: CourseGradeReportStudent, mode: AvgMode): number {
  const assignments = student.assignments ?? [];
  if (assignments.length === 0) return 0;

  const relevant =
    mode === "gradedOnly"
      ? assignments.filter((a) => a.status === "GRADED" && a.score != null)
      : assignments;

  const earned = relevant.reduce((sum, a) => sum + Number(a.score ?? 0), 0);
  const total = relevant.reduce((sum, a) => sum + Number(a.maxScore ?? 0), 0);
  if (total <= 0) return 0;
  return Math.round((earned / total) * 100);
}

const statusLabel: Record<string, string> = {
  NOT_SUBMITTED: "Not submitted",
  SUBMITTED: "Submitted",
  GRADED: "Graded",
};

export function FacultyClassStudentDetailPage() {
  const { classId, studentId } = useParams();
  const resolvedClassId = classId ?? "1";
  const courseId = useMemo(() => Number(classId || "0") || 0, [classId]);
  const parsedStudentId = useMemo(() => Number(studentId || "0") || 0, [studentId]);

  const [avgMode, setAvgMode] = useState<AvgMode>("gradedOnly");
  const [student, setStudent] = useState<CourseGradeReportStudent | null>(null);
  const [stats, setStats] = useState<StudentCourseStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (courseId <= 0 || parsedStudentId <= 0) return;
    setIsLoading(true);
    setErrorMessage(null);
    Promise.all([
      getCourseGradeReport(courseId, [parsedStudentId]),
      getStudentCourseStats(courseId, parsedStudentId),
    ])
      .then(([report, studentStats]) => {
        setStudent(report.students?.[0] ?? null);
        setStats(studentStats);
      })
      .catch((err) => {
        const apiMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
        setErrorMessage(typeof apiMessage === "string" && apiMessage.trim() ? apiMessage : "Failed to load student details.");
        setStudent(null);
        setStats(null);
      })
      .finally(() => setIsLoading(false));
  }, [courseId, parsedStudentId]);

  const overallPercent = useMemo(() => (student ? computeOverallPercent(student, avgMode) : 0), [student, avgMode]);
  const displayedOverall = useMemo(() => {
    if (!stats) return overallPercent;
    return avgMode === "includeMissing" ? stats.overallPercentIncludingMissing : stats.overallPercentGradedOnly;
  }, [stats, avgMode, overallPercent]);

  return (
    <div className="flex h-screen bg-[#F5F2F2]">
      <aside className="w-64 bg-white border-r border-gray-200 flex-shrink-0">
        <div className="h-full flex flex-col">
          <div className="px-4 py-4 border-b border-gray-200">
            <Link
              to="/dashboard"
              className="flex items-center gap-2 text-[13px] text-gray-600 hover:text-[#2B2A2A] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" strokeWidth={2} />
              <span>Back to Dashboard</span>
            </Link>
          </div>
          <nav className="flex-1 px-3 py-4 overflow-y-auto">
            <ul className="space-y-1">
              <NavItem
                icon={<LayoutDashboard className="w-4 h-4" strokeWidth={2} />}
                label="Dashboard"
                active={false}
                to={`/faculty/class/${resolvedClassId}/dashboard`}
              />
              <NavItem
                icon={<FileText className="w-4 h-4" strokeWidth={2} />}
                label="Assignments"
                active={false}
                to={`/faculty/class/${resolvedClassId}/assignments`}
              />
              <NavItem
                icon={<BarChart3 className="w-4 h-4" strokeWidth={2} />}
                label="Grades"
                active={false}
                to={`/faculty/class/${resolvedClassId}/grades`}
              />
              <NavItem
                icon={<Users className="w-4 h-4" strokeWidth={2} />}
                label="Students"
                active
                to={`/faculty/class/${resolvedClassId}/students`}
              />
              <NavItem
                icon={<UserPlus className="w-4 h-4" strokeWidth={2} />}
                label="Grading Assistants"
                active={false}
                to={`/faculty/class/${resolvedClassId}/assistants`}
              />
              <NavItem
                icon={<UsersRound className="w-4 h-4" strokeWidth={2} />}
                label="Groups"
                active={false}
                to={`/faculty/class/${resolvedClassId}/groups`}
              />
              <NavItem
                icon={<Settings className="w-4 h-4" strokeWidth={2} />}
                label="Settings"
                active={false}
                to={`/faculty/class/${resolvedClassId}/settings`}
              />
            </ul>
          </nav>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-8 py-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-[24px] font-semibold text-[#2B2A2A]">Student Grades</h1>
              </div>
              <div className="flex items-center gap-4 text-[13px] text-gray-600">
                <span>Class {resolvedClassId}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-8 py-6">
            <div className="mb-6">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Link
                      to={`/faculty/class/${resolvedClassId}/students`}
                      className="text-[13px] text-[#5A7ACD] hover:text-[#4a6abd] font-medium"
                    >
                      Back to roster
                    </Link>
                  </div>
                  <h2 className="text-[18px] font-semibold text-[#2B2A2A]">
                    {student?.studentName ?? "Student"} — Grades
                  </h2>
                  <p className="text-[13px] text-gray-600 mt-1">
                    Assignment grades and status for this class.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex flex-col items-end">
                    <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Overall</div>
                    <div className="text-[26px] font-semibold text-[#2B2A2A] tabular-nums">{displayedOverall}%</div>
                  </div>
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
            </div>

            {/* Student stats overview */}
            {stats ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                <StatCard
                  label="Submission rate"
                  value={`${stats.submittedAssignments}/${stats.totalAssignments} (${stats.submissionRatePercent}%)`}
                />
                <StatCard
                  label="Missing"
                  value={String(stats.missingAssignments)}
                />
                <StatCard
                  label="Late"
                  value={String(stats.lateSubmissions)}
                />
                <StatCard
                  label="Last activity"
                  value={
                    stats.lastActivity
                      ? `${stats.lastActivity.assignmentName} • ${new Date(stats.lastActivity.submittedAt).toLocaleString()}`
                      : "—"
                  }
                />
                <StatCard
                  label="Trend (last graded)"
                  value={stats.trend?.length ? `${stats.trend.length} items` : "—"}
                />
                <StatCard
                  label="Plagiarism flags"
                  value={stats.plagiarismFlagCount != null ? String(stats.plagiarismFlagCount) : "—"}
                />
                <StatCard
                  label="Time on task"
                  value={stats.timeOnTaskMinutes != null ? `${stats.timeOnTaskMinutes} min` : "—"}
                />
                <StatCard
                  label="Rubric breakdown"
                  value={stats.rubricBreakdownSummary ?? "—"}
                />
              </div>
            ) : null}

            {/* Trend table */}
            {stats?.trend?.length ? (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm mb-6">
                <div className="px-6 py-4 border-b border-gray-200 bg-[#F8F9FB] flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[13px] font-semibold text-[#2B2A2A]">
                    <BarChart3 className="w-4 h-4 text-gray-500" strokeWidth={2} />
                    Recent graded trend
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px]">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="text-left px-6 py-3 text-[12px] font-semibold text-gray-600 uppercase tracking-wide">
                          Assignment
                        </th>
                        <th className="text-right px-6 py-3 text-[12px] font-semibold text-gray-600 uppercase tracking-wide w-44">
                          Score
                        </th>
                        <th className="text-right px-6 py-3 text-[12px] font-semibold text-gray-600 uppercase tracking-wide w-56">
                          Graded at
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.trend.map((t, idx) => (
                        <tr
                          key={`${t.assignmentId}-${t.gradedAt}`}
                          className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx === stats.trend.length - 1 ? "border-b-0" : ""}`}
                        >
                          <td className="px-6 py-4">
                            <span className="text-[14px] font-medium text-[#2B2A2A]">{t.assignmentName}</span>
                          </td>
                          <td className="px-6 py-4 text-right text-[13px] font-semibold text-[#2B2A2A] tabular-nums">
                            {t.score.toFixed(2)} / {t.maxScore.toFixed(1)}
                          </td>
                          <td className="px-6 py-4 text-right text-[13px] text-gray-600">
                            {new Date(t.gradedAt).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

        {errorMessage ? (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
            {errorMessage}
          </div>
        ) : null}

        {isLoading ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-[14px] text-gray-600">
            Loading student grades…
          </div>
        ) : student ? (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200 bg-[#F8F9FB] flex items-center justify-between">
              <div className="flex items-center gap-2 text-[13px] font-semibold text-[#2B2A2A]">
                <FileText className="w-4 h-4 text-gray-500" strokeWidth={2} />
                Assignments
              </div>
              <div className="flex items-center gap-2 text-[12px] text-gray-600">
                <BarChart3 className="w-4 h-4 text-gray-400" strokeWidth={2} />
                <span>
                  Avg mode:{" "}
                  <span className="font-medium text-[#2B2A2A]">
                    {avgMode === "gradedOnly" ? "Graded only" : "Include missing as 0"}
                  </span>
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px]">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left px-6 py-3 text-[12px] font-semibold text-gray-600 uppercase tracking-wide">
                      Assignment
                    </th>
                    <th className="text-right px-6 py-3 text-[12px] font-semibold text-gray-600 uppercase tracking-wide w-44">
                      Score
                    </th>
                    <th className="text-left px-6 py-3 text-[12px] font-semibold text-gray-600 uppercase tracking-wide w-32">
                      Status
                    </th>
                    <th className="text-right px-6 py-3 text-[12px] font-semibold text-gray-600 uppercase tracking-wide w-40">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {student.assignments.map((a, index) => {
                    const scoreText =
                      a.score != null ? `${a.score.toFixed(2)} / ${a.maxScore.toFixed(1)}` : `— / ${a.maxScore.toFixed(1)}`;
                    const label = statusLabel[a.status] ?? a.status;
                    const pillStyle =
                      a.status === "GRADED"
                        ? "bg-emerald-100 text-emerald-800"
                        : a.status === "SUBMITTED"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-gray-100 text-gray-600";
                    return (
                      <tr
                        key={a.assignmentId}
                        className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${index === student.assignments.length - 1 ? "border-b-0" : ""}`}
                      >
                        <td className="px-6 py-4">
                          <span className="text-[14px] font-medium text-[#2B2A2A]">{a.assignmentName}</span>
                        </td>
                        <td className="px-6 py-4 text-right text-[13px] font-semibold text-[#2B2A2A] tabular-nums">
                          {scoreText}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium ${pillStyle}`}>
                            {label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            to={`/faculty/class/${classId ?? "1"}/assignment/${a.assignmentId}`}
                            className="inline-flex items-center justify-center px-3 py-2 rounded-lg border border-gray-300 bg-white text-[12px] font-medium text-[#2B2A2A] hover:bg-gray-50 transition-colors"
                          >
                            Open assignment
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-[14px] text-gray-600">
            No grade data found for this student in this class.
          </div>
              )}
          </div>
        </main>
      </div>
    </div>
  );
}

function NavItem({
  icon,
  label,
  active,
  to,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  to: string;
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
      </Link>
    </li>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 px-4 py-3">
      <p className="text-[12px] text-[#5D6A80]">{label}</p>
      <p className="mt-1 text-[16px] font-semibold text-[#2B2A2A]">{value}</p>
    </div>
  );
}

