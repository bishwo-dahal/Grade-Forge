import { useEffect, useMemo, useState } from "react";
import { AlertCircle, ArrowRight, Calendar, Clock3, Plus } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { clearAuthenticated, getAuthenticatedUser } from "../auth";
import { listFacultyMyClasses, listFacultySemesters } from "../../services/classService";
import type { FacultyMyClassItem, FacultySemesterOption } from "../../types/class";
import { SegmentedFilter } from "./ui/SegmentedFilter";
import { AuthShell } from "./layout/AuthShell";
import { AuthTopBar } from "./layout/AuthTopBar";
import type { SettingsSection } from "./layout/AuthTopBar";
import { getApiErrorMessage } from "../../utils/apiErrorMessage";
import { CourseCoverCardShell } from "./CourseCoverCardShell";

type FacultyClassFilter = "active" | "archived";

interface FacultyMyClassesViewProps {
  // NOTE: This component is presentation-only. Data is injected by the page/container.
  classes: FacultyMyClassItem[];
  semesters: FacultySemesterOption[];
  isLoading: boolean;
  error: string | null;
  selectedFilter: FacultyClassFilter;
  onFilterChange: (filter: FacultyClassFilter) => void;
  onCreateNewClass: () => void;
}

function FacultyMyClassesView({
  classes,
  semesters,
  isLoading,
  error,
  selectedFilter,
  onFilterChange,
  onCreateNewClass,
}: FacultyMyClassesViewProps) {
  const activeClasses = classes.filter((course) => course.isActive);
  const archivedClasses = classes.filter((course) => !course.isActive);
  const pendingGrading = classes.reduce((sum, course) => sum + course.pendingGrading, 0);

  const archivedSemesters = useMemo(() => {
    const counts = new Map<string, number>();
    for (const course of archivedClasses) {
      const semester = (course.semester || "").trim() || "TBD";
      counts.set(semester, (counts.get(semester) ?? 0) + 1);
    }
    if (semesters.length > 0) {
      return [...semesters]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((semester) => ({ semester, count: counts.get(semester.name) ?? 0 }));
    }
    return Array.from(counts.entries())
      .map(([semester, count]) => ({ semester: { id: -1, name: semester, startDate: "", endDate: "" }, count }))
      .sort((a, b) => a.semester.name.localeCompare(b.semester.name));
  }, [archivedClasses, semesters]);

  const filteredClasses = useMemo(() => {
    return selectedFilter === "archived" ? archivedClasses : activeClasses;
  }, [activeClasses, archivedClasses, selectedFilter]);

  const filterPills: Array<{ id: FacultyClassFilter; label: string; count: number }> = [
    { id: "active", label: "Active", count: activeClasses.length },
    { id: "archived", label: "Archived", count: archivedClasses.length },
  ];

  return (
    <main className="flex-1 overflow-y-auto bg-[#F5F2F2] px-4 py-4 sm:px-6">
      <section className="mt-1 flex flex-wrap items-center justify-between gap-3">
        {/* REFACTOR: Use shared segmented filter component so this control style can be reused across pages. */}
        <SegmentedFilter items={filterPills} value={selectedFilter} onValueChange={onFilterChange} />

        <div className="flex items-center gap-2.5">
          {/* CLEANUP: Removed large top statistics cards and kept only compact pending grading summary near class creation action. */}
          <div className="inline-flex h-10 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 text-[12px] font-medium text-[#3E4E67]">
            <Clock3 className="h-4 w-4 text-[#F5A54A]" strokeWidth={2} />
            <span>Pending Grading:</span>
            <span className="text-[13px] font-semibold text-[#1F2430]">{pendingGrading}</span>
          </div>

          <button
            type="button"
            onClick={onCreateNewClass}
            className="inline-flex h-10 items-center gap-2 rounded-2xl bg-[#5A7ACD] px-5 text-[14px] leading-none font-semibold text-white"
          >
            <Plus className="h-4.5 w-4.5" strokeWidth={2} />
            Create New Class
          </button>
        </div>
      </section>

      {error && <p className="mt-4 text-[14px] text-[#C23A42]">{error}</p>}

      {selectedFilter === "archived" ? (
        <section className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {isLoading
            ? Array.from({ length: 6 }).map((_, index) => (
                <article
                  key={`faculty-my-classes-archived-semester-skeleton-${index}`}
                  className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 animate-pulse"
                >
                  <div className="h-4 w-40 rounded bg-gray-200" />
                  <div className="mt-2 h-3 w-24 rounded bg-gray-200" />
                </article>
              ))
            : null}

          {!isLoading && archivedSemesters.length === 0 && (
            <article className="rounded-2xl border border-gray-200 bg-white p-4">
              <p className="text-[14px] text-[#5D6A80]">No archived semesters found.</p>
            </article>
          )}

          {!isLoading &&
            archivedSemesters.map((entry) => (
              <article
                key={`${entry.semester.id}-${entry.semester.name}`}
                className="rounded-2xl border border-gray-200 bg-white p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[12px] font-semibold leading-snug text-[#1F2430]">{entry.semester.name}</p>
                    <p className="mt-1 text-[11px] text-[#5D6A80]">
                      {entry.count} archived class{entry.count === 1 ? "" : "es"}
                    </p>
                    {(entry.semester.startDate || entry.semester.endDate) && (
                      <p className="mt-1 text-[10px] text-[#7A869C]">
                        {entry.semester.startDate || "N/A"} - {entry.semester.endDate || "N/A"}
                      </p>
                    )}
                  </div>
                  <div className="inline-flex items-center gap-1 rounded-xl bg-[#F6F7F9] px-2 py-1 text-[11px] font-medium text-[#3E4E67]">
                    <Calendar className="h-3 w-3 text-[#5D6A80]" strokeWidth={2} />
                    Semester
                  </div>
                </div>
              </article>
            ))}
        </section>
      ) : (
        <section className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {isLoading
            ? Array.from({ length: 6 }).map((_, index) => (
                <article
                  key={`faculty-my-classes-skeleton-${index}`}
                  // NOTE: Skeleton class cards preserve faculty My Classes layout while backend data loads.
                  className="overflow-hidden rounded-2xl border border-gray-200 bg-white animate-pulse"
                >
                  <div className="h-[120px] bg-gray-100" />
                  <div className="space-y-1.5 p-2.5">
                    <div className="h-4 w-40 rounded bg-gray-200" />
                    <div className="h-3 w-28 rounded bg-gray-200" />
                    <div className="h-3 w-20 rounded bg-gray-200" />
                  </div>
                  <div className="mx-2.5 rounded-lg bg-[#F6F7F9] px-2 py-2">
                    <div className="h-3 w-36 rounded bg-gray-200" />
                    <div className="mt-2 h-3 w-28 rounded bg-gray-200" />
                  </div>
                  <div className="mx-2.5 mt-2 grid grid-cols-3 gap-2">
                    <div className="space-y-2">
                      <div className="h-3 w-14 rounded bg-gray-200" />
                      <div className="h-4 w-8 rounded bg-gray-200" />
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 w-20 rounded bg-gray-200" />
                      <div className="h-4 w-8 rounded bg-gray-200" />
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 w-16 rounded bg-gray-200" />
                      <div className="h-4 w-10 rounded bg-gray-200" />
                    </div>
                  </div>
                  <div className="mx-2.5 mt-2 h-8 rounded-lg bg-[#FFF8EE]" />
                  <div className="m-2.5 mt-2 grid grid-cols-[1fr_auto] gap-1.5">
                    <div className="h-8 rounded-xl bg-[#EEF2FA]" />
                    <div className="h-8 w-20 rounded-xl bg-[#FFE8CA]" />
                  </div>
                </article>
              ))
            : null}

          {!isLoading && filteredClasses.length === 0 && (
            <article className="rounded-2xl border border-gray-200 bg-white p-4">
              <p className="text-[14px] text-[#5D6A80]">No classes found for this filter.</p>
            </article>
          )}

          {!isLoading &&
            filteredClasses.map((course) => (
              <article key={course.id}>
                <CourseCoverCardShell compact coverImageUrl={course.coverImageUrl}>
                  <div className="flex flex-1 flex-col gap-1 p-2">
                    <h2 className="line-clamp-2 text-[12px] font-semibold leading-snug text-[#1F2430]">
                      {course.title}
                    </h2>
                    <p className="text-[11px] leading-tight text-[#3E4E67]">
                      {course.code} · Sec {course.section}
                    </p>
                    <p className="text-[10px] text-[#5D6A80]">{course.semester}</p>

                    <div className="rounded-md bg-[#F6F7F9] px-2 py-1.5">
                      <div className="flex items-center gap-1 text-[11px] text-[#3F4F67]">
                        <Calendar className="h-3 w-3 shrink-0 text-[#5D6A80]" strokeWidth={2} />
                        <span className="truncate">{course.schedule}</span>
                      </div>
                      <p className="mt-0.5 truncate text-[10px] text-[#5D6A80]">{course.location}</p>
                    </div>

                    <div className="grid grid-cols-3 gap-1">
                      <div>
                        <p className="text-[9px] text-[#5D6A80]">Students</p>
                        <p className="text-[12px] font-semibold leading-none text-[#1F2430]">{course.students}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-[#5D6A80]">Assign.</p>
                        <p className="text-[12px] font-semibold leading-none text-[#1F2430]">{course.assignments}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-[#5D6A80]">Avg</p>
                        <p className="text-[12px] font-semibold leading-none text-[#1F2430]">{course.avgScore}%</p>
                      </div>
                    </div>

                    <div className="rounded-md border border-[#F0D8BC] bg-[#FFF8EE] px-2 py-1">
                      <div className="flex items-center gap-1 text-[10px] leading-tight text-[#8A5A25]">
                        <AlertCircle className="h-3 w-3 shrink-0 text-[#F5A54A]" strokeWidth={2} />
                        <span className="line-clamp-1">{course.pendingReview} pending</span>
                      </div>
                    </div>

                    <div className="mt-auto grid grid-cols-[1fr_auto] gap-1 pt-1">
                      <Link
                        to={`/faculty/class/${course.id}`}
                        className="inline-flex h-7 items-center justify-center gap-1 rounded-lg bg-[#5A7ACD] px-2 text-[11px] font-semibold text-white"
                      >
                        Manage
                        <ArrowRight className="h-3 w-3" strokeWidth={2} />
                      </Link>
                      <Link
                        to={`/faculty/class/${course.id}`}
                        className="inline-flex h-7 items-center justify-center rounded-lg bg-[#FEB05D] px-2.5 text-[11px] font-semibold text-white"
                      >
                        Grade
                      </Link>
                    </div>
                  </div>
                </CourseCoverCardShell>
              </article>
            ))}
        </section>
      )}
    </main>
  );
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
  const [semesters, setSemesters] = useState<FacultySemesterOption[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<FacultyClassFilter>("active");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // NOTE: Container owns DB-backed class loading; the view stays presentation-only and reusable.
    setIsLoading(true);
    setError(null);
    listFacultyMyClasses()
      .then(setClasses)
      .catch((loadError) => setError(getApiErrorMessage(loadError, "Could not load faculty classes.")))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (selectedFilter !== "archived") {
      return;
    }
    listFacultySemesters()
      .then(setSemesters)
      .catch((loadError) => setError(getApiErrorMessage(loadError, "Could not load semesters.")));
  }, [selectedFilter]);

  const goToSettingsSection = (section: SettingsSection) => {
    navigate(`/settings?section=${section}`);
  };

  const handleLogout = () => {
    clearAuthenticated();
    navigate("/signin", { replace: true });
  };

  const handleCreateNewClass = () => {
    // REFACTOR: Faculty class creation now uses a dedicated page instead of dashboard modal flow.
    navigate("/faculty/my-classes/create");
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
          semesters={semesters}
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
