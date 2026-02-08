import {
  Activity,
  BookOpen,
  Clock,
  FileText,
} from "lucide-react";
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

export function listSummaryMetrics(): Promise<SummaryMetric[]> {
  return Promise.resolve(summaryMetrics);
}

export function getActivitySummary(): Promise<ActivitySummary> {
  return Promise.resolve(activitySummary);
}

export function listGradeRows(classId?: string): Promise<GradeRow[]> {
  // NOTE: classId is unused in the mock implementation but preserved for backend parity.
  return Promise.resolve(gradeRows);
}

export function listCategoryStats(classId?: string): Promise<CategoryStat[]> {
  // NOTE: classId is unused in the mock implementation but preserved for backend parity.
  return Promise.resolve(categoryStats);
}

export function getOverallGradeSummary(classId?: string): Promise<OverallGradeSummary> {
  // NOTE: classId is unused in the mock implementation but preserved for backend parity.
  return Promise.resolve(overallGradeSummary);
}

export function getAssignmentResult(assignmentId: string): Promise<AssignmentResult> {
  // NOTE: assignmentId is unused in the mock implementation but preserved for backend parity.
  return Promise.resolve(assignmentResult);
}

export function listRecentlyGraded(): Promise<RecentlyGradedItem[]> {
  return Promise.resolve(recentlyGraded);
}
