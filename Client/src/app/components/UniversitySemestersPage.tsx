import { useEffect, useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, Plus, Search } from "lucide-react";
import type { AcademicSemester } from "../../types/universityAdmin";
import { listAcademicSemesters } from "../../services/universityAdminService";

interface UniversitySemestersViewProps {
  // NOTE: This component is presentation-only. Data is injected by the page/container.
  semesters: AcademicSemester[];
  isLoading: boolean;
  error: string | null;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
}

function UniversitySemestersView({
  semesters,
  isLoading,
  error,
  searchTerm,
  onSearchTermChange,
}: UniversitySemestersViewProps) {
  const filteredSemesters = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (!normalizedSearch) {
      return semesters;
    }
    return semesters.filter((semester) => semester.name.toLowerCase().includes(normalizedSearch));
  }, [semesters, searchTerm]);

  return (
    <main className="flex-1 overflow-y-auto bg-[#F5F2F2] px-8 py-6">
      <section className="flex flex-wrap items-start justify-between gap-3">
        <div>
          {/* FIX: Reduced section heading size so university pages match the natural typography used elsewhere. */}
          <h1 className="text-[28px] leading-none font-bold text-[#2B2A2A]">Academic Semesters</h1>
          <p className="mt-3 text-[14px] text-[#5D6A80]">Manage academic terms and schedules</p>
        </div>
        <button
          type="button"
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#2B2A2A] px-4 text-[14px] font-semibold text-white"
        >
          <Plus className="h-4 w-4" strokeWidth={2} />
          Create Semester
        </button>
      </section>

      <section className="mt-6">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98A2B5]" strokeWidth={2} />
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => onSearchTermChange(event.target.value)}
            placeholder="Search semesters..."
            className="w-full rounded-2xl border border-[#CFD2D9] bg-white py-2.5 pl-10 pr-4 text-[14px] text-[#2B2A2A] placeholder:text-[#8791A5] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]"
          />
        </div>
      </section>

      {error && <p className="mt-4 text-[14px] text-[#C23A42]">{error}</p>}

      <section className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-2 2xl:grid-cols-3">
        {isLoading && (
          <article className="rounded-2xl border border-gray-200 bg-white p-6">
            <p className="text-[14px] text-[#5D6A80]">Loading semesters...</p>
          </article>
        )}

        {!isLoading && filteredSemesters.length === 0 && (
          <article className="rounded-2xl border border-gray-200 bg-white p-6">
            <p className="text-[14px] text-[#5D6A80]">No semesters found.</p>
          </article>
        )}

        {!isLoading &&
          filteredSemesters.map((semester) => (
            <article key={`${semester.name}-${semester.startDate}`} className="rounded-2xl border border-gray-200 bg-white p-6">
              <div className="mb-5 flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E8EEFF] text-[#5A7ACD]">
                  <CalendarDays className="h-5 w-5" strokeWidth={2} />
                </div>
                <div>
                  <h2 className="text-[16px] font-semibold text-[#1F2430]">{semester.name}</h2>
                  {semester.status === "past" && (
                    <span className="mt-2 inline-flex items-center rounded-lg bg-[#EDF0F4] px-2.5 py-1 text-[11px] font-semibold uppercase text-[#667186]">
                      Past
                    </span>
                  )}
                  {semester.status === "active" && (
                    <span className="mt-2 inline-flex items-center gap-1 rounded-lg bg-[#EAF5EC] px-2.5 py-1 text-[11px] font-semibold uppercase text-[#0D9A4B]">
                      <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2} />
                      Active
                    </span>
                  )}
                  {semester.status === "upcoming" && (
                    <span className="mt-2 inline-flex items-center rounded-lg bg-[#E8EEFF] px-2.5 py-1 text-[11px] font-semibold uppercase text-[#2D63D7]">
                      Upcoming
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-1.5 text-[14px] text-[#2D3B53]">
                <p>Start: {semester.startDate}</p>
                <p>End: {semester.endDate}</p>
                <p>Courses: {semester.courses}</p>
              </div>
            </article>
          ))}
      </section>
    </main>
  );
}

export function UniversitySemestersPage() {
  const [semesters, setSemesters] = useState<AcademicSemester[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    // NOTE: Container-level data loading keeps the cards view presentation-only for easier backend handoff.
    listAcademicSemesters()
      .then(setSemesters)
      .catch(() => setError("Could not load semesters."))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <UniversitySemestersView
      semesters={semesters}
      isLoading={isLoading}
      error={error}
      searchTerm={searchTerm}
      onSearchTermChange={setSearchTerm}
    />
  );
}
