import React, { useMemo, useState } from "react";
import type { Rubric, RubricCreatePayload } from "../../../../types/rubric";

export interface RubricFormProps {
  mode: "create" | "edit";
  initialRubric?: Rubric | null;
  isSubmitting?: boolean;
  errorMessage?: string | null;
  onSubmit: (payload: RubricCreatePayload) => Promise<void> | void;
  onCancel: () => void;
}

interface CriterionRow {
  id: string;
  title: string;
  description: string;
  maxScore: string;
  weight: string;
}

export function RubricForm({
  mode,
  initialRubric,
  isSubmitting = false,
  errorMessage,
  onSubmit,
  onCancel,
}: RubricFormProps) {
  const [name, setName] = useState(initialRubric?.name ?? "");
  const [description, setDescription] = useState(initialRubric?.description ?? "");
  const [criteria, setCriteria] = useState<CriterionRow[]>(() => {
    if (initialRubric && initialRubric.criteria.length > 0) {
      return initialRubric.criteria.map((c) => ({
        id: String(c.id ?? `${c.title}-${Math.random().toString(36).slice(2)}`),
        title: c.title,
        description: c.description ?? "",
        maxScore: String(c.maxScore),
        weight: c.weight != null ? String(c.weight) : "",
      }));
    }
    return [
      {
        id: "criterion-1",
        title: "",
        description: "",
        maxScore: "",
        weight: "",
      },
    ];
  });
  const [localError, setLocalError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    if (!name.trim()) return false;
    if (criteria.length === 0) return false;

    let totalWeight = 0;

    for (const c of criteria) {
      if (!c.title.trim()) return false;

      const maxScore = Number(c.maxScore);
      if (!Number.isFinite(maxScore) || maxScore <= 0) return false;

      const w = Number(c.weight);
      if (!Number.isFinite(w) || w < 0) return false;
      totalWeight += w;
    }

    // Require weights to sum to 100% (allowing tiny floating error)
    if (Math.abs(totalWeight - 100) > 0.01) return false;

    return true;
  }, [name, criteria]);

  const handleAddCriterion = () => {
    setCriteria((prev) => [
      ...prev,
      {
        id: `criterion-${prev.length + 1}-${Date.now()}`,
        title: "",
        description: "",
        maxScore: "",
        weight: "",
      },
    ]);
  };

  const handleRemoveCriterion = (id: string) => {
    setCriteria((prev) => prev.filter((c) => c.id !== id));
  };

  const handleDuplicateCriterion = (id: string) => {
    setCriteria((prev) => {
      const index = prev.findIndex((c) => c.id === id);
      if (index === -1) return prev;
      const original = prev[index];
      const copy: CriterionRow = {
        ...original,
        id: `criterion-${prev.length + 1}-${Date.now()}`,
      };
      const next = [...prev];
      next.splice(index + 1, 0, copy);
      return next;
    });
  };

  const handleChangeCriterion = (id: string, field: keyof CriterionRow, value: string) => {
    setCriteria((prev) => {
      const next = prev.map((c) => (c.id === id ? { ...c, [field]: value } : c));

      // Auto-adjust weights so the total stays 100% when editing weight
      if (field === "weight") {
        const index = next.findIndex((c) => c.id === id);
        if (index !== -1 && next.length > 1) {
          const numericWeights = next.map((c) => Number(c.weight) || 0);
          const editedWeight = numericWeights[index];

          // If edited weight is invalid, just keep raw string without auto-adjust
          if (Number.isFinite(editedWeight) && editedWeight >= 0) {
            const otherTotal = numericWeights.reduce(
              (sum, w, i) => (i === index ? sum : sum + w),
              0,
            );

            const remaining = 100 - editedWeight;
            const lastIndex = next.length - 1;

            if (remaining >= 0) {
              if (index !== lastIndex) {
                // Put all remaining weight on the last criterion
                next[lastIndex] = {
                  ...next[lastIndex],
                  weight: String(remaining),
                };
              } else if (next.length > 1) {
                // Edited the last one → adjust the previous one
                const adjustIndex = lastIndex - 1;
                next[adjustIndex] = {
                  ...next[adjustIndex],
                  weight: String(remaining),
                };
              }

              // If there were more than two criteria, keep others as-is;
              // user can fine-tune them and auto-adjust will always bump
              // one neighbor so the sum stays 100.
            }
          }
        }
      }

      return next;
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) {
      setLocalError("Please fill in the rubric name and ensure all criteria are valid.");
      return;
    }
    setLocalError(null);
    const payload: RubricCreatePayload = {
      name: name.trim(),
      description: description.trim() || undefined,
      criteria: criteria.map((c) => ({
        title: c.title.trim(),
        description: c.description.trim() || undefined,
        maxScore: Number(c.maxScore),
        weight: Number(c.weight),
      })),
    };
    await onSubmit(payload);
  };

  return (
    <main className="flex-1 overflow-y-auto bg-[#F5F2F2] px-8 py-7">
      <div className="mx-auto w-full max-w-[960px]">
        <h1 className="text-[28px] font-semibold leading-tight text-[#1F2430]">
          {mode === "create" ? "Create Rubric" : "Edit Rubric"}
        </h1>
        <p className="mt-2 text-[14px] text-[#5D6A80]">
          Define criteria and points to grade assignments consistently.
        </p>

        {errorMessage ? (
          <p className="mt-5 rounded-xl border border-[#F3CDD1] bg-[#FDEBEC] px-3 py-2 text-[13px] text-[#C23A42]">
            {errorMessage}
          </p>
        ) : null}
        {localError ? (
          <p className="mt-3 rounded-xl border border-[#F3CDD1] bg-[#FDEBEC] px-3 py-2 text-[13px] text-[#C23A42]">
            {localError}
          </p>
        ) : null}

        <form
          onSubmit={handleSubmit}
          className="mt-8 rounded-3xl border border-gray-200 bg-white p-6"
        >
          <div className="space-y-5">
            <div>
              <label
                htmlFor="rubric-name"
                className="mb-2 block text-[14px] font-medium text-[#1F2430]"
              >
                Rubric Name <span className="text-[#D84E57]">*</span>
              </label>
              <input
                id="rubric-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g., Project Rubric"
                className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-[14px] text-[#1F2430] placeholder:text-[#9CA6B6] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]"
              />
            </div>

            <div>
              <label
                htmlFor="rubric-description"
                className="mb-2 block text-[14px] font-medium text-[#1F2430]"
              >
                Description
              </label>
              <textarea
                id="rubric-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={3}
                placeholder="Optional: describe how this rubric should be used."
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-[14px] text-[#1F2430] placeholder:text-[#9CA6B6] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]"
              />
            </div>

            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-[16px] font-semibold text-[#1F2430]">Criteria</h2>
                <button
                  type="button"
                  onClick={handleAddCriterion}
                  className="inline-flex h-9 items-center justify-center rounded-xl border border-gray-300 bg-white px-3 text-[12px] font-medium text-[#2B2A2A] hover:bg-gray-50"
                >
                  Add Criterion
                </button>
              </div>
              <p className="mb-3 text-[12px] text-[#7C879A]">
                Each row represents a rubric criterion. Provide a title, description, max points,
                and a weight so that all weights sum to 100%.
              </p>

              <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-[#F9FAFB]">
                <table className="min-w-full border-separate border-spacing-0 text-left">
                  <thead className="bg-[#E4E7EC] text-[12px] font-semibold text-[#1F2430]">
                    <tr>
                      <th className="px-4 py-2 align-middle">Criterion</th>
                      <th className="px-4 py-2 align-middle">Description</th>
                      <th className="w-[110px] px-4 py-2 align-middle">
                        Max Points <span className="text-[#D84E57]">*</span>
                      </th>
                      <th className="w-[100px] px-4 py-2 align-middle">Weight (%)</th>
                      <th className="w-[90px] px-3 py-2 align-middle text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-[13px] text-[#1F2430]">
                    {criteria.map((criterion, index) => (
                      <tr
                        key={criterion.id}
                        className="border-t border-gray-200 bg-white last:rounded-b-2xl [&:last-child>td:first-child]:rounded-bl-2xl [&:last-child>td:last-child]:rounded-br-2xl"
                      >
                        <td className="px-4 py-3 align-top">
                          <div className="mb-1 text-[11px] font-medium text-[#6D7B91]">
                            Criterion {index + 1}
                          </div>
                          <input
                            value={criterion.title}
                            onChange={(event) =>
                              handleChangeCriterion(criterion.id, "title", event.target.value)
                            }
                            placeholder="e.g., Correctness"
                            className="h-9 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-[13px] text-[#1F2430] placeholder:text-[#9CA6B6] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]"
                          />
                        </td>
                        <td className="px-4 py-3 align-top">
                          <textarea
                            value={criterion.description}
                            onChange={(event) =>
                              handleChangeCriterion(
                                criterion.id,
                                "description",
                                event.target.value,
                              )
                            }
                            rows={2}
                            placeholder="Optional: explain what you are looking for in this criterion."
                            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-[13px] text-[#1F2430] placeholder:text-[#9CA6B6] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]"
                          />
                        </td>
                        <td className="w-[40px] px-4 py-3 align-top">
                          <input
                            type="number"
                            min={1}
                            value={criterion.maxScore}
                            onChange={(event) =>
                              handleChangeCriterion(
                                criterion.id,
                                "maxScore",
                                event.target.value,
                              )
                            }
                            className="h-9 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-[13px] text-[#1F2430] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]"
                          />
                        </td>
                        <td className="w-[100px] px-4 py-3 align-top">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            step="0.1"
                            value={criterion.weight}
                            onChange={(event) =>
                              handleChangeCriterion(
                                criterion.id,
                                "weight",
                                event.target.value,
                              )
                            }
                            placeholder="e.g., 1.0"
                            className="h-9 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-[13px] text-[#1F2430] placeholder:text-[#9CA6B6] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]"
                          />
                        </td>
                        <td className="w-[90px] px-3 py-3 align-top">
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleDuplicateCriterion(criterion.id)}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-transparent text-[#5A7ACD] hover:border-[#CBD2E0] hover:bg-[#EEF2FF]"
                              aria-label="Duplicate criterion"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="h-4 w-4"
                              >
                                <rect x="9" y="9" width="10" height="10" rx="2" />
                                <path d="M6 15H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1" />
                              </svg>
                            </button>
                            {criteria.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveCriterion(criterion.id)}
                                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-transparent text-[#C23A42] hover:border-[#F3CDD1] hover:bg-[#FDEBEC]"
                                aria-label="Remove criterion"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="1.8"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="h-4 w-4"
                                >
                                  <path d="M5 7h14" />
                                  <path d="M10 11v6" />
                                  <path d="M14 11v6" />
                                  <path d="M9 7l1-2h4l1 2" />
                                  <path d="M7 7v11a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V7" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-end gap-3 border-t border-gray-200 pt-5">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-[14px] font-medium text-[#2B2A2A] hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !canSubmit}
              className="rounded-xl bg-[#2B2A2A] px-5 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-[#3a3939] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (mode === "create" ? "Creating..." : "Saving...") : mode === "create" ? "Create Rubric" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

