import { Link } from "react-router";
import type { UpcomingAssignment } from "../../types/assignment";

interface UpcomingAssignmentsProps {
  // NOTE: Data is passed via props so this component stays presentation-only.
  assignments: UpcomingAssignment[];
}

export function UpcomingAssignments({ assignments }: UpcomingAssignmentsProps) {

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-[#2B2A2A]">Upcoming Assignments</h2>
        <button className="text-[13px] text-gray-500 hover:text-gray-700 font-medium">
          Filter by Course
        </button>
      </div>

      <div className="space-y-3">
        {assignments.map((assignment) => (
          <Link
            key={assignment.id}
            to={`/assignment/${assignment.id}`}
            // NOTE: Border styling now matches Enrolled Courses cards to keep dashboard card chrome consistent.
            className="block bg-white rounded-2xl px-4 py-3 border border-gray-200 hover:border-gray-300 transition-colors"
          >
            <div className="flex items-start justify-between gap-6">
              <div className="min-w-0">
                <h3 className="text-[18px] leading-tight font-semibold text-[#1F2430]">
                  {assignment.title}
                </h3>
                <p className="mt-1 text-[14px] text-[#5E6880]">
                  {/* NOTE: Only show course name in this list even when source data includes extra context segments. */}
                  {assignment.course.split("\u2022")[0]?.trim() || assignment.course}
                </p>
              </div>

              <div className="flex items-center gap-7 pt-1 shrink-0">
                <span className="text-[14px] text-[#4E566B]">{assignment.dueDate}</span>
                <span className={`text-[14px] ${assignment.urgent ? "text-[#F2A245]" : "text-[#4E566B]"}`}>
                  {assignment.daysLeft}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
