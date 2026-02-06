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

      <div className="space-y-4">
        {assignments.map((assignment) => (
          <Link
            key={assignment.id}
            to={`/assignment/${assignment.id}`}
            className="block bg-white rounded-2xl p-5 border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all"
          >
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className={`w-12 h-12 ${assignment.iconBg} rounded-xl flex items-center justify-center text-xl flex-shrink-0`}>
                {assignment.icon}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="text-[15px] font-semibold text-[#2B2A2A] mb-1">
                  {assignment.title}
                </h3>
                <p className="text-[13px] text-gray-500 mb-3">
                  {assignment.course}
                </p>
                <div className="flex items-center gap-4 text-[12px]">
                  <span className="text-gray-600">{assignment.dueDate}</span>
                  <span className={`${assignment.urgent ? 'text-[#FEB05D] font-medium' : 'text-gray-500'}`}>
                    {assignment.daysLeft}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
