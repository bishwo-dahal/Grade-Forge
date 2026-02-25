import { Link } from "react-router";
import type { CourseCard } from "../../types/class";

interface EnrolledCoursesProps {
  // NOTE: Data is passed via props so this component stays presentation-only.
  courses: CourseCard[];
  isLoading?: boolean;
}

const courseSkeletonStyles = [
  { iconBg: "bg-[#EEF3FF]" },
  { iconBg: "bg-[#FFF3E6]" },
  { iconBg: "bg-[#EEF3FF]" },
  { iconBg: "bg-[#FFF3E6]" },
];

export function EnrolledCourses({ courses, isLoading = false }: EnrolledCoursesProps) {

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-[#2B2A2A]">Enrolled Courses</h2>
        <button className="text-[13px] text-[#5A7ACD] hover:text-[#4a6abd] font-medium">
          {/* NOTE: Use an HTML entity to avoid encoding issues in exports. */}
          View All &rarr;
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
        {isLoading
          ? courseSkeletonStyles.map((skeletonStyle, index) => (
              <div
                key={`course-skeleton-${index}`}
                // NOTE: Skeleton cards preserve course-card layout so blocks stay visible while backend data loads.
                className="block bg-white rounded-2xl p-5 border border-gray-200 animate-pulse"
              >
                <div className={`w-12 h-12 ${skeletonStyle.iconBg} rounded-xl mb-4`} />
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
          const progress = (course.completed / course.total) * 100;
          
          return (
            <Link
              key={course.id}
              to={`/class/${course.id}`}
              className="block bg-white rounded-2xl p-5 border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all"
            >
              {/* Course Icon */}
              <div className={`w-12 h-12 ${course.iconBg} rounded-xl flex items-center justify-center mb-4 text-xl`}>
                {course.icon}
              </div>

              {/* Course Info */}
              <h3 className="text-[14px] font-semibold text-[#2B2A2A] mb-2 leading-snug">
                {course.title}
              </h3>
              <p className="text-[12px] text-gray-500 mb-1">
                {course.instructor}
              </p>

              {/* Assignments */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] text-gray-500 uppercase tracking-wide">
                    Assignments
                  </span>
                  <span className="text-[12px] font-semibold text-[#2B2A2A]">
                    {assignmentsLeft} left
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div 
                    className={`${course.progressColor} h-2 rounded-full transition-all`}
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <p className="text-[11px] text-gray-400 mt-1.5">
                  {course.completed} / {course.total} completed
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

