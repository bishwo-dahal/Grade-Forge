import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import type { GradingAssistantCourseResponse } from "../../../types/gradingAssistantCourse";
import { listGradingAssistantCourses } from "../../../services/gradingAssistantCourseService";
import { clearAuthenticated, getAuthenticatedUser } from "../../auth";
import { AuthShell } from "../layout/AuthShell";
import { AuthTopBar } from "../layout/AuthTopBar";
import type { SettingsSection } from "../layout/AuthTopBar";
import { SegmentedFilter } from "../ui/SegmentedFilter";
import { BookOpen } from "lucide-react";
import { GradingAssistantCourseCard } from "./GradingAssistantCourseCard";

type GACourseFilter = "all" | "active" | "archived";

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
  const [selectedFilter, setSelectedFilter] = useState<GACourseFilter>("all");

  useEffect(() => {
    setLoading(true);
    setError(null);
    listGradingAssistantCourses()
      .then(setCourses)
      .catch(() => setError("Failed to load courses."))
      .finally(() => setLoading(false));
  }, []);

  const activeCourses = useMemo(
    () => courses.filter((c) => c.active !== false),
    [courses]
  );
  const archivedCourses = useMemo(
    () => courses.filter((c) => c.active === false),
    [courses]
  );
  const filteredCourses = useMemo(() => {
    if (selectedFilter === "active") return activeCourses;
    if (selectedFilter === "archived") return archivedCourses;
    return courses;
  }, [activeCourses, archivedCourses, courses, selectedFilter]);

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
        <main className="flex-1 overflow-y-auto bg-[#F5F2F2]">
          <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div>
              <h1 className="text-[18px] font-semibold text-[#2B2A2A]">Courses</h1>
              <p className="text-[13px] text-gray-600">
                Courses you are assigned to as a grading assistant.
              </p>
            </div>
            <div className="inline-flex h-10 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 text-[12px] font-medium text-[#3E4E67]">
              <BookOpen className="h-4 w-4 text-[#5A7ACD]" strokeWidth={2} />
              <span>Total Courses:</span>
              <span className="text-[13px] font-semibold text-[#1F2430]">{courses.length}</span>
            </div>
          </div>

          <section className="mt-1 flex flex-wrap items-center justify-between gap-3">
            {courses.length > 0 && (
              <SegmentedFilter
                items={[
                  { id: "all", label: "All Courses", count: courses.length },
                  {
                    id: "active",
                    label: "Active",
                    count: activeCourses.length,
                  },
                  {
                    id: "archived",
                    label: "Archived",
                    count: archivedCourses.length,
                  },
                ]}
                value={selectedFilter}
                onValueChange={(value) => setSelectedFilter(value as GACourseFilter)}
              />
            )}
          </section>

          {loading && <p className="mt-6 text-[13px] text-gray-600">Loading courses…</p>}
          {error && !loading && <p className="mt-6 text-[13px] text-red-600">{error}</p>}

          {!loading && !error && courses.length === 0 && (
            <div className="mt-6 rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-8 text-center">
              <p className="text-[13px] text-gray-600">
                You are not assigned to any courses yet.
              </p>
              <Link
                to="/dashboard"
                className="mt-3 inline-block text-[13px] font-medium text-[#5A7ACD] hover:text-[#4a6abd]"
              >
                Back to Dashboard
              </Link>
            </div>
          )}

          {!loading && !error && courses.length > 0 && (
            <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredCourses.map((course) => (
                <GradingAssistantCourseCard key={course.id} course={course} />
              ))}
            </section>
          )}
          </div>
        </main>
      }
    />
  );
}
