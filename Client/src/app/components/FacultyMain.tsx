import React, { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  Users,
  FileText,
  Clock,
  BookOpen,
  ChevronRight,
  CheckCircle2,
  CalendarClock,
} from "lucide-react";
import { getFacultyCourseworkSnapshot } from "../../services/facultyCourseworkService";
import type { FacultyCourseworkSnapshot } from "../../services/facultyCourseworkService";
import { CourseCoverCardShell } from "./CourseCoverCardShell";

// ── Derived data shapes ─────────────────────────────────────────────────────

interface DashboardStats {
  pendingGrading: number;
  closingSoon: number;
  totalStudents: number;
  activeAssignments: number;
}

interface GradingQueueItem {
  submissionId: number;
  studentName: string;
  assignmentName: string;
  courseCode: string;
  courseId: number;
  assignmentId: number;
  submittedAt: string;
}

interface DeadlineItem {
  assignmentId: number;
  name: string;
  courseId: number;
  courseCode: string;
  dueDate: string;
  submittedCount: number;
  totalStudents: number;
}

interface CourseHealthItem {
  id: string;
  title: string;
  code: string;
  students: number;
  activeAssignments: number;
  pendingGrading: number;
  gradedCount: number;
  totalSubmissions: number;
  avgScore: number;
  coverImageUrl?: string | null;
}

// ── Data derivation ─────────────────────────────────────────────────────────

function deriveFromSnapshot(snapshot: FacultyCourseworkSnapshot) {
  const now = Date.now();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

  const courseCodeById = new Map(snapshot.courses.map((c) => [c.id, c.courseCode]));
  const activeCourses = snapshot.courses.filter((c) => c.active);

  const allSubmissions = [...snapshot.submissionsByAssignmentId.values()].flat();
  const allAssignments = [...snapshot.assignmentsByCourseId.values()].flat();

  const pendingGrading = allSubmissions.filter((s) => s.marks === null).length;

  const closingSoon = allAssignments.filter((a) => {
    if (!a.dueDate) return false;
    const due = new Date(a.dueDate).getTime();
    return due >= now && due <= now + sevenDaysMs;
  }).length;

  const totalStudents = activeCourses.reduce((sum, course) => {
    const enrollments = snapshot.enrollmentsByCourseId.get(course.id) ?? [];
    const active = enrollments.filter((e) => e.enrolledStatus === "ENROLLED").length;
    return sum + (active > 0 ? active : enrollments.length);
  }, 0);

  const activeAssignments = allAssignments.filter((a) => {
    if (!a.dueDate) return true;
    return new Date(a.dueDate).getTime() >= now;
  }).length;

  const stats: DashboardStats = { pendingGrading, closingSoon, totalStudents, activeAssignments };

  const gradingQueue: GradingQueueItem[] = allSubmissions
    .filter((s) => s.marks === null)
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
    .slice(0, 8)
    .map((s) => ({
      submissionId: s.id,
      studentName: s.studentName,
      assignmentName: s.assignmentName,
      courseCode: courseCodeById.get(s.courseId) ?? s.courseName,
      courseId: s.courseId,
      assignmentId: s.assignmentId,
      submittedAt: s.submittedAt,
    }));

  const upcomingDeadlines: DeadlineItem[] = allAssignments
    .filter((a) => {
      if (!a.dueDate) return false;
      const due = new Date(a.dueDate).getTime();
      return due >= now && due <= now + sevenDaysMs;
    })
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 8)
    .map((a) => {
      const submissions = snapshot.submissionsByAssignmentId.get(a.id) ?? [];
      const enrollments = snapshot.enrollmentsByCourseId.get(a.courseId) ?? [];
      const enrolled =
        enrollments.filter((e) => e.enrolledStatus === "ENROLLED").length || enrollments.length;
      return {
        assignmentId: a.id,
        name: a.name,
        courseId: a.courseId,
        courseCode: courseCodeById.get(a.courseId) ?? a.courseName,
        dueDate: a.dueDate!,
        submittedCount: submissions.length,
        totalStudents: enrolled,
      };
    });

  const courseHealth: CourseHealthItem[] = activeCourses.map((course) => {
    const enrollments = snapshot.enrollmentsByCourseId.get(course.id) ?? [];
    const assignments = snapshot.assignmentsByCourseId.get(course.id) ?? [];
    const enrolled =
      enrollments.filter((e) => e.enrolledStatus === "ENROLLED").length || enrollments.length;
    const activeAssigCount = assignments.filter((a) => {
      if (!a.dueDate) return true;
      return new Date(a.dueDate).getTime() >= now;
    }).length;
    const subs = assignments.flatMap((a) => snapshot.submissionsByAssignmentId.get(a.id) ?? []);
    const pending = subs.filter((s) => s.marks === null).length;
    const graded = subs.filter((s) => s.marks !== null);
    const avgScore =
      graded.length > 0
        ? Math.round(graded.reduce((sum, s) => sum + Number(s.marks ?? 0), 0) / graded.length)
        : 0;
    return {
      id: String(course.id),
      title: course.name,
      code: course.courseCode,
      students: enrolled,
      activeAssignments: activeAssigCount,
      pendingGrading: pending,
      gradedCount: graded.length,
      totalSubmissions: subs.length,
      avgScore,
      coverImageUrl: course.imageUrl ?? null,
    };
  });

  return { stats, gradingQueue, upcomingDeadlines, courseHealth };
}

// ── Utilities ────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 2) return "just now";
  if (hours < 1) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "yesterday";
  return `${days}d ago`;
}

function formatDue(iso: string): string {
  const due = new Date(iso);
  const diffDays = Math.ceil((due.getTime() - Date.now()) / 86400000);
  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  return due.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

const AVATAR_PALETTES = [
  { bg: "#EEF2FF", text: "#5A7ACD" },
  { bg: "#FFF7ED", text: "#C2590A" },
  { bg: "#F0FDF4", text: "#16A34A" },
  { bg: "#FFF1F2", text: "#9F3549" },
  { bg: "#F5F3FF", text: "#7C3AED" },
  { bg: "#ECFDF5", text: "#059669" },
];

function avatarPalette(name: string) {
  const idx = ((name.charCodeAt(0) ?? 0) + (name.charCodeAt(1) ?? 0)) % AVATAR_PALETTES.length;
  return AVATAR_PALETTES[idx];
}

// ── Main export ─────────────────────────────────────────────────────────────

export function FacultyMain() {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [gradingQueue, setGradingQueue] = useState<GradingQueueItem[]>([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<DeadlineItem[]>([]);
  const [courseHealth, setCourseHealth] = useState<CourseHealthItem[]>([]);

  useEffect(() => {
    getFacultyCourseworkSnapshot()
      .then((snapshot) => {
        const derived = deriveFromSnapshot(snapshot);
        setStats(derived.stats);
        setGradingQueue(derived.gradingQueue);
        setUpcomingDeadlines(derived.upcomingDeadlines);
        setCourseHealth(derived.courseHealth);
      })
      .catch(() => {
        setStats({ pendingGrading: 0, closingSoon: 0, totalStudents: 0, activeAssignments: 0 });
      })
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <main className="flex-1 overflow-y-auto bg-[#F5F4F6]">
      <div className="space-y-6 p-6">
        <MyClassesSection items={courseHealth} isLoading={isLoading} />
        <StatCardRow stats={stats} isLoading={isLoading} />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <GradingQueuePanel items={gradingQueue} isLoading={isLoading} />
          <UpcomingDeadlinesPanel items={upcomingDeadlines} isLoading={isLoading} />
        </div>
        <CourseHealthSection items={courseHealth} isLoading={isLoading} />
      </div>
    </main>
  );
}

// ── My classes ───────────────────────────────────────────────────────────────

const MAX_VISIBLE_CLASSES = 4;

function MyClassesSection({ items, isLoading }: { items: CourseHealthItem[]; isLoading: boolean }) {
  const visible = items.slice(0, MAX_VISIBLE_CLASSES);
  const hasMore = items.length > MAX_VISIBLE_CLASSES;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[14px] font-semibold text-[#1F2430]">My Classes</h2>
        <Link
          to="/faculty/my-classes"
          className="text-[12px] font-medium text-[#7A1226] hover:text-[#65101F]"
        >
          View All &rarr;
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
              >
                <div className="h-[120px] bg-gray-100" />
                <div className="space-y-2 p-3">
                  <div className="h-3.5 w-36 rounded bg-gray-200" />
                  <div className="h-3 w-20 rounded bg-gray-100" />
                  <div className="mt-2 flex gap-4">
                    <div className="h-3 w-16 rounded bg-gray-100" />
                    <div className="h-3 w-16 rounded bg-gray-100" />
                  </div>
                </div>
              </div>
            ))
          : null}

        {!isLoading &&
          visible.map((course) => (
            <Link
              key={course.id}
              to={`/faculty/class/${course.id}`}
              className="group block overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              <CourseCoverCardShell
                coverImageUrl={course.coverImageUrl}
                compact
                className="border-0 shadow-none"
                imageOverlay={
                  <div className="flex h-full items-start justify-end p-2">
                    <span className="rounded-md bg-black/35 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white ring-1 ring-white/30">
                      {course.code}
                    </span>
                  </div>
                }
              >
                <div className="flex flex-col gap-1 p-3 pt-2">
                  <h3 className="line-clamp-2 text-[13px] font-semibold leading-snug text-[#1F2430]">
                    {course.title}
                  </h3>
                  <div className="mt-1 flex items-center gap-3 text-[11px] text-gray-500">
                    <span>{course.students} students</span>
                    <span>{course.activeAssignments} active</span>
                  </div>
                  {course.pendingGrading > 0 && (
                    <span className="mt-1 w-fit rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-600">
                      {course.pendingGrading} to grade
                    </span>
                  )}
                </div>
              </CourseCoverCardShell>
            </Link>
          ))}

        {!isLoading && hasMore && (
          <Link
            to="/faculty/my-classes"
            className="flex min-h-[200px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 bg-white text-[13px] font-medium text-[#7A1226] shadow-sm transition-colors hover:border-[#7A1226] hover:bg-[#FBF7F8]"
          >
            <span className="text-[22px] font-light text-gray-400">+{items.length - MAX_VISIBLE_CLASSES}</span>
            <span>More classes</span>
          </Link>
        )}

        {!isLoading && items.length === 0 && (
          <div className="col-span-full rounded-xl border border-dashed border-gray-200 bg-white p-8 text-center">
            <p className="text-[13px] text-gray-400">No active courses this semester</p>
            <Link
              to="/faculty/my-classes"
              className="mt-2 inline-block text-[12px] font-medium text-[#7A1226]"
            >
              Go to My Classes &rarr;
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Stat cards ───────────────────────────────────────────────────────────────

function StatCardRow({ stats, isLoading }: { stats: DashboardStats | null; isLoading: boolean }) {
  const cards = [
    {
      label: "Pending Grading",
      value: stats?.pendingGrading ?? 0,
      Icon: Clock,
      iconBg: "bg-red-50",
      iconColor: "text-red-500",
      valueColor: (stats?.pendingGrading ?? 0) > 0 ? "text-red-600" : "text-[#1F2430]",
      href: "/faculty/my-classes",
    },
    {
      label: "Closing This Week",
      value: stats?.closingSoon ?? 0,
      Icon: FileText,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-500",
      valueColor: "text-[#1F2430]",
      href: "/faculty/my-classes",
    },
    {
      label: "Total Students",
      value: stats?.totalStudents ?? 0,
      Icon: Users,
      iconBg: "bg-[#5A7ACD]/10",
      iconColor: "text-[#5A7ACD]",
      valueColor: "text-[#1F2430]",
      href: "/faculty/my-classes",
    },
    {
      label: "Active Assignments",
      value: stats?.activeAssignments ?? 0,
      Icon: BookOpen,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
      valueColor: "text-[#1F2430]",
      href: "/faculty/my-classes",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {cards.map((_, i) => (
          <div key={i} className="animate-pulse rounded-2xl bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-start justify-between">
              <div className="h-3 w-24 rounded bg-gray-100" />
              <div className="h-11 w-11 rounded-xl bg-gray-100" />
            </div>
            <div className="mt-3 h-8 w-12 rounded bg-gray-200" />
            <div className="mt-4 h-3 w-16 rounded bg-gray-100" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {cards.map(({ label, value, Icon, iconBg, iconColor, valueColor, href }) => (
        <div key={label} className="relative flex flex-col rounded-2xl bg-white p-4 shadow-sm">
          <div className={`absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-xl ${iconBg}`}>
            <Icon size={22} className={iconColor} />
          </div>
          <p className="pr-14 text-[12px] text-gray-500">{label}</p>
          <p className={`mt-1 text-[28px] font-bold leading-none ${valueColor}`}>{value}</p>
          <div className="mt-4">
            <Link
              to={href}
              className="flex items-center gap-0.5 text-[12px] font-medium text-gray-400 hover:text-[#7A1226]"
            >
              View all
              <ChevronRight size={13} />
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Grading queue ────────────────────────────────────────────────────────────

function GradingQueuePanel({ items, isLoading }: { items: GradingQueueItem[]; isLoading: boolean }) {
  return (
    <div className="flex flex-col rounded-2xl bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
        <h2 className="text-[14px] font-semibold text-[#1F2430]">Grading Queue</h2>
        <Link
          to="/faculty/my-classes"
          className="flex items-center gap-0.5 text-[11px] font-medium text-[#7A1226] hover:text-[#65101F]"
        >
          View all
          <ChevronRight size={11} />
        </Link>
      </div>

      {isLoading ? (
        <div className="divide-y divide-gray-50 px-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-3.5">
              <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-gray-100" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-32 animate-pulse rounded bg-gray-100" />
                <div className="h-2.5 w-48 animate-pulse rounded bg-gray-100" />
              </div>
              <div className="h-2.5 w-10 animate-pulse rounded bg-gray-100" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center py-14 text-center">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-green-50">
            <CheckCircle2 size={22} className="text-green-500" />
          </div>
          <p className="text-[13px] font-semibold text-gray-700">All caught up!</p>
          <p className="mt-0.5 text-[12px] text-gray-400">No submissions awaiting grades</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-50 px-5">
          {items.map((item) => {
            const palette = avatarPalette(item.studentName);
            return (
              <Link
                key={item.submissionId}
                to={`/faculty/class/${item.courseId}/assignment/${item.assignmentId}/submission/${item.submissionId}`}
                className="flex items-center gap-3 py-3.5 transition-opacity hover:opacity-70"
              >
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                  style={{ backgroundColor: palette.bg, color: palette.text }}
                >
                  {initials(item.studentName)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-[#1F2430]">
                    {item.studentName}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-gray-500">
                    <span className="min-w-0 truncate">{item.assignmentName}</span>
                    <span className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">
                      {item.courseCode}
                    </span>
                  </p>
                </div>
                <span className="shrink-0 text-[11px] text-gray-400">
                  {relativeTime(item.submittedAt)}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Upcoming deadlines ───────────────────────────────────────────────────────

function UpcomingDeadlinesPanel({
  items,
  isLoading,
}: {
  items: DeadlineItem[];
  isLoading: boolean;
}) {
  return (
    <div className="flex flex-col rounded-2xl bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
        <h2 className="text-[14px] font-semibold text-[#1F2430]">Closing This Week</h2>
        <Link
          to="/faculty/my-classes"
          className="flex items-center gap-0.5 text-[11px] font-medium text-[#7A1226] hover:text-[#65101F]"
        >
          View all
          <ChevronRight size={11} />
        </Link>
      </div>

      {isLoading ? (
        <div className="divide-y divide-gray-50 px-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-3.5">
              <div className="flex-1 space-y-2">
                <div className="h-3 w-40 animate-pulse rounded bg-gray-100" />
                <div className="h-2.5 w-28 animate-pulse rounded bg-gray-100" />
              </div>
              <div className="h-6 w-16 animate-pulse rounded-full bg-gray-100" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center py-14 text-center">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-blue-50">
            <CalendarClock size={22} className="text-blue-400" />
          </div>
          <p className="text-[13px] font-semibold text-gray-700">Nothing closing soon</p>
          <p className="mt-0.5 text-[12px] text-gray-400">No assignments due in the next 7 days</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-50 px-5">
          {items.map((item) => {
            const dueLabel = formatDue(item.dueDate);
            const isUrgent = dueLabel === "Today" || dueLabel === "Tomorrow";
            return (
              <Link
                key={item.assignmentId}
                to={`/faculty/class/${item.courseId}/assignment/${item.assignmentId}`}
                className="flex items-center gap-3 py-3.5 transition-opacity hover:opacity-70"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-[#1F2430]">{item.name}</p>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <span className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">
                      {item.courseCode}
                    </span>
                    <span className="text-[11px] text-gray-400">
                      {item.submittedCount}/{item.totalStudents} submitted
                    </span>
                  </div>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                    isUrgent ? "bg-red-50 text-red-600" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {dueLabel}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Course health ────────────────────────────────────────────────────────────

function CourseHealthSection({ items, isLoading }: { items: CourseHealthItem[]; isLoading: boolean }) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[14px] font-semibold text-[#1F2430]">Course Health</h2>
        <Link
          to="/faculty/my-classes"
          className="text-[12px] font-medium text-[#7A1226] hover:text-[#65101F]"
        >
          View All Courses &rarr;
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-2xl bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-start justify-between gap-2">
                  <div className="space-y-2">
                    <div className="h-3.5 w-40 rounded bg-gray-200" />
                    <div className="h-3 w-16 rounded bg-gray-100" />
                  </div>
                  <div className="h-8 w-14 rounded-lg bg-gray-100" />
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3 border-t border-gray-50 pt-4">
                  {[0, 1, 2].map((j) => (
                    <div key={j} className="space-y-1.5">
                      <div className="h-5 w-8 rounded bg-gray-200" />
                      <div className="h-3 w-14 rounded bg-gray-100" />
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <div className="mb-1.5 flex justify-between">
                    <div className="h-2.5 w-10 rounded bg-gray-100" />
                    <div className="h-2.5 w-6 rounded bg-gray-100" />
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-100" />
                </div>
              </div>
            ))
          : null}

        {!isLoading &&
          items.map((course) => {
            const gradingPct =
              course.totalSubmissions > 0
                ? Math.round((course.gradedCount / course.totalSubmissions) * 100)
                : 100;

            return (
              <div key={course.id} className="rounded-2xl bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate text-[13px] font-semibold text-[#1F2430]">
                      {course.title}
                    </h3>
                    <span className="text-[11px] text-gray-400">{course.code}</span>
                  </div>
                  <Link
                    to={`/faculty/class/${course.id}`}
                    className="shrink-0 rounded-lg bg-[#7A1226] px-3 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-[#65101F]"
                  >
                    Grade
                  </Link>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3 border-t border-gray-50 pt-4">
                  <div>
                    <p className="text-[17px] font-bold text-[#1F2430]">{course.students}</p>
                    <p className="text-[11px] text-gray-400">Students</p>
                  </div>
                  <div>
                    <p
                      className={`text-[17px] font-bold ${
                        course.pendingGrading > 0 ? "text-red-500" : "text-[#1F2430]"
                      }`}
                    >
                      {course.pendingGrading}
                    </p>
                    <p className="text-[11px] text-gray-400">To grade</p>
                  </div>
                  <div>
                    <p className="text-[17px] font-bold text-[#5A7ACD]">
                      {course.avgScore > 0 ? course.avgScore : "—"}
                    </p>
                    <p className="text-[11px] text-gray-400">Avg score</p>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-[11px] text-gray-400">Graded</span>
                    <span className="text-[11px] font-semibold text-[#1F2430]">{gradingPct}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-[#7A1226] transition-all duration-500"
                      style={{ width: `${gradingPct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}

        {!isLoading && items.length === 0 && (
          <div className="col-span-full rounded-2xl bg-white p-10 text-center shadow-sm">
            <p className="text-[13px] text-gray-500">No active courses this semester.</p>
            <Link
              to="/faculty/my-classes"
              className="mt-2 inline-block text-[12px] font-medium text-[#7A1226] hover:text-[#65101F]"
            >
              Go to My Classes &rarr;
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
