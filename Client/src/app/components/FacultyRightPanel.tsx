import { ChevronLeft, ChevronRight, Bell, CheckCircle2, Circle, AlertCircle, Clock, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import type { AlertItem, CalendarDay, DeadlineItem, TaskItem } from "../../types/notification";
import type { PendingSubmissionItem } from "../../types/submission";
import { getFacultyDeadlineDays, listFacultyAlerts, listGradingTasks, listUpcomingDeadlines } from "../../services/notificationService";
import { listPendingSubmissions } from "../../services/submissionService";

interface FacultyRightPanelViewProps {
  // NOTE: Props keep the right panel view reusable and data-agnostic.
  currentDate: Date;
  alerts: AlertItem[];
  deadlineDays: CalendarDay[];
  pendingSubmissions: PendingSubmissionItem[];
  upcomingDeadlines: DeadlineItem[];
  isLoading: boolean;
}

export function FacultyRightPanel() {
  const [currentDate] = useState(new Date(2023, 9, 22)); // October 22, 2023
  // NOTE: Data now comes from the mock service to create a clean backend integration seam.
  const [gradingTasks, setGradingTasks] = useState<TaskItem[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [deadlineDays, setDeadlineDays] = useState<CalendarDay[]>([]);
  const [pendingSubmissions, setPendingSubmissions] = useState<PendingSubmissionItem[]>([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<DeadlineItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // NOTE: One loading state keeps all right-panel cards visible while async sections are fetched together.
    setIsLoading(true);
    Promise.all([
      listGradingTasks(),
      listFacultyAlerts(),
      getFacultyDeadlineDays(),
      listPendingSubmissions(),
      listUpcomingDeadlines(),
    ])
      .then(([gradingTasksData, alertsData, deadlineDaysData, pendingSubmissionsData, upcomingDeadlinesData]) => {
        setGradingTasks(gradingTasksData);
        setAlerts(alertsData);
        setDeadlineDays(deadlineDaysData);
        setPendingSubmissions(pendingSubmissionsData);
        setUpcomingDeadlines(upcomingDeadlinesData);
      })
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <FacultyRightPanelView
      currentDate={currentDate}
      alerts={alerts}
      deadlineDays={deadlineDays}
      pendingSubmissions={pendingSubmissions}
      upcomingDeadlines={upcomingDeadlines}
      isLoading={isLoading}
    />
  );
}

function FacultyRightPanelView({
  currentDate,
  alerts,
  deadlineDays,
  pendingSubmissions,
  upcomingDeadlines,
  isLoading,
}: FacultyRightPanelViewProps) {
  // NOTE: View-only component; data loading lives in the container above.
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

  // Days with assignment deadlines
  return (
    <aside className="w-72 bg-white border-l border-[#C9C4C9] flex-shrink-0 overflow-y-auto">
      <div className="p-6">
        {/* Calendar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[13px] font-semibold text-[#1F2430]">
              Assignment Deadlines
            </h3>
            <div className="flex items-center gap-1">
              {/* Accessibility: icon-only controls need labels for screen readers. */}
              <button aria-label="Previous month" className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 transition-colors">
                <ChevronLeft className="w-4 h-4 text-gray-600" strokeWidth={2} />
              </button>
              <button aria-label="Next month" className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 transition-colors">
                <ChevronRight className="w-4 h-4 text-gray-600" strokeWidth={2} />
              </button>
            </div>
          </div>

          <div className="bg-[#F7F6F8] rounded-md p-4 border border-[#E4E0E5]">
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
                    ${day === 22 ? 'bg-[#1F2430] text-white font-semibold' : 'text-gray-700'}
                    ${day && deadlineDays.includes(day) && day !== 22 ? 'relative' : ''}
                  `}
                >
                  {day}
                  {day && deadlineDays.includes(day) && day !== 22 && (
                    <div className="absolute bottom-1 w-1 h-1 bg-[#9F3549] rounded-full"></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pending Submissions */}
        <div className="mb-8">
          <h3 className="text-[13px] font-semibold text-[#1F2430] mb-4">
            Pending Submissions
          </h3>

          {/* NOTE: Pending submissions now render from service data; removed static placeholders. */}
          <div className="space-y-3">
            {isLoading
              ? Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={`faculty-pending-skeleton-${index}`}
                    // NOTE: Skeleton pending-submission rows keep this section visible during backend fetch.
                    className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 animate-pulse"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#EEF2FA] flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-24 rounded bg-gray-200" />
                      <div className="h-3 w-36 rounded bg-gray-200" />
                    </div>
                  </div>
                ))
              : null}
            {!isLoading &&
              pendingSubmissions.map((submission, index) => {
                const isEven = index % 2 === 0;
                return (
                  <Link
                    key={submission.id}
                    to={`/assignment/${submission.assignmentId}/grade/${submission.id}`}
                    className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <div className={`w-8 h-8 ${isEven ? "bg-[#7A1226]/10" : "bg-[#5A606B]/10"} rounded-md flex items-center justify-center flex-shrink-0`}>
                      <FileText className={`w-4 h-4 ${isEven ? "text-[#7A1226]" : "text-[#5A606B]"}`} strokeWidth={2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium text-[#1F2430] mb-0.5">
                        {submission.studentName}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        {submission.assignmentTitle} &bull; {submission.courseCode}
                      </p>
                    </div>
                  </Link>
                );
              })}
          </div>

          <button className="mt-3 w-full py-2 text-[12px] text-gray-500 hover:text-gray-700">
            View all submissions &rarr;
          </button>
        </div>

        {/* Upcoming Deadlines */}
        <div className="mb-8">
          <h3 className="text-[13px] font-semibold text-[#1F2430] mb-4">
            Upcoming Deadlines
          </h3>

          {/* NOTE: Upcoming deadlines now map directly from service data. */}
          <div className="space-y-3">
            {isLoading
              ? Array.from({ length: 3 }).map((_, index) => (
                  <div key={`faculty-deadline-skeleton-${index}`} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 animate-pulse">
                    <div className="w-8 h-8 rounded-lg bg-[#FFF1DF] flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-28 rounded bg-gray-200" />
                      <div className="h-3 w-36 rounded bg-gray-200" />
                    </div>
                  </div>
                ))
              : null}
            {!isLoading &&
              upcomingDeadlines.map((deadline) => (
                <div key={`${deadline.title}-${deadline.dueDate}`} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                  <div className={`w-8 h-8 ${deadline.color.split(" ")[0]}/10 rounded-md flex items-center justify-center flex-shrink-0`}>
                    <Clock className="w-4 h-4 text-[#7A1226]" strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium text-[#1F2430] mb-0.5">
                      {deadline.title}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      {deadline.className} &bull; {deadline.dueDate}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Student Activity Alerts */}
        <div className="mb-8">
          <h3 className="text-[13px] font-semibold text-[#1F2430] mb-4">
            Student Activity
          </h3>

          <div className="space-y-3">
            {isLoading
              ? Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={`faculty-alert-skeleton-${index}`}
                    className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 animate-pulse"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#EEF2FA] flex-shrink-0" />
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="h-3 w-28 rounded bg-gray-200" />
                      <div className="h-3 w-full rounded bg-gray-200" />
                      <div className="h-3 w-14 rounded bg-gray-200" />
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
                  <div className="w-8 h-8 bg-[#7A1226]/10 rounded-md flex items-center justify-center flex-shrink-0">
                    <alert.icon className={`w-4 h-4 ${alert.color}`} strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium text-[#1F2430] mb-0.5">
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

          <button className="mt-3 w-full py-2 text-[12px] text-gray-500 hover:text-gray-700">
            View all activity &rarr;
          </button>
        </div>
      </div>
    </aside>
  );
}
