import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { ChevronLeft, User, BookOpen, Calendar } from "lucide-react";
import type { CourseDetail } from "../../types/class";
import type { AssignmentSummary } from "../../types/assignment";
import { getCourseDetailById } from "../../services/classService";
import { listCourseAssignments } from "../../services/assignmentService";
import React from "react";

export function CoursePage() {
  const { courseId } = useParams();
  // NOTE: Course data now comes from backend-driven service mapping.
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [assignments, setAssignments] = useState<AssignmentSummary[]>([]);
  const [isCourseLoading, setIsCourseLoading] = useState(true);
  const [isAssignmentsLoading, setIsAssignmentsLoading] = useState(true);

  useEffect(() => {
    const resolvedId = courseId || "1";
    // NOTE: Separate loading flags keep header and assignment list visible while each request resolves.
    setIsCourseLoading(true);
    setIsAssignmentsLoading(true);
    getCourseDetailById(resolvedId)
      .then(setCourse)
      .finally(() => setIsCourseLoading(false));
    listCourseAssignments(resolvedId)
      .then(setAssignments)
      .finally(() => setIsAssignmentsLoading(false));
  }, [courseId]);

  // NOTE: Use a lightweight placeholder shape to avoid undefined access during async load.
  const courseData: CourseDetail = course ?? {
    id: "",
    title: "",
    code: "",
    instructor: "",
    icon: "",
    iconBg: "bg-gray-100",
  };

  return (
    <div className="min-h-screen bg-[#F5F2F2]">
      {/* Top Navigation */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center gap-2 text-[13px]">
          <Link to="/dashboard" className="text-gray-500 hover:text-[#2B2A2A] flex items-center gap-1">
            <ChevronLeft className="w-4 h-4" strokeWidth={2} />
            Dashboard
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-[#2B2A2A] font-medium">{courseData.code}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Course Header */}
        <div className="bg-white rounded-2xl p-8 border border-gray-200 mb-8">
          {isCourseLoading ? (
            <div className="flex items-start gap-6 animate-pulse">
              {/* NOTE: Header skeleton keeps course hero block visible during fetch. */}
              <div className="w-20 h-20 rounded-2xl bg-[#EEF2FA] flex-shrink-0" />
              <div className="flex-1">
                <div className="h-3 w-20 rounded bg-gray-200 mb-3" />
                <div className="h-8 w-72 max-w-full rounded bg-gray-200 mb-3" />
                <div className="h-4 w-40 rounded bg-gray-200" />
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-6">
              <div className={`w-20 h-20 ${courseData.iconBg} rounded-2xl flex items-center justify-center text-4xl flex-shrink-0`}>
                {courseData.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[12px] text-gray-500 uppercase tracking-wide font-medium">
                    {courseData.code}
                  </span>
                </div>
                <h1 className="text-3xl font-bold text-[#2B2A2A] mb-3">
                  {courseData.title}
                </h1>
                <div className="flex items-center gap-2 text-[14px] text-gray-600">
                  <User className="w-4 h-4" strokeWidth={2} />
                  <span>{courseData.instructor}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Assignments List */}
        <div>
          <h2 className="text-xl font-semibold text-[#2B2A2A] mb-5">Assignments</h2>
          
          <div className="space-y-4">
            {isAssignmentsLoading
              ? Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={`course-assignments-skeleton-${index}`}
                    // NOTE: Skeleton assignment rows prevent the list panel from disappearing while loading.
                    className="block bg-white rounded-2xl p-6 border border-gray-200 animate-pulse"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="h-4 w-24 rounded bg-gray-200 mb-3" />
                        <div className="h-5 w-64 max-w-full rounded bg-gray-200 mb-3" />
                        <div className="h-4 w-52 rounded bg-gray-200" />
                      </div>
                    </div>
                  </div>
                ))
              : null}
            {!isAssignmentsLoading &&
              assignments.map((assignment) => (
                <Link
                  key={assignment.id}
                  to={`/assignment/${assignment.id}`}
                  className="block bg-white rounded-2xl p-6 border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {assignment.number !== undefined && (
                          <span className="text-[12px] text-gray-500 font-medium">
                            Assignment {assignment.number}
                          </span>
                        )}
                        {assignment.status === "not_submitted" && (
                          <span className="px-3 py-1 rounded-full text-[11px] font-medium bg-gray-100 text-gray-600">
                            Not Submitted
                          </span>
                        )}
                        {assignment.status === "graded" && (
                          <span className="px-3 py-1 rounded-full text-[11px] font-medium bg-green-50 text-green-600">
                            Graded
                          </span>
                        )}
                      </div>
                      <h3 className="text-[16px] font-semibold text-[#2B2A2A] mb-2">
                        {assignment.title}
                      </h3>
                      <div className="flex items-center gap-4 text-[13px] text-gray-600">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4" strokeWidth={2} />
                          <span>Due: {assignment.dueDate}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <BookOpen className="w-4 h-4" strokeWidth={2} />
                          <span>
                            {assignment.status === "graded" 
                              ? `${assignment.points}/${assignment.totalPoints} points`
                              : `${assignment.points} points`
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            {!isAssignmentsLoading && assignments.length === 0 ? (
              <div className="block bg-white rounded-2xl p-6 border border-gray-200">
                <p className="text-[14px] text-gray-600">No assignments available yet.</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
