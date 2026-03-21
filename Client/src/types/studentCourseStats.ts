export interface StudentCourseStatsLastActivity {
  assignmentId: number;
  assignmentName: string;
  submittedAt: string;
}

export interface StudentCourseStatsTrendPoint {
  assignmentId: number;
  assignmentName: string;
  score: number;
  maxScore: number;
  gradedAt: string;
}

export interface StudentCourseStats {
  courseId: number;
  studentId: number;
  studentName: string | null;
  totalAssignments: number;
  submittedAssignments: number;
  gradedAssignments: number;
  missingAssignments: number;
  lateSubmissions: number;
  submissionRatePercent: number;
  overallPercentGradedOnly: number;
  overallPercentIncludingMissing: number;
  lastActivity: StudentCourseStatsLastActivity | null;
  trend: StudentCourseStatsTrendPoint[];
  plagiarismFlagCount: number | null;
  timeOnTaskMinutes: number | null;
  rubricBreakdownSummary: string | null;
}

