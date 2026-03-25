import { useEffect, useMemo, useState } from "react";
import { Plus, ListChecks, Trash2 } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router";
import { clearAuthenticated, getAuthenticatedUser } from "../auth";
import {
  createFacultyAssignmentDraft,
  getFacultyAssignmentEditPageData,
  getFacultyAssignmentCreatePageData,
  updateFacultyAssignmentDraft,
} from "../../services/assignmentService";
import { getRubric, getUnweightedRubricTotalPoints } from "../../services/rubricService";
import { createTestSuite } from "../../services/testSuiteService";
import type {
  AssignmentCreateFormData,
  AssignmentExistingStarterFile,
  FacultyAssignmentCreatePageData,
} from "../../types/assignment";
import type { TestSuitePayload } from "../../types/testSuite";
import { AuthShell } from "./layout/AuthShell";
import { AuthTopBar } from "./layout/AuthTopBar";
import type { SettingsSection } from "./layout/AuthTopBar";
import { getApiErrorMessage } from "../../utils/apiErrorMessage";

interface FacultyCreateAssignmentViewProps {
  // NOTE: This component is presentation-only. Data and handlers are injected by the page/container.
  classId: string;
  pageData: FacultyAssignmentCreatePageData | null;
  /** Edit mode: server-side starter files still kept; user can remove or download. */
  retainedStarterFiles: AssignmentExistingStarterFile[];
  onRemoveRetainedStarter: (id: number) => void;
  form: AssignmentCreateFormData | null;
  testSuiteDraft: TestSuiteDraftState | null;
  isLoading: boolean;
  isSaving: boolean;
  errorMessage: string | null;
  showSuccessModal: boolean;
  testCasesAdded?: boolean;
  onFieldChange: <K extends keyof AssignmentCreateFormData>(field: K, value: AssignmentCreateFormData[K]) => void;
  onRubricChange: (rubricId: string) => void;
  totalPointsLockedByRubric: boolean;
  onTestSuiteTitleChange: (title: string) => void;
  onTestSuiteDescriptionChange: (description: string) => void;
  onTestCaseAdd: () => void;
  onTestCaseRemove: (id: string) => void;
  onTestCaseChange: (id: string, field: keyof TestCaseRow, value: string | boolean) => void;
  onCreateRubric: () => void;
  onCloseSuccessModal: () => void;
  onGoBackToClass: () => void;
  onSubmit: () => void;
  mode: "create" | "edit";
}

interface TestCaseRow {
  id: string;
  title: string;
  isPrivate: boolean;
  input: string;
  fileName: string;
  output: string;
}

interface TestSuiteDraftState {
  title: string;
  description: string;
  testCases: TestCaseRow[];
}

function FacultyCreateAssignmentView({
  classId,
  pageData,
  retainedStarterFiles,
  onRemoveRetainedStarter,
  form,
  testSuiteDraft,
  isLoading,
  isSaving,
  errorMessage,
  showSuccessModal,
  onFieldChange,
  onRubricChange,
  totalPointsLockedByRubric,
  onTestSuiteTitleChange,
  onTestSuiteDescriptionChange,
  onTestCaseAdd,
  onTestCaseRemove,
  onTestCaseChange,
  onCreateRubric,
  onCloseSuccessModal,
  onGoBackToClass,
  onSubmit,
  testCasesAdded = false,
  mode,
}: FacultyCreateAssignmentViewProps) {
  const courseCode = pageData?.header.courseCode ?? "CS 2400";

  return (
    <main className="flex-1 overflow-y-auto bg-[#F5F2F2] px-8 py-7">
      <div className="mx-auto w-full max-w-[1160px]">
        <div className="mb-5 text-[15px] text-[#6D7B91]">
          <Link to="/faculty/my-classes" className="hover:text-[#2B2A2A]">
            My Classes
          </Link>
          <span className="mx-2 text-[#9CA6B6]">/</span>
          <Link to={`/faculty/class/${classId}`} className="hover:text-[#2B2A2A]">
            {courseCode}
          </Link>
          <span className="mx-2 text-[#9CA6B6]">/</span>
          <span className="font-medium text-[#2B2A2A]">{mode === "edit" ? "Edit Assignment" : "Create Assignment"}</span>
        </div>

        <h1 className="text-[34px] font-semibold leading-tight text-[#1F2430]">
          {mode === "edit" ? "Edit Assignment" : "Create New Assignment"}
        </h1>

        {errorMessage ? (
          <p className="mt-5 rounded-xl border border-[#F3CDD1] bg-[#FDEBEC] px-3 py-2 text-[13px] text-[#C23A42]">
            {errorMessage}
          </p>
        ) : null}

        <section className="mt-10 rounded-3xl border border-gray-200 bg-white p-6">
          <h2 className="text-[24px] font-semibold text-[#1F2430]">Assignment Setup</h2>

          {isLoading || !form || !pageData ? (
            <div className="mt-5 space-y-4 animate-pulse">
              {/* NOTE: Skeleton form blocks keep assignment-create layout visible while page data loads. */}
              <div className="h-12 w-full rounded-xl bg-gray-100" />
              <div className="h-36 w-full rounded-xl bg-gray-100" />
              <div className="h-40 w-full rounded-xl bg-gray-100" />
              <div className="h-44 w-full rounded-xl bg-gray-100" />
            </div>
          ) : (
            <>
              {/* REFACTOR: Group related controls by task so the form is easier to scan and complete. */}
              <section className="mt-6 rounded-2xl border border-[#E5E9F2] bg-[#FAFBFD] p-5">
                <h3 className="text-[16px] font-semibold text-[#1F2430]">Basics</h3>
                <p className="mt-1 text-[12px] text-[#6D7B91]">Core assignment identity and language settings.</p>
                <div className="mt-4">
                  <label htmlFor="assignment-title" className="mb-2 block text-[14px] font-medium text-[#1F2430]">
                    Assignment Title <span className="text-[#D84E57]">*</span>
                  </label>
                  <input
                    id="assignment-title"
                    value={form.title}
                    onChange={(event) => onFieldChange("title", event.target.value)}
                    placeholder="e.g., Binary Search Tree Implementation"
                    className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-[14px] text-[#1F2430] placeholder:text-[#9CA6B6] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]"
                  />
                </div>
                <div className="mt-4">
                  <label htmlFor="assignment-description" className="mb-2 block text-[14px] font-medium text-[#1F2430]">
                    Description <span className="text-[#D84E57]">*</span>
                  </label>
                  <textarea
                    id="assignment-description"
                    value={form.description}
                    onChange={(event) => onFieldChange("description", event.target.value)}
                    rows={5}
                    placeholder="Describe the assignment requirements and expected outcomes..."
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-[14px] text-[#1F2430] placeholder:text-[#9CA6B6] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]"
                  />
                </div>
                <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <div>
                    <label htmlFor="assignment-language" className="mb-2 block text-[14px] font-medium text-[#1F2430]">
                      Programming Language <span className="text-[#D84E57]">*</span>
                    </label>
                    <select
                      id="assignment-language"
                      value={form.languageId}
                      onChange={(event) => onFieldChange("languageId", event.target.value)}
                      className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-[14px] text-[#1F2430] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]"
                    >
                      <option value="">Select language</option>
                      {pageData.languageOptions.map((language) => (
                        <option key={language.id} value={language.id}>
                          {language.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="assignment-submission-type" className="mb-2 block text-[14px] font-medium text-[#1F2430]">
                      Submission Type <span className="text-[#D84E57]">*</span>
                    </label>
                    <select
                      id="assignment-submission-type"
                      value={form.submissionType}
                      onChange={(event) => onFieldChange("submissionType", event.target.value as AssignmentCreateFormData["submissionType"])}
                      className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-[14px] text-[#1F2430] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]"
                    >
                      <option value="INDIVIDUAL">Individual</option>
                      <option value="GROUP">Group</option>
                    </select>

                    {form.submissionType === "GROUP" ? (
                      <div className="mt-4">
                        <label htmlFor="assignment-main-group" className="mb-2 block text-[14px] font-medium text-[#1F2430]">
                          Main Group <span className="text-[#D84E57]">*</span>
                        </label>
                        <select
                          id="assignment-main-group"
                          value={form.mainGroupId}
                          onChange={(event) => onFieldChange("mainGroupId", event.target.value)}
                          className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-[14px] text-[#1F2430] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]"
                        >
                          <option value="">Select main group</option>
                          {pageData.mainGroupOptions.map((group) => (
                            <option key={group.id} value={group.id}>
                              {group.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : null}
                  </div>
                </div>
              </section>

              <section className="mt-5 rounded-2xl border border-[#E5E9F2] bg-[#FAFBFD] p-5">
                <h3 className="text-[16px] font-semibold text-[#1F2430]">Schedule</h3>
                <p className="mt-1 text-[12px] text-[#6D7B91]">Set opening, due, and optional late window.</p>
                {/* REFACTOR: Keep all schedule date/time controls in one aligned row on desktop for faster scanning. */}
                <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
                  <div>
                    <label className="mb-2 block text-[14px] font-medium text-[#1F2430]">Available From</label>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <input
                        type="date"
                        value={form.availableFromDate}
                        onChange={(event) => onFieldChange("availableFromDate", event.target.value)}
                        className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-[14px] text-[#1F2430] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]"
                      />
                      <input
                        type="time"
                        value={form.availableFromTime}
                        onChange={(event) => onFieldChange("availableFromTime", event.target.value)}
                        className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-[14px] text-[#1F2430] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-[14px] font-medium text-[#1F2430]">
                      Due Date & Time <span className="text-[#D84E57]">*</span>
                    </label>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <input
                        type="date"
                        value={form.dueDate}
                        onChange={(event) => onFieldChange("dueDate", event.target.value)}
                        className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-[14px] text-[#1F2430] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]"
                      />
                      <input
                        type="time"
                        value={form.dueTime}
                        onChange={(event) => onFieldChange("dueTime", event.target.value)}
                        className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-[14px] text-[#1F2430] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-[14px] font-medium text-[#1F2430]">Late Due Date & Time</label>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <input
                        type="date"
                        value={form.lateDueDate}
                        onChange={(event) => onFieldChange("lateDueDate", event.target.value)}
                        className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-[14px] text-[#1F2430] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]"
                      />
                      <input
                        type="time"
                        value={form.lateDueTime}
                        onChange={(event) => onFieldChange("lateDueTime", event.target.value)}
                        className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-[14px] text-[#1F2430] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]"
                      />
                    </div>
                  </div>
                </div>
              </section>

              <section className="mt-5 rounded-2xl border border-[#E5E9F2] bg-[#FAFBFD] p-5">
                <h3 className="text-[16px] font-semibold text-[#1F2430]">Points, Rubric, and Resources</h3>
                <p className="mt-1 text-[12px] text-[#6D7B91]">Configure grading weight and optional supporting assets.</p>
                <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <div>
                    <div className="mb-2 flex min-h-[40px] items-center justify-between">
                      <label htmlFor="assignment-total-points" className="block text-[14px] font-medium text-[#1F2430]">
                        Total Points <span className="text-[#D84E57]">*</span>
                      </label>
                      {/* FIX: Keep this spacer so Total Points and Rubric controls align to the same vertical baseline. */}
                      <span className="h-9 w-[112px] opacity-0" aria-hidden="true" />
                    </div>
                    <input
                      id="assignment-total-points"
                      type="number"
                      min={1}
                      value={form.totalPoints}
                      onChange={(event) => onFieldChange("totalPoints", Number(event.target.value))}
                      disabled={totalPointsLockedByRubric}
                      className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-[14px] text-[#1F2430] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5A7ACD] disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-600"
                    />
                    {totalPointsLockedByRubric ? (
                      <p className="mt-1.5 text-[12px] text-[#6D7B91]">
                        From unweighted rubric; change rubric to edit points.
                      </p>
                    ) : null}
                  </div>

                  <div>
                    <div className="mb-2 flex min-h-[40px] items-center justify-between gap-2">
                      <label htmlFor="assignment-rubric" className="block text-[14px] font-medium text-[#1F2430]">
                        Rubric
                      </label>
                      <button
                        type="button"
                        onClick={onCreateRubric}
                        className="inline-flex items-center gap-1 rounded-lg border border-[#D8DFEC] bg-white px-2.5 py-1.5 text-[12px] font-medium text-[#30415F] hover:bg-[#F3F6FB]"
                      >
                        <Plus className="h-3.5 w-3.5" strokeWidth={2} />
                        Add Rubric
                      </button>
                    </div>
                    <select
                      id="assignment-rubric"
                      value={form.rubricId}
                      onChange={(event) => onRubricChange(event.target.value)}
                      className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-[14px] text-[#1F2430] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]"
                    >
                      <option value="">No rubric</option>
                      {pageData.rubricOptions.map((rubric) => (
                        <option key={rubric.id} value={rubric.id}>
                          {rubric.label}
                        </option>
                      ))}
                    </select>
                    {pageData.rubricOptions.length === 0 ? (
                      // NOTE: Explicit empty state guides faculty to create rubric first, then return to assign it.
                      <p className="mt-2 text-[12px] text-[#6D7B91]">
                        No rubric found yet. Use Add Rubric to create as many as you need.
                      </p>
                    ) : null}
                  </div>

                  <div className="lg:col-span-2">
                    <label htmlFor="assignment-starter-files" className="mb-2 block text-[14px] font-medium text-[#1F2430]">
                      Starter files
                    </label>
                    <p className="mb-2 text-[12px] text-[#6D7B91]">
                      Optional. Any file type is allowed (source, data, zip, images, etc.).{" "}
                      {mode === "edit"
                        ? "Remove files you no longer need, add new ones below, then save. Saving applies the full starter set."
                        : "Upload one or more files, or leave empty."}
                    </p>
                    {mode === "edit" && retainedStarterFiles.length > 0 ? (
                      <div className="mb-3">
                        <p className="mb-1.5 text-[12px] font-medium text-[#30415F]">Current starter files</p>
                        <ul className="space-y-1 rounded-xl border border-[#E5E9F2] bg-white px-3 py-2 text-[13px] text-[#30415F]">
                          {retainedStarterFiles.map((f) => (
                            <li key={f.id} className="flex items-center justify-between gap-2">
                              <span className="min-w-0 truncate">{f.fileName}</span>
                              <span className="flex shrink-0 items-center gap-2">
                                {f.downloadUrl ? (
                                  <a
                                    href={f.downloadUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[#5A7ACD] hover:underline"
                                  >
                                    Download
                                  </a>
                                ) : null}
                                <button
                                  type="button"
                                  onClick={() => onRemoveRetainedStarter(f.id)}
                                  className="text-[12px] text-[#C23A42] hover:underline"
                                >
                                  Remove
                                </button>
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {mode === "edit" ? (
                      <p className="mb-2 text-[12px] text-[#6D7B91]">Add new starter files</p>
                    ) : null}
                    <input
                      id="assignment-starter-files"
                      type="file"
                      multiple
                      accept="*/*"
                      className="block w-full text-[13px] text-[#30415F] file:mr-3 file:rounded-lg file:border file:border-[#D8DFEC] file:bg-white file:px-3 file:py-1.5 file:text-[13px] file:font-medium file:text-[#30415F] hover:file:bg-[#F3F6FB]"
                      onChange={(event) => {
                        const list = event.target.files ? Array.from(event.target.files) : [];
                        onFieldChange("starterFiles", [...form.starterFiles, ...list]);
                        event.target.value = "";
                      }}
                    />
                    {form.starterFiles.length > 0 ? (
                      <div className="mt-3">
                        {mode === "edit" ? (
                          <p className="mb-1.5 text-[12px] font-medium text-[#30415F]">New files to upload</p>
                        ) : null}
                        <ul className="space-y-1.5">
                          {form.starterFiles.map((file, index) => (
                            <li
                              key={`${file.name}-${index}-${file.size}`}
                              className="flex items-center justify-between gap-2 rounded-lg border border-[#E5E9F2] bg-white px-3 py-2 text-[13px]"
                            >
                              <span className="truncate text-[#1F2430]">{file.name}</span>
                              <button
                                type="button"
                                onClick={() =>
                                  onFieldChange(
                                    "starterFiles",
                                    form.starterFiles.filter((_, i) => i !== index),
                                  )
                                }
                                className="shrink-0 text-[12px] text-[#C23A42] hover:underline"
                              >
                                Remove
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                </div>
              </section>

              {/* Test cases (optional) */}
              {testSuiteDraft && (
                <section className="mt-5 rounded-2xl border border-[#E5E9F2] bg-[#FAFBFD] p-5">
                  <div className="flex items-center gap-2">
                    <ListChecks className="w-5 h-5 text-[#5A7ACD]" strokeWidth={2} />
                    <h3 className="text-[16px] font-semibold text-[#1F2430]">Test cases (optional)</h3>
                  </div>
                  <p className="mt-1 text-[12px] text-[#6D7B91]">
                    Add test cases now or later from the assignment page. Mark as private to hide from students until grading.
                  </p>
                  <div className="mt-4">
                    <label className="mb-2 block text-[13px] font-medium text-[#1F2430]">Suite title</label>
                    <input
                      value={testSuiteDraft.title}
                      onChange={(e) => onTestSuiteTitleChange(e.target.value)}
                      placeholder="e.g. Public tests"
                      className="h-10 w-full max-w-xs rounded-xl border border-gray-200 bg-white px-3 text-[14px] text-[#1F2430] placeholder:text-[#9CA6B6] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]"
                    />
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[13px] font-medium text-[#1F2430]">Test cases</span>
                      <button
                        type="button"
                        onClick={onTestCaseAdd}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#D8DFEC] bg-white px-2.5 py-1.5 text-[12px] font-medium text-[#30415F] hover:bg-[#F3F6FB]"
                      >
                        <Plus className="h-3.5 w-3.5" strokeWidth={2} />
                        Add case
                      </button>
                    </div>
                    <div className="space-y-4">
                      {testSuiteDraft.testCases.map((row, index) => (
                        <div key={row.id} className="rounded-xl border border-[#E5E9F2] bg-white p-4">
                          <div className="mb-3 flex items-center justify-between">
                            <span className="text-[12px] font-medium text-[#6D7B91]">Case {index + 1}</span>
                            {testSuiteDraft.testCases.length > 1 && (
                              <button
                                type="button"
                                onClick={() => onTestCaseRemove(row.id)}
                                className="text-[12px] text-[#C23A42] hover:underline flex items-center gap-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Remove
                              </button>
                            )}
                          </div>
                          <div className="space-y-3">
                            <div className="flex items-center gap-4">
                              <input
                                value={row.title}
                                onChange={(e) => onTestCaseChange(row.id, "title", e.target.value)}
                                placeholder="Case title"
                                className="flex-1 h-9 rounded-lg border border-gray-200 bg-white px-3 text-[13px] placeholder:text-gray-400 focus:border-[#5A7ACD] focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]/20"
                              />
                              <label className="flex items-center gap-2 text-[13px] text-gray-700 whitespace-nowrap">
                                <input
                                  type="checkbox"
                                  checked={row.isPrivate}
                                  onChange={(e) => onTestCaseChange(row.id, "isPrivate", e.target.checked)}
                                  className="rounded border-gray-300 text-[#5A7ACD] focus:ring-[#5A7ACD]"
                                />
                                Private
                              </label>
                            </div>
                            <div>
                              <label className="mb-1 block text-[12px] font-medium text-gray-600">Input</label>
                              <p className="mb-2 text-[11px] text-gray-500">Content passed to the program as stdin, or as a file if you check &quot;Use as file&quot; and enter a file name.</p>
                              <textarea
                                value={row.input}
                                onChange={(e) => onTestCaseChange(row.id, "input", e.target.value)}
                                placeholder="Type or paste input, or import from file below..."
                                rows={3}
                                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 font-mono text-[13px] focus:border-[#5A7ACD] focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]/20"
                              />
                              <div className="mt-2 flex flex-wrap items-center gap-3">
                                <input
                                  type="file"
                                  accept="*"
                                  className="hidden"
                                  id={`file-input-${row.id}`}
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    const reader = new FileReader();
                                    reader.onload = () => {
                                      onTestCaseChange(row.id, "input", String(reader.result ?? ""));
                                      onTestCaseChange(row.id, "fileName", file.name);
                                    };
                                    reader.readAsText(file);
                                    e.target.value = "";
                                  }}
                                />
                                <label
                                  htmlFor={`file-input-${row.id}`}
                                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-[12px] font-medium text-[#2B2A2A] hover:bg-gray-50"
                                >
                                  Import from file
                                </label>
                                <label className="flex items-center gap-2 text-[13px] text-gray-700">
                                  <input
                                    type="checkbox"
                                    checked={row.fileName.length > 0}
                                    onChange={(e) => {
                                      if (!e.target.checked) {
                                        onTestCaseChange(row.id, "fileName", "");
                                      } else {
                                        onTestCaseChange(row.id, "fileName", "input.txt");
                                      }
                                    }}
                                    className="rounded border-gray-300 text-[#5A7ACD] focus:ring-[#5A7ACD]"
                                  />
                                  Use as file
                                </label>
                                {row.fileName.length > 0 && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-[12px] text-gray-500">File name</span>
                                    <input
                                      value={row.fileName}
                                      onChange={(e) => onTestCaseChange(row.id, "fileName", e.target.value)}
                                      placeholder="e.g. input.txt"
                                      className="h-8 w-40 rounded-lg border border-gray-200 bg-white px-2 font-mono text-[13px] focus:border-[#5A7ACD] focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]/20"
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                            <div>
                              <label className="mb-1 block text-[12px] font-medium text-gray-600">Expected output</label>
                              <textarea
                                value={row.output}
                                onChange={(e) => onTestCaseChange(row.id, "output", e.target.value)}
                                placeholder="Expected stdout"
                                rows={2}
                                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 font-mono text-[13px] focus:border-[#5A7ACD] focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]/20"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              )}

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
                  {isSaving ? (mode === "edit" ? "Saving..." : "Creating...") : mode === "edit" ? "Save Changes" : "Create Assignment"}
                </button>
              </div>
            </>
          )}
        </section>

        {showSuccessModal ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-2xl border border-[#DDE4F0] bg-white p-6 shadow-2xl">
              <h3 className="text-[20px] font-semibold text-[#1F2430]">
                {mode === "edit" ? "Assignment Updated" : "Assignment Created"}
              </h3>
              {/* NOTE: Success confirmation is modal-based so faculty can clearly confirm completion before navigation. */}
              <p className="mt-2 text-[14px] text-[#5D6A80]">
                {mode === "edit" ? "Your assignment was updated successfully." : "Your assignment was created successfully."}
                {testCasesAdded ? " Test cases were added." : ""}
              </p>
              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onCloseSuccessModal}
                  className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-[14px] font-medium text-[#2B2A2A] hover:bg-gray-50"
                >
                  Stay Here
                </button>
                <button
                  type="button"
                  onClick={onGoBackToClass}
                  className="rounded-xl bg-[#2B2A2A] px-4 py-2 text-[14px] font-semibold text-white hover:bg-[#3a3939]"
                >
                  Go Back to Class
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}

function extractErrorMessage(error: unknown): string {
  return getApiErrorMessage(error, "Unable to create assignment right now. Please try again.");
}

export function FacultyCreateAssignmentPage() {
  const navigate = useNavigate();
  const { classId, assignmentId } = useParams();
  const resolvedClassId = classId ?? "1";
  const mode: "create" | "edit" = assignmentId ? "edit" : "create";
  const loggedInUser = getAuthenticatedUser();
  const displayName = loggedInUser?.name ?? "Dr. Sarah Miller";
  const displayEmail = loggedInUser?.email ?? "smiller@university.edu";
  const displayInitials = useMemo(() => {
    return (
      displayName
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("") || "SM"
    );
  }, [displayName]);

  const [pageData, setPageData] = useState<FacultyAssignmentCreatePageData | null>(null);
  const [form, setForm] = useState<AssignmentCreateFormData | null>(null);
  const [testSuiteDraft, setTestSuiteDraft] = useState<TestSuiteDraftState>({
    title: "Test Suite",
    description: "",
    testCases: [{ id: "tc-1", title: "", isPrivate: false, input: "", fileName: "", output: "" }],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [testCasesAdded, setTestCasesAdded] = useState(false);
  const [totalPointsLockedByRubric, setTotalPointsLockedByRubric] = useState(false);
  /** Snapshot of server starter files when edit page loaded (for dirty detection). */
  const [initialStarterSnapshot, setInitialStarterSnapshot] = useState<AssignmentExistingStarterFile[]>([]);
  /** Edit mode: starter files still included on save; user can remove before save. */
  const [retainedStarterFiles, setRetainedStarterFiles] = useState<AssignmentExistingStarterFile[]>([]);

  useEffect(() => {
    setIsLoading(true);
    setErrorMessage(null);
    // NOTE: Page-level data loading keeps this form view presentation-only and backend-ready.
    (mode === "edit" && assignmentId
      ? getFacultyAssignmentEditPageData(resolvedClassId, assignmentId)
      : getFacultyAssignmentCreatePageData(resolvedClassId))
      .then((data) => {
        setPageData(data);
        setForm(data.initialForm);
      })
      .catch((error) => {
        setErrorMessage(extractErrorMessage(error));
      })
      .finally(() => setIsLoading(false));
  }, [resolvedClassId, mode, assignmentId]);

  useEffect(() => {
    if (!pageData) {
      return;
    }
    if (mode === "edit") {
      const existing = pageData.existingStarterFiles ?? [];
      setInitialStarterSnapshot(existing);
      setRetainedStarterFiles(existing);
    } else {
      setInitialStarterSnapshot([]);
      setRetainedStarterFiles([]);
    }
  }, [pageData, mode, assignmentId]);

  const handleRemoveRetainedStarter = (id: number) => {
    setRetainedStarterFiles((previous) => previous.filter((f) => f.id !== id));
  };

  const canSubmit = useMemo(() => {
    if (!form) {
      return false;
    }
    const hasAvailableFromDateOnly = form.availableFromDate.trim().length > 0 && form.availableFromTime.trim().length === 0;
    const hasLateDueDateOnly = form.lateDueDate.trim().length > 0 && form.lateDueTime.trim().length === 0;
    if (hasAvailableFromDateOnly || hasLateDueDateOnly) {
      return false;
    }
    return (
      form.title.trim().length > 0 &&
      form.description.trim().length > 0 &&
      form.dueDate.trim().length > 0 &&
      form.dueTime.trim().length > 0 &&
      form.languageId.trim().length > 0 &&
      (form.submissionType === "INDIVIDUAL" ||
        (form.submissionType === "GROUP" && form.mainGroupId.trim().length > 0)) &&
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

  const onTestSuiteTitleChange = (title: string) => {
    setTestSuiteDraft((prev) => ({ ...prev, title }));
  };
  const onTestSuiteDescriptionChange = (description: string) => {
    setTestSuiteDraft((prev) => ({ ...prev, description }));
  };
  const onTestCaseAdd = () => {
    setTestSuiteDraft((prev) => ({
      ...prev,
      testCases: [
        ...prev.testCases,
        {
        id: `tc-${Date.now()}`,
        title: "",
        isPrivate: false,
        input: "",
        fileName: "",
        output: "",
      },
      ],
    }));
  };
  const onTestCaseRemove = (id: string) => {
    setTestSuiteDraft((prev) => ({
      ...prev,
      testCases: prev.testCases.length <= 1 ? prev.testCases : prev.testCases.filter((c) => c.id !== id),
    }));
  };
  const onTestCaseChange = (id: string, field: keyof TestCaseRow, value: string | boolean) => {
    setTestSuiteDraft((prev) => ({
      ...prev,
      testCases: prev.testCases.map((c) => (c.id === id ? { ...c, [field]: value } : c)),
    }));
  };

  const handleSubmit = async () => {
    if (!form || !canSubmit) {
      setErrorMessage("Fill all required fields before creating the assignment.");
      return;
    }
    if (form.availableFromDate.trim() && !form.availableFromTime.trim()) {
      // FIX: Backend expects complete LocalDateTime values, so date-only optional fields are blocked in UI.
      setErrorMessage("Choose a time for Available From.");
      return;
    }
    if (form.lateDueDate.trim() && !form.lateDueTime.trim()) {
      // FIX: Backend expects complete LocalDateTime values, so date-only optional fields are blocked in UI.
      setErrorMessage("Choose a time for Late Due Date.");
      return;
    }
    const dueAt = new Date(`${form.dueDate}T${form.dueTime}:00`);
    if (Number.isNaN(dueAt.getTime())) {
      setErrorMessage("Due date and time are invalid.");
      return;
    }
    if (form.availableFromDate.trim()) {
      const availableAt = new Date(`${form.availableFromDate}T${form.availableFromTime}:00`);
      if (Number.isNaN(availableAt.getTime())) {
        setErrorMessage("Available From date and time are invalid.");
        return;
      }
      if (availableAt.getTime() > dueAt.getTime()) {
        setErrorMessage("Available From must be before Due Date.");
        return;
      }
    }
    if (form.lateDueDate.trim()) {
      const lateDueAt = new Date(`${form.lateDueDate}T${form.lateDueTime}:00`);
      if (Number.isNaN(lateDueAt.getTime())) {
        setErrorMessage("Late Due Date and time are invalid.");
        return;
      }
      if (lateDueAt.getTime() < dueAt.getTime()) {
        setErrorMessage("Late Due Date must be after Due Date.");
        return;
      }
    }
    setIsSaving(true);
    setErrorMessage(null);
    try {
      const savedAssignmentId =
        mode === "edit" && assignmentId
          ? (
              await updateFacultyAssignmentDraft(assignmentId, resolvedClassId, form, {
                initialExisting: initialStarterSnapshot,
                retainedExisting: retainedStarterFiles,
              })
            ).assignmentId
          : (await createFacultyAssignmentDraft(resolvedClassId, form)).assignmentId;
      const hasTestCases = testSuiteDraft.testCases.some((c) => c.output.trim().length > 0);
      setTestCasesAdded(false);
      if (mode === "create" && hasTestCases) {
        const payload: TestSuitePayload = {
          title: testSuiteDraft.title.trim() || "Test Suite",
          description: testSuiteDraft.description.trim(),
          testCases: testSuiteDraft.testCases
            .filter((c) => c.output.trim().length > 0)
            .map((c) => ({
              title: c.title.trim() || "Untitled",
              isPrivate: c.isPrivate,
              input: c.input,
              fileName: c.fileName.trim() || null,
              output: c.output,
            })),
        };
        if (payload.testCases.length > 0) {
          await createTestSuite(savedAssignmentId, payload);
          setTestCasesAdded(true);
        }
      }
      setShowSuccessModal(true);
    } catch (error) {
      setErrorMessage(extractErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const goToSettingsSection = (section: SettingsSection) => {
    navigate(`/settings?section=${section}`);
  };

  const handleRubricChange = (rubricId: string) => {
    onFieldChange("rubricId", rubricId);
    if (!rubricId.trim()) {
      onFieldChange("totalPoints", 100);
      setTotalPointsLockedByRubric(false);
      return;
    }
    getRubric(rubricId)
      .then((rubric) => {
        const total = getUnweightedRubricTotalPoints(rubric);
        if (total != null) {
          onFieldChange("totalPoints", total);
          setTotalPointsLockedByRubric(true);
        } else {
          onFieldChange("totalPoints", 100);
          setTotalPointsLockedByRubric(false);
        }
      })
      .catch(() => {
        setTotalPointsLockedByRubric(false);
      });
  };

  const handleCreateRubric = () => {
    // NOTE: Create-rubric route lets faculty add multiple rubric templates, then return and select one.
    navigate("/faculty/rubrics/new");
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
  };

  const handleGoBackToClass = () => {
    navigate(`/faculty/class/${resolvedClassId}`);
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
          retainedStarterFiles={retainedStarterFiles}
          onRemoveRetainedStarter={handleRemoveRetainedStarter}
          form={form}
          testSuiteDraft={testSuiteDraft}
          isLoading={isLoading}
          isSaving={isSaving}
          errorMessage={errorMessage}
          showSuccessModal={showSuccessModal}
          testCasesAdded={testCasesAdded}
          onFieldChange={onFieldChange}
          onRubricChange={handleRubricChange}
          totalPointsLockedByRubric={totalPointsLockedByRubric}
          onTestSuiteTitleChange={onTestSuiteTitleChange}
          onTestSuiteDescriptionChange={onTestSuiteDescriptionChange}
          onTestCaseAdd={onTestCaseAdd}
          onTestCaseRemove={onTestCaseRemove}
          onTestCaseChange={onTestCaseChange}
          onCreateRubric={handleCreateRubric}
          onCloseSuccessModal={handleCloseSuccessModal}
          onGoBackToClass={handleGoBackToClass}
          onSubmit={handleSubmit}
          mode={mode}
        />
      }
    />
  );
}
