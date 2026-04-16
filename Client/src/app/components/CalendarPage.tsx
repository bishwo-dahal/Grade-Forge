import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { useNavigate } from "react-router";
import { clearAuthenticated, getAuthenticatedUser } from "../auth";
import { AuthShell } from "./layout/AuthShell";
import { AuthTopBar } from "./layout/AuthTopBar";
import type { SettingsSection } from "./layout/AuthTopBar";
import type { CalendarAssignment } from "../../types/assignment";
import { getStudentCourseworkSnapshot } from "../../services/studentCourseworkService";
import { getFacultyCourseworkSnapshot } from "../../services/facultyCourseworkService";

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS_OF_WEEK = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// Each course is assigned a color in order of first appearance.
const COURSE_COLORS = ["#4B67C8", "#EA7A14", "#1E8E4D", "#9333EA", "#0891B2", "#DC2626", "#7A1226"];

// ─── Pure helpers ─────────────────────────────────────────────────────────────

/** Returns "YYYY-MM-DD" string from a local Date. */
function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/** Returns true when two Dates fall on the same calendar day. */
function isSameDay(a: Date, b: Date): boolean {
  return toDateKey(a) === toDateKey(b);
}

/**
 * Builds a 42-cell (6-week) grid starting from the Sunday on or before
 * the 1st of the given month.
 */
function buildCalendarGrid(year: number, month: number): Date[] {
  const firstOfMonth = new Date(year, month, 1);
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(1 - firstOfMonth.getDay()); // back-fill to preceding Sunday

  const cells: Date[] = [];
  const cursor = new Date(gridStart);
  for (let i = 0; i < 42; i++) {
    cells.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return cells;
}

/** Returns assignments whose dueDate falls on the given calendar day. */
function assignmentsOnDay(assignments: CalendarAssignment[], day: Date): CalendarAssignment[] {
  const key = toDateKey(day);
  return assignments.filter((a) => a.dueDate.slice(0, 10) === key);
}

/** Returns [start, end] for the current calendar week (Sun 00:00 – Sat 23:59). */
function currentWeekRange(): [Date, Date] {
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - today.getDay());
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return [start, end];
}

/** Builds a Map<courseId, hexColor> in order of first appearance. */
function buildCourseColorMap(assignments: CalendarAssignment[]): Map<number, string> {
  const map = new Map<number, string>();
  for (const a of assignments) {
    if (!map.has(a.courseId)) {
      map.set(a.courseId, COURSE_COLORS[map.size % COURSE_COLORS.length]);
    }
  }
  return map;
}

/** Formats an ISO datetime string to "h:mm AM/PM" local time. */
function formatTime(isoDate: string): string {
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

// ─── Data loaders ─────────────────────────────────────────────────────────────

async function loadStudentAssignments(): Promise<CalendarAssignment[]> {
  const snapshot = await getStudentCourseworkSnapshot();
  const courseById = new Map(snapshot.courses.map((c) => [c.id, c]));
  const results: CalendarAssignment[] = [];
  for (const [courseId, assignments] of snapshot.assignmentsByCourseId) {
    const course = courseById.get(courseId);
    for (const a of assignments) {
      if (!a.dueDate) continue;
      results.push({
        id: a.id,
        name: a.name,
        courseId: a.courseId,
        courseCode: course?.courseCode ?? a.courseName,
        dueDate: a.dueDate,
        totalPoints: a.totalPoints,
      });
    }
  }
  return results;
}

async function loadFacultyAssignments(): Promise<CalendarAssignment[]> {
  const snapshot = await getFacultyCourseworkSnapshot();
  const courseById = new Map(snapshot.courses.map((c) => [c.id, c]));
  const results: CalendarAssignment[] = [];
  for (const [courseId, assignments] of snapshot.assignmentsByCourseId) {
    const course = courseById.get(courseId);
    for (const a of assignments) {
      if (!a.dueDate) continue;
      results.push({
        id: a.id,
        name: a.name,
        courseId: a.courseId,
        courseCode: course?.courseCode ?? a.courseName,
        dueDate: a.dueDate,
        totalPoints: a.totalPoints,
      });
    }
  }
  return results;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface CalendarPageProps {
  roleView: "student" | "faculty";
  pageTitle: string;
}

export function CalendarPage({ roleView, pageTitle }: CalendarPageProps) {
  const navigate = useNavigate();
  const loggedInUser = getAuthenticatedUser();
  const displayName = loggedInUser?.name ?? (roleView === "faculty" ? "Dr. Sarah Miller" : "Alex Johnson");
  const displayEmail = loggedInUser?.email ?? (roleView === "faculty" ? "smiller@university.edu" : "alex@university.edu");
  const displayInitials =
    displayName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "GF";

  const today = useMemo(() => new Date(), []);
  const [currentMonth, setCurrentMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [assignments, setAssignments] = useState<CalendarAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const loader = roleView === "student" ? loadStudentAssignments() : loadFacultyAssignments();
    loader.then(setAssignments).finally(() => setIsLoading(false));
  }, [roleView]);

  const courseColorMap = useMemo(() => buildCourseColorMap(assignments), [assignments]);

  const calendarCells = useMemo(
    () => buildCalendarGrid(currentMonth.getFullYear(), currentMonth.getMonth()),
    [currentMonth],
  );

  const selectedDayAssignments = useMemo(
    () => assignmentsOnDay(assignments, selectedDate),
    [assignments, selectedDate],
  );

  const [weekStart, weekEnd] = useMemo(() => currentWeekRange(), []);
  const upcomingThisWeek = useMemo(
    () =>
      assignments
        .filter((a) => {
          const d = new Date(a.dueDate);
          return d >= weekStart && d <= weekEnd;
        })
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()),
    [assignments, weekStart, weekEnd],
  );

  const handlePrevMonth = () =>
    setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  const handleNextMonth = () =>
    setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1));

  const handleAssignmentClick = (a: CalendarAssignment) => {
    if (roleView === "student") {
      navigate(`/assignment/${a.id}`);
    } else {
      navigate(`/faculty/class/${a.courseId}/assignment/${a.id}`);
    }
  };

  const handleLogout = () => {
    clearAuthenticated();
    navigate("/signin", { replace: true });
  };
  const goToSettingsSection = (section: SettingsSection) => navigate(`/settings?section=${section}`);

  const topBar = (
    <AuthTopBar
      roleView={roleView}
      profile={{ name: displayName, email: displayEmail, initials: displayInitials }}
      showSearch={false}
      pageTitle={pageTitle}
      onSettingsSectionSelect={goToSettingsSection}
      onLogout={handleLogout}
    />
  );

  return (
    <AuthShell
      roleView={roleView}
      topBar={topBar}
      mainContent={
        <main className="flex-1 overflow-y-auto bg-[#F5F4F6] px-6 py-6">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center text-[14px] text-[#5d667a]">
              Loading calendar…
            </div>
          ) : (
            <>
              {/* ── Calendar grid + Day detail ─────────────────── */}
              <div className="flex gap-4">
                {/* Calendar grid */}
                <div className="flex-1 rounded-xl border border-[#c9c4c9] bg-white p-5 shadow-sm">
                  {/* Month navigation */}
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-[15px] font-semibold text-[#2B2A2A]">
                      {MONTH_NAMES[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                    </h2>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={handlePrevMonth}
                        className="rounded p-1 text-[#5d667a] transition-colors hover:bg-[#F5F4F6]"
                        aria-label="Previous month"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button
                        onClick={handleNextMonth}
                        className="rounded p-1 text-[#5d667a] transition-colors hover:bg-[#F5F4F6]"
                        aria-label="Next month"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Day-of-week header */}
                  <div className="mb-1 grid grid-cols-7">
                    {DAYS_OF_WEEK.map((d) => (
                      <div key={d} className="py-1 text-center text-[11px] font-semibold text-[#5d667a]">
                        {d}
                      </div>
                    ))}
                  </div>

                  {/* Date cells */}
                  <div className="grid grid-cols-7">
                    {calendarCells.map((date, i) => {
                      const inMonth = date.getMonth() === currentMonth.getMonth();
                      const isToday = isSameDay(date, today);
                      const isSelected = isSameDay(date, selectedDate);
                      const dayAssignments = assignmentsOnDay(assignments, date);

                      return (
                        <button
                          key={i}
                          onClick={() => setSelectedDate(new Date(date))}
                          className={[
                            "relative flex min-h-[52px] flex-col items-center justify-start rounded-lg pt-2 pb-1 transition-colors",
                            inMonth ? "text-[#2B2A2A]" : "text-[#c9c4c9]",
                            isSelected
                              ? "bg-[#7A1226] text-white"
                              : isToday
                              ? "border border-[#F97316]"
                              : "hover:bg-[#F5F4F6]",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                        >
                          <span className="text-[13px] font-medium leading-5">{date.getDate()}</span>
                          {/* Assignment dots */}
                          {dayAssignments.length > 0 && (
                            <div className="mt-0.5 flex gap-0.5">
                              {dayAssignments.slice(0, 3).map((a, di) => (
                                <span
                                  key={di}
                                  className="h-1.5 w-1.5 rounded-full"
                                  style={{
                                    backgroundColor: isSelected
                                      ? "#fff"
                                      : (courseColorMap.get(a.courseId) ?? "#7A1226"),
                                  }}
                                />
                              ))}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Legend */}
                  <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-[#c9c4c9] pt-3">
                    <div className="flex items-center gap-1.5 text-[11px] text-[#5d667a]">
                      <span className="h-3 w-3 rounded-sm border border-[#F97316]" />
                      Today
                    </div>
                    {Array.from(courseColorMap.entries())
                      .slice(0, 4)
                      .map(([courseId, color]) => {
                        const course = assignments.find((a) => a.courseId === courseId);
                        return (
                          <div key={courseId} className="flex items-center gap-1.5 text-[11px] text-[#5d667a]">
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                            {course?.courseCode ?? "Course"}
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Day Detail Panel */}
                <div className="w-[280px] shrink-0 rounded-xl border border-[#c9c4c9] bg-white p-5 shadow-sm">
                  <p className="text-[15px] font-semibold text-[#2B2A2A]">
                    {MONTH_NAMES[selectedDate.getMonth()]} {selectedDate.getDate()},{" "}
                    {selectedDate.getFullYear()}
                  </p>
                  {selectedDayAssignments.length === 0 ? (
                    <p className="mt-3 text-[13px] text-[#5d667a]">No assignments due</p>
                  ) : (
                    <>
                      <p className="mt-1 text-[12px] text-[#5d667a]">
                        {selectedDayAssignments.length} assignment
                        {selectedDayAssignments.length !== 1 ? "s" : ""} due
                      </p>
                      <div className="mt-4 flex flex-col gap-3">
                        {selectedDayAssignments.map((a) => (
                          <button
                            key={a.id}
                            onClick={() => handleAssignmentClick(a)}
                            className="flex items-start gap-3 rounded-lg p-2 text-left transition-colors hover:bg-[#F5F4F6]"
                          >
                            <div
                              className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[11px] font-bold"
                              style={{
                                backgroundColor: `${courseColorMap.get(a.courseId) ?? "#7A1226"}20`,
                                color: courseColorMap.get(a.courseId) ?? "#7A1226",
                              }}
                            >
                              {a.courseCode.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-[13px] font-medium leading-tight text-[#2B2A2A]">
                                {a.name}
                              </p>
                              <p className="text-[11px] text-[#5d667a]">{a.courseCode}</p>
                              <div className="mt-0.5 flex items-center gap-1 text-[11px] text-[#5d667a]">
                                <Clock size={10} />
                                <span>{formatTime(a.dueDate)}</span>
                                <span>·</span>
                                <span>{a.totalPoints} pts</span>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* ── Upcoming This Week ─────────────────────────── */}
              {upcomingThisWeek.length > 0 && (
                <section className="mt-6">
                  <h2 className="mb-3 text-[15px] font-semibold text-[#2B2A2A]">Upcoming This Week</h2>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {upcomingThisWeek.map((a) => (
                      <button
                        key={a.id}
                        onClick={() => handleAssignmentClick(a)}
                        className="flex items-start gap-3 rounded-xl border border-[#c9c4c9] bg-white p-4 text-left shadow-sm transition-all hover:border-[#7A1226]/40 hover:shadow-md"
                      >
                        <div
                          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold"
                          style={{
                            backgroundColor: `${courseColorMap.get(a.courseId) ?? "#7A1226"}18`,
                            color: courseColorMap.get(a.courseId) ?? "#7A1226",
                          }}
                        >
                          {a.courseCode.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-semibold leading-tight text-[#2B2A2A]">
                            {a.name}
                          </p>
                          <p className="mt-0.5 text-[12px] text-[#5d667a]">{a.courseCode}</p>
                          <div className="mt-1.5 flex items-center justify-between">
                            <span className="text-[11px] text-[#5d667a]">
                              Due{" "}
                              {new Date(a.dueDate).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                            <span className="text-[12px] font-semibold text-[#2B2A2A]">
                              {a.totalPoints} pts
                            </span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </main>
      }
    />
  );
}
