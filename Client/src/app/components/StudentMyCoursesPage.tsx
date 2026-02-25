import { useEffect, useMemo, useState } from "react";
import { Filter } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { clearAuthenticated, getAuthenticatedUser } from "../auth";
import { listEnrolledCourses } from "../../services/classService";
import type { CourseCard } from "../../types/class";
import { AuthShell } from "./layout/AuthShell";
import { AuthTopBar } from "./layout/AuthTopBar";
import type { SettingsSection } from "./layout/AuthTopBar";

type CourseLayoutMode = "grid" | "list";

interface StudentMyCoursesViewProps {
  // NOTE: This component is presentation-only. Data is injected by the page/container.
  courses: CourseCard[];
  isLoading: boolean;
  layoutMode: CourseLayoutMode;
  onLayoutModeChange: (mode: CourseLayoutMode) => void;
}

function StudentMyCoursesView({ courses, isLoading, layoutMode, onLayoutModeChange }: StudentMyCoursesViewProps) {
  const isGrid = layoutMode === "grid";

  return (
    <main className="flex-1 overflow-y-auto bg-[#F5F2F2] px-8 py-6">
      <section className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#CFD2D9] bg-[#F2F3F5] px-4 text-[14px] font-medium text-[#2B2A2A]"
          >
            <Filter className="h-4 w-4 text-[#5D667A]" strokeWidth={2} />
            Filter
          </button>
          <p className="text-[14px] text-[#5D667A]">
            Showing <span className="font-semibold text-[#2B2A2A]">{courses.length}</span> classes
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onLayoutModeChange("grid")}
            className={`h-10 rounded-xl border px-5 text-[14px] font-medium transition-colors ${
              isGrid
                ? "border-[#CFD2D9] bg-white text-[#2B2A2A]"
                : "border-transparent bg-transparent text-[#6F7686] hover:bg-white/80"
            }`}
          >
            Grid View
          </button>
          <button
            type="button"
            onClick={() => onLayoutModeChange("list")}
            className={`h-10 rounded-xl border px-5 text-[14px] font-medium transition-colors ${
              !isGrid
                ? "border-[#CFD2D9] bg-white text-[#2B2A2A]"
                : "border-transparent bg-transparent text-[#6F7686] hover:bg-white/80"
            }`}
          >
            List View
          </button>
        </div>
      </section>

      <section className={`mt-6 grid gap-5 ${isGrid ? "grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3" : "grid-cols-1"}`}>
        {isLoading
          ? Array.from({ length: isGrid ? 6 : 3 }).map((_, index) => (
              <article
                key={`student-courses-skeleton-${index}`}
                // NOTE: Skeleton cards keep My Courses layout visible while enrolled-course data is loading.
                className="rounded-2xl border border-gray-200 bg-white p-5 animate-pulse"
              >
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-[#EEF2FA]" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-28 rounded bg-gray-200" />
                    <div className="h-4 w-52 max-w-full rounded bg-gray-200" />
                  </div>
                </div>
                <div className="mt-5 space-y-2">
                  <div className="h-3 w-36 rounded bg-gray-200" />
                  <div className="h-3 w-24 rounded bg-gray-200" />
                </div>
                <div className="mt-5 space-y-2">
                  <div className="h-3 w-full rounded bg-gray-200" />
                  <div className="h-2 w-full rounded-full bg-gray-100" />
                  <div className="h-3 w-28 rounded bg-gray-200" />
                </div>
                <div className="mt-5 h-10 w-full rounded-xl bg-gray-100" />
              </article>
            ))
          : null}
        {!isLoading &&
          courses.map((course) => {
            const assignmentsLeft = course.total - course.completed;
            const progress = course.total > 0 ? (course.completed / course.total) * 100 : 0;

            return (
              <article key={course.id} className="rounded-2xl border border-gray-200 bg-white p-5">
                <div className="flex items-start gap-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl text-xl ${course.iconBg}`}>
                    {course.icon}
                  </div>
                  <div>
                    <p className="text-[12px] uppercase tracking-wide text-[#738099]">
                      {course.courseCode} - {course.credits} CREDITS
                    </p>
                    {/* FIX: Reduced title scale to match dashboard card sizing. */}
                    <h2 className="mt-1 text-[14px] font-semibold leading-snug text-[#2B2A2A]">{course.title}</h2>
                  </div>
                </div>

                <div className="mt-5">
                  <p className="text-[12px] text-[#5D667A]">{course.instructor}</p>
                  <p className="text-[12px] text-[#7A849A]">{course.semester}</p>
                </div>

                <div className="mt-5">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] uppercase tracking-wide text-[#738099]">Assignments</p>
                    <p className="text-[12px] font-semibold text-[#111827]">{assignmentsLeft} left</p>
                  </div>
                  <div className="mt-2 h-2 w-full rounded-full bg-[#E5E7EB]">
                    {/* FIX: Progress fill is now consistently orange per My Courses design requirement. */}
                    <div className="h-2 rounded-full bg-[#FEB05D]" style={{ width: `${progress}%` }} />
                  </div>
                  <p className="mt-1.5 text-[11px] text-[#97A0B4]">
                    {course.completed} / {course.total} completed
                  </p>
                </div>

                <Link
                  to={`/class/${course.id}`}
                  className="mt-5 flex h-10 items-center justify-center rounded-xl bg-[#F2F3F5] text-[14px] font-medium text-[#111827] hover:bg-[#E9EBEF]"
                >
                  View Class
                </Link>
              </article>
            );
          })}
        {!isLoading && courses.length === 0 ? (
          <article className="rounded-2xl border border-gray-200 bg-white p-5">
            <p className="text-[14px] text-[#5D667A]">No classes available yet.</p>
          </article>
        ) : null}
      </section>
    </main>
  );
}

export function StudentMyCoursesPage() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<CourseCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [layoutMode, setLayoutMode] = useState<CourseLayoutMode>("grid");
  const loggedInUser = getAuthenticatedUser();
  const displayName = loggedInUser?.name ?? "Alex Johnson";
  const displayEmail = loggedInUser?.email ?? "alex@university.edu";

  const displayInitials = useMemo(() => {
    // NOTE: Keep initials derived from auth session so top-bar profile stays consistent across student pages.
    return (
      displayName
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("") || "AJ"
    );
  }, [displayName]);

  useEffect(() => {
    // NOTE: Container owns data loading and passes course data into the presentation component.
    // NOTE: listEnrolledCourses now pulls real enrolled courses and progress metrics from backend APIs.
    setIsLoading(true);
    listEnrolledCourses()
      .then(setCourses)
      .catch(() => setCourses([]))
      .finally(() => setIsLoading(false));
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
      roleView="student"
      topBar={
        <AuthTopBar
          roleView="student"
          profile={{ name: displayName, email: displayEmail, initials: displayInitials }}
          searchPlaceholder="Search calendar, assignments..."
          onSettingsSectionSelect={goToSettingsSection}
          onLogout={handleLogout}
        />
      }
      mainContent={
        <StudentMyCoursesView
          courses={courses}
          isLoading={isLoading}
          layoutMode={layoutMode}
          onLayoutModeChange={setLayoutMode}
        />
      }
    />
  );
}
