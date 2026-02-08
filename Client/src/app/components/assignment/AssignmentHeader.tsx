import { Calendar, Award } from "lucide-react";
import { StatusPill } from "./StatusPill";
import type { AssignmentDetail } from "../../../types/assignment";

interface AssignmentHeaderProps {
  // NOTE: Use shared assignment types so service data can be passed directly.
  assignment: AssignmentDetail;
}

export function AssignmentHeader({ assignment }: AssignmentHeaderProps) {
  return (
    <div className="border-b border-gray-200 p-6">
      <div className="mb-3">
        <span className="text-[11px] text-gray-500 uppercase tracking-wide font-medium">
          {assignment.courseCode} &bull; {assignment.course}
        </span>
      </div>
      
      <h1 className="text-2xl font-bold text-[#2B2A2A] mb-4">
        {assignment.title}
      </h1>

      <div className="flex flex-wrap items-center gap-4">
        {/* Due Date */}
        <div className="flex items-center gap-2 text-[13px]">
          <Calendar className="w-4 h-4 text-gray-400" strokeWidth={2} />
          <span className="text-gray-600">Due:</span>
          <span className="text-[#2B2A2A] font-medium">{assignment.dueDate}</span>
        </div>

        {/* Status */}
        <StatusPill status={assignment.status} />

        {/* Points (if graded) */}
        {assignment.points.earned !== null && (
          <div className="flex items-center gap-2 text-[13px]">
            <Award className="w-4 h-4 text-[#FEB05D]" strokeWidth={2} />
            <span className="text-[#2B2A2A] font-semibold">
              {assignment.points.earned}/{assignment.points.total} points
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
