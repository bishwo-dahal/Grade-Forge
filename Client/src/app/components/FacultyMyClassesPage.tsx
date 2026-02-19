import { useEffect, useMemo, useState } from "react";
import { AlertCircle, ArrowRight, BookOpen, Calendar, CheckCircle2, Clock3, Plus, Users } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { clearAuthenticated, getAuthenticatedUser } from "../auth";
import { listFacultyMyClasses } from "../../services/classService";
import type { FacultyMyClassItem } from "../../types/class";
import { AuthShell } from "./layout/AuthShell";
import { AuthTopBar } from "./layout/AuthTopBar";
import type { SettingsSection } from "./layout/AuthTopBar";

type FacultyClassFilter = "all" | "active" | "archived";

interface FacultyMyClassesViewProps {
  // NOTE: This component is presentation-only. Data is injected by the page/container.
  classes: FacultyMyClassItem[];
  isLoading: boolean;
  error: string | null;
  selectedFilter: FacultyClassFilter;
  onFilterChange: (filter: FacultyClassFilter) => void;
  onCreateNewClass: () => void;
}

function FacultyMyClassesView({
  classes,
  isLoading,
  error,
  selectedFilter,
  onFilterChange,
  onCreateNewClass,
}: FacultyMyClassesViewProps) {
  const activeClasses = classes.filter((course) => course.isActive);
  const archivedClasses = classes.filter((course) => !course.isActive);
  const totalStudents = classes.reduce((sum, course) => sum + course.students, 0);
  const pendingGrading = classes.reduce((sum, course) => sum + course.pendingGrading, 0);
  const averageScore =
    classes.length > 0 ? Math.round(classes.reduce((sum, course) => sum + course.avgScore, 0) / classes.length) : 0;

  const filteredClasses = useMemo(() => {
    if (selectedFilter === "active") {
      return activeClasses;
    }
    if (selectedFilter === "archived") {
      return archivedClasses;
    }
    return classes;
  }, [activeClasses, archivedClasses, classes, selectedFilter]);

  const filterPills: Array<{ id: FacultyClassFilter; label: string; count: number }> = [
    { id: "all", label: "All Classes", count: classes.length },
    { id: "active", label: "Active", count: activeClasses.length },
    { id: "archived", label: "Archived", count: archivedClasses.length },
  ];

  return (
    <main className="flex-1 overflow-y-auto bg-[#F5F2F2] px-6 py-5">
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-gray-200 bg-white p-4">
          <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl bg-[#E8EEFF] text-[#5A7ACD]">
            <BookOpen className="h-4.5 w-4.5" strokeWidth={2} />
          </div>
          <p className="text-[22px] leading-none font-semibold text-[#1F2430]">{activeClasses.length}</p>
          <p className="mt-2 text-[12px] text-[#5D6A80]">Active Classes</p>
        </article>
        <article className="rounded-2xl border border-gray-200 bg-white p-4">
          <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFF1E1] text-[#F5A54A]">
            <Users className="h-4.5 w-4.5" strokeWidth={2} />
          </div>
          <p className="text-[22px] leading-none font-semibold text-[#1F2430]">{totalStudents}</p>
          <p className="mt-2 text-[12px] text-[#5D6A80]">Total Students</p>
        </article>
        <article className="rounded-2xl border border-gray-200 bg-white p-4">
          <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFF1E1] text-[#F5A54A]">
            <Clock3 className="h-4.5 w-4.5" strokeWidth={2} />
          </div>
          <p className="text-[22px] leading-none font-semibold text-[#1F2430]">{pendingGrading}</p>
          <p className="mt-2 text-[12px] text-[#5D6A80]">Pending Grading</p>
        </article>
        <article className="rounded-2xl border border-gray-200 bg-white p-4">
          <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl bg-[#E8EEFF] text-[#5A7ACD]">
            <CheckCircle2 className="h-4.5 w-4.5" strokeWidth={2} />
          </div>
          <p className="text-[22px] leading-none font-semibold text-[#1F2430]">{averageScore}%</p>
          <p className="mt-2 text-[12px] text-[#5D6A80]">Average Score</p>
        </article>
      </section>

      <section className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {filterPills.map((pill) => {
            const active = selectedFilter === pill.id;
            return (
              <button
                key={pill.id}
                type="button"
                onClick={() => onFilterChange(pill.id)}
                className={`rounded-2xl border px-5 py-2.5 text-[14px] leading-none font-medium transition-colors ${
                  active
                    ? "border-transparent bg-[#2B2A2A] text-white"
                    : "border-[#D7DBE3] bg-white text-[#3A4A63] hover:bg-[#F7F8FB]"
                }`}
              >
                {pill.label} ({pill.count})
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onCreateNewClass}
          className="inline-flex h-11 items-center gap-2 rounded-2xl bg-[#5A7ACD] px-5 text-[14px] leading-none font-semibold text-white"
        >
          <Plus className="h-5 w-5" strokeWidth={2} />
          Create New Class
        </button>
      </section>

      {error && <p className="mt-4 text-[14px] text-[#C23A42]">{error}</p>}

      {/* FIX: Render three class cards per row on large screens to match requested layout density. */}
      <section className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-3">
        {isLoading && (
          <article className="rounded-3xl border border-gray-200 bg-white p-5">
            <p className="text-[14px] text-[#5D6A80]">Loading classes...</p>
          </article>
        )}

        {!isLoading && filteredClasses.length === 0 && (
          <article className="rounded-3xl border border-gray-200 bg-white p-5">
            <p className="text-[14px] text-[#5D6A80]">No classes found for this filter.</p>
          </article>
        )}

        {!isLoading &&
          filteredClasses.map((course) => (
            <article key={course.id} className="rounded-3xl border border-gray-200 bg-white p-5">
              <div className="flex items-start gap-4">
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl text-2xl ${course.iconBg}`}>{course.icon}</div>
                <div>
                  <h2 className="text-[17px] leading-none font-semibold text-[#1F2430]">{course.title}</h2>
                  <p className="mt-2 text-[14px] leading-none text-[#3E4E67]">
                    {course.code} &middot; Section {course.section}
                  </p>
                  <p className="mt-2 text-[14px] leading-none text-[#5D6A80]">{course.semester}</p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl bg-[#F6F7F9] px-4 py-3.5">
                <div className="flex items-center gap-3 text-[14px] leading-none text-[#3F4F67]">
                  <Calendar className="h-4.5 w-4.5 text-[#5D6A80]" strokeWidth={2} />
                  <span>{course.schedule}</span>
                </div>
                <p className="mt-2 text-[14px] leading-none text-[#5D6A80]">{course.location}</p>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-4">
                <div>
                  <p className="text-[14px] text-[#5D6A80]">Students</p>
                  <p className="mt-1 text-[18px] leading-none font-semibold text-[#1F2430]">{course.students}</p>
                </div>
                <div>
                  <p className="text-[14px] text-[#5D6A80]">Assignments</p>
                  <p className="mt-1 text-[18px] leading-none font-semibold text-[#1F2430]">{course.assignments}</p>
                </div>
                <div>
                  <p className="text-[14px] text-[#5D6A80]">Avg Score</p>
                  <p className="mt-1 text-[18px] leading-none font-semibold text-[#1F2430]">{course.avgScore}%</p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-[#F0D8BC] bg-[#FFF8EE] px-4 py-3.5">
                <div className="flex items-center gap-3 text-[14px] text-[#8A5A25]">
                  <AlertCircle className="h-4.5 w-4.5 text-[#F5A54A]" strokeWidth={2} />
                  <span>{course.pendingReview} assignments pending review</span>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-[1fr_auto] gap-3">
                <Link
                  to={`/faculty/class/${course.id}`}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#5A7ACD] px-6 text-[14px] leading-none font-semibold text-white"
                >
                  Manage Class
                  <ArrowRight className="h-4.5 w-4.5" strokeWidth={2} />
                </Link>
                <Link
                  to={`/faculty/class/${course.id}`}
                  className="inline-flex h-11 items-center justify-center rounded-2xl bg-[#FEB05D] px-8 text-[14px] leading-none font-semibold text-white"
                >
                  Grade Now
                </Link>
              </div>
            </article>
          ))}
      </section>
    </main>
  );
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === "object" && error !== null) {
    const response = (error as { response?: { data?: { message?: unknown } } }).response;
    const message = response?.data?.message;
    if (typeof message === "string" && message.trim().length > 0) {
      return message;
    }
  }
  return fallback;
}

export function FacultyMyClassesPage() {
  const navigate = useNavigate();
  const loggedInUser = getAuthenticatedUser();
  const displayName = loggedInUser?.name ?? "Dr. Sarah Miller";
  const displayEmail = loggedInUser?.email ?? "smiller@university.edu";
  const displayInitials =
    displayName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "SM";

  const [classes, setClasses] = useState<FacultyMyClassItem[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<FacultyClassFilter>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // NOTE: Container owns DB-backed class loading; the view stays presentation-only and reusable.
    setIsLoading(true);
    setError(null);
    listFacultyMyClasses()
      .then(setClasses)
      .catch((loadError) => setError(getErrorMessage(loadError, "Could not load faculty classes.")))
      .finally(() => setIsLoading(false));
  }, []);

  const goToSettingsSection = (section: SettingsSection) => {
    navigate(`/settings?section=${section}`);
  };

  const handleLogout = () => {
    clearAuthenticated();
    navigate("/signin", { replace: true });
  };

  const handleCreateNewClass = () => {
    // NOTE: Reuse existing add-class workflow entry point on faculty dashboard.
    navigate("/dashboard");
  };

  return (
    <AuthShell
      roleView="faculty"
      topBar={
        <AuthTopBar
          roleView="faculty"
          profile={{ name: displayName, email: displayEmail, initials: displayInitials }}
          searchPlaceholder="Search calendar, assignments..."
          onSettingsSectionSelect={goToSettingsSection}
          onLogout={handleLogout}
        />
      }
      mainContent={
        <FacultyMyClassesView
          classes={classes}
          isLoading={isLoading}
          error={error}
          selectedFilter={selectedFilter}
          onFilterChange={setSelectedFilter}
          onCreateNewClass={handleCreateNewClass}
        />
      }
    />
  );
}
