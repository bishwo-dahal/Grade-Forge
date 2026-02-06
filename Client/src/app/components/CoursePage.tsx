import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { ChevronLeft, User, BookOpen, Calendar } from "lucide-react";
import type { CourseDetail } from "../../types/class";
import type { AssignmentSummary } from "../../types/assignment";
import { getCourseDetailById } from "../../services/classService";
import { listCourseAssignments } from "../../services/assignmentService";

export function CoursePage() {
  const { courseId } = useParams();
  // NOTE: Course data now comes from mock services to keep backend integration seams centralized.
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [assignments, setAssignments] = useState<AssignmentSummary[]>([]);

  useEffect(() => {
    const resolvedId = courseId || "1";
    getCourseDetailById(resolvedId).then(setCourse);
    listCourseAssignments(resolvedId).then(setAssignments);
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
          <Link to="/" className="text-gray-500 hover:text-[#2B2A2A] flex items-center gap-1">
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
        </div>

        {/* Assignments List */}
        <div>
          <h2 className="text-xl font-semibold text-[#2B2A2A] mb-5">Assignments</h2>
          
          <div className="space-y-4">
            {assignments.map((assignment) => (
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
          </div>
        </div>
      </div>
    </div>
  );
}
