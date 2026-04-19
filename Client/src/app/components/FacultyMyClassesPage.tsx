import { useEffect, useMemo, useState } from "react";
import { AlertCircle, ArrowRight, Plus } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { clearAuthenticated, getAuthenticatedUser } from "../auth";
import {
  getCourseCoverImageUrl,
  listFacultyCoursesBySemester,
  listFacultyMyClasses,
  listFacultySemesters,
} from "../../services/classService";
import type { FacultyMyClassItem, FacultySemesterOption } from "../../types/class";
import { SegmentedFilter } from "./ui/SegmentedFilter";
import { AuthShell } from "./layout/AuthShell";
import { AuthTopBar } from "./layout/AuthTopBar";
import type { SettingsSection } from "./layout/AuthTopBar";
import { getApiErrorMessage } from "../../utils/apiErrorMessage";
import { CourseCoverCardShell } from "./CourseCoverCardShell";

type FacultyClassFilter = "active" | "archived";

function FacultyCourseHierarchyBadges({ course }: { course: FacultyMyClassItem }) {
  const mainCount = course.linkedSectionCount ?? 0;
  return (
    <div className="contents">
      {mainCount > 0 ? (
        <span
          className="shrink-0 rounded-full border border-[#5A7ACD]/45 bg-[#EEF2FA] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#345079]"
          title="Main course — assignments and tests sync to these section courses"
        >
          Main · {mainCount}
        </span>
      ) : null}
      {course.isLinkedSection ? (
        <span className="shrink-0 rounded-full border border-amber-300/70 bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-900">
          Section
        </span>
      ) : null}
    </div>
  );
}

interface FacultyMyClassesViewProps {
  // NOTE: This component is presentation-only. Data is injected by the page/container.
  classes: FacultyMyClassItem[];
  semesters: FacultySemesterOption[];
  archivedSemesterCourses: FacultyMyClassItem[];
  selectedArchivedSemesterId: number | null;
  isArchivedCoursesLoading: boolean;
  isLoading: boolean;
  error: string | null;
  selectedFilter: FacultyClassFilter;
  onFilterChange: (filter: FacultyClassFilter) => void;
  onArchivedSemesterSelect: (semesterId: number) => void;
  onCreateNewClass: () => void;
}

function FacultyMyClassesView({
  classes,
  semesters,
  archivedSemesterCourses,
  selectedArchivedSemesterId,
  isArchivedCoursesLoading,
  isLoading,
  error,
  selectedFilter,
  onFilterChange,
  onArchivedSemesterSelect,
  onCreateNewClass,
}: FacultyMyClassesViewProps) {
  const activeClasses = classes.filter((course) => course.isActive);
  const archivedClasses = classes.filter((course) => !course.isActive);
  const pendingGrading = classes.reduce((sum, course) => sum + course.pendingGrading, 0);

  const archivedSemesters = useMemo(() => {
    const toTime = (value: string): number => {
      const time = new Date(value).getTime();
      return Number.isFinite(time) ? time : 0;
    };
    return [...semesters].sort((a, b) => {
      const leftTime = toTime(a.endDate || a.startDate);
      const rightTime = toTime(b.endDate || b.startDate);
      return rightTime - leftTime;
    });
  }, [semesters]);

  const filteredClasses = useMemo(() => {
    return selectedFilter === "archived" ? archivedClasses : activeClasses;
  }, [activeClasses, archivedClasses, selectedFilter]);

  const filterPills: Array<{ id: FacultyClassFilter; label: string; count?: number }> = [
    { id: "active", label: "Active", count: activeClasses.length },
    { id: "archived", label: "Archived" },
  ];

  return (
    <main className="flex-1 overflow-y-auto bg-[#F5F2F2] px-4 py-4 sm:px-6">
      <div className="2xl:max-w-7xl 2xl:mx-auto">
      <section className="mt-1 flex flex-wrap items-center justify-between gap-3">
        {/* REFACTOR: Use shared segmented filter component so this control style can be reused across pages. */}
        <SegmentedFilter items={filterPills} value={selectedFilter} onValueChange={onFilterChange} />

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onCreateNewClass}
            className="inline-flex h-10 items-center gap-2 rounded-2xl bg-[#7A1226] px-5 text-[14px] leading-none font-semibold text-white hover:bg-[#65101F]"
          >
            <Plus className="h-4.5 w-4.5" strokeWidth={2} />
            Create New Class
          </button>
        </div>
      </section>

      {error && <p className="mt-4 text-[14px] text-[#C23A42]">{error}</p>}

      {selectedFilter === "archived" ? (
        <section className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-[280px_minmax(0,1fr)]">
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

          {!isLoading && (
            <div className="rounded-2xl p-2">
              {archivedSemesters.length === 0 ? (
                <p className="p-2 text-[13px] text-[#5D6A80]">No semesters found.</p>
              ) : (
                <div className="flex flex-col gap-1">
                  {archivedSemesters.map((semester) => {
                    const isSelected = selectedArchivedSemesterId === semester.id;
                    return (
                      <button
                        key={semester.id}
                        type="button"
                        onClick={() => onArchivedSemesterSelect(semester.id)}
                        className={`w-full rounded-xl border px-3 py-2 text-left transition-colors ${
                          isSelected
                            ? "bg-[#EEF2FA]"
                            : "hover:bg-[#F6F7F9]"
                        }`}
                      >
                        <p className="text-[12px] font-semibold text-[#1F2430]">{semester.name}</p>
                        <p className="mt-1 text-[10px] text-[#7A869C]">
                          {semester.startDate || "N/A"} - {semester.endDate || "N/A"}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {!isLoading && (
            <div className="rounded-2xl p-3">
              {isArchivedCoursesLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={`archived-course-skeleton-${index}`} className="rounded-xl border border-gray-200 p-3">
                      <div className="h-4 w-44 rounded bg-gray-200 animate-pulse" />
                      <div className="mt-2 h-3 w-32 rounded bg-gray-200 animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : archivedSemesterCourses.length === 0 ? (
                <p className="text-[14px] text-[#5D6A80]">No courses found for this semester.</p>
              ) : (
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                  {archivedSemesterCourses.map((course) => (
                    <article key={course.id}>
                      <CourseCoverCardShell compact coverImageUrl={course.coverImageUrl}>
                        <div className="flex flex-1 flex-col gap-1 p-2">
                          <div className="flex flex-wrap items-center gap-1">
                            <h2 className="line-clamp-2 text-[12px] font-semibold leading-snug text-[#1F2430]">
                              {course.title}
                            </h2>
                            <FacultyCourseHierarchyBadges course={course} />
                          </div>
                          <p className="text-[11px] leading-tight text-[#3E4E67]">
                            {course.code} · Sec {course.section}
                          </p>
                          <p className="text-[10px] text-[#5D6A80]">{course.semester}</p>
                          <div className="mt-auto grid grid-cols-1 gap-1 pt-1">
                            <Link
                              to={`/faculty/class/${course.id}`}
                              className="inline-flex h-7 items-center justify-center gap-1 rounded-lg bg-[#7A1226] px-2 text-[11px] font-semibold text-white hover:bg-[#65101F]"
                            >
                              Manage
                              <ArrowRight className="h-3 w-3" strokeWidth={2} />
                            </Link>
                          </div>
                        </div>
                      </CourseCoverCardShell>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}
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
                    <div className="flex flex-wrap items-center gap-1">
                      <h2 className="line-clamp-2 text-[12px] font-semibold leading-snug text-[#1F2430]">
                        {course.title}
                      </h2>
                      <FacultyCourseHierarchyBadges course={course} />
                    </div>
                    <p className="text-[11px] leading-tight text-[#3E4E67]">
                      {course.code} · Sec {course.section}
                    </p>
                    <p className="text-[10px] text-[#5D6A80]">{course.semester}</p>


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
                        className="inline-flex h-7 items-center justify-center gap-1 rounded-lg bg-[#7A1226] px-2 text-[11px] font-semibold text-white hover:bg-[#65101F]"
                      >
                        Manage
                        <ArrowRight className="h-3 w-3" strokeWidth={2} />
                      </Link>
                      <Link
                        to={`/faculty/class/${course.id}`}
                        className="inline-flex h-7 items-center justify-center rounded-lg bg-[#2E7D32] px-2.5 text-[11px] font-semibold text-white hover:bg-[#256329]"
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
      </div>
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
  const [archivedSemesterCourses, setArchivedSemesterCourses] = useState<FacultyMyClassItem[]>([]);
  const [selectedArchivedSemesterId, setSelectedArchivedSemesterId] = useState<number | null>(null);
  const [isArchivedCoursesLoading, setIsArchivedCoursesLoading] = useState(false);
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
      .then((loadedSemesters) => {
        setSemesters(loadedSemesters);
        if (loadedSemesters.length > 0) {
          setSelectedArchivedSemesterId((current) => current ?? loadedSemesters[0].id);
        }
      })
      .catch((loadError) => setError(getApiErrorMessage(loadError, "Could not load semesters.")));
  }, [selectedFilter]);

  useEffect(() => {
    if (selectedFilter !== "archived" || selectedArchivedSemesterId === null) {
      return;
    }
    setIsArchivedCoursesLoading(true);
    listFacultyCoursesBySemester(selectedArchivedSemesterId)
      .then((courses) => {
        const mapped: FacultyMyClassItem[] = courses.map((course) => {
          const sectionChildren = !course.parentCourseId ? (course.sectionCourses?.length ?? 0) : 0;
          return {
          id: String(course.id),
          title: course.name,
          code: course.courseCode,
          section: course.section ?? "TBD",
          semester: course.semester?.name ?? "TBD",
          isLinkedSection: Boolean(course.parentCourseId),
          ...(sectionChildren > 0 ? { linkedSectionCount: sectionChildren } : {}),
          isActive: Boolean(course.active),
          students: 0,
          assignments: 0,
          avgScore: 0,
          pendingGrading: 0,
          pendingReview: 0,
          schedule: "TBD",
          location: "TBD",
          icon: "",
          iconBg: "",
          coverImageUrl: getCourseCoverImageUrl(course),
        };
        });
        setArchivedSemesterCourses(mapped);
      })
      .catch((loadError) => setError(getApiErrorMessage(loadError, "Could not load semester courses.")))
      .finally(() => setIsArchivedCoursesLoading(false));
  }, [selectedArchivedSemesterId, selectedFilter]);

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
          showSearch={false}
          pageTitle="My Classes"
          onSettingsSectionSelect={goToSettingsSection}
          onLogout={handleLogout}
        />
      }
      mainContent={
        <FacultyMyClassesView
          classes={classes}
          semesters={semesters}
          archivedSemesterCourses={archivedSemesterCourses}
          selectedArchivedSemesterId={selectedArchivedSemesterId}
          isArchivedCoursesLoading={isArchivedCoursesLoading}
          isLoading={isLoading}
          error={error}
          selectedFilter={selectedFilter}
          onFilterChange={setSelectedFilter}
          onArchivedSemesterSelect={setSelectedArchivedSemesterId}
          onCreateNewClass={handleCreateNewClass}
        />
      }
    />
  );
}
