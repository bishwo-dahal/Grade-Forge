import { Link } from "react-router";
import { ChevronRight } from "lucide-react";
import type { RecentGradeItem } from "../../../services/studentCourseworkService";

const COURSE_COLORS = [
  "bg-[#5A7ACD]",
  "bg-[#FEB05D]",
  "bg-green-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-teal-500",
];

function courseColorClass(courseId: number): string {
  return COURSE_COLORS[courseId % COURSE_COLORS.length];
}

function formatRelative(isoDate: string): string {
  const delta = Math.max(0, Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000));
  const mins = Math.floor(delta / 60);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function GradeRowSkeleton() {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-slate-100 last:border-0 animate-pulse">
      <div className="w-2.5 h-2.5 rounded-full bg-slate-200 flex-shrink-0" />
      <div className="flex-1 space-y-1">
        <div className="h-3.5 bg-slate-200 rounded w-3/4" />
        <div className="h-3 bg-slate-100 rounded w-1/3" />
      </div>
      <div className="text-right space-y-1">
        <div className="h-3.5 bg-slate-200 rounded w-12" />
        <div className="h-3 bg-slate-100 rounded w-8 ml-auto" />
      </div>
    </div>
  );
}

function GradeRow({ item }: { item: RecentGradeItem }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-slate-100 last:border-0">
      <span
        className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${courseColorClass(item.courseId)}`}
        aria-hidden="true"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">{item.assignmentName}</p>
        <p className="text-xs text-slate-500">{item.courseCode}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-semibold text-slate-800">
          {item.score} / {item.totalPoints}
        </p>
        <p className="text-xs text-slate-400">{formatRelative(item.submittedAt)}</p>
      </div>
    </div>
  );
}

interface Props {
  grades: RecentGradeItem[];
  isLoading: boolean;
}

export function StudentRecentGrades({ grades, isLoading }: Props) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm flex flex-col">
      <h2 className="text-base font-semibold text-slate-800 mb-1">Recent Grades</h2>
      {isLoading ? (
        <div>
          {[...Array(5)].map((_, i) => (
            <GradeRowSkeleton key={i} />
          ))}
        </div>
      ) : grades.length === 0 ? (
        <p className="text-sm text-slate-400 py-6 text-center">No graded assignments yet.</p>
      ) : (
        <>
          <div>
            {grades.map((item) => (
              <GradeRow key={item.submissionId} item={item} />
            ))}
          </div>
          <Link
            to="/student/assignments"
            className="mt-3 text-xs text-[#5A7ACD] flex items-center gap-1 hover:underline cursor-pointer self-start"
          >
            View all <ChevronRight size={12} />
          </Link>
        </>
      )}
    </div>
  );
}
