import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ChevronLeft, FileText } from "lucide-react";
import type { GradingAssistantCourseResponse } from "../../../types/gradingAssistantCourse";
import type { AssignmentBasicResponse } from "../../../types/gradingAssistantAssignment";
import { listGradingAssistantCourses } from "../../../services/gradingAssistantCourseService";
import { listAssignmentsByCourse } from "../../../services/gradingAssistantAssignmentService";
import { clearAuthenticated, getAuthenticatedUser } from "../../auth";
import { AuthShell } from "../layout/AuthShell";
import { AuthTopBar } from "../layout/AuthTopBar";
import type { SettingsSection } from "../layout/AuthTopBar";

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export function GradingAssistantClassPage() {
  const { classId } = useParams();
  const navigate = useNavigate();
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

  const [course, setCourse] = useState<GradingAssistantCourseResponse | null>(null);
  const [assignments, setAssignments] = useState<AssignmentBasicResponse[]>([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const courseIdNum = classId ? Number(classId) : 0;

  useEffect(() => {
    if (!classId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    listGradingAssistantCourses()
      .then((courses) => {
        const id = Number(classId);
        const found = courses.find((c) => c.id === id);
        setCourse(found ?? null);
        if (!found) setError("Course not found or you are not assigned to it.");
      })
      .catch(() => setError("Failed to load course."))
      .finally(() => setLoading(false));
  }, [classId]);

  useEffect(() => {
    if (!courseIdNum || !course) return;
    setAssignmentsLoading(true);
    listAssignmentsByCourse(courseIdNum)
      .then(setAssignments)
      .catch(() => setAssignments([]))
      .finally(() => setAssignmentsLoading(false));
  }, [courseIdNum, course]);

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
      mainContent={
        <main className="flex-1 overflow-y-auto bg-[#F5F2F2]">
          <div className="max-w-7xl mx-auto px-8 py-6">
            <Link
              to="/grading-assistant/courses"
              className="inline-flex items-center gap-1.5 text-[13px] text-gray-600 hover:text-[#2B2A2A] transition-colors mb-4"
            >
              <ChevronLeft className="w-4 h-4" strokeWidth={2} />
              Back to Courses
            </Link>

            {loading && <p className="text-[14px] text-gray-600">Loading course…</p>}
            {error && !loading && (
              <div className="rounded-2xl border border-gray-200 bg-white p-6">
                <p className="text-[14px] text-red-600">{error}</p>
                <Link to="/grading-assistant/courses" className="mt-3 inline-block text-[13px] font-medium text-[#5A7ACD]">
                  Back to Courses
                </Link>
              </div>
            )}
            {!loading && course && (
              <>
                <header className="bg-white rounded-2xl border border-gray-200 px-8 py-6 mb-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-[24px] font-semibold text-[#2B2A2A]">
                          {course.courseCode}: {course.name}
                        </h1>
                        {course.section && (
                          <span className="px-3 py-1 bg-[#EEF3FF] text-[#5A7ACD] text-[11px] font-semibold rounded uppercase">
                            {course.section}
                          </span>
                        )}
                      </div>
                      {course.semester && (
                        <p className="text-[13px] text-gray-600">{course.semester.name}</p>
                      )}
                      {course.faculty && (
                        <p className="text-[13px] text-gray-600 mt-1">
                          Instructor: {course.faculty.name}
                          {course.faculty.email ? ` · ${course.faculty.email}` : ""}
                        </p>
                      )}
                    </div>
                  </div>
                </header>

                <div className="space-y-6">
                  <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-[#5A7ACD]" strokeWidth={2} />
                        <div>
                          <h2 className="text-[18px] font-semibold text-[#2B2A2A]">Assignments</h2>
                          <p className="text-[13px] text-gray-600">
                            Assignments you can help grade in this course.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[720px]">
                        <thead>
                          <tr className="border-b border-gray-200 bg-gray-50">
                            <th className="text-left px-6 py-3 text-[12px] font-semibold text-gray-600 uppercase tracking-wide">
                              Assignment
                            </th>
                            <th className="text-left px-6 py-3 text-[12px] font-semibold text-gray-600 uppercase tracking-wide">
                              Total Points
                            </th>
                            <th className="text-left px-6 py-3 text-[12px] font-semibold text-gray-600 uppercase tracking-wide">
                              Available From
                            </th>
                            <th className="text-left px-6 py-3 text-[12px] font-semibold text-gray-600 uppercase tracking-wide">
                              Due Date
                            </th>
                            <th className="text-left px-6 py-3 text-[12px] font-semibold text-gray-600 uppercase tracking-wide">
                              Late Due
                            </th>
                            <th className="text-right px-6 py-3 text-[12px] font-semibold text-gray-600 uppercase tracking-wide">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {assignmentsLoading ? (
                            Array.from({ length: 4 }).map((_, index) => (
                              <tr
                                key={`ga-assignments-skeleton-${index}`}
                                className="border-b border-gray-100 last:border-b-0"
                              >
                                <td className="px-6 py-4">
                                  <div className="h-4 w-40 rounded bg-gray-200 animate-pulse" />
                                </td>
                                <td className="px-6 py-4">
                                  <div className="h-4 w-16 rounded bg-gray-200 animate-pulse" />
                                </td>
                                <td className="px-6 py-4">
                                  <div className="h-4 w-28 rounded bg-gray-200 animate-pulse" />
                                </td>
                                <td className="px-6 py-4">
                                  <div className="h-4 w-28 rounded bg-gray-200 animate-pulse" />
                                </td>
                                <td className="px-6 py-4">
                                  <div className="h-4 w-24 rounded bg-gray-200 animate-pulse" />
                                </td>
                                <td className="px-6 py-4">
                                  <div className="ml-auto h-8 w-24 rounded-lg bg-gray-100 animate-pulse" />
                                </td>
                              </tr>
                            ))
                          ) : assignments.length === 0 ? (
                            <tr>
                              <td
                                colSpan={6}
                                className="px-6 py-6 text-center text-[13px] text-gray-600"
                              >
                                No assignments in this course yet.
                              </td>
                            </tr>
                          ) : (
                            assignments.map((a, index) => (
                              <tr
                                key={a.id}
                                className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                                  index === assignments.length - 1 ? "border-b-0" : ""
                                }`}
                              >
                                <td className="px-6 py-4">
                                  <div className="min-w-0">
                                    <Link
                                      to={`/grading-assistant/class/${classId}/assignment/${a.id}`}
                                      className="text-[14px] font-medium text-[#2B2A2A] hover:text-[#5A7ACD] transition-colors"
                                    >
                                      {a.name}
                                    </Link>
                                    {a.description && (
                                      <p className="mt-0.5 text-[13px] text-gray-600 line-clamp-2">
                                        {a.description}
                                      </p>
                                    )}
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="text-[13px] text-gray-700">
                                    {a.totalPoints != null ? `${a.totalPoints} pts` : "—"}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="text-[13px] text-gray-700">
                                    {formatDate(a.availableFrom)}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="text-[13px] text-gray-700">
                                    {formatDate(a.dueDate)}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="text-[13px] text-gray-700">
                                    {formatDate(a.lateDueDate)}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <Link
                                    to={`/grading-assistant/class/${classId}/assignment/${a.id}`}
                                    className="inline-flex h-8 items-center justify-center rounded-lg bg-[#5A7ACD] px-3 text-[12px] font-semibold text-white hover:bg-[#4a6abd] transition-colors"
                                  >
                                    View details
                                  </Link>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </section>
                </div>
              </>
            )}
          </div>
        </main>
      }
    />
  );
}
