import React, { useState } from "react";
import { AlertCircle } from "lucide-react";

interface RubricTabProps {
  submission: any;
}

export function RubricTab({ submission }: RubricTabProps) {
  const [rubricItems, setRubricItems] = useState(submission.rubric);

  const handlePointsChange = (id: string, value: string) => {
    setRubricItems((prev: any[]) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, manualPoints: value === "" ? null : Number(value) }
          : item
      )
    );
  };

  const handleFeedbackChange = (id: string, value: string) => {
    setRubricItems((prev: any[]) =>
      prev.map((item) => (item.id === id ? { ...item, feedback: value } : item))
    );
  };

  const totalAutoPoints = rubricItems.reduce(
    (sum: number, item: any) => sum + item.autoPoints,
    0
  );
  
  const totalManualPoints = rubricItems.reduce(
    (sum: number, item: any) => sum + (item.manualPoints ?? item.autoPoints),
    0
  );

  const totalMaxPoints = rubricItems.reduce(
    (sum: number, item: any) => sum + item.maxPoints,
    0
  );

  const hasManualOverrides = rubricItems.some(
    (item: any) => item.manualPoints !== null
  );

  return (
    <div className="p-6">
      {/* Total Score Summary */}
      <div className="mb-6 bg-gradient-to-br from-[#5A7ACD]/5 to-[#FEB05D]/5 rounded-xl p-5 border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] text-gray-500 uppercase tracking-wide mb-1">
              Total Score
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#2B2A2A]">
                {totalManualPoints}
              </span>
              <span className="text-[12px] text-gray-600">/ {totalMaxPoints} pts</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-[#2B2A2A]">
              {Math.round((totalManualPoints / totalMaxPoints) * 100)}%
            </div>
          </div>
        </div>

        {hasManualOverrides && (
          <div className="mt-3 pt-3 border-t border-gray-200 flex items-center gap-2 text-[11px] text-[#FEB05D]">
            <AlertCircle className="w-3.5 h-3.5" strokeWidth={2} />
            <span className="font-medium">
              Contains manual overrides (Auto: {totalAutoPoints} pts)
            </span>
          </div>
        )}
      </div>

      {/* Rubric Items - table layout */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[14px] font-semibold text-[#1F2430]">Criteria</h2>
          {/* In grading view, criteria are fixed so Add Criterion is disabled/hidden for now */}
        </div>
        <p className="mb-3 text-[12px] text-[#7C879A]">
          Each row represents a rubric criterion. Faculty can enter points from 0 up to the max
          for each criterion; the total points update automatically.
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
                <th className="w-[140px] px-4 py-2 align-middle text-right">Total points</th>
              </tr>
            </thead>
            <tbody className="text-[13px] text-[#1F2430]">
              {rubricItems.map((item: any, index: number) => {
                const weight =
                  totalMaxPoints > 0 ? (item.maxPoints / totalMaxPoints) * 100 : 0;

                return (
                  <tr
                    key={item.id}
                    className={`border-t border-gray-200 bg-white ${
                      item.manualPoints !== null
                        ? "bg-[#FEB05D]/5"
                        : "bg-white"
                    }`}
                  >
                    <td className="px-4 py-3 align-top">
                      <div className="mb-1 text-[11px] font-medium text-[#6D7B91]">
                        Criterion {index + 1}
                      </div>
                      <div className="text-[13px] font-semibold text-[#2B2A2A]">
                        {item.category}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <p className="text-[12px] text-gray-700 whitespace-pre-line">
                        {item.description}
                      </p>
                    </td>
                    <td className="w-[110px] px-4 py-3 align-top">
                      <div className="text-[13px] font-semibold text-[#2B2A2A]">
                        {item.maxPoints}
                      </div>
                    </td>
                    <td className="w-[100px] px-4 py-3 align-top">
                      <div className="text-[13px] text-[#2B2A2A]">
                        {weight.toFixed(1)}
                      </div>
                    </td>
                    <td className="w-[140px] px-4 py-3 align-top">
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={0}
                            max={item.maxPoints}
                            value={item.manualPoints ?? ""}
                            onChange={(e) =>
                              handlePointsChange(item.id, e.target.value)
                            }
                            placeholder={item.autoPoints.toString()}
                            className="h-8 w-20 rounded-md border border-gray-300 bg-white px-2 text-right text-[13px] text-[#1F2430] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]"
                          />
                          <span className="text-[11px] text-gray-500">
                            / {item.maxPoints}
                          </span>
                        </div>
                        <div className="text-[11px] text-gray-500">
                          Auto: {item.autoPoints} pts
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
