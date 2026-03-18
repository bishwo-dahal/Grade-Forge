import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { ChevronLeft, BarChart3, FileText } from "lucide-react";
import { getCourseGradeReport } from "../../../services/gradeReportService";
import type { CourseGradeReportStudent } from "../../../types/gradeReport";
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
  const courseId = useMemo(() => Number(classId || "0") || 0, [classId]);
  const parsedStudentId = useMemo(() => Number(studentId || "0") || 0, [studentId]);

  const [avgMode, setAvgMode] = useState<AvgMode>("gradedOnly");
  const [student, setStudent] = useState<CourseGradeReportStudent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (courseId <= 0 || parsedStudentId <= 0) return;
    setIsLoading(true);
    setErrorMessage(null);
    getCourseGradeReport(courseId, [parsedStudentId])
      .then((report) => {
        setStudent(report.students?.[0] ?? null);
      })
      .catch((err) => {
        const apiMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
        setErrorMessage(typeof apiMessage === "string" && apiMessage.trim() ? apiMessage : "Failed to load student grades.");
        setStudent(null);
      })
      .finally(() => setIsLoading(false));
  }, [courseId, parsedStudentId]);

  const overallPercent = useMemo(() => (student ? computeOverallPercent(student, avgMode) : 0), [student, avgMode]);

  return (
    <div className="min-h-screen bg-[#F5F2F2]">
      <header className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Link
                to={`/faculty/class/${classId ?? "1"}/students`}
                className="inline-flex items-center gap-2 text-[13px] text-gray-600 hover:text-[#2B2A2A] transition-colors mb-3"
              >
                <ChevronLeft className="w-4 h-4" strokeWidth={2} />
                <span>Back to Students</span>
              </Link>
              <h1 className="text-[22px] font-semibold text-[#2B2A2A]">
                {student?.studentName ?? "Student"}{" "}
                <span className="text-[13px] font-medium text-gray-500">
                  (Class {classId ?? "—"})
                </span>
              </h1>
              <p className="text-[13px] text-gray-600 mt-1">
                Assignment grades and status for this class.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex flex-col items-end">
                <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Overall</div>
                <div className="text-[26px] font-semibold text-[#2B2A2A] tabular-nums">{overallPercent}%</div>
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
      </header>

      <main className="max-w-7xl mx-auto px-8 py-6">
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
      </main>
    </div>
  );
}

