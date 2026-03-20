import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { clearAuthenticated, getAuthenticatedUser } from "../auth";
import { createFacultyCourse, listFacultySemesters } from "../../services/classService";
import type { ClassCreateFormData, FacultySemesterOption } from "../../types/class";
import { AuthShell } from "./layout/AuthShell";
import { AuthTopBar } from "./layout/AuthTopBar";
import type { SettingsSection } from "./layout/AuthTopBar";
import { getApiErrorMessage } from "../../utils/apiErrorMessage";

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

interface FacultyCreateClassViewProps {
  // NOTE: This component is presentation-only. Data is injected by the page/container.
  classForm: ClassCreateFormData;
  semesters: FacultySemesterOption[];
  isLoadingSemesters: boolean;
  isCreatingClass: boolean;
  error: string | null;
  onFormChange: (nextForm: ClassCreateFormData) => void;
  onSubmit: () => void;
}

function FacultyCreateClassView({
  classForm,
  semesters,
  isLoadingSemesters,
  isCreatingClass,
  error,
  onFormChange,
  onSubmit,
}: FacultyCreateClassViewProps) {
  return (
    <main className="flex-1 overflow-y-auto bg-[#F5F2F2] px-8 py-6">
      <div className="mb-5">
        <Link
          to="/faculty/my-classes"
          className="inline-flex items-center gap-2 text-[13px] text-[#5D6A80] transition-colors hover:text-[#2B2A2A]"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2} />
          Back to My Classes
        </Link>
      </div>

      <section className="rounded-3xl border border-gray-200 bg-white p-6">
        <h1 className="text-[24px] font-semibold text-[#1F2430]">Create New Class</h1>
        <p className="mt-2 text-[14px] text-[#5D6A80]">Fill all required fields and create your class.</p>

        {error && (
          <p className="mt-4 rounded-xl border border-[#F3CDD1] bg-[#FDEBEC] px-3 py-2 text-[13px] text-[#C23A42]">{error}</p>
        )}

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="faculty-create-class-name" className="mb-1.5 block text-[13px] font-medium text-[#1F2430]">
              Class Name
            </label>
            <input
              id="faculty-create-class-name"
              value={classForm.name}
              onChange={(event) => onFormChange({ ...classForm, name: event.target.value })}
              placeholder="e.g., Data Structures and Algorithms"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-[14px] text-[#1F2430] placeholder:text-[#9CA6B6] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]"
            />
          </div>

          <div>
            <label htmlFor="faculty-create-class-code" className="mb-1.5 block text-[13px] font-medium text-[#1F2430]">
              Course Code
            </label>
            <input
              id="faculty-create-class-code"
              value={classForm.courseCode}
              onChange={(event) => onFormChange({ ...classForm, courseCode: event.target.value })}
              placeholder="e.g., CS-301"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-[14px] text-[#1F2430] placeholder:text-[#9CA6B6] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]"
            />
          </div>

          <div>
            <label htmlFor="faculty-create-class-section" className="mb-1.5 block text-[13px] font-medium text-[#1F2430]">
              Section
            </label>
            <input
              id="faculty-create-class-section"
              value={classForm.section}
              onChange={(event) => onFormChange({ ...classForm, section: event.target.value })}
              placeholder="e.g., Section 001"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-[14px] text-[#1F2430] placeholder:text-[#9CA6B6] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]"
            />
          </div>

          <div>
            <label htmlFor="faculty-create-class-semester" className="mb-1.5 block text-[13px] font-medium text-[#1F2430]">
              Semester
            </label>
            <select
              id="faculty-create-class-semester"
              value={classForm.semesterId}
              onChange={(event) => onFormChange({ ...classForm, semesterId: event.target.value })}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-[14px] text-[#1F2430] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]"
              disabled={isLoadingSemesters}
            >
              <option value="">{isLoadingSemesters ? "Loading semesters..." : "Select semester"}</option>
              {semesters.map((semester) => (
                <option key={semester.id} value={String(semester.id)}>
                  {semester.name} ({semester.startDate} - {semester.endDate})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4">
          <label htmlFor="faculty-create-class-description" className="mb-1.5 block text-[13px] font-medium text-[#1F2430]">
            Description
          </label>
          <textarea
            id="faculty-create-class-description"
            value={classForm.description}
            onChange={(event) => onFormChange({ ...classForm, description: event.target.value })}
            rows={3}
            placeholder="Optional course description"
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-[14px] text-[#1F2430] placeholder:text-[#9CA6B6] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]"
          />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="faculty-create-class-image" className="mb-1.5 block text-[13px] font-medium text-[#1F2430]">
              Image URL
            </label>
            <input
              id="faculty-create-class-image"
              value={classForm.imageUrl}
              onChange={(event) => onFormChange({ ...classForm, imageUrl: event.target.value })}
              placeholder="Optional cover image URL"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-[14px] text-[#1F2430] placeholder:text-[#9CA6B6] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]"
            />
          </div>
          <div>
            <label htmlFor="faculty-create-class-canvas-id" className="mb-1.5 block text-[13px] font-medium text-[#1F2430]">
              Canvas Course ID
            </label>
            <input
              id="faculty-create-class-canvas-id"
              value={classForm.canvasCourseId}
              onChange={(event) => onFormChange({ ...classForm, canvasCourseId: event.target.value })}
              placeholder="Optional LMS id"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-[14px] text-[#1F2430] placeholder:text-[#9CA6B6] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]"
            />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="inline-flex items-center gap-2 text-[14px] text-[#1F2430]">
            <input
              type="checkbox"
              checked={classForm.active}
              onChange={(event) => onFormChange({ ...classForm, active: event.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-[#5A7ACD] focus:ring-[#5A7ACD]"
            />
            Active
          </label>
          <label className="inline-flex items-center gap-2 text-[14px] text-[#1F2430]">
            <input
              type="checkbox"
              checked={classForm.isPublished}
              onChange={(event) => onFormChange({ ...classForm, isPublished: event.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-[#5A7ACD] focus:ring-[#5A7ACD]"
            />
            Published
          </label>
        </div>

        {/* NOTE: Faculty id is resolved on backend from the authenticated user, so form does not expose this field. */}
        <p className="mt-4 text-[12px] text-[#6D7B91]">Faculty is auto-derived from your logged-in account on create.</p>

        <div className="mt-6 flex items-center justify-end gap-3 border-t border-gray-200 pt-5">
          <Link
            to="/faculty/my-classes"
            className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-[14px] font-medium text-[#2B2A2A] hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="button"
            onClick={onSubmit}
            className="rounded-xl bg-[#5A7ACD] px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-[#4a6abd] disabled:opacity-60"
            disabled={isCreatingClass}
          >
            {isCreatingClass ? "Creating..." : "Create Class"}
          </button>
        </div>
      </section>
    </main>
  );
}

export function FacultyCreateClassPage() {
  const navigate = useNavigate();
  const loggedInUser = getAuthenticatedUser();
  const displayName = loggedInUser?.name ?? "Dr. Sarah Miller";
  const displayEmail = loggedInUser?.email ?? "smiller@university.edu";
  const displayInitials =
    displayName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "SM";

  const [classForm, setClassForm] = useState<ClassCreateFormData>(EMPTY_CLASS_FORM);
  const [semesters, setSemesters] = useState<FacultySemesterOption[]>([]);
  const [isLoadingSemesters, setIsLoadingSemesters] = useState(true);
  const [isCreatingClass, setIsCreatingClass] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // NOTE: Page-level data loading keeps the class form view presentation-only and backend-ready.
    setIsLoadingSemesters(true);
    setError(null);
    listFacultySemesters()
      .then(setSemesters)
      .catch((loadError) => setError(getApiErrorMessage(loadError, "Unable to load semesters. Please try again.")))
      .finally(() => setIsLoadingSemesters(false));
  }, []);

  const handleSubmit = async () => {
    if (!classForm.name.trim() || !classForm.courseCode.trim() || !classForm.semesterId.trim()) {
      setError("Class name, course code, and semester are required.");
      return;
    }

    setIsCreatingClass(true);
    setError(null);
    try {
      // IMPORTANT: Create call persists the new class in DB through /api/v1/faculty/courses/create.
      await createFacultyCourse(classForm);
      navigate("/faculty/my-classes", { replace: true });
    } catch (createError) {
      setError(getApiErrorMessage(createError, "Unable to create class. Please verify the fields and try again."));
    } finally {
      setIsCreatingClass(false);
    }
  };

  const goToSettingsSection = (section: SettingsSection) => {
    navigate(`/settings?section=${section}`);
  };

  const handleLogout = () => {
    clearAuthenticated();
    navigate("/signin", { replace: true });
  };

  return (
    <AuthShell
      roleView="faculty"
      topBar={
        <AuthTopBar
          roleView="faculty"
          profile={{ name: displayName, email: displayEmail, initials: displayInitials }}
          searchPlaceholder="Search calendar, assignments..."
          onSettingsSectionSelect={goToSettingsSection}
          onLogout={handleLogout}
        />
      }
      mainContent={
        <FacultyCreateClassView
          classForm={classForm}
          semesters={semesters}
          isLoadingSemesters={isLoadingSemesters}
          isCreatingClass={isCreatingClass}
          error={error}
          onFormChange={setClassForm}
          onSubmit={handleSubmit}
        />
      }
    />
  );
}
