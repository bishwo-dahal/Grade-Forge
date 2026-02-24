import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CalendarDays, Clock3, Upload } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router";
import { clearAuthenticated, getAuthenticatedUser } from "../auth";
import {
  createFacultyAssignmentDraft,
  getFacultyAssignmentCreatePageData,
} from "../../services/assignmentService";
import type {
  AssignmentCreateFormData,
  AssignmentCreateTestCase,
  FacultyAssignmentCreatePageData,
} from "../../types/assignment";
import { AuthShell } from "./layout/AuthShell";
import { AuthTopBar } from "./layout/AuthTopBar";
import type { SettingsSection } from "./layout/AuthTopBar";

interface FacultyCreateAssignmentViewProps {
  // NOTE: This component is presentation-only. Data and handlers are injected by the page/container.
  classId: string;
  pageData: FacultyAssignmentCreatePageData | null;
  form: AssignmentCreateFormData | null;
  isLoading: boolean;
  isSaving: boolean;
  errorMessage: string | null;
  successMessage: string | null;
  onFieldChange: <K extends keyof AssignmentCreateFormData>(field: K, value: AssignmentCreateFormData[K]) => void;
  onPublicCaseChange: (testCaseId: string, patch: Partial<AssignmentCreateTestCase>) => void;
  onPrivateCaseChange: (testCaseId: string, patch: Partial<AssignmentCreateTestCase>) => void;
  onAddPublicCase: () => void;
  onAddPrivateCase: () => void;
  onStarterFileSelect: (fileName: string | null) => void;
  onSubmit: () => void;
}

function FacultyCreateAssignmentView({
  classId,
  pageData,
  form,
  isLoading,
  isSaving,
  errorMessage,
  successMessage,
  onFieldChange,
  onPublicCaseChange,
  onPrivateCaseChange,
  onAddPublicCase,
  onAddPrivateCase,
  onStarterFileSelect,
  onSubmit,
}: FacultyCreateAssignmentViewProps) {
  const courseCode = pageData?.header.courseCode ?? "CS 2400";
  const courseName = pageData?.header.courseName ?? "Class";

  return (
    <main className="flex-1 overflow-y-auto bg-[#F5F2F2] px-8 py-7">
      <div className="mx-auto w-full max-w-[1160px]">
        <div className="mb-5">
          <Link
            to={`/faculty/class/${classId}`}
            className="inline-flex items-center gap-2 text-[13px] text-[#5D6A80] transition-colors hover:text-[#2B2A2A]"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2} />
            Back to Class
          </Link>
        </div>

        <div className="mb-5 text-[15px] text-[#6D7B91]">
          <Link to="/faculty/my-classes" className="hover:text-[#2B2A2A]">
            My Classes
          </Link>
          <span className="mx-2 text-[#9CA6B6]">/</span>
          <Link to={`/faculty/class/${classId}`} className="hover:text-[#2B2A2A]">
            {courseCode}
          </Link>
          <span className="mx-2 text-[#9CA6B6]">/</span>
          <span className="font-medium text-[#2B2A2A]">Create Assignment</span>
        </div>

        <h1 className="text-[34px] font-semibold leading-tight text-[#1F2430]">Create New Assignment</h1>
        <p className="mt-3 text-[15px] text-[#5D6A80]">Create a new coding assignment with automated grading.</p>
        <p className="mt-2 text-[14px] text-[#7C879A]">{courseCode} - {courseName}</p>

        {errorMessage ? (
          <p className="mt-5 rounded-xl border border-[#F3CDD1] bg-[#FDEBEC] px-3 py-2 text-[13px] text-[#C23A42]">{errorMessage}</p>
        ) : null}
        {successMessage ? (
          <p className="mt-5 rounded-xl border border-[#CFE8D5] bg-[#EEF9F1] px-3 py-2 text-[13px] text-[#1C7A41]">{successMessage}</p>
        ) : null}

        <section className="mt-10 rounded-3xl border border-gray-200 bg-white p-6">
          <h2 className="text-[24px] font-semibold text-[#1F2430]">Basic Information</h2>

          {isLoading || !form || !pageData ? (
            <p className="mt-5 text-[14px] text-[#6D7B91]">Loading assignment form...</p>
          ) : (
            <>
              <div className="mt-6">
                <label htmlFor="assignment-title" className="mb-2 block text-[14px] font-medium text-[#1F2430]">
                  Assignment Title <span className="text-[#D84E57]">*</span>
                </label>
                <input
                  id="assignment-title"
                  value={form.title}
                  onChange={(event) => onFieldChange("title", event.target.value)}
                  placeholder="e.g., Binary Search Tree Implementation"
                  className="h-14 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-[14px] text-[#1F2430] placeholder:text-[#9CA6B6] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]"
                />
              </div>

              <div className="mt-5">
                <label htmlFor="assignment-description" className="mb-2 block text-[14px] font-medium text-[#1F2430]">
                  Description <span className="text-[#D84E57]">*</span>
                </label>
                <textarea
                  id="assignment-description"
                  value={form.description}
                  onChange={(event) => onFieldChange("description", event.target.value)}
                  rows={6}
                  placeholder="Describe the assignment requirements, learning objectives, and any special instructions..."
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-[14px] text-[#1F2430] placeholder:text-[#9CA6B6] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]"
                />
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div>
                  <label className="mb-2 block text-[14px] font-medium text-[#1F2430]">
                    Due Date & Time <span className="text-[#D84E57]">*</span>
                  </label>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="relative">
                      <CalendarDays className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6D7B91]" strokeWidth={2} />
                      <input
                        type="date"
                        value={form.dueDate}
                        onChange={(event) => onFieldChange("dueDate", event.target.value)}
                        className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 pr-10 text-[14px] text-[#1F2430] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]"
                      />
                    </div>
                    <div className="relative">
                      <Clock3 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6D7B91]" strokeWidth={2} />
                      <input
                        type="time"
                        value={form.dueTime}
                        onChange={(event) => onFieldChange("dueTime", event.target.value)}
                        className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 pr-10 text-[14px] text-[#1F2430] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="assignment-language" className="mb-2 block text-[14px] font-medium text-[#1F2430]">
                    Programming Language <span className="text-[#D84E57]">*</span>
                  </label>
                  <select
                    id="assignment-language"
                    value={form.languageId}
                    onChange={(event) => onFieldChange("languageId", event.target.value)}
                    className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-[14px] text-[#1F2430] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]"
                  >
                    <option value="">Select language</option>
                    {pageData.languageOptions.map((language) => (
                      <option key={language.id} value={language.id}>
                        {language.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div>
                  <label htmlFor="assignment-total-points" className="mb-2 block text-[14px] font-medium text-[#1F2430]">
                    Total Points
                  </label>
                  <input
                    id="assignment-total-points"
                    type="number"
                    min={1}
                    value={form.totalPoints}
                    onChange={(event) => onFieldChange("totalPoints", Number(event.target.value))}
                    className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-[14px] text-[#1F2430] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]"
                  />
                </div>
                <div>
                  <label htmlFor="assignment-rubric" className="mb-2 block text-[14px] font-medium text-[#1F2430]">
                    Grading Rubric
                  </label>
                  <select
                    id="assignment-rubric"
                    value={form.rubricId}
                    onChange={(event) => onFieldChange("rubricId", event.target.value)}
                    className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-[14px] text-[#1F2430] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]"
                  >
                    <option value="">Select rubric (optional)</option>
                    {pageData.rubricOptions.map((rubric) => (
                      <option key={rubric.id} value={rubric.id}>
                        {rubric.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-8">
                <h3 className="text-[24px] font-semibold text-[#1F2430]">Starter Code</h3>
                <p className="mt-1 text-[14px] text-[#5D6A80]">Upload a starter code file that students will begin with.</p>
                <div className="mt-3 rounded-2xl border border-dashed border-[#C9D0DE] bg-[#FCFCFD] px-4 py-10 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#EEF1F7]">
                    <Upload className="h-5 w-5 text-[#66738A]" strokeWidth={2} />
                  </div>
                  <p className="text-[14px] text-[#2B2A2A]">Drag and drop your file here</p>
                  <p className="mt-1 text-[13px] text-[#7A8599]">or</p>
                  <label className="mt-3 inline-flex cursor-pointer items-center rounded-xl border border-gray-300 bg-white px-4 py-2 text-[13px] font-medium text-[#2B2A2A] hover:bg-gray-50">
                    Browse Files
                    <input
                      type="file"
                      className="hidden"
                      onChange={(event) => onStarterFileSelect(event.target.files?.[0]?.name ?? null)}
                    />
                  </label>
                  <p className="mt-2 text-[14px] text-[#6D7B91]">
                    {form.starterFileName ? `Selected: ${form.starterFileName}` : "No file selected"}
                  </p>
                </div>
              </div>

              <div className="mt-8">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-[24px] font-semibold text-[#1F2430]">Public Test Cases</h3>
                    <p className="mt-1 text-[14px] text-[#5D6A80]">
                      Test cases that students can see and run while developing their solution.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onAddPublicCase}
                    className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-[14px] font-medium text-[#2B2A2A] transition-colors hover:bg-gray-50"
                  >
                    + Add Test Case
                  </button>
                </div>

                <div className="space-y-3">
                  {form.publicTestCases.map((testCase, index) => (
                    <div key={testCase.id} className="rounded-2xl border border-gray-200 bg-[#FCFCFD] p-4">
                      <p className="text-[18px] font-semibold text-[#1F2430]">Test Case {index + 1}</p>
                      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-[13px] text-[#1F2430]">Input</label>
                          <textarea
                            value={testCase.input}
                            onChange={(event) => onPublicCaseChange(testCase.id, { input: event.target.value })}
                            rows={3}
                            placeholder="Enter test input..."
                            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-[14px] text-[#1F2430] placeholder:text-[#9CA6B6] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-[13px] text-[#1F2430]">Expected Output</label>
                          <textarea
                            value={testCase.expectedOutput}
                            onChange={(event) => onPublicCaseChange(testCase.id, { expectedOutput: event.target.value })}
                            rows={3}
                            placeholder="Enter expected output..."
                            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-[14px] text-[#1F2430] placeholder:text-[#9CA6B6] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-[24px] font-semibold text-[#1F2430]">Private Test Cases</h3>
                    <p className="mt-1 text-[14px] text-[#5D6A80]">Hidden test cases used for final grading that students cannot see.</p>
                  </div>
                  <button
                    type="button"
                    onClick={onAddPrivateCase}
                    className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-[14px] font-medium text-[#2B2A2A] transition-colors hover:bg-gray-50"
                  >
                    + Add Test Case
                  </button>
                </div>

                <div className="space-y-3">
                  {form.privateTestCases.map((testCase, index) => (
                    <div key={testCase.id} className="rounded-2xl border border-gray-200 bg-[#FCFCFD] p-4">
                      <div className="mb-2 flex items-center gap-2">
                        <p className="text-[18px] font-semibold text-[#1F2430]">Test Case {index + 1}</p>
                        <span className="rounded-full bg-[#EEF1F7] px-2 py-0.5 text-[11px] text-[#5D6A80]">Hidden</span>
                      </div>
                      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-[13px] text-[#1F2430]">Input</label>
                          <textarea
                            value={testCase.input}
                            onChange={(event) => onPrivateCaseChange(testCase.id, { input: event.target.value })}
                            rows={3}
                            placeholder="Enter test input..."
                            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-[14px] text-[#1F2430] placeholder:text-[#9CA6B6] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-[13px] text-[#1F2430]">Expected Output</label>
                          <textarea
                            value={testCase.expectedOutput}
                            onChange={(event) => onPrivateCaseChange(testCase.id, { expectedOutput: event.target.value })}
                            rows={3}
                            placeholder="Enter expected output..."
                            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-[14px] text-[#1F2430] placeholder:text-[#9CA6B6] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-end gap-3 border-t border-gray-200 pt-5">
                <Link
                  to={`/faculty/class/${classId}`}
                  className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-[14px] font-medium text-[#2B2A2A] hover:bg-gray-50"
                >
                  Cancel
                </Link>
                <button
                  type="button"
                  onClick={onSubmit}
                  disabled={isSaving}
                  className="rounded-xl bg-[#2B2A2A] px-5 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-[#3a3939] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving ? "Creating..." : "Create Assignment"}
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

function createNextTestCase(isHidden: boolean, sectionKey: "public" | "private", currentLength: number): AssignmentCreateTestCase {
  return {
    // NOTE: Deterministic prefix keeps the UI key stable and easy to inspect during backend integration testing.
    id: `${sectionKey}-${currentLength + 1}-${Date.now()}`,
    input: "",
    expectedOutput: "",
    isHidden,
  };
}

export function FacultyCreateAssignmentPage() {
  const navigate = useNavigate();
  const { classId } = useParams();
  const resolvedClassId = classId ?? "1";
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

  const [pageData, setPageData] = useState<FacultyAssignmentCreatePageData | null>(null);
  const [form, setForm] = useState<AssignmentCreateFormData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setErrorMessage(null);
    // NOTE: Page-level data loading keeps the assignment form view presentation-only and backend-ready.
    getFacultyAssignmentCreatePageData(resolvedClassId)
      .then((data) => {
        setPageData(data);
        setForm(data.initialForm);
      })
      .catch(() => {
        setErrorMessage("Unable to load assignment form. Please try again.");
      })
      .finally(() => setIsLoading(false));
  }, [resolvedClassId]);

  const canSubmit = useMemo(() => {
    if (!form) {
      return false;
    }
    return (
      form.title.trim().length > 0 &&
      form.description.trim().length > 0 &&
      form.dueDate.trim().length > 0 &&
      form.dueTime.trim().length > 0 &&
      form.languageId.trim().length > 0 &&
      Number.isFinite(form.totalPoints) &&
      form.totalPoints > 0
    );
  }, [form]);

  const onFieldChange = <K extends keyof AssignmentCreateFormData>(field: K, value: AssignmentCreateFormData[K]) => {
    setForm((previous) => {
      if (!previous) {
        return previous;
      }
      return { ...previous, [field]: value };
    });
  };

  const onPublicCaseChange = (testCaseId: string, patch: Partial<AssignmentCreateTestCase>) => {
    setForm((previous) => {
      if (!previous) {
        return previous;
      }
      return {
        ...previous,
        publicTestCases: previous.publicTestCases.map((testCase) =>
          testCase.id === testCaseId ? { ...testCase, ...patch } : testCase,
        ),
      };
    });
  };

  const onPrivateCaseChange = (testCaseId: string, patch: Partial<AssignmentCreateTestCase>) => {
    setForm((previous) => {
      if (!previous) {
        return previous;
      }
      return {
        ...previous,
        privateTestCases: previous.privateTestCases.map((testCase) =>
          testCase.id === testCaseId ? { ...testCase, ...patch } : testCase,
        ),
      };
    });
  };

  const onAddPublicCase = () => {
    setForm((previous) => {
      if (!previous) {
        return previous;
      }
      return {
        ...previous,
        publicTestCases: [...previous.publicTestCases, createNextTestCase(false, "public", previous.publicTestCases.length)],
      };
    });
  };

  const onAddPrivateCase = () => {
    setForm((previous) => {
      if (!previous) {
        return previous;
      }
      return {
        ...previous,
        privateTestCases: [...previous.privateTestCases, createNextTestCase(true, "private", previous.privateTestCases.length)],
      };
    });
  };

  const onStarterFileSelect = (fileName: string | null) => {
    onFieldChange("starterFileName", fileName);
  };

  const handleSubmit = async () => {
    if (!form || !canSubmit) {
      setErrorMessage("Fill all required fields before creating the assignment.");
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      await createFacultyAssignmentDraft(resolvedClassId, form);
      setSuccessMessage("Assignment draft created in frontend mock mode.");
    } catch {
      setErrorMessage("Unable to create assignment right now. Please try again.");
    } finally {
      setIsSaving(false);
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
          searchPlaceholder="Search classes, assignments..."
          onSettingsSectionSelect={goToSettingsSection}
          onLogout={handleLogout}
        />
      }
      mainContent={
        <FacultyCreateAssignmentView
          classId={resolvedClassId}
          pageData={pageData}
          form={form}
          isLoading={isLoading}
          isSaving={isSaving}
          errorMessage={errorMessage}
          successMessage={successMessage}
          onFieldChange={onFieldChange}
          onPublicCaseChange={onPublicCaseChange}
          onPrivateCaseChange={onPrivateCaseChange}
          onAddPublicCase={onAddPublicCase}
          onAddPrivateCase={onAddPrivateCase}
          onStarterFileSelect={onStarterFileSelect}
          onSubmit={handleSubmit}
        />
      }
    />
  );
}
