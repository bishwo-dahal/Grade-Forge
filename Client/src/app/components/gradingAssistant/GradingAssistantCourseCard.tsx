import React from "react";
import { Link } from "react-router";
import type { GradingAssistantCourseResponse } from "../../../types/gradingAssistantCourse";

interface GradingAssistantCourseCardProps {
  course: GradingAssistantCourseResponse;
}

export function GradingAssistantCourseCard({ course }: GradingAssistantCourseCardProps) {
  const initials = (course.courseCode || course.name || "GA").slice(0, 2).toUpperCase();
  const statusLabel = course.active === false ? "Archived" : "Active";

  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-4 flex flex-col">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#EEF2FA] text-[15px] font-semibold text-[#5A7ACD] flex-shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-[15px] leading-snug font-semibold text-[#1F2430] line-clamp-2">
            {course.name}
          </h2>
          <p className="mt-1 text-[12px] text-[#5D6A80]">
            {course.courseCode}
            {course.section ? ` · Section ${course.section}` : ""}
          </p>
          {course.semester && (
            <p className="mt-1 text-[12px] text-gray-500">{course.semester.name}</p>
          )}
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-[#F6F7F9] px-3.5 py-3">
        {course.faculty ? (
          <>
            <p className="text-[13px] text-[#3F4F67]">
              Instructor: <span className="font-medium">{course.faculty.name}</span>
            </p>
            {course.faculty.email && (
              <p className="mt-1 text-[12px] text-gray-500">{course.faculty.email}</p>
            )}
          </>
        ) : (
          <p className="text-[13px] text-[#5D6A80]">Instructor not specified.</p>
        )}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 text-[13px]">
        <div>
          <p className="text-[#5D6A80]">Status</p>
          <p className="mt-1 text-[15px] font-semibold text-[#1F2430]">{statusLabel}</p>
        </div>
        <div>
          <p className="text-[#5D6A80]">Code</p>
          <p className="mt-1 text-[15px] font-semibold text-[#1F2430]">
            {course.courseCode || "—"}
          </p>
        </div>
        <div>
          <p className="text-[#5D6A80]">Section</p>
          <p className="mt-1 text-[15px] font-semibold text-[#1F2430]">
            {course.section || "—"}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-[1fr_auto] gap-2.5">
        <Link
          to={`/grading-assistant/class/${course.id}`}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-[#7A1226] px-5 text-[13px] leading-none font-semibold text-white hover:bg-[#65101F] transition-colors"
        >
          Open Course
        </Link>
        <span className="inline-flex h-10 items-center justify-center rounded-2xl bg-[#EEF2FA] px-4 text-[12px] font-medium text-[#5D6A80]">
          GA view
        </span>
      </div>
    </article>
  );
}

