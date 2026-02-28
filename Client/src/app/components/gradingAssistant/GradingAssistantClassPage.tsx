import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ChevronLeft, FileText, Send } from "lucide-react";
import type { GradingAssistantCourseResponse } from "../../../types/gradingAssistantCourse";
import { listGradingAssistantCourses } from "../../../services/gradingAssistantCourseService";
import { clearAuthenticated, getAuthenticatedUser } from "../../auth";
import { AuthShell } from "../layout/AuthShell";
import { AuthTopBar } from "../layout/AuthTopBar";
import type { SettingsSection } from "../layout/AuthTopBar";

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          <div className="max-w-5xl mx-auto px-8 py-6">
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
                  <section className="bg-white rounded-2xl border border-gray-200 p-6">
                    <h2 className="text-[18px] font-semibold text-[#2B2A2A] mb-4 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-[#5A7ACD]" strokeWidth={2} />
                      Assignments
                    </h2>
                    <p className="text-[14px] text-gray-600">
                      Assignment list and grading tasks will be available here.
                    </p>
                  </section>
                  <section className="bg-white rounded-2xl border border-gray-200 p-6">
                    <h2 className="text-[18px] font-semibold text-[#2B2A2A] mb-4 flex items-center gap-2">
                      <Send className="w-5 h-5 text-[#5A7ACD]" strokeWidth={2} />
                      Submissions
                    </h2>
                    <p className="text-[14px] text-gray-600">
                      Student submissions to grade will appear here.
                    </p>
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
