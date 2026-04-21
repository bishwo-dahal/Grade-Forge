import { Link } from "react-router";
import { CourseCoverCardShell } from "../CourseCoverCardShell";
import type { StudentCourseCardItem } from "../../../services/studentCourseworkService";

const MAX_VISIBLE = 4;

interface Props {
  items: StudentCourseCardItem[];
  isLoading: boolean;
}

export function StudentMyClassesSection({ items, isLoading }: Props) {
  const visible = items.slice(0, MAX_VISIBLE);
  const hasMore = items.length > MAX_VISIBLE;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[14px] font-semibold text-[#1F2430]">My Classes</h2>
        <Link
          to="/student/my-courses"
          className="text-[12px] font-medium text-[#5A7ACD] hover:text-[#4A6AB0]"
        >
          View All &rarr;
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading &&
          Array.from({ length: 4 }).map((_, i) => (
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
          ))}

        {!isLoading &&
          visible.map((course) => (
            <Link
              key={course.id}
              to={`/class/${course.id}`}
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
                    <span>{course.submittedCount}/{course.totalAssignments} submitted</span>
                    <span>{course.activeAssignments} active</span>
                  </div>
                  {course.avgScore > 0 && (
                    <span className="mt-1 w-fit rounded-full bg-[#5A7ACD]/10 px-2 py-0.5 text-[10px] font-semibold text-[#5A7ACD]">
                      avg {course.avgScore}%
                    </span>
                  )}
                </div>
              </CourseCoverCardShell>
            </Link>
          ))}

        {!isLoading && hasMore && (
          <Link
            to="/student/my-courses"
            className="flex min-h-[200px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 bg-white text-[13px] font-medium text-[#5A7ACD] shadow-sm transition-colors hover:border-[#5A7ACD] hover:bg-[#F0F4FF]"
          >
            <span className="text-[22px] font-light text-gray-400">+{items.length - MAX_VISIBLE}</span>
            <span>More classes</span>
          </Link>
        )}

        {!isLoading && items.length === 0 && (
          <div className="col-span-full rounded-xl border border-dashed border-gray-200 bg-white p-8 text-center">
            <p className="text-[13px] text-gray-400">No enrolled courses this semester</p>
            <Link
              to="/student/my-courses"
              className="mt-2 inline-block text-[12px] font-medium text-[#5A7ACD]"
            >
              Browse Courses &rarr;
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
