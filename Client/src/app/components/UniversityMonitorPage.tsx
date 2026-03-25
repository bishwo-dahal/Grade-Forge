import { useCallback, useEffect, useState } from "react";
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
  onRefresh: () => void;
}

function UniversityMonitorView({
  data,
  isLoading,
  error,
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
        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#CFD2D9] bg-white px-4 text-[14px] font-semibold text-[#2B2A2A] disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} strokeWidth={2} />
          Refresh
        </button>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
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
              disabled={page <= 0 || isLoading}
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
              disabled={totalPages <= 1 || page >= totalPages - 1 || isLoading}
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
              {isLoading
                ? Array.from({ length: 5 }).map((_, index) => (
                    <tr key={`monitor-log-skeleton-${index}`} className="border-b border-gray-100 last:border-b-0">
                      <td className="px-6 py-4" colSpan={6}>
                        <div className="h-4 w-full animate-pulse rounded bg-[#F1F3F7]" />
                      </td>
                    </tr>
                  ))
                : logs.length === 0
                  ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-[14px] text-[#5D6A80]">
                          No log entries match the current filters.
                        </td>
                      </tr>
                    )
                  : (
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

interface MonitorPagedSliceProps {
  filterKey: string;
  userInput: string;
  onUserInputChange: (value: string) => void;
  roleFilter: string;
  onRoleFilterChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  dateFilter: string;
  onDateFilterChange: (value: string) => void;
}

/** Owns page state so remounting on filter changes resets pagination without racing the API. */
function MonitorPagedSlice({
  filterKey,
  userInput,
  onUserInputChange,
  roleFilter,
  onRoleFilterChange,
  statusFilter,
  onStatusFilterChange,
  dateFilter,
  onDateFilterChange,
}: MonitorPagedSliceProps) {
  const [page, setPage] = useState(0);
  const [data, setData] = useState<ActivityLogPageResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [debouncedUser, role, status, date] = filterKey.split("\0");

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetchActivityLogs({
        page,
        size: PAGE_SIZE,
        user: debouncedUser || undefined,
        role: role || undefined,
        status: status || undefined,
        date: date || undefined,
      });
      setData(response);
    } catch (e) {
      setError(getApiErrorMessage(e, "Could not load activity logs."));
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedUser, role, status, date]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <UniversityMonitorView
      data={data}
      isLoading={isLoading}
      error={error}
      page={page}
      onPageChange={setPage}
      userInput={userInput}
      onUserInputChange={onUserInputChange}
      roleFilter={roleFilter}
      onRoleFilterChange={onRoleFilterChange}
      statusFilter={statusFilter}
      onStatusFilterChange={onStatusFilterChange}
      dateFilter={dateFilter}
      onDateFilterChange={onDateFilterChange}
      onRefresh={load}
    />
  );
}

export function UniversityMonitorPage() {
  const [userInput, setUserInput] = useState("");
  const [debouncedUser, setDebouncedUser] = useState("");

  const [roleInput, setRoleInput] = useState("");
  const [debouncedRole, setDebouncedRole] = useState("");

  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedUser(userInput.trim()), 400);
    return () => window.clearTimeout(timer);
  }, [userInput]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedRole(roleInput.trim()), 400);
    return () => window.clearTimeout(timer);
  }, [roleInput]);

  const filterKey = [debouncedUser, debouncedRole, statusFilter.trim(), dateFilter.trim()].join("\0");

  return (
    <MonitorPagedSlice
      key={filterKey}
      filterKey={filterKey}
      userInput={userInput}
      onUserInputChange={setUserInput}
      roleFilter={roleInput}
      onRoleFilterChange={setRoleInput}
      statusFilter={statusFilter}
      onStatusFilterChange={setStatusFilter}
      dateFilter={dateFilter}
      onDateFilterChange={setDateFilter}
    />
  );
}
