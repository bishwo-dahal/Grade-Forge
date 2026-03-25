import { useCallback, useState } from "react";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import type { ActivityLogEntry, ActivityLogPageResponse } from "../../types/universityAdmin";
import { fetchActivityLogs } from "../../services/universityAdminService";
import { getApiErrorMessage } from "../../utils/apiErrorMessage";

const PAGE_SIZE = 20;

const timestampFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "medium",
});

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : timestampFormatter.format(d);
}

function statusBadgeClass(status: string): string {
  const normalized = status.toLowerCase();
  if (normalized === "success") {
    return "bg-emerald-50 text-emerald-800 ring-emerald-200";
  }
  if (normalized === "failure" || normalized === "error" || normalized === "failed") {
    return "bg-red-50 text-red-800 ring-red-200";
  }
  return "bg-[#F1F3F7] text-[#44506B] ring-[#E2E6EF]";
}

interface UniversityMonitorViewProps {
  data: ActivityLogPageResponse | null;
  isLoading: boolean;
  error: string | null;
  hasSearched: boolean;
  hasFilters: boolean;
  page: number;
  onPageChange: (page: number) => void;
  userInput: string;
  onUserInputChange: (value: string) => void;
  roleFilter: string;
  onRoleFilterChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  dateFilter: string;
  onDateFilterChange: (value: string) => void;
  startFilter: string;
  onStartFilterChange: (value: string) => void;
  endFilter: string;
  onEndFilterChange: (value: string) => void;
  showAdvanced: boolean;
  onToggleAdvanced: () => void;
  onSearch: () => void;
  onReset: () => void;
  onRefresh: () => void;
}

function UniversityMonitorView({
  data,
  isLoading,
  error,
  hasSearched,
  hasFilters,
  page,
  onPageChange,
  userInput,
  onUserInputChange,
  roleFilter,
  onRoleFilterChange,
  statusFilter,
  onStatusFilterChange,
  dateFilter,
  onDateFilterChange,
  startFilter,
  onStartFilterChange,
  endFilter,
  onEndFilterChange,
  showAdvanced,
  onToggleAdvanced,
  onSearch,
  onReset,
  onRefresh,
}: UniversityMonitorViewProps) {
  const logs: ActivityLogEntry[] = data?.logs ?? [];
  const totalPages = data?.pages ?? 0;
  const total = data?.total ?? 0;
  const displayFrom = total === 0 ? 0 : page * PAGE_SIZE + 1;
  const displayTo = total === 0 ? 0 : Math.min(total, page * PAGE_SIZE + logs.length);

  return (
    <main className="flex-1 overflow-y-auto bg-[#F5F2F2] px-8 py-6">
      <section className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[28px] leading-none font-bold text-[#2B2A2A]">Monitor</h1>
          <p className="mt-3 text-[14px] text-[#5D6A80]">System activity and audit log</p>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="flex-1">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <label htmlFor="monitor-filter-user" className="mb-1.5 block text-[13px] font-medium text-[#1F2430]">
                User email
              </label>
              <input
                id="monitor-filter-user"
                type="text"
                value={userInput}
                onChange={(e) => onUserInputChange(e.target.value)}
                placeholder="e.g. faculty@gmail.com"
                className="w-full rounded-xl border border-[#CFD2D9] bg-white px-3 py-2 text-[14px] text-[#2B2A2A] placeholder:text-[#8791A5] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]"
              />
            </div>
            <div>
              <label htmlFor="monitor-filter-role" className="mb-1.5 block text-[13px] font-medium text-[#1F2430]">
                Role
              </label>
              <input
                id="monitor-filter-role"
                type="text"
                value={roleFilter}
                onChange={(e) => onRoleFilterChange(e.target.value)}
                placeholder="e.g. FACULTY"
                className="w-full rounded-xl border border-[#CFD2D9] bg-white px-3 py-2 text-[14px] text-[#2B2A2A] placeholder:text-[#8791A5] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]"
              />
            </div>
            <div>
              <label htmlFor="monitor-filter-status" className="mb-1.5 block text-[13px] font-medium text-[#1F2430]">
                Status
              </label>
              <select
                id="monitor-filter-status"
                value={statusFilter}
                onChange={(e) => onStatusFilterChange(e.target.value)}
                className="w-full rounded-xl border border-[#CFD2D9] bg-white px-3 py-2 text-[14px] text-[#2B2A2A] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]"
              >
                <option value="">All</option>
                <option value="success">Success</option>
                <option value="failure">Failure</option>
              </select>
            </div>
            <div>
              <label htmlFor="monitor-filter-date" className="mb-1.5 block text-[13px] font-medium text-[#1F2430]">
                Date
              </label>
              <input
                id="monitor-filter-date"
                type="date"
                value={dateFilter}
                onChange={(e) => onDateFilterChange(e.target.value)}
                className="w-full rounded-xl border border-[#CFD2D9] bg-white px-3 py-2 text-[14px] text-[#2B2A2A] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]"
              />
            </div>
            <div className="md:col-span-2 xl:col-span-4">
              <button
                type="button"
                onClick={onToggleAdvanced}
                className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#345079] hover:text-[#2B2A2A] transition-colors"
              >
                {showAdvanced ? "Hide advanced search" : "Advanced search"}
              </button>
              <span className="ml-2 text-[12px] text-[#7A859A]">(time range)</span>
            </div>
            {showAdvanced && (
              <>
                <div>
                  <label htmlFor="monitor-filter-start" className="mb-1.5 block text-[13px] font-medium text-[#1F2430]">
                    Start
                  </label>
                  <input
                    id="monitor-filter-start"
                    type="time"
                    value={startFilter}
                    onChange={(e) => onStartFilterChange(e.target.value)}
                    className="w-full rounded-xl border border-[#CFD2D9] bg-white px-3 py-2 text-[14px] text-[#2B2A2A] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]"
                  />
                </div>
                <div>
                  <label htmlFor="monitor-filter-end" className="mb-1.5 block text-[13px] font-medium text-[#1F2430]">
                    End
                  </label>
                  <input
                    id="monitor-filter-end"
                    type="time"
                    value={endFilter}
                    onChange={(e) => onEndFilterChange(e.target.value)}
                    className="w-full rounded-xl border border-[#CFD2D9] bg-white px-3 py-2 text-[14px] text-[#2B2A2A] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]"
                  />
                </div>
              </>
            )}
          </div>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-end xl:w-auto xl:items-end">
            <button
              type="button"
              onClick={onSearch}
              disabled={isLoading}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#2B2A2A] px-5 text-[14px] font-semibold text-white disabled:opacity-50"
            >
              Search
            </button>
            <button
              type="button"
              onClick={onReset}
              disabled={isLoading || !hasFilters}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#CFD2D9] bg-white px-5 text-[14px] font-semibold text-[#2B2A2A] disabled:opacity-50"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={onRefresh}
              disabled={!hasSearched || isLoading}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#CFD2D9] bg-white px-5 text-[14px] font-semibold text-[#2B2A2A] disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} strokeWidth={2} />
              Refresh
            </button>
          </div>
        </div>
      </section>

      {error && <p className="mt-4 text-[14px] text-[#C23A42]">{error}</p>}

      <section className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-6 py-3 text-[13px] text-[#5D6A80]">
          <span>
            {total === 0 ? "No entries" : `Showing ${displayFrom}–${displayTo} of ${total}`}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!hasSearched || page <= 0 || isLoading}
              onClick={() => onPageChange(page - 1)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#CFD2D9] bg-white text-[#2B2A2A] disabled:opacity-40"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={2} />
            </button>
            <span className="min-w-[100px] text-center text-[14px] font-medium text-[#2B2A2A]">
              Page {totalPages === 0 ? 0 : page + 1} / {Math.max(totalPages, 1)}
            </span>
            <button
              type="button"
              disabled={!hasSearched || totalPages <= 1 || page >= totalPages - 1 || isLoading}
              onClick={() => onPageChange(page + 1)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#CFD2D9] bg-white text-[#2B2A2A] disabled:opacity-40"
              aria-label="Next page"
            >
              <ChevronRight className="h-5 w-5" strokeWidth={2} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px]">
            <thead>
              <tr className="border-b border-gray-200 bg-[#FBFCFE]">
                <th className="px-6 py-4 text-left text-[12px] font-semibold tracking-wide text-[#345079] uppercase">Time</th>
                <th className="px-6 py-4 text-left text-[12px] font-semibold tracking-wide text-[#345079] uppercase">Role</th>
                <th className="px-6 py-4 text-left text-[12px] font-semibold tracking-wide text-[#345079] uppercase">User</th>
                <th className="px-6 py-4 text-left text-[12px] font-semibold tracking-wide text-[#345079] uppercase">Action</th>
                <th className="px-6 py-4 text-left text-[12px] font-semibold tracking-wide text-[#345079] uppercase">Details</th>
                <th className="px-6 py-4 text-left text-[12px] font-semibold tracking-wide text-[#345079] uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {!hasSearched ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[14px] text-[#5D6A80]">
                    Click <span className="font-semibold text-[#2B2A2A]">Search</span> to load activity logs.
                  </td>
                </tr>
              ) : isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={`monitor-log-skeleton-${index}`} className="border-b border-gray-100 last:border-b-0">
                    <td className="px-6 py-4" colSpan={6}>
                      <div className="h-4 w-full animate-pulse rounded bg-[#F1F3F7]" />
                    </td>
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[14px] text-[#5D6A80]">
                    No log entries match the current filters.
                  </td>
                </tr>
              ) : (
                logs.map((log, index) => (
                  <tr key={`${log.timestamp}-${index}`} className="border-b border-gray-100 last:border-b-0">
                    <td className="px-6 py-4 text-[13px] whitespace-nowrap text-[#2B2A2A]">{formatTimestamp(log.timestamp)}</td>
                    <td className="px-6 py-4 text-[13px] text-[#44506B]">{log.role}</td>
                    <td className="px-6 py-4 text-[13px] text-[#44506B]">{log.user}</td>
                    <td className="px-6 py-4 text-[13px] font-medium text-[#2B2A2A]">{log.action}</td>
                    <td className="px-6 py-4 text-[13px] text-[#5D6A80] max-w-[320px]">{log.details}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-lg px-2.5 py-1 text-[12px] font-semibold ring-1 ring-inset ${statusBadgeClass(log.status)}`}
                      >
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

export function UniversityMonitorPage() {
  const [userInput, setUserInput] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [startFilter, setStartFilter] = useState("");
  const [endFilter, setEndFilter] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [page, setPage] = useState(0);
  const [data, setData] = useState<ActivityLogPageResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const [appliedFilters, setAppliedFilters] = useState<{
    user?: string;
    role?: string;
    status?: string;
    date?: string;
    start?: string;
    end?: string;
  } | null>(null);

  const buildFilters = useCallback(() => {
    return {
      user: userInput.trim() || undefined,
      role: roleFilter.trim() || undefined,
      status: statusFilter.trim() || undefined,
      date: dateFilter.trim() || undefined,
      start: startFilter.trim() || undefined,
      end: endFilter.trim() || undefined,
    };
  }, [userInput, roleFilter, statusFilter, dateFilter, startFilter, endFilter]);

  const hasFilters =
    userInput.trim().length > 0 ||
    roleFilter.trim().length > 0 ||
    statusFilter.trim().length > 0 ||
    dateFilter.trim().length > 0 ||
    startFilter.trim().length > 0 ||
    endFilter.trim().length > 0;

  const load = useCallback(
    async (pageToLoad: number, filters: NonNullable<typeof appliedFilters>) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetchActivityLogs({
          ...filters,
          page: pageToLoad,
          size: PAGE_SIZE,
        });
        setData(response);
      } catch (e) {
        setError(getApiErrorMessage(e, "Could not load activity logs."));
        setData(null);
      } finally {
        setIsLoading(false);
      }
    },
    [setData]
  );

  const onSearch = useCallback(async () => {
    const filters = buildFilters();
    setAppliedFilters(filters);
    setPage(0);
    setHasSearched(true);
    await load(0, filters);
  }, [buildFilters, load]);

  const onReset = useCallback(() => {
    setUserInput("");
    setRoleFilter("");
    setStatusFilter("");
    setDateFilter("");
    setStartFilter("");
    setEndFilter("");
    setAppliedFilters(null);
    setPage(0);
    setHasSearched(false);
    setData(null);
    setError(null);
    setShowAdvanced(false);
  }, []);

  const onPageChange = useCallback(
    async (nextPage: number) => {
      if (!appliedFilters) return;
      setPage(nextPage);
      await load(nextPage, appliedFilters);
    },
    [appliedFilters, load]
  );

  const onRefresh = useCallback(async () => {
    if (!appliedFilters) return;
    await load(page, appliedFilters);
  }, [appliedFilters, load, page]);

  return (
    <UniversityMonitorView
      data={data}
      isLoading={isLoading}
      error={error}
      hasSearched={hasSearched}
      hasFilters={hasFilters}
      page={page}
      onPageChange={onPageChange}
      userInput={userInput}
      onUserInputChange={setUserInput}
      roleFilter={roleFilter}
      onRoleFilterChange={setRoleFilter}
      statusFilter={statusFilter}
      onStatusFilterChange={setStatusFilter}
      dateFilter={dateFilter}
      onDateFilterChange={setDateFilter}
      startFilter={startFilter}
      onStartFilterChange={setStartFilter}
      endFilter={endFilter}
      onEndFilterChange={setEndFilter}
      showAdvanced={showAdvanced}
      onToggleAdvanced={() => setShowAdvanced((v) => !v)}
      onSearch={onSearch}
      onReset={onReset}
      onRefresh={onRefresh}
    />
  );
}
