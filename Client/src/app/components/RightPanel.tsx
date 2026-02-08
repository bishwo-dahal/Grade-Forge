import { useEffect, useState } from "react";
import { Calendar, Clock } from "lucide-react";
import type { DeadlineItem } from "../../types/notification";
import type { RecentlyGradedItem } from "../../types/grade";
import { listUpcomingDeadlines } from "../../services/notificationService";
import { listRecentlyGraded } from "../../services/resultService";

export function RightPanel() {
  // NOTE: Data now comes from mock services to keep integration seams in one place.
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<DeadlineItem[]>([]);
  const [recentlyGraded, setRecentlyGraded] = useState<RecentlyGradedItem[]>([]);

  useEffect(() => {
    listUpcomingDeadlines().then(setUpcomingDeadlines);
    listRecentlyGraded().then(setRecentlyGraded);
  }, []);

  return (
    <aside className="w-80 bg-white border-l border-gray-100 flex-shrink-0 py-8 px-6 overflow-y-auto">
      {/* Upcoming Deadlines */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-5">
          <Calendar className="w-4 h-4 text-gray-400" strokeWidth={1.5} />
          <h3 className="text-xs tracking-wide text-gray-500 uppercase">
            Upcoming Deadlines
          </h3>
        </div>
        <div className="space-y-3">
          {upcomingDeadlines.map((item, index) => (
            <div 
              key={index}
              className="p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-[13px] text-gray-800">{item.title}</span>
                <span className={`text-[10px] px-2 py-1 rounded-full ${item.color}`}>
                  {item.type}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-gray-400">{item.className}</span>
                <div className="flex items-center gap-1 text-gray-500">
                  <Clock className="w-3 h-3" strokeWidth={1.5} />
                  <span className="text-[11px]">{item.dueDate}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recently Graded */}
      <div>
        <div className="flex items-center gap-2 mb-5">
          <div className="w-4 h-4 flex items-center justify-center">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          </div>
          <h3 className="text-xs tracking-wide text-gray-500 uppercase">
            Recently Graded
          </h3>
        </div>
        <div className="space-y-3">
          {recentlyGraded.map((item, index) => (
            <div 
              key={index}
              className="p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <div className="mb-2">
                <span className="text-[13px] text-gray-800">{item.title}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-gray-400">{item.className}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[12px] text-green-600">{item.score}</span>
                  <span className="text-[11px] text-gray-400">&bull;</span>
                  <span className="text-[11px] text-gray-400">{item.date}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
