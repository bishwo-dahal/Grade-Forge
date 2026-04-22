import api from "../api/axios";

export interface StudentCourseworkCourseApiResponse {
  id: number;
  name: string;
  courseCode: string;
  section: string | null;
  description: string | null;
  imageUrl: string | null;
  courseImage?: { downloadUrl: string } | null;
  canvasCourseId: string | null;
  active: boolean;
  isPublished: boolean;
  semester?: {
    id: number;
    name: string;
    startDate: string;
    endDate: string;
  } | null;
  faculty?: {
    id: number;
    name: string;
    email: string;
    department: string;
    qualifications: string;
  } | null;
}

export interface StudentCourseworkAssignmentApiResponse {
  id: number;
  courseId: number;
  courseName: string;
  languageId: number;
  languageName: string;
  name: string;
  description: string | null;
  totalPoints: number;
  submissionType: string;
  starterCodeUrl: string | null;
  availableFrom: string | null;
  dueDate: string | null;
  lateDueDate: string | null;
}

export interface StudentCourseworkSubmissionApiResponse {
  id: number;
  assignmentId: number;
  assignmentName: string;
  courseId: number;
  courseName: string;
  studentId: number;
  studentName: string;
  studentEmail: string;
  marks: number | null;
  feedback: string | null;
  submittedAt: string;
}

export interface StudentCourseworkSnapshot {
  courses: StudentCourseworkCourseApiResponse[];
  assignmentsByCourseId: Map<number, StudentCourseworkAssignmentApiResponse[]>;
  submissionsByAssignmentId: Map<number, StudentCourseworkSubmissionApiResponse[]>;
}

const SNAPSHOT_TTL_MS = 30_000;

let cachedSnapshot: StudentCourseworkSnapshot | null = null;
let cachedSnapshotAt = 0;
let inFlightSnapshotPromise: Promise<StudentCourseworkSnapshot> | null = null;

export function invalidateStudentCourseworkSnapshotCache(): void {
  cachedSnapshot = null;
  cachedSnapshotAt = 0;
  inFlightSnapshotPromise = null;
}

export async function getStudentCourseworkSnapshot(): Promise<StudentCourseworkSnapshot> {
  const now = Date.now();
  if (cachedSnapshot && now - cachedSnapshotAt < SNAPSHOT_TTL_MS) {
    return cachedSnapshot;
  }

  if (inFlightSnapshotPromise) {
    return inFlightSnapshotPromise;
  }

  inFlightSnapshotPromise = loadStudentCourseworkSnapshot()
    .then((snapshot) => {
      cachedSnapshot = snapshot;
      cachedSnapshotAt = Date.now();
      return snapshot;
    })
    .finally(() => {
      inFlightSnapshotPromise = null;
    });

  return inFlightSnapshotPromise;
}

async function loadStudentCourseworkSnapshot(): Promise<StudentCourseworkSnapshot> {
  const { data: courses } = await api.get<StudentCourseworkCourseApiResponse[]>("/api/v1/student/classes/enrolled");

  const assignmentsByCourseEntries = await Promise.all(
    courses.map(async (course) => {
      const { data } = await api.get<StudentCourseworkAssignmentApiResponse[]>(
        `/api/v1/student/assignments/course/${course.id}`,
      );
      return [course.id, data] as const;
    }),
  );

  const allAssignments = assignmentsByCourseEntries.flatMap(([, assignments]) => assignments);

  const submissionsByAssignmentEntries = await Promise.all(
    allAssignments.map(async (assignment) => {
      const { data } = await api.get<StudentCourseworkSubmissionApiResponse[]>(
        `/api/v1/student/submissions/assignment?assignmentId=${assignment.id}`,
      );
      return [assignment.id, data] as const;
    }),
  );

  return {
    courses,
    assignmentsByCourseId: new Map(assignmentsByCourseEntries),
    submissionsByAssignmentId: new Map(submissionsByAssignmentEntries),
  };
}

// ── Dashboard data types ─────────────────────────────────────────────────────

export interface StudentDashboardStats {
  enrolledCourses: number;
  pendingSubmissions: number;
  gradedThisWeek: number;
}

export interface RecentGradeItem {
  submissionId: number;
  assignmentName: string;
  courseCode: string;
  courseId: number;
  score: number;
  totalPoints: number;
  submittedAt: string; // ISO date string
}

export interface DeadlineItem {
  assignmentId: number;
  assignmentName: string;
  courseName: string;
  courseCode: string;
  dueDate: string; // ISO date string
  dueDateLabel: string; // e.g. "due 11:59 PM"
  isSubmitted: boolean;
}

export interface DeadlineGroup {
  label: string; // e.g. "Today, Monday 21" | "Tomorrow" | "Wednesday"
  items: DeadlineItem[];
}

export interface StudentCourseCardItem {
  id: string;
  title: string;
  code: string;
  coverImageUrl: string;
  submittedCount: number;
  totalAssignments: number;
  avgScore: number;
  activeAssignments: number;
}

export interface StudentDashboardData {
  stats: StudentDashboardStats;
  courseCards: StudentCourseCardItem[];
  recentGrades: RecentGradeItem[];
  deadlineGroups: DeadlineGroup[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function pickLatest(
  submissions: StudentCourseworkSubmissionApiResponse[],
): StudentCourseworkSubmissionApiResponse | null {
  if (submissions.length === 0) return null;
  return [...submissions].sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
  )[0] ?? null;
}

function buildDeadlineGroups(snapshot: StudentCourseworkSnapshot): DeadlineGroup[] {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const sevenDaysOut = todayStart + 7 * 24 * 60 * 60 * 1000;

  const flat: Array<DeadlineItem & { dueTimestamp: number }> = [];

  for (const course of snapshot.courses) {
    if (!course.isPublished) continue;
    const assignments = snapshot.assignmentsByCourseId.get(course.id) ?? [];
    for (const assignment of assignments) {
      if (!assignment.dueDate) continue;
      const dueAt = new Date(assignment.dueDate).getTime();
      if (isNaN(dueAt) || dueAt < todayStart || dueAt >= sevenDaysOut) continue;

      const submissions = snapshot.submissionsByAssignmentId.get(assignment.id) ?? [];
      const isSubmitted = submissions.length > 0;
      const dueDate = new Date(assignment.dueDate);
      const dueDateLabel = `due ${dueDate.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      })}`;

      flat.push({
        assignmentId: assignment.id,
        assignmentName: assignment.name,
        courseName: course.name,
        courseCode: course.courseCode,
        dueDate: assignment.dueDate,
        dueDateLabel,
        isSubmitted,
        dueTimestamp: dueAt,
      });
    }
  }

  flat.sort((a, b) => a.dueTimestamp - b.dueTimestamp);

  const byDay = new Map<string, DeadlineItem[]>();
  for (const item of flat) {
    const d = new Date(item.dueTimestamp);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const list = byDay.get(key) ?? [];
    list.push(item);
    byDay.set(key, list);
  }

  const groups: DeadlineGroup[] = [];
  for (const [key, items] of byDay) {
    const [y, m, d] = key.split("-").map(Number);
    const dayDate = new Date(y, m, d);
    const diffDays = Math.round((dayDate.getTime() - todayStart) / (24 * 60 * 60 * 1000));

    let label: string;
    if (diffDays === 0) {
      label = `Today, ${dayDate.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      })}`;
    } else if (diffDays === 1) {
      label = "Tomorrow";
    } else {
      label = dayDate.toLocaleDateString("en-US", { weekday: "long" });
    }

    groups.push({ label, items });
  }

  return groups;
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function getStudentDashboardData(): Promise<StudentDashboardData> {
  const snapshot = await getStudentCourseworkSnapshot();
  const publishedCourses = snapshot.courses.filter((c) => c.isPublished);
  const enrolledCourses = publishedCourses.length;

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  let pendingSubmissions = 0;
  let gradedThisWeek = 0;
  const gradeItems: Array<RecentGradeItem & { sortKey: number }> = [];

  for (const course of publishedCourses) {
    const assignments = snapshot.assignmentsByCourseId.get(course.id) ?? [];
    for (const assignment of assignments) {
      const submissions = snapshot.submissionsByAssignmentId.get(assignment.id) ?? [];
      const latest = pickLatest(submissions);

      if (!latest) {
        const dueAt = assignment.dueDate ? new Date(assignment.dueDate).getTime() : null;
        if (dueAt === null || dueAt > Date.now()) {
          pendingSubmissions++;
        }
      } else if (latest.marks !== null) {
        const submittedAt = new Date(latest.submittedAt).getTime();
        if (submittedAt >= sevenDaysAgo) gradedThisWeek++;
        gradeItems.push({
          submissionId: latest.id,
          assignmentName: assignment.name,
          courseCode: course.courseCode,
          courseId: course.id,
          score: latest.marks,
          totalPoints: assignment.totalPoints,
          submittedAt: latest.submittedAt,
          sortKey: submittedAt,
        });
      }
    }
  }

  gradeItems.sort((a, b) => b.sortKey - a.sortKey);
  const recentGrades = gradeItems.slice(0, 6).map(({ sortKey: _sk, ...item }) => item);

  const now = Date.now();
  const courseCards: StudentCourseCardItem[] = publishedCourses.map((course) => {
    const assignments = snapshot.assignmentsByCourseId.get(course.id) ?? [];
    let submittedCount = 0;
    let gradedTotal = 0;
    let gradedEarned = 0;
    let activeAssignments = 0;
    for (const assignment of assignments) {
      const subs = snapshot.submissionsByAssignmentId.get(assignment.id) ?? [];
      const latest = pickLatest(subs);
      if (latest) submittedCount++;
      if (latest?.marks !== null && latest?.marks !== undefined) {
        gradedEarned += latest.marks;
        gradedTotal += assignment.totalPoints;
      }
      const dueAt = assignment.dueDate ? new Date(assignment.dueDate).getTime() : null;
      if (dueAt === null || dueAt > now) activeAssignments++;
    }
    const avgScore = gradedTotal > 0 ? Math.round((gradedEarned / gradedTotal) * 100) : 0;
    return {
      id: String(course.id),
      title: course.name,
      code: course.courseCode,
      coverImageUrl: course.courseImage?.downloadUrl?.trim() || course.imageUrl?.trim() || "/ulm.jpg",
      submittedCount,
      totalAssignments: assignments.length,
      avgScore,
      activeAssignments,
    };
  });

  return {
    stats: { enrolledCourses, pendingSubmissions, gradedThisWeek },
    courseCards,
    recentGrades,
    deadlineGroups: buildDeadlineGroups(snapshot),
  };
}
