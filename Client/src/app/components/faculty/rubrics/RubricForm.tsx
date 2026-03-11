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
    return criteria.every((c) => {
      if (!c.title.trim()) return false;
      const maxScore = Number(c.maxScore);
      if (!Number.isFinite(maxScore) || maxScore <= 0) return false;
      if (c.weight.trim().length > 0) {
        const w = Number(c.weight);
        if (!Number.isFinite(w) || w < 0) return false;
      }
      return true;
    });
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
    setCriteria((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)),
    );
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
        weight: c.weight.trim().length > 0 ? Number(c.weight) : undefined,
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
              <p className="text-[12px] text-[#7C879A] mb-3">
                Each criterion should have a title and max points. Weight is optional and can be
                used to emphasize certain criteria.
              </p>

              <div className="space-y-3">
                {criteria.map((criterion, index) => (
                  <div
                    key={criterion.id}
                    className="rounded-2xl border border-gray-200 bg-[#F9FAFB] p-4"
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="text-[12px] font-medium text-[#6D7B91]">
                        Criterion {index + 1}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleDuplicateCriterion(criterion.id)}
                          className="text-[11px] text-[#5A7ACD] hover:underline"
                        >
                          Duplicate
                        </button>
                        {criteria.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveCriterion(criterion.id)}
                            className="text-[11px] text-[#C23A42] hover:underline"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="mb-1 block text-[13px] font-medium text-[#1F2430]">
                          Title <span className="text-[#D84E57]">*</span>
                        </label>
                        <input
                          value={criterion.title}
                          onChange={(event) =>
                            handleChangeCriterion(criterion.id, "title", event.target.value)
                          }
                          placeholder="e.g., Correctness"
                          className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-[13px] text-[#1F2430] placeholder:text-[#9CA6B6] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-[13px] font-medium text-[#1F2430]">
                          Description
                        </label>
                        <textarea
                          value={criterion.description}
                          onChange={(event) =>
                            handleChangeCriterion(criterion.id, "description", event.target.value)
                          }
                          rows={2}
                          placeholder="Optional: explain what you are looking for in this criterion."
                          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-[13px] text-[#1F2430] placeholder:text-[#9CA6B6] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]"
                        />
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-[13px] font-medium text-[#1F2430]">
                            Max Points <span className="text-[#D84E57]">*</span>
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              min={1}
                              value={criterion.maxScore}
                              onChange={(event) =>
                                handleChangeCriterion(criterion.id, "maxScore", event.target.value)
                              }
                              className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 pr-10 text-[13px] text-[#1F2430] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]"
                            />
                            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-[#7C879A]">
                              points
                            </span>
                          </div>
                        </div>

                        <div>
                          <label className="mb-1 block text-[13px] font-medium text-[#1F2430]">
                            Weight
                            <span className="ml-1 text-[11px] font-normal text-[#7C879A]">
                              (optional)
                            </span>
                          </label>
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            value={criterion.weight}
                            onChange={(event) =>
                              handleChangeCriterion(criterion.id, "weight", event.target.value)
                            }
                            placeholder="e.g., 1.0"
                            className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-[13px] text-[#1F2430] placeholder:text-[#9CA6B6] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
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

