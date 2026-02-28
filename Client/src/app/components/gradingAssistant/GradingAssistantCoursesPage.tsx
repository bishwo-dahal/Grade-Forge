import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import type { GradingAssistantCourseResponse } from "../../../types/gradingAssistantCourse";
import { listGradingAssistantCourses } from "../../../services/gradingAssistantCourseService";
import { clearAuthenticated, getAuthenticatedUser } from "../../auth";
import { AuthShell } from "../layout/AuthShell";
import { AuthTopBar } from "../layout/AuthTopBar";
import type { SettingsSection } from "../layout/AuthTopBar";

export function GradingAssistantCoursesPage() {
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

  const [courses, setCourses] = useState<GradingAssistantCourseResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    listGradingAssistantCourses()
      .then(setCourses)
      .catch(() => setError("Failed to load courses."))
      .finally(() => setLoading(false));
  }, []);

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
          searchPlaceholder="Search courses..."
          onSettingsSectionSelect={goToSettingsSection}
          onLogout={handleLogout}
        />
      }
      mainContent={
        <main className="flex-1 overflow-y-auto bg-[#F5F2F2] px-6 py-5">
          <div className="mb-5">
            <h1 className="text-[18px] font-semibold text-[#2B2A2A]">Courses</h1>
            <p className="text-[13px] text-gray-600">
              Courses you are assigned to as a grading assistant.
            </p>
          </div>

          {loading && <p className="text-[13px] text-gray-600">Loading courses…</p>}
          {error && !loading && <p className="text-[13px] text-red-600">{error}</p>}
          {!loading && !error && courses.length === 0 && (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-8 text-center">
              <p className="text-[13px] text-gray-600">
                You are not assigned to any courses yet.
              </p>
              <Link to="/dashboard" className="mt-3 inline-block text-[13px] font-medium text-[#5A7ACD] hover:text-[#4a6abd]">
                Back to Dashboard
              </Link>
            </div>
          )}
          {!loading && !error && courses.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {courses.map((course) => (
                <Link
                  key={course.id}
                  to={`/grading-assistant/class/${course.id}`}
                  className="block bg-white rounded-2xl p-6 border border-gray-200 hover:border-[#5A7ACD]/60 hover:shadow-md transition-all"
                >
                  <div className="flex items-start gap-4 mb-3">
                    <div className="w-12 h-12 bg-[#EEF3FF] rounded-xl flex items-center justify-center text-[#5A7ACD] flex-shrink-0">
                      <span className="text-lg font-semibold">
                        {(course.courseCode || course.name).slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] text-gray-500 uppercase tracking-wide mb-1">
                        {course.courseCode}
                        {course.section ? ` · ${course.section}` : ""}
                      </div>
                      <h3 className="text-[14px] font-semibold text-[#2B2A2A] leading-snug line-clamp-2">
                        {course.name}
                      </h3>
                    </div>
                  </div>
                  {course.faculty && (
                    <p className="text-[12px] text-gray-600">Instructor: {course.faculty.name}</p>
                  )}
                  {course.semester && (
                    <p className="text-[12px] text-gray-500 mt-0.5">{course.semester.name}</p>
                  )}
                  <div className="mt-4 w-full py-2.5 bg-gray-50 hover:bg-gray-100 text-[#2B2A2A] rounded-lg text-[13px] font-medium transition-colors text-center">
                    View Course
                  </div>
                </Link>
              ))}
            </div>
          )}
        </main>
      }
    />
  );
}
