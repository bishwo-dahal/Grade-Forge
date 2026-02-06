import { useState } from "react";
import { Edit3, AlertCircle } from "lucide-react";

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

      {/* Rubric Items */}
      <div className="space-y-4">
        {rubricItems.map((item: any) => (
          <div
            key={item.id}
            className={`bg-white rounded-xl border p-4 ${
              item.manualPoints !== null
                ? "border-[#FEB05D] bg-[#FEB05D]/5"
                : "border-gray-200"
            }`}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h4 className="text-[13px] font-semibold text-[#2B2A2A] mb-1">
                  {item.category}
                </h4>
                <p className="text-[11px] text-gray-600">{item.description}</p>
              </div>
              <div className="text-right ml-4">
                <div className="text-[11px] text-gray-500 mb-1">Max Points</div>
                <div className="text-[14px] font-bold text-[#2B2A2A]">
                  {item.maxPoints}
                </div>
              </div>
            </div>

            {/* Points Assignment */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">
                  Auto Points
                </div>
                <div className="text-[16px] font-bold text-gray-600">
                  {item.autoPoints}
                </div>
              </div>

              <div className="bg-[#5A7ACD]/10 rounded-lg p-3">
                <div className="text-[10px] text-[#5A7ACD] uppercase tracking-wide mb-1 flex items-center gap-1">
                  <Edit3 className="w-3 h-3" strokeWidth={2} />
                  Manual Override
                </div>
                <input
                  type="number"
                  min="0"
                  max={item.maxPoints}
                  value={item.manualPoints ?? ""}
                  onChange={(e) => handlePointsChange(item.id, e.target.value)}
                  placeholder={item.autoPoints.toString()}
                  className="w-full bg-white border border-[#5A7ACD] rounded px-2 py-1 text-[14px] font-bold text-[#2B2A2A] focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]"
                />
              </div>
            </div>

            {/* Feedback */}
            <div>
              <label className="text-[11px] text-gray-600 mb-1 block">
                Feedback (optional)
              </label>
              <textarea
                value={item.feedback}
                onChange={(e) => handleFeedbackChange(item.id, e.target.value)}
                placeholder="Add specific feedback for this rubric item..."
                rows={2}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-[12px] text-[#2B2A2A] focus:outline-none focus:ring-2 focus:ring-[#5A7ACD] resize-none"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
