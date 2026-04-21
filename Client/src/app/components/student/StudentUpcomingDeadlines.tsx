import type { DeadlineGroup, DeadlineItem } from "../../../services/studentCourseworkService";

function DeadlineItemCard({ item }: { item: DeadlineItem }) {
  const notSubmitted = !item.isSubmitted;
  return (
    <div
      className={`rounded-lg px-3 py-2.5 ${
        notSubmitted
          ? "bg-[#FEB05D]/10 border border-[#FEB05D]/30"
          : "bg-slate-50 border border-transparent"
      }`}
    >
      <p
        className={`text-sm font-medium truncate ${
          notSubmitted ? "text-slate-800" : "text-slate-500"
        }`}
      >
        {item.assignmentName}
      </p>
      <div className="flex items-center justify-between mt-0.5 gap-2">
        <p className="text-xs text-slate-400 truncate">{item.courseName}</p>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <p className="text-xs text-slate-400">{item.dueDateLabel}</p>
          <span
            className={`text-xs px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap ${
              item.isSubmitted
                ? "bg-green-50 text-green-700"
                : "bg-[#FEB05D]/20 text-amber-700"
            }`}
          >
            {item.isSubmitted ? "submitted" : "not submitted"}
          </span>
        </div>
      </div>
    </div>
  );
}

function DeadlineGroupSkeleton() {
  return (
    <div className="mb-4 animate-pulse">
      <div className="h-3 bg-slate-200 rounded w-28 mb-2" />
      <div className="flex flex-col gap-2">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-slate-100 rounded-lg h-14" />
        ))}
      </div>
    </div>
  );
}

function DeadlineGroupSection({ group }: { group: DeadlineGroup }) {
  return (
    <div className="mb-4 last:mb-0">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
        {group.label}
      </p>
      <div className="flex flex-col gap-2">
        {group.items.map((item) => (
          <DeadlineItemCard key={item.assignmentId} item={item} />
        ))}
      </div>
    </div>
  );
}

interface Props {
  groups: DeadlineGroup[];
  isLoading: boolean;
}

export function StudentUpcomingDeadlines({ groups, isLoading }: Props) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm overflow-y-auto">
      <h2 className="text-base font-semibold text-slate-800 mb-3">Upcoming Deadlines</h2>
      {isLoading ? (
        <>
          <DeadlineGroupSkeleton />
          <DeadlineGroupSkeleton />
        </>
      ) : groups.length === 0 ? (
        <p className="text-sm text-slate-400 py-6 text-center">
          No deadlines in the next 7 days. You're all caught up.
        </p>
      ) : (
        groups.map((group) => (
          <DeadlineGroupSection key={group.label} group={group} />
        ))
      )}
    </div>
  );
}
