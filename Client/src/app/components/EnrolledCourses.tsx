import { Link } from "react-router";
import type { CourseCard } from "../../types/class";
import { CourseCoverCardShell } from "./CourseCoverCardShell";

interface EnrolledCoursesProps {
  // NOTE: Data is passed via props so this component stays presentation-only.
  courses: CourseCard[];
  isLoading?: boolean;
}

export function EnrolledCourses({ courses, isLoading = false }: EnrolledCoursesProps) {

  return (
    <div className="mb-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-[#2B2A2A]">Enrolled Courses</h2>
        <button className="text-[13px] text-[#5A7ACD] hover:text-[#4a6abd] font-medium">
          {/* NOTE: Use an HTML entity to avoid encoding issues in exports. */}
          View All &rarr;
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, index) => (
              <div
                key={`course-skeleton-${index}`}
                // NOTE: Skeleton cards preserve course-card layout so blocks stay visible while backend data loads.
                className="block rounded-xl border border-gray-200 bg-white p-4 animate-pulse"
              >
                <div className="mb-3 h-20 w-full rounded-lg bg-gray-100" />
                <div className="h-4 w-3/4 rounded bg-gray-200 mb-2" />
                <div className="h-3 w-1/2 rounded bg-gray-200 mb-4" />
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="h-3 w-20 rounded bg-gray-200" />
                    <div className="h-3 w-12 rounded bg-gray-200" />
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="w-1/2 h-2 rounded-full bg-gray-200" />
                  </div>
                  <div className="h-3 w-24 rounded bg-gray-200 mt-1.5" />
                </div>
              </div>
            ))
          : null}
        {courses.map((course) => {
          const assignmentsLeft = course.total - course.completed;
          const progress = course.total > 0 ? (course.completed / course.total) * 100 : 0;

          return (
            <Link
              key={course.id}
              to={`/class/${course.id}`}
              className="block overflow-hidden rounded-2xl shadow-sm transition-all hover:shadow-md"
            >
              <CourseCoverCardShell coverImageUrl={course.coverImageUrl} className="min-h-[220px] border-0 shadow-none">
                <div className="flex flex-1 flex-col gap-1 p-3 pt-2">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-[#5D6A80]">{course.courseCode}</p>
                  <h3 className="text-[13px] font-semibold leading-tight text-[#2B2A2A]">{course.title}</h3>
                  <p className="text-[11px] text-gray-500">{course.instructor}</p>

                  <div className="mt-2">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-wide text-gray-500">Assignments</span>
                      <span className="text-[11px] font-semibold text-[#2B2A2A]">{assignmentsLeft} left</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-gray-100">
                      <div
                        className={`${course.progressColor} h-1.5 rounded-full transition-all`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="mt-1 text-[10px] text-gray-400">
                      {course.completed} / {course.total} completed
                    </p>
                  </div>
                </div>
              </CourseCoverCardShell>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

