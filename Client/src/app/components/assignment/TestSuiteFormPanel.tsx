import React, { useCallback, useMemo, useState } from "react";
import type { TestSuiteDetail, TestSuitePayload } from "../../../types/testSuite";
import { Plus, Trash2 } from "lucide-react";
import { getApiErrorMessage } from "../../../utils/apiErrorMessage";

interface TestSuiteFormPanelProps {
  assignmentId: string;
  existingSuite: TestSuiteDetail | null;
  onSaved: () => void;
  isSubmitting: boolean;
  errorMessage: string | null;
}

interface CaseRow {
  id: string;
  title: string;
  isPrivate: boolean;
  input: string;
  fileName: string;
  output: string;
}

export function TestSuiteFormPanel({
  assignmentId,
  existingSuite,
  onSaved,
  isSubmitting,
  errorMessage,
}: TestSuiteFormPanelProps) {
  const [title, setTitle] = useState(existingSuite?.title ?? "");
  const [description, setDescription] = useState(existingSuite?.description ?? "");
  const [cases, setCases] = useState<CaseRow[]>(() => {
    if (existingSuite?.testCases?.length) {
      return existingSuite.testCases.map((tc, i) => ({
        id: `tc-${tc.id ?? i}`,
        title: tc.title ?? "",
        isPrivate: Boolean(tc.isPrivate),
        input: tc.input ?? "",
        fileName: tc.fileName ?? "",
        output: tc.output ?? "",
      }));
    }
    return [{ id: "tc-1", title: "", isPrivate: false, input: "", fileName: "", output: "" }];
  });

  const addCase = useCallback(() => {
    setCases((prev) => [
      ...prev,
      {
        id: `tc-${Date.now()}`,
        title: "",
        isPrivate: false,
        input: "",
        fileName: "",
        output: "",
      },
    ]);
  }, []);

  const removeCase = useCallback((id: string) => {
    setCases((prev) => (prev.length <= 1 ? prev : prev.filter((c) => c.id !== id)));
  }, []);

  const updateCase = useCallback((id: string, field: keyof CaseRow, value: string | boolean) => {
    setCases((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  }, []);

  const payload: TestSuitePayload = useMemo(
    () => ({
      title: title.trim() || "Test Suite",
      description: description.trim(),
      testCases: cases.map((c) => ({
        title: c.title.trim() || "Untitled",
        isPrivate: c.isPrivate,
        input: c.input,
        fileName: c.fileName.trim() || null,
        output: c.output,
      })),
    }),
    [title, description, cases]
  );

  const canSave = useMemo(() => {
    if (!payload.title.trim()) return false;
    return payload.testCases.length > 0 && payload.testCases.every((tc) => tc.output !== undefined);
  }, [payload]);

  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold text-[#2B2A2A]">
        {existingSuite ? "Edit test suite" : "Create test suite"}
      </h2>
      <p className="mt-1 text-[13px] text-gray-600">
        Define test cases for this assignment. Mark as private to hide from students until grading.
      </p>

      {errorMessage && (
        <p className="mt-4 rounded-xl border border-[#F3CDD1] bg-[#FDEBEC] px-3 py-2 text-[13px] text-[#C23A42]">
          {errorMessage}
        </p>
      )}

      <div className="mt-6 space-y-6">
        <div>
          <label className="mb-2 block text-[14px] font-medium text-[#2B2A2A]">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Public tests"
            className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-[14px] text-[#2B2A2A] placeholder:text-gray-400 focus:border-[#5A7ACD] focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]/20"
          />
        </div>
        <div>
          <label className="mb-2 block text-[14px] font-medium text-[#2B2A2A]">Description (optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of this test suite"
            rows={2}
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-[14px] text-[#2B2A2A] placeholder:text-gray-400 focus:border-[#5A7ACD] focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]/20"
          />
        </div>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[15px] font-semibold text-[#2B2A2A]">Test cases</h3>
            <button
              type="button"
              onClick={addCase}
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-3 py-2 text-[13px] font-medium text-[#2B2A2A] hover:bg-gray-50"
            >
              <Plus className="w-4 h-4" strokeWidth={2} />
              Add case
            </button>
          </div>

          <div className="space-y-4">
            {cases.map((row, index) => (
              <div
                key={row.id}
                className="rounded-2xl border border-gray-200 bg-[#F9FAFB] p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[12px] font-medium text-gray-500">Test case {index + 1}</span>
                  {cases.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCase(row.id)}
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
                      onChange={(e) => updateCase(row.id, "title", e.target.value)}
                      placeholder="Case title"
                      className="flex-1 h-9 rounded-lg border border-gray-200 bg-white px-3 text-[13px] placeholder:text-gray-400 focus:border-[#5A7ACD] focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]/20"
                    />
                    <label className="flex items-center gap-2 text-[13px] text-gray-700">
                      <input
                        type="checkbox"
                        checked={row.isPrivate}
                        onChange={(e) => updateCase(row.id, "isPrivate", e.target.checked)}
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
                      onChange={(e) => updateCase(row.id, "input", e.target.value)}
                      placeholder="Type or paste input, or import from file below..."
                      rows={3}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 font-mono text-[13px] focus:border-[#5A7ACD] focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]/20"
                    />
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <input
                        type="file"
                        accept="*"
                        className="hidden"
                        id={`file-input-ts-${row.id}`}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = () => {
                            updateCase(row.id, "input", String(reader.result ?? ""));
                            updateCase(row.id, "fileName", file.name);
                          };
                          reader.readAsText(file);
                          e.target.value = "";
                        }}
                      />
                      <label
                        htmlFor={`file-input-ts-${row.id}`}
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
                              updateCase(row.id, "fileName", "");
                            } else {
                              updateCase(row.id, "fileName", "input.txt");
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
                            onChange={(e) => updateCase(row.id, "fileName", e.target.value)}
                            placeholder="e.g. input.txt"
                            className="h-8 w-40 rounded-lg border border-gray-200 bg-white px-2 font-mono text-[13px] focus:border-[#5A7ACD] focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]/20"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-[12px] font-medium text-gray-600">Expected output <span className="text-[#C23A42]">*</span></label>
                    <textarea
                      value={row.output}
                      onChange={(e) => updateCase(row.id, "output", e.target.value)}
                      placeholder="Expected stdout"
                      rows={2}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 font-mono text-[13px] focus:border-[#5A7ACD] focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]/20"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <TestSuiteFormActions
        assignmentId={assignmentId}
        payload={payload}
        existingSuite={existingSuite}
        canSave={canSave}
        isSubmitting={isSubmitting}
        onSaved={onSaved}
      />
    </div>
  );
}

interface TestSuiteFormActionsProps {
  assignmentId: string;
  payload: TestSuitePayload;
  existingSuite: TestSuiteDetail | null;
  canSave: boolean;
  isSubmitting: boolean;
  onSaved: () => void;
}

function TestSuiteFormActions({
  assignmentId,
  payload,
  existingSuite,
  canSave,
  isSubmitting,
  onSaved,
}: TestSuiteFormActionsProps) {
  const [localError, setLocalError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = useCallback(async () => {
    setLocalError(null);
    setSaving(true);
    try {
      const { createTestSuite, updateTestSuite } = await import("../../../services/testSuiteService");
      if (existingSuite) {
        await updateTestSuite(assignmentId, payload);
      } else {
        await createTestSuite(assignmentId, payload);
      }
      onSaved();
    } catch (err: unknown) {
      setLocalError(getApiErrorMessage(err, "Failed to save test suite."));
    } finally {
      setSaving(false);
    }
  }, [assignmentId, payload, existingSuite, onSaved]);

  return (
    <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-gray-200 pt-5">
      {localError && (
        <p className="w-full text-[13px] text-[#C23A42]">{localError}</p>
      )}
      <button
        type="button"
        onClick={handleSave}
        disabled={!canSave || isSubmitting || saving}
        className="rounded-xl bg-[#2B2A2A] px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-[#3a3939] disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {saving || isSubmitting ? "Saving..." : existingSuite ? "Save changes" : "Create test suite"}
      </button>
    </div>
  );
}
