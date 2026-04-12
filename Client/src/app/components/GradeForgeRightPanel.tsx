import { ChevronLeft, ChevronRight, Bell } from "lucide-react";
import { useEffect, useState } from "react";
import type { CalendarDay, NotificationItem } from "../../types/notification";
import { getStudentTaskDays, listStudentAlerts } from "../../services/notificationService";

interface GradeForgeRightPanelViewProps {
  // NOTE: View props keep this component presentation-only.
  alerts: NotificationItem[];
  taskDays: CalendarDay[];
  isLoading: boolean;
}

export function GradeForgeRightPanel() {
  // NOTE: Container loads data once and passes into the view component.
  const [alerts, setAlerts] = useState<NotificationItem[]>([]);
  const [taskDays, setTaskDays] = useState<CalendarDay[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // NOTE: Shared loading state prevents right-panel sections from briefly disappearing during fetch.
    setIsLoading(true);
    Promise.all([listStudentAlerts(), getStudentTaskDays()])
      .then(([alertsData, taskDaysData]) => {
        setAlerts(alertsData);
        setTaskDays(taskDaysData);
      })
      .finally(() => setIsLoading(false));
  }, []);

  return <GradeForgeRightPanelView alerts={alerts} taskDays={taskDays} isLoading={isLoading} />;
}

function GradeForgeRightPanelView({ alerts, taskDays, isLoading }: GradeForgeRightPanelViewProps) {
  // NOTE: Trimmed unused resource data from the export to reduce dead code.
  const currentDate = new Date(2023, 9, 22); // October 22, 2023

  // Generate calendar days
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add the days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const days = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Days with tasks

  return (
    <aside className="w-80 bg-white border-l border-gray-200 flex-shrink-0 overflow-y-auto">
      <div className="p-6">
        {/* Calendar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[13px] font-semibold text-[#2B2A2A]">
              Task Calendar
            </h3>
            <div className="flex items-center gap-1">
              {/* Accessibility: icon-only buttons need labels. */}
              <button
                aria-label="Previous month"
                className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600" strokeWidth={2} />
              </button>
              <button
                aria-label="Next month"
                className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-gray-600" strokeWidth={2} />
              </button>
            </div>
          </div>

          <div className="bg-gray-50 rounded-2xl p-4">
            <div className="text-[12px] font-medium text-gray-900 mb-3 text-center">
              {monthName}
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                <div key={i} className="text-[10px] text-gray-400 text-center font-medium">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, index) => (
                <div
                  key={index}
                  className={`
                    aspect-square flex items-center justify-center text-[11px] rounded-lg
                    ${!day ? '' : 'hover:bg-gray-100 cursor-pointer'}
                    ${day === 22 ? 'bg-[#2B2A2A] text-white font-semibold' : 'text-gray-700'}
                    ${day && taskDays.includes(day) && day !== 22 ? 'relative' : ''}
                  `}
                >
                  {day}
                  {day && taskDays.includes(day) && day !== 22 && (
                    <div className="absolute bottom-1 w-1 h-1 bg-[#FEB05D] rounded-full"></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="mb-8">
          <h3 className="text-[13px] font-semibold text-[#2B2A2A] mb-4">
            Recent Alerts
          </h3>

          <div className="space-y-3">
            {isLoading
              ? Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={`student-alert-skeleton-${index}`}
                    // NOTE: Skeleton alert cards keep right-panel spacing stable during async load.
                    className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 animate-pulse"
                  >
                    <div className="w-8 h-8 bg-[#EEF2FA] rounded-lg flex-shrink-0" />
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="h-3 w-28 rounded bg-gray-200" />
                      <div className="h-3 w-full rounded bg-gray-200" />
                      <div className="h-3 w-16 rounded bg-gray-200" />
                    </div>
                  </div>
                ))
              : null}
            {!isLoading &&
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors cursor-pointer"
                >
                  <div className="w-8 h-8 bg-[#5A7ACD]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Bell className="w-4 h-4 text-[#5A7ACD]" strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium text-[#2B2A2A] mb-0.5">
                      {alert.title}
                    </p>
                    <p className="text-[11px] text-gray-500 truncate">
                      {alert.description}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1">
                      {alert.time}
                    </p>
                  </div>
                </div>
              ))}
          </div>

          {/* NOTE: Replace garbled arrow glyph from the export with ASCII. */}
          <button className="mt-3 w-full py-2 text-[12px] text-gray-500 hover:text-gray-700">
            View all notifications &rarr;
          </button>
        </div>
      </div>
    </aside>
  );
}
