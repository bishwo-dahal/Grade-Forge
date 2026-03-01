import React, { useEffect, useState } from "react";
import { Link } from "react-router";
import type { GradingAssistantCourseResponse } from "../../types/gradingAssistantCourse";
import { listGradingAssistantCourses } from "../../services/gradingAssistantCourseService";
import { GradingAssistantCourseCard } from "./gradingAssistant/GradingAssistantCourseCard";

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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
                <GradingAssistantCourseCard key={course.id} course={course} />
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
