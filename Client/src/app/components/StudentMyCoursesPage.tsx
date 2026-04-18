import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { clearAuthenticated, getAuthenticatedUser } from "../auth";
import { listEnrolledCourses } from "../../services/classService";
import type { CourseCard } from "../../types/class";
import { AuthShell } from "./layout/AuthShell";
import { AuthTopBar } from "./layout/AuthTopBar";
import type { SettingsSection } from "./layout/AuthTopBar";
import { CourseCoverCardShell } from "./CourseCoverCardShell";

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
    <main className="flex-1 overflow-y-auto bg-[#F5F2F2] px-4 py-3">
      <div className="2xl:max-w-7xl 2xl:mx-auto">
      <section className="flex flex-wrap items-center justify-between gap-3">
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

      <section className={`mt-5 grid gap-3 ${isGrid ? "grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3" : "grid-cols-1"}`}>
        {isLoading
          ? Array.from({ length: isGrid ? 6 : 3 }).map((_, index) => (
              <article
                key={`student-courses-skeleton-${index}`}
                // NOTE: Skeleton cards keep My Courses layout visible while enrolled-course data is loading.
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white animate-pulse"
              >
                <div className="h-24 bg-gray-100" />
                <div className="space-y-2 p-5">
                  <div className="h-3 w-28 rounded bg-gray-200" />
                  <div className="h-4 w-52 max-w-full rounded bg-gray-200" />
                </div>
                <div className="space-y-2 px-5">
                  <div className="h-3 w-36 rounded bg-gray-200" />
                  <div className="h-3 w-24 rounded bg-gray-200" />
                  <div className="h-3 w-full rounded bg-gray-200" />
                  <div className="h-2 w-full rounded-full bg-gray-100" />
                  <div className="h-3 w-28 rounded bg-gray-200" />
                </div>
                <div className="mx-5 mb-5 mt-4 h-10 rounded-xl bg-gray-100" />
              </article>
            ))
          : null}
        {!isLoading &&
          courses.map((course) => {
            const assignmentsLeft = course.total - course.completed;
            const progress = course.total > 0 ? (course.completed / course.total) * 100 : 0;
            const isInactive = !course.isActive;

            const cardContent = (
              <div className="flex flex-1 flex-col gap-1 p-3 pt-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[10px] uppercase tracking-wide text-[#738099]">
                    {course.courseCode} · {course.credits} cr
                  </p>
                  {isInactive && (
                    <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-gray-500">
                      Inactive
                    </span>
                  )}
                </div>
                <h2 className="text-[13px] font-semibold leading-tight text-[#2B2A2A]">{course.title}</h2>
                <p className="text-[11px] text-[#5D667A]">{course.instructor}</p>
                <p className="text-[11px] text-[#7A849A]">{course.semester}</p>

                <div className="mt-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] uppercase tracking-wide text-[#738099]">Assignments</p>
                    <p className="text-[11px] font-semibold text-[#111827]">{assignmentsLeft} left</p>
                  </div>
                  <div className="mt-1 h-1.5 w-full rounded-full bg-[#E5E7EB]">
                    <div
                      className={`h-1.5 rounded-full ${isInactive ? "bg-gray-300" : "bg-[#FEB05D]"}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="mt-1 text-[10px] text-[#97A0B4]">
                    {course.completed} / {course.total} done
                  </p>
                </div>

                {isInactive ? (
                  <div className="mt-auto flex h-8 items-center justify-center rounded-lg bg-gray-100 text-[12px] font-medium text-gray-400 cursor-not-allowed select-none">
                    Class Inactive
                  </div>
                ) : (
                  <Link
                    to={`/class/${course.id}`}
                    className="mt-auto flex h-8 items-center justify-center rounded-lg bg-[#F2F3F5] text-[12px] font-medium text-[#111827] hover:bg-[#E9EBEF]"
                  >
                    View Class
                  </Link>
                )}
              </div>
            );

            return (
              <article key={course.id} className={`overflow-hidden rounded-2xl shadow-sm${isInactive ? " opacity-70" : ""}`}>
                {isGrid ? (
                  <CourseCoverCardShell coverImageUrl={course.coverImageUrl} className="min-h-[220px] border-0 shadow-none">
                    {cardContent}
                  </CourseCoverCardShell>
                ) : (
                  <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                    {cardContent}
                  </div>
                )}
              </article>
            );
          })}
        {!isLoading && courses.length === 0 ? (
          <article className="rounded-2xl border border-gray-200 bg-white p-5">
            <p className="text-[14px] text-[#5D667A]">No classes available yet.</p>
          </article>
        ) : null}
      </section>
      </div>
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
          showSearch={false}
          pageTitle="My Courses"
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
