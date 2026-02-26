import {
  Activity,
  BookOpen,
  Clock,
  FileText,
} from "lucide-react";
import api from "../api/axios";
import { getAuthenticatedRole } from "../app/auth";
import type {
  ActivitySummary,
  AssignmentResult,
  CategoryStat,
  GradeRow,
  OverallGradeSummary,
  RecentlyGradedItem,
  SummaryMetric,
} from "../types/grade";

// NOTE: Centralized mock results/grades data to create a single integration seam.
// TODO(backend): Replace mock service with real API calls. Keep return shapes stable for the UI.

const summaryMetrics: SummaryMetric[] = [
  {
    title: "Total Classes",
    value: "6",
    subtitle: "This semester",
    icon: BookOpen,
    bgColor: "bg-[#E0DBFF]",
    iconColor: "text-purple-600",
  },
  {
    title: "Active Assignments",
    value: "12",
    subtitle: "Across all classes",
    icon: FileText,
    bgColor: "bg-orange-100",
    iconColor: "text-orange-600",
  },
  {
    title: "Pending Submissions",
    value: "3",
    subtitle: "Due this week",
    icon: Clock,
    bgColor: "bg-[#E0DBFF]",
    iconColor: "text-purple-600",
  },
  {
    title: "Recent Activity",
    value: "8",
    subtitle: "In the last 7 days",
    icon: Activity,
    bgColor: "bg-orange-100",
    iconColor: "text-orange-600",
  },
];

const activitySummary: ActivitySummary = {
  data: [
    { day: "Mon", submissions: 4, graded: 3 },
    { day: "Tue", submissions: 6, graded: 5 },
    { day: "Wed", submissions: 3, graded: 4 },
    { day: "Thu", submissions: 8, graded: 6 },
    { day: "Fri", submissions: 5, graded: 7 },
    { day: "Sat", submissions: 2, graded: 2 },
    { day: "Sun", submissions: 3, graded: 1 },
  ],
  totalSubmissions: 31,
  totalGraded: 28,
};

const gradeRows: GradeRow[] = [
  { id: "assignment-6", name: "Linked List Operations", category: "Assignment", score: 95, total: 100, weight: "10%" },
  { id: "assignment-5", name: "Stack and Queue Applications", category: "Assignment", score: 88, total: 100, weight: "10%" },
  { id: "assignment-4", name: "Recursion and Backtracking", category: "Assignment", score: 92, total: 100, weight: "10%" },
  { id: "assignment-3", name: "Array Sorting Algorithms", category: "Assignment", score: 98, total: 100, weight: "10%" },
  { id: "quiz-2", name: "Quiz: Trees & Graphs", category: "Quiz", score: 85, total: 100, weight: "10%" },
  { id: "quiz-1", name: "Quiz: Arrays & Lists", category: "Quiz", score: 90, total: 100, weight: "10%" },
  { id: "midterm", name: "Midterm Exam", category: "Midterm", score: 92, total: 100, weight: "20%" },
  { id: "final", name: "Final Exam", category: "Final Exam", score: 0, total: 100, weight: "20%" },
];

// NOTE: Use Unicode escapes for the em dash to avoid mojibake in non-UTF8 environments.
const categoryStats: CategoryStat[] = [
  { category: "Assignments", weight: "40%", average: "93.3%", completed: "5/8" },
  { category: "Quizzes", weight: "20%", average: "87.5%", completed: "2/4" },
  { category: "Midterm", weight: "20%", average: "\u2014", completed: "0/1" },
  { category: "Final Exam", weight: "20%", average: "\u2014", completed: "0/1" },
];

// NOTE: Added overall grade summary for class-grade overview cards.
const overallGradeSummary: OverallGradeSummary = {
  current: "92.4%",
  letter: "A-",
  classAverage: "84.2%",
};

const assignmentResult: AssignmentResult = {
  score: 85,
  totalPoints: 100,
  earnedPoints: 85,
  submittedAt: "October 22, 2023 at 3:45 PM",
  gradedAt: "October 26, 2023 \u2022 14:32 PM",
  status: "Good Effort!",
  publicTestsPassed: 4,
  publicTestsTotal: 5,
  privateTestsPassed: 8,
  privateTestsTotal: 10,
  privateTestResults: [true, true, true, true, true, true, true, true, false, false],
  failedTests: [
    "Failed: Edge Case (Negative Input)",
    "Failed: Performance (Memory Limit Exceeded)",
  ],
  compileErrors: [],
  runtimeErrors: [],
  rubricBreakdown: [
    {
      category: "Logic & Correctness",
      earned: 40,
      total: 40,
      feedback: null,
    },
    {
      category: "Performance & Optimization",
      earned: 30,
      total: 40,
      feedback: "Space complexity O(n^2) detected in hash function",
    },
    {
      category: "Documentation",
      earned: 15,
      total: 20,
      feedback: null,
    },
  ],
};

const recentlyGraded: RecentlyGradedItem[] = [
  {
    title: "Algorithm Analysis",
    className: "CS 301",
    score: "94/100",
    date: "Feb 2",
  },
  {
    title: "React Components",
    className: "CS 340",
    score: "87/100",
    date: "Feb 1",
  },
];

interface AssignmentApiResponse {
  id: number;
  name: string;
  totalPoints: number;
  submissionType: string;
}

interface SubmissionApiResponse {
  id: number;
  assignmentId: number;
  marks: number | null;
  submittedAt: string;
}

interface StudentEnrolledCourseApiResponse {
  id: number;
  name: string;
}

interface AssignmentResultWorkspaceSource {
  assignment: AssignmentApiResponse;
  submissions: SubmissionApiResponse[];
}

const assignmentResultCache = new Map<string, Promise<AssignmentResultWorkspaceSource>>();
const facultyAssignmentResultCache = new Map<string, Promise<AssignmentResultWorkspaceSource>>();

export function invalidateAssignmentResultCache(assignmentId?: string): void {
  if (!assignmentId) {
    // NOTE: Clear both caches together because submission updates affect student and faculty result views.
    assignmentResultCache.clear();
    facultyAssignmentResultCache.clear();
    return;
  }

  const trimmedId = assignmentId.trim();
  if (!trimmedId) {
    return;
  }

  assignmentResultCache.delete(trimmedId);
  facultyAssignmentResultCache.delete(trimmedId);
}

function toLetterGrade(percentage: number): string {
  if (percentage >= 93) return "A";
  if (percentage >= 90) return "A-";
  if (percentage >= 87) return "B+";
  if (percentage >= 83) return "B";
  if (percentage >= 80) return "B-";
  if (percentage >= 77) return "C+";
  if (percentage >= 73) return "C";
  if (percentage >= 70) return "C-";
  if (percentage >= 67) return "D+";
  if (percentage >= 63) return "D";
  if (percentage >= 60) return "D-";
  return "F";
}

function parseAssignmentId(rawAssignmentId: string): number {
  const parsedAssignmentId = Number(rawAssignmentId.trim());
  if (!Number.isFinite(parsedAssignmentId) || parsedAssignmentId <= 0) {
    throw new Error("Invalid assignment id.");
  }
  return parsedAssignmentId;
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return "placeholder text";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "placeholder text";
  }
  return parsed.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function latestSubmission(submissions: SubmissionApiResponse[]): SubmissionApiResponse | undefined {
  return [...submissions].sort((left, right) => {
    return new Date(right.submittedAt).getTime() - new Date(left.submittedAt).getTime();
  })[0];
}

async function loadAssignmentResultWorkspaceSource(assignmentId: string): Promise<AssignmentResultWorkspaceSource> {
  const parsedAssignmentId = parseAssignmentId(assignmentId);
  const authenticatedRole = getAuthenticatedRole();
  if (authenticatedRole === "FACULTY") {
    // FIX: Faculty assignment pages cannot load results through student-only endpoints.
    return loadFacultyAssignmentResultWorkspaceSource(parsedAssignmentId);
  }

  const cacheKey = String(parsedAssignmentId);
  const cachedPromise = assignmentResultCache.get(cacheKey);
  if (cachedPromise) {
    return cachedPromise;
  }

  const loaderPromise = (async () => {
    // NOTE: Student route includes only assignmentId, so we discover the owning course by scanning enrolled classes.
    const { data: enrolledCourses } = await api.get<StudentEnrolledCourseApiResponse[]>("/api/v1/student/classes/enrolled");
    for (const course of enrolledCourses) {
      const { data: assignments } = await api.get<AssignmentApiResponse[]>(`/api/v1/student/assignments/course/${course.id}`);
      const matchedAssignment = assignments.find((assignment) => assignment.id === parsedAssignmentId);
      if (!matchedAssignment) {
        continue;
      }

      const { data: submissions } = await api.get<SubmissionApiResponse[]>(
        `/api/v1/student/submissions/assignment?assignmentId=${parsedAssignmentId}`,
      );

      return {
        assignment: matchedAssignment,
        submissions,
      } satisfies AssignmentResultWorkspaceSource;
    }

    throw new Error("Assignment result not found.");
  })();

  assignmentResultCache.set(cacheKey, loaderPromise);
  return loaderPromise;
}

async function loadFacultyAssignmentResultWorkspaceSource(parsedAssignmentId: number): Promise<AssignmentResultWorkspaceSource> {
  const cacheKey = String(parsedAssignmentId);
  const cachedPromise = facultyAssignmentResultCache.get(cacheKey);
  if (cachedPromise) {
    return cachedPromise;
  }

  const loaderPromise = (async () => {
    const { data: assignment } = await api.get<AssignmentApiResponse>(`/api/v1/faculty/assignments/${parsedAssignmentId}`);

    let submissions: SubmissionApiResponse[] = [];
    try {
      // NOTE: Faculty grading view resolves assignment submissions from faculty scope.
      const response = await api.get<SubmissionApiResponse[]>(`/api/v1/faculty/submissions?assignmentId=${parsedAssignmentId}`);
      submissions = response.data;
    } catch {
      // NOTE: Missing submissions should not block assignment page load.
      submissions = [];
    }

    return {
      assignment: {
        id: assignment.id,
        name: assignment.name,
        totalPoints: assignment.totalPoints,
        submissionType: assignment.submissionType,
      },
      submissions,
    } satisfies AssignmentResultWorkspaceSource;
  })();

  facultyAssignmentResultCache.set(cacheKey, loaderPromise);
  return loaderPromise;
}

async function listStudentAssignmentsWithSubmissions(courseId: number): Promise<
  Array<{ assignment: AssignmentApiResponse; submissions: SubmissionApiResponse[] }>
> {
  const { data: assignments } = await api.get<AssignmentApiResponse[]>(`/api/v1/student/assignments/course/${courseId}`);
  const withSubmissions = await Promise.all(
    assignments.map(async (assignment) => {
      const { data: submissions } = await api.get<SubmissionApiResponse[]>(
        `/api/v1/student/submissions/assignment?assignmentId=${assignment.id}`,
      );
      return { assignment, submissions };
    }),
  );
  return withSubmissions;
}

export function listSummaryMetrics(): Promise<SummaryMetric[]> {
  return Promise.resolve(summaryMetrics);
}

export function getActivitySummary(): Promise<ActivitySummary> {
  return Promise.resolve(activitySummary);
}

export async function listGradeRows(classId?: string): Promise<GradeRow[]> {
  const parsedClassId = Number(classId);
  if (!Number.isFinite(parsedClassId) || parsedClassId <= 0) {
    return gradeRows;
  }

  // NOTE: Class grades table now uses student assignment + submission data from backend instead of fixed mock rows.
  const withSubmissions = await listStudentAssignmentsWithSubmissions(parsedClassId);
  const totalPointsAcrossAssignments = withSubmissions.reduce(
    (sum, item) => sum + item.assignment.totalPoints,
    0,
  );

  return withSubmissions.map(({ assignment, submissions }) => {
    const latestSubmission = [...submissions].sort((left, right) => {
      return new Date(right.submittedAt).getTime() - new Date(left.submittedAt).getTime();
    })[0];
    const score = Number(latestSubmission?.marks ?? 0);
    const weightPercentage =
      totalPointsAcrossAssignments > 0
        ? ((assignment.totalPoints / totalPointsAcrossAssignments) * 100).toFixed(0)
        : "0";

    return {
      id: String(assignment.id),
      name: assignment.name,
      category: assignment.submissionType || "Assignment",
      score,
      total: assignment.totalPoints,
      weight: `${weightPercentage}%`,
    };
  });
}

export async function listCategoryStats(classId?: string): Promise<CategoryStat[]> {
  const parsedClassId = Number(classId);
  if (!Number.isFinite(parsedClassId) || parsedClassId <= 0) {
    return categoryStats;
  }

  const withSubmissions = await listStudentAssignmentsWithSubmissions(parsedClassId);
  const totalPointsAcrossAssignments = withSubmissions.reduce(
    (sum, item) => sum + item.assignment.totalPoints,
    0,
  );

  const grouped = new Map<
    string,
    {
      totalAssignments: number;
      completedAssignments: number;
      totalPoints: number;
      earnedPoints: number;
      gradedCount: number;
    }
  >();

  withSubmissions.forEach(({ assignment, submissions }) => {
    const category = assignment.submissionType || "Assignment";
    const current = grouped.get(category) ?? {
      totalAssignments: 0,
      completedAssignments: 0,
      totalPoints: 0,
      earnedPoints: 0,
      gradedCount: 0,
    };

    const latestSubmission = [...submissions].sort((left, right) => {
      return new Date(right.submittedAt).getTime() - new Date(left.submittedAt).getTime();
    })[0];

    current.totalAssignments += 1;
    current.totalPoints += assignment.totalPoints;
    if (latestSubmission) {
      current.completedAssignments += 1;
    }
    if (latestSubmission?.marks !== null && latestSubmission?.marks !== undefined) {
      current.earnedPoints += Number(latestSubmission.marks);
      current.gradedCount += 1;
    }
    grouped.set(category, current);
  });

  return Array.from(grouped.entries()).map(([category, values]) => {
    const average =
      values.totalPoints > 0 && values.gradedCount > 0
        ? `${((values.earnedPoints / values.totalPoints) * 100).toFixed(1)}%`
        : "\u2014";
    const weight =
      totalPointsAcrossAssignments > 0
        ? `${((values.totalPoints / totalPointsAcrossAssignments) * 100).toFixed(0)}%`
        : "0%";

    return {
      category,
      weight,
      average,
      completed: `${values.completedAssignments}/${values.totalAssignments}`,
    };
  });
}

export async function getOverallGradeSummary(classId?: string): Promise<OverallGradeSummary> {
  const parsedClassId = Number(classId);
  if (!Number.isFinite(parsedClassId) || parsedClassId <= 0) {
    return overallGradeSummary;
  }

  const withSubmissions = await listStudentAssignmentsWithSubmissions(parsedClassId);
  const graded = withSubmissions
    .map(({ assignment, submissions }) => {
      const latestSubmission = [...submissions].sort((left, right) => {
        return new Date(right.submittedAt).getTime() - new Date(left.submittedAt).getTime();
      })[0];
      if (latestSubmission?.marks === null || latestSubmission?.marks === undefined) {
        return null;
      }
      return {
        earned: Number(latestSubmission.marks),
        total: assignment.totalPoints,
      };
    })
    .filter((value): value is { earned: number; total: number } => value !== null);

  const earnedPoints = graded.reduce((sum, item) => sum + item.earned, 0);
  const totalPoints = graded.reduce((sum, item) => sum + item.total, 0);
  const percentage = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;

  return {
    current: `${percentage.toFixed(1)}%`,
    letter: toLetterGrade(percentage),
    // TODO(backend): Replace this placeholder when class-wide average endpoint is available.
    classAverage: "N/A",
  };
}

export async function getAssignmentResult(assignmentId: string): Promise<AssignmentResult> {
  const workspaceSource = await loadAssignmentResultWorkspaceSource(assignmentId);
  const latest = latestSubmission(workspaceSource.submissions);
  const score = Number(latest?.marks ?? 0);

  return {
    score,
    totalPoints: workspaceSource.assignment.totalPoints,
    earnedPoints: score,
    submittedAt: formatDateTime(latest?.submittedAt),
    // TODO(backend): Replace with real grading timestamp once backend exposes grader metadata.
    gradedAt: formatDateTime(latest?.submittedAt),
    status: "placeholder text",
    // TODO(backend): Replace test-run placeholders once backend exposes per-test grading outcomes.
    publicTestsPassed: 0,
    publicTestsTotal: 0,
    privateTestsPassed: 0,
    privateTestsTotal: 0,
    privateTestResults: [],
    failedTests: ["placeholder text"],
    compileErrors: ["placeholder text"],
    runtimeErrors: ["placeholder text"],
    rubricBreakdown: [
      {
        category: "placeholder text",
        earned: 0,
        total: 0,
        feedback: "placeholder text",
      },
    ],
  };
}

export function listRecentlyGraded(): Promise<RecentlyGradedItem[]> {
  return Promise.resolve(recentlyGraded);
}
