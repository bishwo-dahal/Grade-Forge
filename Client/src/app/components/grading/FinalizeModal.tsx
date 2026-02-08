import { AlertCircle, CheckCircle } from "lucide-react";

interface FinalizeModalProps {
  submission: any;
  onConfirm: () => void;
  onCancel: () => void;
}

export function FinalizeModal({ submission, onConfirm, onCancel }: FinalizeModalProps) {
  const hasManualOverrides = submission.rubric.some(
    (item: any) => item.manualPoints !== null
  );

  const totalPoints = submission.rubric.reduce(
    (sum: number, item: any) => sum + (item.manualPoints ?? item.autoPoints),
    0
  );

  const maxPoints = submission.rubric.reduce(
    (sum: number, item: any) => sum + item.maxPoints,
    0
  );

  const finalScore = Math.round((totalPoints / maxPoints) * 100);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-[#5A7ACD]/10 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-[#5A7ACD]" strokeWidth={2} />
            </div>
            <h2 className="text-[16px] font-semibold text-[#2B2A2A]">
              Finalize Grade
            </h2>
          </div>
          <p className="text-[13px] text-gray-600 ml-13">
            Are you sure you want to finalize and release this grade to the student?
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Grade Summary */}
          <div className="bg-gradient-to-br from-[#5A7ACD]/5 to-[#FEB05D]/5 rounded-xl p-4 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[12px] text-gray-600">Final Score</span>
              <span className="text-2xl font-bold text-[#2B2A2A]">{finalScore}%</span>
            </div>
            <div className="text-[11px] text-gray-500">
              {totalPoints} / {maxPoints} points
            </div>
          </div>

          {/* Warnings/Info */}
          <div className="space-y-2">
            {hasManualOverrides && (
              <div className="flex items-start gap-2 text-[12px] text-[#FEB05D]">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" strokeWidth={2} />
                <span>This grade includes manual rubric adjustments</span>
              </div>
            )}

            <div className="flex items-start gap-2 text-[12px] text-gray-600">
              <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" strokeWidth={2} />
              <span>Student will receive email notification</span>
            </div>

            <div className="flex items-start gap-2 text-[12px] text-gray-600">
              <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" strokeWidth={2} />
              <span>Grade will appear in gradebook immediately</span>
            </div>
          </div>

          {/* Important Note */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-[11px] text-amber-800">
              <strong>Note:</strong> Once finalized, this grade cannot be edited. 
              You can only add additional feedback later.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-[13px] font-medium text-gray-600 hover:text-[#2B2A2A] hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2 text-[13px] font-medium bg-[#5A7ACD] hover:bg-[#4a6abd] text-white rounded-lg transition-colors"
          >
            Finalize Grade
          </button>
        </div>
      </div>
    </div>
  );
}
