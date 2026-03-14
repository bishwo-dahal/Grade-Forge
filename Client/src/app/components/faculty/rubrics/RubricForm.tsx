import React, { useCallback, useMemo, useState } from "react";
import { Copy, Trash2 } from "lucide-react";
import type { Rubric, RubricCreatePayload } from "../../../../types/rubric";

export interface RubricFormProps {
  mode: "create" | "edit";
  initialRubric?: Rubric | null;
  isSubmitting?: boolean;
  errorMessage?: string | null;
  onSubmit: (payload: RubricCreatePayload) => Promise<void> | void;
  onCancel: () => void;
}

interface SubCriterionRow {
  id: string;
  description: string;
  maxScore: string;
  weight: string;
}

interface CriterionRow {
  id: string;
  title: string;
  subCriteria: SubCriterionRow[];
}

function getAllSubCriteriaFlat(criteria: CriterionRow[]): { criterionIndex: number; subIndex: number }[] {
  const out: { criterionIndex: number; subIndex: number }[] = [];
  criteria.forEach((c, i) => c.subCriteria.forEach((_, j) => out.push({ criterionIndex: i, subIndex: j })));
  return out;
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
  const [autoAdjustWeights, setAutoAdjustWeights] = useState(true);
  const [criteria, setCriteria] = useState<CriterionRow[]>(() => {
    if (initialRubric?.criteria?.length) {
      return initialRubric.criteria.map((c, i) => ({
        id: String(c.id ?? `c-${i}-${Date.now()}`),
        title: c.title ?? "",
        subCriteria: (c.subCriteria ?? (c.maxScore != null ? [{ description: c.description ?? "", maxScore: c.maxScore, weight: c.weight ?? null }] : [])).map((s, j) => ({
          id: `s-${i}-${j}-${Date.now()}`,
          description: s.description ?? "",
          maxScore: String(s.maxScore ?? ""),
          weight: s.weight != null ? String(s.weight) : "",
        })),
      }));
    }
    return [
      {
        id: `criterion-1-${Date.now()}`,
        title: "",
        subCriteria: [{ id: `sub-1-${Date.now()}`, description: "", maxScore: "", weight: "" }],
      },
    ];
  });
  const [localError, setLocalError] = useState<string | null>(null);

  const allSubWeights = useMemo(() => {
    const list: { criterionIndex: number; subIndex: number; weight: number }[] = [];
    criteria.forEach((c, i) =>
      c.subCriteria.forEach((s, j) => {
        const w = Number(s.weight);
        list.push({ criterionIndex: i, subIndex: j, weight: Number.isFinite(w) && w >= 0 ? w : 0 });
      }),
    );
    return list;
  }, [criteria]);

  const totalWeight = useMemo(() => allSubWeights.reduce((sum, x) => sum + x.weight, 0), [allSubWeights]);

  const rebalanceWeightsToHundred = useCallback((rows: CriterionRow[]): CriterionRow[] => {
    const flat = getAllSubCriteriaFlat(rows);
    if (flat.length === 0) return rows;
    const weights = flat.map(({ criterionIndex, subIndex }) => {
      const w = Number(rows[criterionIndex].subCriteria[subIndex].weight);
      return Number.isFinite(w) && w >= 0 ? w : 0;
    });
    const sum = weights.reduce((a, b) => a + b, 0);
    const epsilon = 0.0001;
    const next = rows.map((c) => ({ ...c, subCriteria: c.subCriteria.map((s) => ({ ...s })) }));

    if (Math.abs(sum - 100) <= 0.01) return rows;

    if (sum > 100 + epsilon) {
      let excess = sum - 100;
      for (let i = flat.length - 1; i >= 0 && excess > epsilon; i--) {
        const { criterionIndex, subIndex } = flat[i];
        const cur = weights[i];
        if (cur <= 0) continue;
        const reduceBy = Math.min(cur, excess);
        weights[i] = cur - reduceBy;
        const rounded = Math.round(weights[i] * 100) / 100;
        next[criterionIndex].subCriteria[subIndex] = { ...next[criterionIndex].subCriteria[subIndex], weight: String(rounded) };
        excess -= reduceBy;
      }
    } else if (sum < 100 - epsilon) {
      const deficit = 100 - sum;
      const last = flat[flat.length - 1];
      if (last) {
        weights[flat.length - 1] = (weights[flat.length - 1] ?? 0) + deficit;
        const rounded = Math.round(weights[flat.length - 1] * 100) / 100;
        next[last.criterionIndex].subCriteria[last.subIndex] = {
          ...next[last.criterionIndex].subCriteria[last.subIndex],
          weight: String(rounded),
        };
      }
    }
    return next;
  }, []);

  const canSubmit = useMemo(() => {
    if (!name.trim()) return false;
    if (criteria.length === 0) return false;
    for (const c of criteria) {
      if (!c.title.trim()) return false;
      if (!c.subCriteria.length) return false;
      for (const s of c.subCriteria) {
        const maxScore = Number(s.maxScore);
        if (!Number.isFinite(maxScore) || maxScore <= 0) return false;
        const w = Number(s.weight);
        if (!Number.isFinite(w) || w < 0) return false;
      }
    }
    if (Math.abs(totalWeight - 100) > 0.01) return false;
    return true;
  }, [name, criteria, totalWeight]);

  const handleAddCriterion = () => {
    setCriteria((prev) => [
      ...prev,
      {
        id: `criterion-${prev.length + 1}-${Date.now()}`,
        title: "",
        subCriteria: [{ id: `sub-${Date.now()}`, description: "", maxScore: "", weight: "" }],
      },
    ]);
  };

  const handleRemoveCriterion = (criterionId: string) => {
    setCriteria((prev) => prev.filter((c) => c.id !== criterionId));
  };

  const handleAddSubCriterion = (criterionId: string) => {
    setCriteria((prev) =>
      prev.map((c) =>
        c.id === criterionId
          ? { ...c, subCriteria: [...c.subCriteria, { id: `sub-${Date.now()}`, description: "", maxScore: "", weight: "" }] }
          : c,
      ),
    );
  };

  const handleRemoveSubCriterion = (criterionId: string, subId: string) => {
    setCriteria((prev) =>
      prev.map((c) =>
        c.id === criterionId ? { ...c, subCriteria: c.subCriteria.filter((s) => s.id !== subId) } : c,
      ),
    );
  };

  const handleDuplicateCriterion = (criterionId: string) => {
    setCriteria((prev) => {
      const index = prev.findIndex((c) => c.id === criterionId);
      if (index === -1) return prev;
      const source = prev[index];
      const duplicate: CriterionRow = {
        id: `criterion-${Date.now()}-${index}`,
        title: source.title,
        subCriteria: source.subCriteria.map((s, j) => ({
          id: `sub-${Date.now()}-${index}-${j}`,
          description: s.description,
          maxScore: s.maxScore,
          weight: s.weight,
        })),
      };
      const next = [...prev];
      next.splice(index + 1, 0, duplicate);
      return autoAdjustWeights ? rebalanceWeightsToHundred(next) : next;
    });
  };

  const handleDuplicateSubCriterion = (criterionId: string, subId: string) => {
    setCriteria((prev) => {
      const next = prev.map((c) => {
        if (c.id !== criterionId) return c;
        const subIndex = c.subCriteria.findIndex((s) => s.id === subId);
        if (subIndex === -1) return c;
        const source = c.subCriteria[subIndex];
        const duplicate: SubCriterionRow = {
          id: `sub-${Date.now()}`,
          description: source.description,
          maxScore: source.maxScore,
          weight: source.weight,
        };
        const newSubCriteria = [...c.subCriteria];
        newSubCriteria.splice(subIndex + 1, 0, duplicate);
        return { ...c, subCriteria: newSubCriteria };
      });
      return autoAdjustWeights ? rebalanceWeightsToHundred(next) : next;
    });
  };

  const handleChangeCriterionTitle = (criterionId: string, value: string) => {
    setCriteria((prev) => prev.map((c) => (c.id === criterionId ? { ...c, title: value } : c)));
  };

  const handleChangeSubCriterion = (
    criterionId: string,
    subId: string,
    field: keyof SubCriterionRow,
    value: string,
  ) => {
    setCriteria((prev) => {
      const next = prev.map((c) => {
        if (c.id !== criterionId) return c;
        return {
          ...c,
          subCriteria: c.subCriteria.map((s) => (s.id === subId ? { ...s, [field]: value } : s)),
        };
      });
      if (field === "weight" && autoAdjustWeights) {
        const editedCriterionIndex = next.findIndex((c) => c.id === criterionId);
        if (editedCriterionIndex === -1) return next;
        const editedSubIndex = next[editedCriterionIndex].subCriteria.findIndex((s) => s.id === subId);
        if (editedSubIndex === -1) return next;
        const editedWeight = Number(value);
        if (!Number.isFinite(editedWeight) || editedWeight < 0) return next;
        if (editedWeight === 0) return next;
        return rebalanceWeightsToHundred(next);
      }
      return next;
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) {
      setLocalError("Please fill in the rubric name and ensure every criterion has at least one sub-criterion and weights sum to 100%.");
      return;
    }
    setLocalError(null);
    const payload: RubricCreatePayload = {
      name: name.trim(),
      description: description.trim() || undefined,
      facultyId: undefined,
      criteria: criteria.map((c) => ({
        title: c.title.trim(),
        subCriteria: c.subCriteria.map((s) => ({
          description: s.description.trim() || undefined,
          maxScore: Number(s.maxScore),
          weight: s.weight.trim() !== "" ? Number(s.weight) : undefined,
        })),
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
          Main rubric has a title and description. Add criteria (title only), then under each criterion add sub-criteria with description, max points, and weight. Weights must total 100%.
        </p>

        {errorMessage ? (
          <p className="mt-5 rounded-xl border border-[#F3CDD1] bg-[#FDEBEC] px-3 py-2 text-[13px] text-[#C23A42]">{errorMessage}</p>
        ) : null}
        {localError ? (
          <p className="mt-3 rounded-xl border border-[#F3CDD1] bg-[#FDEBEC] px-3 py-2 text-[13px] text-[#C23A42]">{localError}</p>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-8 rounded-3xl border border-gray-200 bg-white p-6">
          <div className="space-y-5">
            <div>
              <label htmlFor="rubric-name" className="mb-2 block text-[14px] font-medium text-[#1F2430]">
                Rubric Name <span className="text-[#D84E57]">*</span>
              </label>
              <input
                id="rubric-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Project Rubric"
                className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-[14px] text-[#1F2430] placeholder:text-[#9CA6B6] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]"
              />
            </div>

            <div>
              <label htmlFor="rubric-description" className="mb-2 block text-[14px] font-medium text-[#1F2430]">
                Description
              </label>
              <textarea
                id="rubric-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
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
              <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                <p className="text-[12px] text-[#7C879A]">
                  Each criterion has a title only. Under it add sub-criteria with description, max points, and weight. Total weight must be 100%.
                </p>
                <label className="inline-flex items-center gap-2 text-[12px] font-medium text-[#1F2430]">
                  <input
                    type="checkbox"
                    checked={autoAdjustWeights}
                    onChange={(e) => {
                      const nextValue = e.target.checked;
                      setAutoAdjustWeights(nextValue);
                      if (nextValue) setCriteria((prev) => rebalanceWeightsToHundred(prev));
                    }}
                    className="h-4 w-4 accent-[#5A7ACD]"
                  />
                  Auto-adjust weights
                </label>
              </div>

              <div className="space-y-6">
                {criteria.map((criterion, cIndex) => (
                  <div key={criterion.id} className="rounded-2xl border border-gray-200 bg-[#F9FAFB] overflow-hidden">
                    <div className="flex items-center justify-between gap-3 border-b border-gray-200 bg-[#E4E7EC] px-4 py-3">
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <label className="shrink-0 text-[12px] font-semibold text-[#1F2430]">Criterion {cIndex + 1}</label>
                        <input
                          value={criterion.title}
                          onChange={(e) => handleChangeCriterionTitle(criterion.id, e.target.value)}
                          placeholder="e.g., Correctness"
                          className="h-9 min-w-[200px] flex-1 rounded-xl border border-gray-200 bg-white px-3 text-[13px] text-[#1F2430] placeholder:text-[#9CA6B6] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]"
                        />
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleDuplicateCriterion(criterion.id)}
                          title="Duplicate criterion"
                          className="rounded-lg border border-gray-300 bg-white p-1.5 text-[#5D6A80] hover:bg-gray-50 hover:text-[#1F2430]"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddSubCriterion(criterion.id)}
                          className="rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-[12px] font-medium text-[#2B2A2A] hover:bg-gray-50"
                        >
                          Add sub-criterion
                        </button>
                        {criteria.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveCriterion(criterion.id)}
                            title="Remove criterion"
                            className="rounded-lg border border-gray-300 bg-white p-1.5 text-[#C23A42] hover:bg-[#FDEBEC]"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="min-w-full border-separate border-spacing-0 text-left">
                        <thead className="bg-[#E4E7EC] text-[12px] font-semibold text-[#1F2430]">
                          <tr>
                            <th className="px-4 py-2 align-middle">Description</th>
                            <th className="w-[110px] px-4 py-2 align-middle">Max Points *</th>
                            <th className="w-[100px] px-4 py-2 align-middle">Weight (%)</th>
                            <th className="w-[72px] px-2 py-2 align-middle text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="text-[13px] text-[#1F2430]">
                          {criterion.subCriteria.map((sub) => (
                            <tr key={sub.id} className="border-t border-gray-200 bg-white">
                              <td className="px-4 py-3 align-top">
                                <textarea
                                  value={sub.description}
                                  onChange={(e) => handleChangeSubCriterion(criterion.id, sub.id, "description", e.target.value)}
                                  rows={2}
                                  placeholder="Sub-criterion description"
                                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-[13px] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]"
                                />
                              </td>
                              <td className="w-[110px] px-4 py-3 align-top">
                                <input
                                  type="number"
                                  min={1}
                                  value={sub.maxScore}
                                  onChange={(e) => handleChangeSubCriterion(criterion.id, sub.id, "maxScore", e.target.value)}
                                  className="h-9 w-full rounded-xl border border-gray-200 bg-white px-3 text-[13px] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]"
                                />
                              </td>
                              <td className="w-[100px] px-4 py-3 align-top">
                                <input
                                  type="number"
                                  min={0}
                                  max={100}
                                  step="any"
                                  value={sub.weight}
                                  onChange={(e) => handleChangeSubCriterion(criterion.id, sub.id, "weight", e.target.value)}
                                  placeholder="0"
                                  className="h-9 w-full rounded-xl border border-gray-200 bg-white px-3 text-[13px] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]"
                                />
                              </td>
                              <td className="w-[72px] px-2 py-3 align-top">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleDuplicateSubCriterion(criterion.id, sub.id)}
                                    title="Duplicate sub-criterion"
                                    className="rounded-lg border border-gray-200 bg-white p-1.5 text-[#5D6A80] hover:bg-gray-50 hover:text-[#1F2430]"
                                  >
                                    <Copy className="h-4 w-4" />
                                  </button>
                                  {criterion.subCriteria.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveSubCriterion(criterion.id, sub.id)}
                                      title="Remove sub-criterion"
                                      className="rounded-lg border border-gray-200 bg-white p-1.5 text-[#C23A42] hover:bg-[#FDEBEC]"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[12px] text-[#7C879A]">Total weight: {totalWeight.toFixed(2)}% (must be 100%)</p>
            </section>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-end gap-3 border-t border-gray-200 pt-5">
            <button type="button" onClick={onCancel} className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-[14px] font-medium text-[#2B2A2A] hover:bg-gray-50">
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
