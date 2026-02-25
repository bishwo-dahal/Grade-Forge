import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CalendarDays, ChevronDown, Clock3 } from "lucide-react";
import { useNavigate } from "react-router";
import { clearAuthenticated, getAuthenticatedUser } from "../auth";
import { listStudentAssignments } from "../../services/assignmentService";
import type { StudentAssignmentListItem, StudentAssignmentStatus } from "../../types/assignment";
import { SegmentedFilter } from "./ui/SegmentedFilter";
import type { SegmentedFilterItem } from "./ui/SegmentedFilter";
import { AuthShell } from "./layout/AuthShell";
import { AuthTopBar } from "./layout/AuthTopBar";
import type { SettingsSection } from "./layout/AuthTopBar";

type AssignmentTabFilter = "all" | StudentAssignmentStatus;

interface StudentAssignmentsViewProps {
  // NOTE: This component is presentation-only. Data is injected by the page/container.
  assignments: StudentAssignmentListItem[];
  isLoading: boolean;
  selectedFilter: AssignmentTabFilter;
  onFilterChange: (filter: AssignmentTabFilter) => void;
}

function buildTabConfigs(assignments: StudentAssignmentListItem[]): SegmentedFilterItem<AssignmentTabFilter>[] {
  const countByStatus = assignments.reduce<Record<StudentAssignmentStatus, number>>(
    (accumulator, assignment) => {
      accumulator[assignment.status] += 1;
      return accumulator;
    },
    { upcoming: 0, active: 0, completed: 0, overdue: 0 },
  );

  return [
    { id: "all", label: "All", count: assignments.length },
    { id: "upcoming", label: "Upcoming", count: countByStatus.upcoming },
    { id: "active", label: "Active", count: countByStatus.active },
    { id: "completed", label: "Completed", count: countByStatus.completed },
    // NOTE: Keep warning tone for overdue to match the shared tab design language across pages.
    { id: "overdue", label: "Overdue", count: countByStatus.overdue, tone: "warning" },
  ];
}

function filterAssignments(assignments: StudentAssignmentListItem[], selectedFilter: AssignmentTabFilter) {
  if (selectedFilter === "all") {
    return assignments;
  }
  return assignments.filter((assignment) => assignment.status === selectedFilter);
}

function getStatusBadgeClasses(status: StudentAssignmentStatus): string {
  switch (status) {
    case "overdue":
      return "border border-[#F6C5C5] bg-[#FFF5F5] text-[#DC2626]";
    case "active":
      return "border border-[#F9D8AF] bg-[#FFF7ED] text-[#EA7A14]";
    case "upcoming":
      return "border border-[#CCD8F9] bg-[#EEF3FF] text-[#4B67C8]";
    case "completed":
      return "border border-[#CDECD8] bg-[#F0FFF6] text-[#1E8E4D]";
    default:
      return "border border-[#CFD2D9] bg-white text-[#4B5565]";
  }
}

function getStatusLabel(status: StudentAssignmentStatus): string {
  switch (status) {
    case "overdue":
      return "Overdue";
    case "active":
      return "In Progress";
    case "upcoming":
      return "Upcoming";
    case "completed":
      return "Completed";
    default:
      return "Unknown";
  }
}

function StudentAssignmentsView({ assignments, isLoading, selectedFilter, onFilterChange }: StudentAssignmentsViewProps) {
  const tabConfigs = useMemo(() => buildTabConfigs(assignments), [assignments]);
  const visibleAssignments = useMemo(
    () => filterAssignments(assignments, selectedFilter),
    [assignments, selectedFilter],
  );

  return (
    <main className="flex-1 overflow-y-auto bg-[#F5F2F2] px-8 py-6">
      {/* REFACTOR: Merge sort and status tabs into one compact controls row, with sort anchored on the left side. */}
      <section className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative">
          <select
            aria-label="Sort assignments"
            defaultValue="due-date"
            className="h-9 appearance-none rounded-xl border border-[#CFD2D9] bg-white pl-3.5 pr-9 text-[12px] text-[#344155] focus:outline-none"
          >
            <option value="due-date">Sort by Due Date</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5D667A]" />
        </div>

        {/* REFACTOR: Reuse shared segmented filter so assignment tabs stay consistent with faculty and future pages. */}
        <SegmentedFilter items={tabConfigs} value={selectedFilter} onValueChange={onFilterChange} />
      </section>

      <section className="mt-6 space-y-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, index) => (
              <article
                key={`student-assignment-skeleton-${index}`}
                // NOTE: Skeleton assignment rows prevent the page from collapsing while assignment data is loading.
                className="rounded-2xl border border-gray-200 bg-white px-6 py-5 animate-pulse"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-5">
                    <div className="mt-1 h-12 w-12 shrink-0 rounded-xl bg-[#EEF2FA]" />
                    <div className="space-y-2">
                      <div className="h-5 w-52 max-w-full rounded bg-gray-200" />
                      <div className="h-4 w-72 max-w-full rounded bg-gray-200" />
                      <div className="h-4 w-44 rounded bg-gray-200" />
                    </div>
                  </div>
                  <div className="h-8 w-28 rounded-xl bg-gray-100" />
                </div>
              </article>
            ))
          : null}
        {!isLoading &&
          visibleAssignments.map((assignment) => (
          <article key={assignment.id} className="rounded-2xl border border-gray-200 bg-white px-6 py-5">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
              <div className="flex min-w-0 items-start gap-5">
                <div
                  className={`mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl ${assignment.iconBg}`}
                >
                  {assignment.icon}
                </div>

                <div className="min-w-0">
                  <h2 className="truncate text-[14px] font-semibold leading-tight text-[#1D2433]">
                    {assignment.title}
                  </h2>
                  <p className="mt-2 text-[14px] text-[#52607A]">
                    {assignment.courseCode}
                    <span className="px-2 text-[#9CA4B6]">.</span>
                    {assignment.courseName}
                    <span className="px-2 text-[#9CA4B6]">.</span>
                    <span className="font-medium text-[#1D2433]">{assignment.points} points</span>
                  </p>
                  <p className="mt-2 inline-flex items-center gap-2 text-[14px] text-[#52607A]">
                    <Clock3 className="h-4 w-4 text-[#5D667A]" strokeWidth={2} />
                    Due {assignment.dueAt}
                  </p>
                </div>
              </div>

              <div className="flex w-full items-start justify-end md:w-auto">
                <div
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-1.5 text-[14px] font-medium ${getStatusBadgeClasses(assignment.status)}`}
                >
                  {assignment.status === "overdue" && <AlertCircle className="h-4 w-4" strokeWidth={2} />}
                  {assignment.status === "upcoming" && <CalendarDays className="h-4 w-4" strokeWidth={2} />}
                  {assignment.status === "active" && <Clock3 className="h-4 w-4" strokeWidth={2} />}
                  {assignment.status === "completed" && <CalendarDays className="h-4 w-4" strokeWidth={2} />}
                  {getStatusLabel(assignment.status)}
                </div>
                {/* CLEANUP: Removed completion progress bar and percentage from cards per updated assignments page requirements. */}
              </div>
            </div>
          </article>
          ))}
        {!isLoading && visibleAssignments.length === 0 ? (
          <article className="rounded-2xl border border-gray-200 bg-white px-6 py-5">
            <p className="text-[14px] text-[#5D667A]">No assignments found for this filter.</p>
          </article>
        ) : null}
      </section>
    </main>
  );
}

export function StudentAssignmentsPage() {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<StudentAssignmentListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<AssignmentTabFilter>("all");
  const loggedInUser = getAuthenticatedUser();
  const displayName = loggedInUser?.name ?? "Alex Johnson";
  const displayEmail = loggedInUser?.email ?? "alex@university.edu";

  const displayInitials = useMemo(() => {
    // NOTE: Keep initials derived from auth session so top-bar profile stays consistent across student pages.
    return (
      displayName
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("") || "AJ"
    );
  }, [displayName]);

  useEffect(() => {
    // NOTE: Container owns data loading and passes assignment data into the presentation component.
    // NOTE: Service now reads live assignments from enrolled classes so this page reflects faculty-created assignments.
    setIsLoading(true);
    listStudentAssignments()
      .then(setAssignments)
      .catch(() => setAssignments([]))
      .finally(() => setIsLoading(false));
  }, []);

  const goToSettingsSection = (section: SettingsSection) => {
    navigate(`/settings?section=${section}`);
  };

  const handleLogout = () => {
    clearAuthenticated();
    navigate("/signin", { replace: true });
  };

  return (
    <AuthShell
      roleView="student"
      topBar={
        <AuthTopBar
          roleView="student"
          profile={{ name: displayName, email: displayEmail, initials: displayInitials }}
          searchPlaceholder="Search calendar, assignments..."
          onSettingsSectionSelect={goToSettingsSection}
          onLogout={handleLogout}
        />
      }
      mainContent={
        <StudentAssignmentsView
          assignments={assignments}
          isLoading={isLoading}
          selectedFilter={selectedFilter}
          onFilterChange={setSelectedFilter}
        />
      }
    />
  );
}
