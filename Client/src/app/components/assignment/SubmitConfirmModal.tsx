import { AlertCircle, Loader2, X } from "lucide-react";

interface SubmitConfirmModalProps {
  submissionsUsed: number;
  submissionsAllowed: number | null;
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
  isSubmitting?: boolean;
  errorMessage?: string | null;
}

export function SubmitConfirmModal({ 
  submissionsUsed, 
  submissionsAllowed, 
  onConfirm, 
  onCancel,
  isSubmitting = false,
  errorMessage = null,
}: SubmitConfirmModalProps) {
  const hasAttemptsLimit = submissionsAllowed !== null;
  const attemptsRemaining = hasAttemptsLimit ? submissionsAllowed - submissionsUsed : null;
  const hasSubmittedBefore = submissionsUsed > 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-[#2B2A2A]">Confirm Submission</h2>
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-5 h-5 text-gray-400" strokeWidth={2} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Warning Box */}
          <div className="bg-[#FEB05D]/10 border border-[#FEB05D]/30 rounded-xl p-4 mb-5">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-[#FEB05D] flex-shrink-0 mt-0.5" strokeWidth={2} />
              <div>
                <p className="text-[14px] text-[#2B2A2A] font-medium mb-1">
                  Your code will be graded with private tests
                </p>
                <p className="text-[13px] text-gray-600">
                  Private test cases are hidden and may include edge cases not covered in public tests. 
                  Make sure your code handles all scenarios.
                </p>
              </div>
            </div>
          </div>

          {hasSubmittedBefore ? (
            <div className="bg-[#C23A42]/10 border border-[#C23A42]/25 rounded-xl p-4 mb-5">
              <p className="text-[14px] text-[#2B2A2A] font-semibold mb-1">You already submitted this assignment.</p>
              {/* FIX: Make resubmission intent explicit so students confirm they want to submit again. */}
              <p className="text-[13px] text-gray-700">Do you want to submit again and replace your previous submission?</p>
            </div>
          ) : null}

          {/* Submission Count */}
          {hasAttemptsLimit && (
            <div className="mb-5 p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[13px] text-gray-600 mb-1">Submission Attempts</div>
                  <div className="text-[15px] font-semibold text-[#2B2A2A]">
                    {submissionsUsed} of {submissionsAllowed} used
                  </div>
                </div>
                {attemptsRemaining !== null && (
                  <div className="text-right">
                    <div className="text-2xl font-bold text-[#5A7ACD]">
                      {attemptsRemaining}
                    </div>
                    <div className="text-[11px] text-gray-500">remaining</div>
                  </div>
                )}
              </div>
              
              {attemptsRemaining !== null && attemptsRemaining <= 1 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-[12px] text-[#FEB05D] font-medium">
                    ⚠️ This is your {attemptsRemaining === 0 ? 'final' : 'last'} submission attempt!
                  </p>
                </div>
              )}
            </div>
          )}

          {!hasAttemptsLimit && (
            <div className="mb-5 p-4 bg-[#5A7ACD]/5 rounded-xl border border-[#5A7ACD]/20">
              <p className="text-[13px] text-gray-700">
                <strong className="text-[#2B2A2A]">Note:</strong> This assignment allows unlimited submissions. 
                Only your highest score will be recorded.
              </p>
            </div>
          )}

          {/* Checklist */}
          <div className="mb-5">
            <p className="text-[13px] font-medium text-[#2B2A2A] mb-2">Before submitting:</p>
            <ul className="space-y-2 text-[13px] text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-[#5A7ACD] mt-0.5">✓</span>
                <span>Run and pass all public tests</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#5A7ACD] mt-0.5">✓</span>
                <span>Handle edge cases (empty inputs, large values, etc.)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#5A7ACD] mt-0.5">✓</span>
                <span>Check code quality and documentation</span>
              </li>
            </ul>
          </div>
          {errorMessage ? (
            // FIX: Keep submission API errors visible in the confirmation step so users know why save failed.
            <p className="text-[12px] text-[#C23A42]">{errorMessage}</p>
          ) : null}
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-6 bg-gray-50 border-t border-gray-200">
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2.5 bg-white border border-gray-300 hover:bg-gray-100 text-[#2B2A2A] rounded-lg text-[14px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={() => void onConfirm()}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2.5 bg-[#2B2A2A] hover:bg-[#3a3939] text-white rounded-lg text-[14px] font-medium transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
                <span>Saving...</span>
              </>
            ) : (
              <span>{hasSubmittedBefore ? "Submit Again" : "Submit for Grading"}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
