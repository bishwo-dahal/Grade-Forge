// NOTE: UI-driven types; add fields only when the UI needs them to avoid premature complexity.

import type { ComponentType } from "react";

export interface SummaryMetric {
  title: string;
  value: string;
  subtitle: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  bgColor: string;
  iconColor: string;
}

export interface ActivityDay {
  day: string;
  submissions: number;
  graded: number;
}

// NOTE: Added summary wrapper used by the activity chart section.
export interface ActivitySummary {
  data: ActivityDay[];
  totalSubmissions: number;
  totalGraded: number;
}

export interface GradeRow {
  id: string;
  name: string;
  category: string;
  score: number;
  total: number;
  weight: string;
}

export interface CategoryStat {
  category: string;
  weight: string;
  average: string;
  completed: string;
}

// NOTE: Added overall grade summary model for class grade overview cards.
export interface OverallGradeSummary {
  current: string;
  letter: string;
  classAverage: string;
}

// NOTE: Added legacy right-panel grade list model.
export interface RecentlyGradedItem {
  title: string;
  className: string;
  score: string;
  date: string;
}

export interface RubricItem {
  id: string;
  category: string;
  description: string;
  maxPoints: number;
  autoPoints: number;
  manualPoints: number | null;
  feedback: string;
}

// NOTE: Added rubric category model for assignment rubric panel data.
export interface RubricCategory {
  name: string;
  points: number;
  criteria: Array<{
    description: string;
    points: number;
  }>;
}

export interface RubricBreakdownItem {
  category: string;
  earned: number;
  total: number;
  feedback: string | null;
}

export interface AssignmentResult {
  score: number;
  totalPoints: number;
  earnedPoints: number;
  submittedAt: string;
  gradedAt: string;
  status: string;
  publicTestsPassed: number;
  publicTestsTotal: number;
  privateTestsPassed: number;
  privateTestsTotal: number;
  privateTestResults: boolean[];
  failedTests: string[];
  compileErrors: string[];
  runtimeErrors: string[];
  rubricBreakdown: RubricBreakdownItem[];
  /** Latest submission id for this assignment (student); used for Run tests. */
  latestSubmissionId?: number | null;
}
