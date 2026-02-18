import { useState } from "react";
import { Navigate, useNavigate } from "react-router";
import { X } from "lucide-react";
import { GradeForgeMain } from "./GradeForgeMain";
import { GradeForgeRightPanel } from "./GradeForgeRightPanel";
import { FacultyMain } from "./FacultyMain";
import { FacultyRightPanel } from "./FacultyRightPanel";
import { AuthShell } from "./layout/AuthShell";
import { AuthTopBar } from "./layout/AuthTopBar";
import { clearAuthenticated, getAuthenticatedRole, getAuthenticatedUser } from "../auth";
import type { ClassCreateFormData } from "../../types/class";
import type { FacultySemesterOption } from "../../types/class";
import { createFacultyCourse, listFacultySemesters } from "../../services/classService";

const EMPTY_CLASS_FORM: ClassCreateFormData = {
  name: "",
  courseCode: "",
  section: "",
  description: "",
  imageUrl: "",
  canvasCourseId: "",
  semesterId: "",
  isPublished: false,
  active: true,
};

export function GradeForgeDashboard() {
  // NOTE: This component is now the only dashboard shell entrypoint; legacy GradeFlowDashboard was removed as dead code.
  const navigate = useNavigate();
  const role = getAuthenticatedRole();
  const loggedInUser = getAuthenticatedUser();
  const [showCreateClassModal, setShowCreateClassModal] = useState(false);
  // NOTE: Form state stays in dashboard container so modal remains presentation-only and backend wiring can be added safely later.
  const [classForm, setClassForm] = useState<ClassCreateFormData>(EMPTY_CLASS_FORM);
  const [facultySemesters, setFacultySemesters] = useState<FacultySemesterOption[]>([]);
  const [isLoadingSemesters, setIsLoadingSemesters] = useState(false);
  const [isCreatingClass, setIsCreatingClass] = useState(false);
  const [createClassError, setCreateClassError] = useState<string | null>(null);
  const [facultyRefreshSignal, setFacultyRefreshSignal] = useState(0);

  if (role === "UNIVERSITY_ADMIN") {
    // NOTE: University admins should never render student/faculty dashboard UI.
    return <Navigate to="/university-admin" replace />;
  }

  // NOTE: View mode is now role-driven; removed manual student/faculty switching.
  const viewMode: "student" | "faculty" = role === "FACULTY" ? "faculty" : "student";
  const fallbackName = viewMode === "faculty" ? "Dr. Sarah Miller" : "Alex Johnson";
  const fallbackEmail = viewMode === "faculty" ? "@smiller.edu" : "@alexj.edu";
  const displayName = loggedInUser?.name ?? fallbackName;
  const displayEmail = loggedInUser?.email ?? fallbackEmail;
  const displayInitials =
    displayName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "GF";

  const goToSettingsSection = (section: "profile" | "security" | "notifications" | "appearance") => {
    navigate(`/settings?section=${section}`);
  };

  const handleLogout = () => {
    clearAuthenticated();
    navigate("/signin", { replace: true });
  };

  const handleOpenCreateClass = () => {
    setClassForm(EMPTY_CLASS_FORM);
    setCreateClassError(null);
    setShowCreateClassModal(true);
    setIsLoadingSemesters(true);
    // NOTE: Modal semester options come from backend so the form can submit valid semester IDs.
    listFacultySemesters()
      .then(setFacultySemesters)
      .catch(() => setCreateClassError("Unable to load semesters. Please try again."))
      .finally(() => setIsLoadingSemesters(false));
  };

  const handleCloseCreateClass = () => {
    setShowCreateClassModal(false);
    setCreateClassError(null);
  };

  const handleCreateClassSubmit = async () => {
    if (!classForm.name.trim() || !classForm.courseCode.trim() || !classForm.semesterId.trim()) {
      setCreateClassError("Class name, course code, and semester are required.");
      return;
    }

    setIsCreatingClass(true);
    setCreateClassError(null);

    try {
      await createFacultyCourse(classForm);
      setShowCreateClassModal(false);
      // NOTE: Incrementing refresh signal triggers faculty dashboard list reload through container useEffect.
      setFacultyRefreshSignal((value) => value + 1);
    } catch (error) {
      const message =
        error instanceof Error && error.message ? error.message : "Unable to create class. Please verify the fields and try again.";
      setCreateClassError(message);
    } finally {
      setIsCreatingClass(false);
    }
  };

  const topBar = (
    <AuthTopBar
      roleView={viewMode}
      profile={{ name: displayName, email: displayEmail, initials: displayInitials }}
      searchPlaceholder={viewMode === "faculty" ? "Search students, assignments, classes..." : "Search courses, lessons, grad..."}
      // NOTE: Faculty add-class action was moved into FacultyMain header next to View All Courses.
      primaryActionLabel={viewMode === "student" ? "Enroll in Class" : undefined}
      onPrimaryAction={() => undefined}
      onSettingsSectionSelect={goToSettingsSection}
      onLogout={handleLogout}
    />
  );

  return (
    <>
      <AuthShell
        roleView={viewMode}
        topBar={topBar}
        // NOTE: Main workflow content stays split by role to avoid mixing student and faculty business flows.
        mainContent={
          viewMode === "student" ? (
            <GradeForgeMain />
          ) : (
            <FacultyMain onOpenCreateClass={handleOpenCreateClass} refreshSignal={facultyRefreshSignal} />
          )
        }
        // NOTE: Right panel remains role-specific since data and widgets are fundamentally different.
        rightPanel={viewMode === "student" ? <GradeForgeRightPanel /> : <FacultyRightPanel />}
      />

      {viewMode === "faculty" && showCreateClassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
          <div className="w-full max-w-[620px] rounded-3xl border border-gray-200 bg-white overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
              <div>
                <h3 className="text-[28px] font-bold leading-none text-[#1F2430]">Add New Class</h3>
                <p className="mt-1 text-[13px] text-[#5D6A80]">Fill fields required by current course schema.</p>
              </div>
              <button
                type="button"
                onClick={handleCloseCreateClass}
                aria-label="Close Add Class dialog"
                className="h-8 w-8 rounded-lg text-[#8B96A8] hover:bg-gray-100 flex items-center justify-center"
              >
                <X className="h-5 w-5" strokeWidth={2} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {createClassError && (
                <p className="text-[13px] text-[#C23A42] bg-[#FDEBEC] border border-[#F3CDD1] rounded-xl px-3 py-2">
                  {createClassError}
                </p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="class-name" className="mb-2 block text-[14px] font-medium text-[#1F2430]">
                    Class Name
                  </label>
                  <input
                    id="class-name"
                    value={classForm.name}
                    onChange={(event) => setClassForm((prev) => ({ ...prev, name: event.target.value }))}
                    placeholder="e.g., Data Structures and Algorithms"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-[14px] text-[#1F2430] placeholder:text-[#9CA6B6] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]"
                  />
                </div>
                <div>
                  <label htmlFor="class-course-code" className="mb-2 block text-[14px] font-medium text-[#1F2430]">
                    Course Code
                  </label>
                  <input
                    id="class-course-code"
                    value={classForm.courseCode}
                    onChange={(event) => setClassForm((prev) => ({ ...prev, courseCode: event.target.value }))}
                    placeholder="e.g., CS-301"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-[14px] text-[#1F2430] placeholder:text-[#9CA6B6] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="class-section" className="mb-2 block text-[14px] font-medium text-[#1F2430]">
                    Section
                  </label>
                  <input
                    id="class-section"
                    value={classForm.section}
                    onChange={(event) => setClassForm((prev) => ({ ...prev, section: event.target.value }))}
                    placeholder="e.g., Section 001"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-[14px] text-[#1F2430] placeholder:text-[#9CA6B6] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]"
                  />
                </div>
                <div>
                  <label htmlFor="class-semester-id" className="mb-2 block text-[14px] font-medium text-[#1F2430]">
                    Semester
                  </label>
                  <select
                    id="class-semester-id"
                    value={classForm.semesterId}
                    onChange={(event) => setClassForm((prev) => ({ ...prev, semesterId: event.target.value }))}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-[14px] text-[#1F2430] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]"
                    disabled={isLoadingSemesters}
                  >
                    <option value="">
                      {isLoadingSemesters ? "Loading semesters..." : "Select semester"}
                    </option>
                    {facultySemesters.map((semester) => (
                      <option key={semester.id} value={String(semester.id)}>
                        {semester.name} ({semester.startDate} - {semester.endDate})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="class-description" className="mb-2 block text-[14px] font-medium text-[#1F2430]">
                  Description
                </label>
                <textarea
                  id="class-description"
                  value={classForm.description}
                  onChange={(event) => setClassForm((prev) => ({ ...prev, description: event.target.value }))}
                  placeholder="Optional course description"
                  rows={3}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-[14px] text-[#1F2430] placeholder:text-[#9CA6B6] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="class-image-url" className="mb-2 block text-[14px] font-medium text-[#1F2430]">
                    Image URL
                  </label>
                  <input
                    id="class-image-url"
                    value={classForm.imageUrl}
                    onChange={(event) => setClassForm((prev) => ({ ...prev, imageUrl: event.target.value }))}
                    placeholder="Optional cover image URL"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-[14px] text-[#1F2430] placeholder:text-[#9CA6B6] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]"
                  />
                </div>
                <div>
                  <label htmlFor="class-canvas-id" className="mb-2 block text-[14px] font-medium text-[#1F2430]">
                    Canvas Course ID
                  </label>
                  <input
                    id="class-canvas-id"
                    value={classForm.canvasCourseId}
                    onChange={(event) => setClassForm((prev) => ({ ...prev, canvasCourseId: event.target.value }))}
                    placeholder="Optional LMS id"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-[14px] text-[#1F2430] placeholder:text-[#9CA6B6] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="flex items-center gap-2 text-[14px] text-[#1F2430]">
                  <input
                    type="checkbox"
                    checked={classForm.active}
                    onChange={(event) => setClassForm((prev) => ({ ...prev, active: event.target.checked }))}
                    className="h-4 w-4 rounded border-gray-300 text-[#5A7ACD] focus:ring-[#5A7ACD]"
                  />
                  Active
                </label>
                <label className="flex items-center gap-2 text-[14px] text-[#1F2430]">
                  <input
                    type="checkbox"
                    checked={classForm.isPublished}
                    onChange={(event) => setClassForm((prev) => ({ ...prev, isPublished: event.target.checked }))}
                    className="h-4 w-4 rounded border-gray-300 text-[#5A7ACD] focus:ring-[#5A7ACD]"
                  />
                  Published
                </label>
              </div>

              {/* NOTE: Faculty ID is database-required but auto-resolved from authenticated faculty email by backend service. */}
              <p className="text-[12px] text-[#6D7B91]">Faculty is auto-derived from your logged-in account on create.</p>
            </div>

            <div className="px-6 py-5 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleCloseCreateClass}
                className="px-5 py-2.5 rounded-xl border border-gray-300 bg-white text-[14px] font-medium text-[#2B2A2A] hover:bg-gray-50 transition-colors"
                disabled={isCreatingClass}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateClassSubmit}
                className="px-5 py-2.5 rounded-xl bg-[#5A7ACD] text-white text-[14px] font-semibold hover:bg-[#4a6abd] transition-colors disabled:opacity-60"
                disabled={isCreatingClass}
              >
                {isCreatingClass ? "Creating..." : "Create Class"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
