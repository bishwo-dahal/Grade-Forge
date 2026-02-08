import { ChevronDown, Save, Play, CheckCircle } from "lucide-react";
import { StatusPill } from "./StatusPill";
import type { GradingAssignmentContext } from "../../../types/assignment";
import type { SubmissionDetail, SubmissionSummary } from "../../../types/submission";

interface GradingHeaderProps {
  // NOTE: Use shared types so mock services can be swapped later without UI changes.
  assignment: GradingAssignmentContext;
  submission: SubmissionDetail;
  allSubmissions: SubmissionSummary[];
  selectedSubmissionId: string;
  onSubmissionChange: (id: string) => void;
  onFinalizeGrade: () => void;
  onSaveDraft: () => void;
  onRerunTests: () => void;
}

export function GradingHeader({
  assignment,
  submission,
  allSubmissions,
  selectedSubmissionId,
  onSubmissionChange,
  onFinalizeGrade,
  onSaveDraft,
  onRerunTests
}: GradingHeaderProps) {
  const isFinalized = submission.status === "finalized";

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0 sticky top-0 z-10 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        {/* Left Side - Assignment and Submission Info */}
        <div className="flex items-center gap-4 flex-1">
          {/* Assignment Info */}
          <div className="border-r border-gray-200 pr-4">
            <div className="text-[13px] font-semibold text-[#2B2A2A]">
              {assignment.title}
            </div>
            <div className="text-[11px] text-gray-500">
              {assignment.courseName} &bull; {assignment.section}
            </div>
          </div>

          {/* Submission Selector */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <select
                value={selectedSubmissionId}
                onChange={(e) => onSubmissionChange(e.target.value)}
                className="appearance-none bg-gray-50 border border-gray-200 rounded-lg pl-3 pr-10 py-2 text-[13px] text-[#2B2A2A] font-medium cursor-pointer hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-[#5A7ACD] min-w-[200px]"
              >
                {allSubmissions.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.studentName} {sub.score !== null ? `(${sub.score}%)` : ""}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" strokeWidth={2} />
            </div>

            {/* Status and Timestamp */}
            <div className="flex items-center gap-2">
              <StatusPill status={submission.status} />
              <span className="text-[11px] text-gray-400">&bull;</span>
              <span className="text-[11px] text-gray-500">{submission.submittedAt}</span>
            </div>
          </div>
        </div>

        {/* Right Side - Actions */}
        <div className="flex items-center gap-2">
          {!isFinalized && (
            <>
              <button
                onClick={onRerunTests}
                className="px-3 py-2 text-[12px] text-gray-600 hover:text-[#2B2A2A] hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5" strokeWidth={2} />
                <span>Re-run Tests</span>
              </button>

              <button
                onClick={onSaveDraft}
                className="px-3 py-2 text-[12px] text-gray-600 hover:text-[#2B2A2A] hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" strokeWidth={2} />
                <span>Save Draft</span>
              </button>

              <button
                onClick={onFinalizeGrade}
                className="px-4 py-2 bg-[#5A7ACD] hover:bg-[#4a6abd] text-white rounded-lg text-[13px] font-medium transition-colors flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" strokeWidth={2} />
                <span>Finalize Grade</span>
              </button>
            </>
          )}

          {isFinalized && (
            <div className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-[13px] font-medium flex items-center gap-2">
              <CheckCircle className="w-4 h-4" strokeWidth={2} />
              <span>Grade Finalized</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
