import { useState } from "react";
import type { StudentSearchResponseDto } from "../../types/universityAdmin";
import { searchStudents, searchFaculty, searchGradingAssistants } from "../../services/universityAdminService";
import { getApiErrorMessage } from "../../utils/apiErrorMessage";

export function UniversityManageUsersPage() {
  const [keyword, setKeyword] = useState("");
  const [activeRole, setActiveRole] = useState<"STUDENT" | "FACULTY" | "GRADING_ASSISTANT">("STUDENT");
  const [results, setResults] = useState<StudentSearchResponseDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const onSearch = async () => {
    const normalizedKeyword = keyword.trim();
    if (!normalizedKeyword) {
      setError("Keyword is required.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setHasSearched(true);
    try {
      let data: StudentSearchResponseDto[] = [];
      if (activeRole === "STUDENT") {
        data = await searchStudents(normalizedKeyword);
      } else if (activeRole === "FACULTY") {
        data = await searchFaculty(normalizedKeyword);
      } else {
        data = await searchGradingAssistants(normalizedKeyword);
      }
      setResults(data);
    } catch (e) {
      setResults([]);
      const fallbackMessage =
        activeRole === "STUDENT"
          ? "Could not search students."
          : activeRole === "FACULTY"
            ? "Could not search faculty."
            : "Could not search grading assistants.";
      setError(getApiErrorMessage(e, fallbackMessage));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex-1 overflow-y-auto bg-[#F5F2F2] px-8 py-6">
      <section>
        <h1 className="text-[28px] leading-none font-bold text-[#2B2A2A]">Manage Users</h1>
        <p className="mt-3 text-[14px] text-[#5D6A80]">Search students, faculty, and grading assistants by keyword</p>
      </section>

      <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-5">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className={`inline-flex items-center rounded-full px-4 py-1.5 text-[13px] font-semibold ${
              activeRole === "STUDENT"
                ? "bg-[#2B2A2A] text-white"
                : "bg-[#F1F3F7] text-[#44506B] hover:bg-[#E2E6EF]"
            }`}
            onClick={() => setActiveRole("STUDENT")}
            disabled={isLoading}
          >
            Students
          </button>
          <button
            type="button"
            className={`inline-flex items-center rounded-full px-4 py-1.5 text-[13px] font-semibold ${
              activeRole === "FACULTY"
                ? "bg-[#2B2A2A] text-white"
                : "bg-[#F1F3F7] text-[#44506B] hover:bg-[#E2E6EF]"
            }`}
            onClick={() => setActiveRole("FACULTY")}
            disabled={isLoading}
          >
            Faculty
          </button>
          <button
            type="button"
            className={`inline-flex items-center rounded-full px-4 py-1.5 text-[13px] font-semibold ${
              activeRole === "GRADING_ASSISTANT"
                ? "bg-[#2B2A2A] text-white"
                : "bg-[#F1F3F7] text-[#44506B] hover:bg-[#E2E6EF]"
            }`}
            onClick={() => setActiveRole("GRADING_ASSISTANT")}
            disabled={isLoading}
          >
            Grading Assistants
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="manage-users-keyword" className="mb-1.5 block text-[13px] font-medium text-[#1F2430]">
              Keyword
            </label>
            <input
              id="manage-users-keyword"
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Name, email, CWID..."
              className="w-full rounded-xl border border-[#CFD2D9] bg-white px-3 py-2 text-[14px] text-[#2B2A2A] placeholder:text-[#8791A5] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]"
            />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={onSearch}
              disabled={isLoading}
              className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-[#2B2A2A] px-5 text-[14px] font-semibold text-white disabled:opacity-50"
            >
              {isLoading ? "Searching..." : "Search"}
            </button>
          </div>
        </div>
        {error && <p className="mt-4 text-[14px] text-[#C23A42]">{error}</p>}
      </section>

      <section className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px]">
            <thead>
              <tr className="border-b border-gray-200 bg-[#FBFCFE]">
                <th className="px-6 py-4 text-left text-[12px] font-semibold tracking-wide text-[#345079] uppercase">ID</th>
                <th className="px-6 py-4 text-left text-[12px] font-semibold tracking-wide text-[#345079] uppercase">User ID</th>
                <th className="px-6 py-4 text-left text-[12px] font-semibold tracking-wide text-[#345079] uppercase">CWID</th>
                <th className="px-6 py-4 text-left text-[12px] font-semibold tracking-wide text-[#345079] uppercase">Major</th>
                <th className="px-6 py-4 text-left text-[12px] font-semibold tracking-wide text-[#345079] uppercase">Canvas User ID</th>
                <th className="px-6 py-4 text-left text-[12px] font-semibold tracking-wide text-[#345079] uppercase">Name</th>
                <th className="px-6 py-4 text-left text-[12px] font-semibold tracking-wide text-[#345079] uppercase">Email</th>
              </tr>
            </thead>
            <tbody>
              {!hasSearched ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-[14px] text-[#5D6A80]">
                    {activeRole === "STUDENT"
                      ? "Search for students to view matching users."
                      : activeRole === "FACULTY"
                        ? "Search for faculty to view matching users."
                        : "Search for grading assistants to view matching users."}
                  </td>
                </tr>
              ) : isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={`manage-users-skeleton-${index}`} className="border-b border-gray-100 last:border-b-0">
                    <td className="px-6 py-4" colSpan={7}>
                      <div className="h-4 w-full animate-pulse rounded bg-[#F1F3F7]" />
                    </td>
                  </tr>
                ))
              ) : results.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-[14px] text-[#5D6A80]">
                    {activeRole === "STUDENT"
                      ? "No students found for the current keyword."
                      : activeRole === "FACULTY"
                        ? "No faculty found for the current keyword."
                        : "No grading assistants found for the current keyword."}
                  </td>
                </tr>
              ) : (
                results.map((user) => (
                  <tr key={user.id} className="border-b border-gray-100 last:border-b-0">
                    <td className="px-6 py-4 text-[13px] text-[#2B2A2A]">{user.id}</td>
                    <td className="px-6 py-4 text-[13px] text-[#44506B]">{user.userId}</td>
                    <td className="px-6 py-4 text-[13px] text-[#44506B]">{user.cwid || "—"}</td>
                    <td className="px-6 py-4 text-[13px] text-[#44506B]">{user.major || "—"}</td>
                    <td className="px-6 py-4 text-[13px] text-[#44506B]">{user.canvasUserId || "—"}</td>
                    <td className="px-6 py-4 text-[13px] font-medium text-[#2B2A2A]">{user.name}</td>
                    <td className="px-6 py-4 text-[13px] text-[#44506B]">{user.email}</td>
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
