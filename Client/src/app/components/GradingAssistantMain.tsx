import React, { useEffect, useState } from "react";
import { Link } from "react-router";
import type { GradingAssistantCourseResponse } from "../../types/gradingAssistantCourse";
import { listGradingAssistantCourses } from "../../services/gradingAssistantCourseService";

export function GradingAssistantMain() {
  const [courses, setCourses] = useState<GradingAssistantCourseResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    listGradingAssistantCourses()
      .then(setCourses)
      .catch(() => setCourses([]))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <main className="flex-1 overflow-y-auto bg-[#F5F2F2]">
      <div className="p-8">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-[#2B2A2A]">My Assigned Courses</h2>
          <Link
            to="/grading-assistant/courses"
            className="text-[13px] text-[#5A7ACD] hover:text-[#4a6abd] font-medium"
          >
            View All Courses &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {isLoading
            ? Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={`ga-course-skeleton-${index}`}
                  className="block bg-white rounded-2xl p-6 border border-gray-200 animate-pulse"
                >
                  <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-[#EEF3FF] rounded-xl flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="h-3 w-16 rounded bg-gray-200 mb-2" />
                    <div className="h-4 w-44 max-w-full rounded bg-gray-200" />
                  </div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-3 w-28 rounded bg-gray-200" />
                    <div className="h-3 w-32 rounded bg-gray-200" />
                  </div>
                  <div className="mt-5 w-full h-10 bg-gray-100 rounded-lg" />
                </div>
              ))
            : courses.slice(0, 6).map((course) => (
                <Link
                  key={course.id}
                  to={`/grading-assistant/class/${course.id}`}
                  className="block bg-white rounded-2xl p-6 border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 bg-[#EEF3FF] rounded-xl flex items-center justify-center text-[#5A7ACD] flex-shrink-0">
                      <span className="text-lg font-semibold">
                        {(course.courseCode || course.name).slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] text-gray-500 uppercase tracking-wide mb-1">
                        {course.courseCode}
                        {course.section ? ` · ${course.section}` : ""}
                      </div>
                      <h3 className="text-[14px] font-semibold text-[#2B2A2A] leading-snug line-clamp-2">
                        {course.name}
                      </h3>
                    </div>
                  </div>
                  {course.faculty && (
                    <p className="text-[12px] text-gray-600">
                      Instructor: {course.faculty.name}
                    </p>
                  )}
                  {course.semester && (
                    <p className="text-[12px] text-gray-500 mt-0.5">{course.semester.name}</p>
                  )}
                  <div className="mt-5 w-full py-2.5 bg-gray-50 hover:bg-gray-100 text-[#2B2A2A] rounded-lg text-[13px] font-medium transition-colors text-center">
                    View Course
                  </div>
                </Link>
              ))}
        </div>
        {!isLoading && courses.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-8 text-center">
            <p className="text-[13px] text-gray-600">
              You are not assigned to any courses yet. Contact your faculty to be added as a grading assistant.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
