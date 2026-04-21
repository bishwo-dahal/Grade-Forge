import { useEffect, useState } from "react";
import { StudentMyClassesSection } from "./student/StudentMyClassesSection";
import { StudentDashboardStatsRow } from "./student/StudentDashboardStatsRow";
import { StudentRecentGrades } from "./student/StudentRecentGrades";
import { StudentUpcomingDeadlines } from "./student/StudentUpcomingDeadlines";
import type { StudentDashboardData } from "../../services/studentCourseworkService";
import { getStudentDashboardData } from "../../services/studentCourseworkService";

export function GradeForgeMain() {
  const [data, setData] = useState<StudentDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getStudentDashboardData()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <main className="flex-1 overflow-y-auto bg-[#F5F2F2]">
      <div className="px-6 py-6 flex flex-col gap-5">
        <StudentMyClassesSection
          items={data?.courseCards ?? []}
          isLoading={isLoading}
        />
        <StudentDashboardStatsRow
          stats={data?.stats ?? null}
          isLoading={isLoading}
        />
        <div className="grid grid-cols-2 gap-5">
          <StudentRecentGrades
            grades={data?.recentGrades ?? []}
            isLoading={isLoading}
          />
          <StudentUpcomingDeadlines
            groups={data?.deadlineGroups ?? []}
            isLoading={isLoading}
          />
        </div>
      </div>
    </main>
  );
}
