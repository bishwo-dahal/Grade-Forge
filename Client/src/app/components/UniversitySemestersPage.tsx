import { useEffect, useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, Plus, Search, X } from "lucide-react";
import type { AcademicSemester, SemesterCreatePayload } from "../../types/universityAdmin";
import {
  createAcademicSemester,
  deleteAcademicSemesterById,
  listAcademicSemesters,
} from "../../services/universityAdminService";

const DEFAULT_SEMESTER_FORM: SemesterCreatePayload = {
  name: "",
  startDate: "",
  endDate: "",
};

function getErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === "object" && error !== null) {
    const response = (error as { response?: { data?: { message?: unknown } } }).response;
    const message = response?.data?.message;
    if (typeof message === "string" && message.trim().length > 0) {
      return message;
    }
  }
  return fallback;
}

interface UniversitySemestersViewProps {
  // NOTE: This component is presentation-only. Data is injected by the page/container.
  semesters: AcademicSemester[];
  isLoading: boolean;
  error: string | null;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  onOpenCreateModal: () => void;
  onDeleteSemester: (semesterId: number) => void;
  deletingSemesterId: number | null;
}

function UniversitySemestersView({
  semesters,
  isLoading,
  error,
  searchTerm,
  onSearchTermChange,
  onOpenCreateModal,
  onDeleteSemester,
  deletingSemesterId,
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
          onClick={onOpenCreateModal}
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
            <article key={semester.id} className="rounded-2xl border border-gray-200 bg-white p-6">
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
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => onDeleteSemester(semester.id)}
                  className="rounded-xl bg-[#FDEBEC] px-4 py-1.5 text-[14px] font-medium text-[#E0474C] disabled:opacity-60"
                  disabled={deletingSemesterId === semester.id}
                >
                  {/* NOTE: Semester cards now expose the same backend-backed delete action style as faculty rows. */}
                  {deletingSemesterId === semester.id ? "Deleting..." : "Delete"}
                </button>
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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [semesterForm, setSemesterForm] = useState<SemesterCreatePayload>(DEFAULT_SEMESTER_FORM);
  const [semesterFormError, setSemesterFormError] = useState<string | null>(null);
  const [isCreatingSemester, setIsCreatingSemester] = useState(false);
  const [deletingSemesterId, setDeletingSemesterId] = useState<number | null>(null);

  const loadSemesters = () => {
    setIsLoading(true);
    setError(null);
    listAcademicSemesters()
      .then(setSemesters)
      .catch((loadError) => setError(getErrorMessage(loadError, "Could not load semesters.")))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    // NOTE: Container-level data loading keeps the cards view presentation-only for easier backend handoff.
    loadSemesters();
  }, []);

  const handleOpenCreateModal = () => {
    setSemesterForm(DEFAULT_SEMESTER_FORM);
    setSemesterFormError(null);
    setShowCreateModal(true);
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setSemesterFormError(null);
  };

  const handleCreateSemester = async () => {
    if (!semesterForm.name || !semesterForm.startDate || !semesterForm.endDate) {
      setSemesterFormError("Semester name, start date, and end date are required.");
      return;
    }

    if (new Date(semesterForm.endDate) < new Date(semesterForm.startDate)) {
      setSemesterFormError("End date must be the same day or after the start date.");
      return;
    }

    setIsCreatingSemester(true);
    setSemesterFormError(null);

    try {
      // NOTE: Uses existing backend-connected university semester create endpoint.
      await createAcademicSemester(semesterForm);
      handleCloseCreateModal();
      loadSemesters();
    } catch (creationError) {
      setSemesterFormError(getErrorMessage(creationError, "Could not create semester."));
    } finally {
      setIsCreatingSemester(false);
    }
  };

  const handleDeleteSemester = async (semesterId: number) => {
    setDeletingSemesterId(semesterId);
    setError(null);

    try {
      // NOTE: Delete action is backend-connected and removes semester record from DB.
      await deleteAcademicSemesterById(semesterId);
      loadSemesters();
    } catch (deleteError) {
      setError(getErrorMessage(deleteError, "Could not delete semester."));
    } finally {
      setDeletingSemesterId(null);
    }
  };

  return (
    <>
      <UniversitySemestersView
        semesters={semesters}
        isLoading={isLoading}
        error={error}
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        onOpenCreateModal={handleOpenCreateModal}
        onDeleteSemester={handleDeleteSemester}
        deletingSemesterId={deletingSemesterId}
      />

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
          <div className="w-full max-w-[520px] overflow-hidden rounded-3xl border border-gray-200 bg-white">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
              <h2 className="text-[22px] font-semibold text-[#1F2430]">Create Semester</h2>
              <button
                type="button"
                onClick={handleCloseCreateModal}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#8B96A8] hover:bg-gray-100"
                aria-label="Close Create Semester dialog"
              >
                <X className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>

            <div className="space-y-4 px-6 py-5">
              {semesterFormError && <p className="text-[13px] text-[#C23A42]">{semesterFormError}</p>}

              <div>
                <label htmlFor="university-semester-name" className="mb-1.5 block text-[13px] font-medium text-[#1F2430]">
                  Semester Name
                </label>
                <input
                  id="university-semester-name"
                  type="text"
                  placeholder="Fall 2026"
                  value={semesterForm.name}
                  onChange={(event) => setSemesterForm((prev) => ({ ...prev, name: event.target.value }))}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-[14px] text-[#1F2430] placeholder:text-[#9CA6B6] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="university-semester-start" className="mb-1.5 block text-[13px] font-medium text-[#1F2430]">
                    Start Date
                  </label>
                  <input
                    id="university-semester-start"
                    type="date"
                    value={semesterForm.startDate}
                    onChange={(event) => setSemesterForm((prev) => ({ ...prev, startDate: event.target.value }))}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-[14px] text-[#1F2430] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]"
                  />
                </div>
                <div>
                  <label htmlFor="university-semester-end" className="mb-1.5 block text-[13px] font-medium text-[#1F2430]">
                    End Date
                  </label>
                  <input
                    id="university-semester-end"
                    type="date"
                    value={semesterForm.endDate}
                    onChange={(event) => setSemesterForm((prev) => ({ ...prev, endDate: event.target.value }))}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-[14px] text-[#1F2430] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
              <button
                type="button"
                onClick={handleCloseCreateModal}
                className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-[13px] font-medium text-[#2B2A2A]"
                disabled={isCreatingSemester}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateSemester}
                className="rounded-xl bg-[#2B2A2A] px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-60"
                disabled={isCreatingSemester}
              >
                {isCreatingSemester ? "Creating..." : "Create Semester"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
