import { Link } from "react-router";
import { BookOpen, Clock, CheckCircle, ChevronRight, CalendarClock } from "lucide-react";
import type { StudentDashboardStats } from "../../../services/studentCourseworkService";

interface StatCardProps {
  label: string;
  value: number | null;
  iconBg: string;
  icon: React.ReactNode;
  linkTo: string;
  isLoading: boolean;
}

function StatCard({ label, value, iconBg, icon, linkTo, isLoading }: StatCardProps) {
  return (
    <div className="flex-1 bg-white rounded-xl p-5 shadow-sm flex items-start justify-between">
      <div className="flex flex-col">
        <p className="text-sm text-slate-500 font-medium">{label}</p>
        {isLoading ? (
          <div className="mt-1 h-8 w-16 bg-slate-100 rounded animate-pulse" />
        ) : (
          <p className="mt-1 text-3xl font-bold text-slate-800">{value ?? 0}</p>
        )}
        <Link
          to={linkTo}
          className="mt-3 text-xs text-[#5A7ACD] flex items-center gap-1 hover:underline cursor-pointer"
        >
          View all <ChevronRight size={12} />
        </Link>
      </div>
      <div className={`${iconBg} p-3 rounded-xl flex-shrink-0`}>{icon}</div>
    </div>
  );
}

interface Props {
  stats: StudentDashboardStats | null;
  isLoading: boolean;
}

export function StudentDashboardStatsRow({ stats, isLoading }: Props) {
  return (
    <div className="flex gap-4">
      <StatCard
        label="Enrolled Courses"
        value={stats?.enrolledCourses ?? null}
        iconBg="bg-[#5A7ACD]/10"
        icon={<BookOpen size={20} className="text-[#5A7ACD]" />}
        linkTo="/student/my-courses"
        isLoading={isLoading}
      />
      <StatCard
        label="Pending Submissions"
        value={stats?.pendingSubmissions ?? null}
        iconBg="bg-[#FEB05D]/10"
        icon={<Clock size={20} className="text-[#FEB05D]" />}
        linkTo="/student/assignments"
        isLoading={isLoading}
      />
      <StatCard
        label="Graded This Week"
        value={stats?.gradedThisWeek ?? null}
        iconBg="bg-green-50"
        icon={<CheckCircle size={20} className="text-green-600" />}
        linkTo="/student/assignments"
        isLoading={isLoading}
      />
      <StatCard
        label="Due This Week"
        value={stats?.dueThisWeek ?? null}
        iconBg="bg-red-50"
        icon={<CalendarClock size={20} className="text-red-500" />}
        linkTo="/student/assignments"
        isLoading={isLoading}
      />
    </div>
  );
}
