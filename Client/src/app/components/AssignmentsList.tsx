import { useEffect, useState } from "react";
import { Calendar, Circle, CheckCircle2, Clock } from "lucide-react";
import type { RecentAssignmentItem } from "../../types/assignment";
import { listRecentAssignments } from "../../services/assignmentService";

export function AssignmentsList() {
  // NOTE: Data now comes from the mock service to create a clean backend integration seam.
  const [assignments, setAssignments] = useState<RecentAssignmentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // NOTE: Keep loading state explicit so assignments list keeps its card structure during fetch.
    setIsLoading(true);
    listRecentAssignments()
      .then(setAssignments)
      .finally(() => setIsLoading(false));
  }, []);

  const iconMap = {
    clock: Clock,
    circle: Circle,
    check: CheckCircle2,
  } as const;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg text-gray-800">Recent Assignments</h2>
      </div>
      
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        <div className="divide-y divide-gray-100">
          {isLoading
            ? Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={`assignments-list-skeleton-${index}`}
                  // NOTE: Skeleton rows keep recent-assignment panel visible while data is loading.
                  className="p-5 animate-pulse"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-52 rounded bg-gray-200" />
                      <div className="h-3 w-40 rounded bg-gray-200" />
                    </div>
                    <div className="h-7 w-24 rounded-full bg-gray-100" />
                  </div>
                </div>
              ))
            : null}
          {!isLoading &&
            assignments.map((assignment, index) => {
              const Icon = iconMap[assignment.iconKey];

              return (
              <div 
                key={index}
                className="p-5 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-[14px] text-gray-800 mb-2">
                      {assignment.name}
                    </h3>
                    <div className="flex items-center gap-4 text-[12px]">
                      <span className="text-gray-400">{assignment.className}</span>
                      <div className="flex items-center gap-1.5 text-gray-400">
                        <Calendar className="w-3 h-3" strokeWidth={1.5} />
                        <span>{assignment.dueDate}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${assignment.statusBg}`}>
                    <Icon className={`w-3 h-3 ${assignment.statusColor}`} strokeWidth={1.5} />
                    <span className={`text-[11px] ${assignment.statusColor}`}>
                      {assignment.status}
                    </span>
                  </div>
                </div>
              </div>
            );
            })}
        </div>
      </div>
    </div>
  );
}
