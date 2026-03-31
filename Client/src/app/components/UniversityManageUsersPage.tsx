import { useState } from "react";
import { Lock, MoreHorizontal, X, Eye, EyeOff } from "lucide-react";
import type { FacultySearchResponse, GradingAssistantResponse, StudentSearchResponseDto } from "../../types/universityAdmin";
import { resetUserPasswordByUniversityAdmin, searchStudents, searchFaculty, searchGradingAssistants } from "../../services/universityAdminService";
import { getApiErrorMessage } from "../../utils/apiErrorMessage";

export function UniversityManageUsersPage() {
  const [keyword, setKeyword] = useState("");
  const [activeRole, setActiveRole] = useState<"STUDENT" | "FACULTY" | "GRADING_ASSISTANT">("STUDENT");
  const [studentResults, setStudentResults] = useState<StudentSearchResponseDto[]>([]);
  const [facultyResults, setFacultyResults] = useState<FacultySearchResponse[]>([]);
  const [assistantResults, setAssistantResults] = useState<GradingAssistantResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const [openActionMenuKey, setOpenActionMenuKey] = useState<string | null>(null);
  const [changePasswordUser, setChangePasswordUser] = useState<{ email: string; label: string } | null>(null);
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [updatingPassword, setUpdatingPassword] = useState(false);

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
      if (activeRole === "STUDENT") {
        const data = await searchStudents(normalizedKeyword);
        setStudentResults(data);
        setFacultyResults([]);
        setAssistantResults([]);
      } else if (activeRole === "FACULTY") {
        const data = await searchFaculty(normalizedKeyword);
        setFacultyResults(data);
        setStudentResults([]);
        setAssistantResults([]);
      } else {
        const data = await searchGradingAssistants(normalizedKeyword);
        setAssistantResults(data);
        setStudentResults([]);
        setFacultyResults([]);
      }
    } catch (e) {
      setStudentResults([]);
      setFacultyResults([]);
      setAssistantResults([]);
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

  const openChangePasswordModal = (email: string, label: string) => {
    setOpenActionMenuKey(null);
    setChangePasswordUser({ email, label });
    setResetToken("");
    setNewPassword("");
    setShowNewPassword(false);
    setPasswordError(null);
    setPasswordSuccess(null);
  };

  const closeChangePasswordModal = () => {
    setChangePasswordUser(null);
    setResetToken("");
    setNewPassword("");
    setShowNewPassword(false);
    setPasswordError(null);
    setPasswordSuccess(null);
    setUpdatingPassword(false);
  };

  const submitPasswordChange = async () => {
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!changePasswordUser) return;
    if (!resetToken || !newPassword) {
      setPasswordError("Please fill in reset token and new password.");
      return;
    }

    setUpdatingPassword(true);
    try {
      await resetUserPasswordByUniversityAdmin({
        email: changePasswordUser.email,
        resetToken,
        newPassword,
      });
      setPasswordSuccess("Password updated successfully.");
      setResetToken("");
      setNewPassword("");
    } catch (e) {
      setPasswordError(getApiErrorMessage(e, "Failed to update password."));
    } finally {
      setUpdatingPassword(false);
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

        <form
          className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (isLoading) return;
            void onSearch();
          }}
        >
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
              type="submit"
              disabled={isLoading}
              className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-[#2B2A2A] px-5 text-[14px] font-semibold text-white disabled:opacity-50"
            >
              {isLoading ? "Searching..." : "Search"}
            </button>
          </div>
        </form>
        {error && <p className="mt-4 text-[14px] text-[#C23A42]">{error}</p>}
      </section>

      <section className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          {activeRole === "FACULTY" ? (
            <table className="w-full min-w-[1300px]">
              <thead>
                <tr className="border-b border-gray-200 bg-[#FBFCFE]">
                  <th className="px-6 py-4 text-left text-[12px] font-semibold tracking-wide text-[#345079] uppercase">Faculty ID</th>
                  <th className="px-6 py-4 text-left text-[12px] font-semibold tracking-wide text-[#345079] uppercase">User ID</th>
                  <th className="px-6 py-4 text-left text-[12px] font-semibold tracking-wide text-[#345079] uppercase">Name</th>
                  <th className="px-6 py-4 text-left text-[12px] font-semibold tracking-wide text-[#345079] uppercase">Email</th>
                  <th className="px-6 py-4 text-left text-[12px] font-semibold tracking-wide text-[#345079] uppercase">Department</th>
                  <th className="px-6 py-4 text-left text-[12px] font-semibold tracking-wide text-[#345079] uppercase">Qualifications</th>
                  <th className="px-6 py-4 text-left text-[12px] font-semibold tracking-wide text-[#345079] uppercase">Phone</th>
                  <th className="px-6 py-4 text-left text-[12px] font-semibold tracking-wide text-[#345079] uppercase">Office</th>
                  <th className="px-6 py-4 text-left text-[12px] font-semibold tracking-wide text-[#345079] uppercase">Office Hours</th>
                  <th className="px-6 py-4 text-left text-[12px] font-semibold tracking-wide text-[#345079] uppercase">Active</th>
                  <th className="px-6 py-4 text-right text-[12px] font-semibold tracking-wide text-[#345079] uppercase">Action</th>
                </tr>
              </thead>
              <tbody>
                {!hasSearched ? (
                  <tr>
                    <td colSpan={11} className="px-6 py-12 text-center text-[14px] text-[#5D6A80]">
                      Search for faculty to view matching users.
                    </td>
                  </tr>
                ) : isLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <tr key={`manage-users-skeleton-faculty-${index}`} className="border-b border-gray-100 last:border-b-0">
                      <td className="px-6 py-4" colSpan={11}>
                        <div className="h-4 w-full animate-pulse rounded bg-[#F1F3F7]" />
                      </td>
                    </tr>
                  ))
                ) : facultyResults.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-6 py-12 text-center text-[14px] text-[#5D6A80]">
                      No faculty found for the current keyword.
                    </td>
                  </tr>
                ) : (
                  facultyResults.map((faculty) => (
                    <tr key={faculty.facultyId} className="border-b border-gray-100 last:border-b-0">
                      <td className="px-6 py-4 text-[13px] text-[#2B2A2A]">{faculty.facultyId}</td>
                      <td className="px-6 py-4 text-[13px] text-[#44506B]">{faculty.userId}</td>
                      <td className="px-6 py-4 text-[13px] font-medium text-[#2B2A2A]">{faculty.name}</td>
                      <td className="px-6 py-4 text-[13px] text-[#44506B]">{faculty.email}</td>
                      <td className="px-6 py-4 text-[13px] text-[#44506B]">{faculty.department || "—"}</td>
                      <td className="px-6 py-4 text-[13px] text-[#44506B]">{faculty.qualifications || "—"}</td>
                      <td className="px-6 py-4 text-[13px] text-[#44506B]">{faculty.phoneNumber || "—"}</td>
                      <td className="px-6 py-4 text-[13px] text-[#44506B]">{faculty.officeLocation || "—"}</td>
                      <td className="px-6 py-4 text-[13px] text-[#44506B]">{faculty.officeHours || "—"}</td>
                      <td className="px-6 py-4 text-[13px] text-[#44506B]">{faculty.active ? "Yes" : "No"}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="relative inline-block">
                          <button
                            type="button"
                            aria-label="Row actions"
                            onClick={() =>
                              setOpenActionMenuKey((k) =>
                                k === `FACULTY-${faculty.facultyId}` ? null : `FACULTY-${faculty.facultyId}`,
                              )
                            }
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#CFD2D9] bg-white text-[#2B2A2A] hover:bg-[#F1F3F7]"
                          >
                            <MoreHorizontal className="h-4 w-4" strokeWidth={2} />
                          </button>
                          {openActionMenuKey === `FACULTY-${faculty.facultyId}` && (
                            <div className="absolute right-0 mt-2 w-48 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg z-10">
                              <button
                                type="button"
                                onClick={() => openChangePasswordModal(faculty.email, faculty.email)}
                                className="flex w-full items-center gap-2 px-4 py-3 text-left text-[13px] text-[#2B2A2A] hover:bg-[#F5F2F2]"
                              >
                                <Lock className="h-4 w-4" strokeWidth={2} />
                                Change password
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : activeRole === "GRADING_ASSISTANT" ? (
            <table className="w-full min-w-[1200px]">
              <thead>
                <tr className="border-b border-gray-200 bg-[#FBFCFE]">
                  <th className="px-6 py-4 text-left text-[12px] font-semibold tracking-wide text-[#345079] uppercase">ID</th>
                  <th className="px-6 py-4 text-left text-[12px] font-semibold tracking-wide text-[#345079] uppercase">User ID</th>
                  <th className="px-6 py-4 text-left text-[12px] font-semibold tracking-wide text-[#345079] uppercase">Faculty ID</th>
                  <th className="px-6 py-4 text-left text-[12px] font-semibold tracking-wide text-[#345079] uppercase">Name</th>
                  <th className="px-6 py-4 text-left text-[12px] font-semibold tracking-wide text-[#345079] uppercase">Email</th>
                  <th className="px-6 py-4 text-left text-[12px] font-semibold tracking-wide text-[#345079] uppercase">Department</th>
                  <th className="px-6 py-4 text-left text-[12px] font-semibold tracking-wide text-[#345079] uppercase">Office Hours</th>
                  <th className="px-6 py-4 text-left text-[12px] font-semibold tracking-wide text-[#345079] uppercase">Faculty</th>
                  <th className="px-6 py-4 text-right text-[12px] font-semibold tracking-wide text-[#345079] uppercase">Action</th>
                </tr>
              </thead>
              <tbody>
                {!hasSearched ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-[14px] text-[#5D6A80]">
                      Search for grading assistants to view matching users.
                    </td>
                  </tr>
                ) : isLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <tr key={`manage-users-skeleton-ga-${index}`} className="border-b border-gray-100 last:border-b-0">
                      <td className="px-6 py-4" colSpan={9}>
                        <div className="h-4 w-full animate-pulse rounded bg-[#F1F3F7]" />
                      </td>
                    </tr>
                  ))
                ) : assistantResults.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-[14px] text-[#5D6A80]">
                      No grading assistants found for the current keyword.
                    </td>
                  </tr>
                ) : (
                  assistantResults.map((ga) => (
                    <tr key={ga.id} className="border-b border-gray-100 last:border-b-0">
                      <td className="px-6 py-4 text-[13px] text-[#2B2A2A]">{ga.id}</td>
                      <td className="px-6 py-4 text-[13px] text-[#44506B]">{ga.userId}</td>
                      <td className="px-6 py-4 text-[13px] text-[#44506B]">{ga.facultyId}</td>
                      <td className="px-6 py-4 text-[13px] font-medium text-[#2B2A2A]">{ga.name}</td>
                      <td className="px-6 py-4 text-[13px] text-[#44506B]">{ga.email}</td>
                      <td className="px-6 py-4 text-[13px] text-[#44506B]">{ga.department || "—"}</td>
                      <td className="px-6 py-4 text-[13px] text-[#44506B]">{ga.officeHours || "—"}</td>
                      <td className="px-6 py-4 text-[13px] text-[#44506B]">
                        {ga.faculty?.name ? `${ga.faculty.name} (${ga.faculty.email ?? "—"})` : "—"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="relative inline-block">
                          <button
                            type="button"
                            aria-label="Row actions"
                            onClick={() => setOpenActionMenuKey((k) => (k === `GA-${ga.id}` ? null : `GA-${ga.id}`))}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#CFD2D9] bg-white text-[#2B2A2A] hover:bg-[#F1F3F7]"
                          >
                            <MoreHorizontal className="h-4 w-4" strokeWidth={2} />
                          </button>
                          {openActionMenuKey === `GA-${ga.id}` && (
                            <div className="absolute right-0 mt-2 w-48 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg z-10">
                              <button
                                type="button"
                                onClick={() => openChangePasswordModal(ga.email, ga.email)}
                                className="flex w-full items-center gap-2 px-4 py-3 text-left text-[13px] text-[#2B2A2A] hover:bg-[#F5F2F2]"
                              >
                                <Lock className="h-4 w-4" strokeWidth={2} />
                                Change password
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
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
                  <th className="px-6 py-4 text-right text-[12px] font-semibold tracking-wide text-[#345079] uppercase">Action</th>
                </tr>
              </thead>
              <tbody>
                {!hasSearched ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-[14px] text-[#5D6A80]">
                      {activeRole === "STUDENT"
                        ? "Search for students to view matching users."
                        : "Search for grading assistants to view matching users."}
                    </td>
                  </tr>
                ) : isLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <tr key={`manage-users-skeleton-${index}`} className="border-b border-gray-100 last:border-b-0">
                      <td className="px-6 py-4" colSpan={8}>
                        <div className="h-4 w-full animate-pulse rounded bg-[#F1F3F7]" />
                      </td>
                    </tr>
                  ))
                ) : activeRole === "STUDENT" ? (
                  studentResults.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-[14px] text-[#5D6A80]">
                        No students found for the current keyword.
                      </td>
                    </tr>
                  ) : (
                    studentResults.map((user) => (
                      <tr key={user.id} className="border-b border-gray-100 last:border-b-0">
                        <td className="px-6 py-4 text-[13px] text-[#2B2A2A]">{user.id}</td>
                        <td className="px-6 py-4 text-[13px] text-[#44506B]">{user.userId}</td>
                        <td className="px-6 py-4 text-[13px] text-[#44506B]">{user.cwid || "—"}</td>
                        <td className="px-6 py-4 text-[13px] text-[#44506B]">{user.major || "—"}</td>
                        <td className="px-6 py-4 text-[13px] text-[#44506B]">{user.canvasUserId || "—"}</td>
                        <td className="px-6 py-4 text-[13px] font-medium text-[#2B2A2A]">{user.name}</td>
                        <td className="px-6 py-4 text-[13px] text-[#44506B]">{user.email}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="relative inline-block">
                            <button
                              type="button"
                              aria-label="Row actions"
                              onClick={() =>
                                setOpenActionMenuKey((k) => (k === `STUDENT-${user.id}` ? null : `STUDENT-${user.id}`))
                              }
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#CFD2D9] bg-white text-[#2B2A2A] hover:bg-[#F1F3F7]"
                            >
                              <MoreHorizontal className="h-4 w-4" strokeWidth={2} />
                            </button>
                            {openActionMenuKey === `STUDENT-${user.id}` && (
                              <div className="absolute right-0 mt-2 w-48 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg z-10">
                                <button
                                  type="button"
                                  onClick={() => openChangePasswordModal(user.email, user.email)}
                                  className="flex w-full items-center gap-2 px-4 py-3 text-left text-[13px] text-[#2B2A2A] hover:bg-[#F5F2F2]"
                                >
                                  <Lock className="h-4 w-4" strokeWidth={2} />
                                  Change password
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )
                ) : null}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {changePasswordUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
          <div className="w-full max-w-[460px] overflow-hidden rounded-2xl border border-gray-200 bg-white">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
              <div>
                <h3 className="text-[22px] leading-none font-semibold text-[#2B2A2A]">Change Password</h3>
                <p className="mt-2 text-[13px] text-[#5D6A80]">{changePasswordUser.label}</p>
              </div>
              <button
                type="button"
                aria-label="Close dialog"
                onClick={closeChangePasswordModal}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5" strokeWidth={2} />
              </button>
            </div>

            <form
              className="space-y-5 px-6 py-6"
              onSubmit={(e) => {
                e.preventDefault();
                if (updatingPassword) return;
                void submitPasswordChange();
              }}
            >
              {passwordError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
                  {passwordError}
                </div>
              )}
              {passwordSuccess && (
                <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-[13px] text-green-700">
                  {passwordSuccess}
                </div>
              )}

              <div>
                <label htmlFor="admin-reset-email" className="mb-2 block text-[14px] font-medium text-[#2B2A2A]">
                  Email
                </label>
                <input
                  id="admin-reset-email"
                  type="email"
                  value={changePasswordUser.email}
                  readOnly
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-[14px] text-gray-700 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="admin-reset-token" className="mb-2 block text-[14px] font-medium text-[#2B2A2A]">
                  Reset Token
                </label>
                <input
                  id="admin-reset-token"
                  type="text"
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  placeholder="Enter reset token"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-[14px] text-[#2B2A2A] placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]"
                />
              </div>

              <div>
                <label htmlFor="admin-new-password" className="mb-2 block text-[14px] font-medium text-[#2B2A2A]">
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="admin-new-password"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 pr-11 text-[14px] text-[#2B2A2A] placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]"
                  />
                  <button
                    type="button"
                    aria-label={showNewPassword ? "Hide new password" : "Show new password"}
                    onClick={() => setShowNewPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-5 w-5" strokeWidth={2} />
                    ) : (
                      <Eye className="h-5 w-5" strokeWidth={2} />
                    )}
                  </button>
                </div>
              </div>
            </form>

            <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-5">
              <button
                type="button"
                onClick={closeChangePasswordModal}
                className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-[14px] font-medium text-[#2B2A2A] hover:bg-gray-50 transition-colors"
                disabled={updatingPassword}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitPasswordChange}
                disabled={updatingPassword}
                className="inline-flex items-center gap-2 rounded-xl bg-[#5A7ACD] px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-[#4a6abd] disabled:opacity-60 transition-colors"
              >
                <Lock className="h-4 w-4" strokeWidth={2} />
                <span>{updatingPassword ? "Updating..." : "Update Password"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
