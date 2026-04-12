import { User, Clock, Code, AlertCircle, CheckCircle } from "lucide-react";

interface OverviewTabProps {
  submission: any;
}

export function OverviewTab({ submission }: OverviewTabProps) {
  const displayScore = submission.manualScore ?? submission.autoScore;

  return (
    <div className="p-6">
      {/* Student Info */}
      <div className="mb-6">
        <h3 className="text-[13px] font-semibold text-[#5A7ACD] mb-3 flex items-center gap-2 uppercase tracking-wide">
          <div className="w-0.5 h-4 bg-[#5A7ACD] rounded-full"></div>
          Student Information
        </h3>
        
        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
          <div className="flex items-start gap-3">
            <User className="w-4 h-4 text-gray-400 mt-0.5" strokeWidth={2} />
            <div>
              <div className="text-[13px] font-semibold text-[#2B2A2A]">
                {submission.studentName}
              </div>
              <div className="text-[11px] text-gray-500">
                {submission.studentId}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Clock className="w-4 h-4 text-gray-400" strokeWidth={2} />
            <div>
              <div className="text-[12px] text-[#2B2A2A]">
                {submission.submittedAt}
              </div>
              {submission.isLate ? (
                <div className="text-[11px] text-red-600 font-medium">
                  Late by {submission.daysLate} {submission.daysLate === 1 ? "day" : "days"}
                </div>
              ) : (
                <div className="text-[11px] text-green-600 font-medium">
                  On time
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Code className="w-4 h-4 text-gray-400" strokeWidth={2} />
            <div className="text-[12px] text-[#2B2A2A]">
              {submission.language} • Attempt #{submission.attemptNumber}
            </div>
          </div>
        </div>
      </div>

      {/* Auto-Grading Summary */}
      <div className="mb-6">
        <h3 className="text-[13px] font-semibold text-[#5A7ACD] mb-3 flex items-center gap-2 uppercase tracking-wide">
          <div className="w-0.5 h-4 bg-[#5A7ACD] rounded-full"></div>
          Grading Summary
        </h3>
        
        <div className="bg-gradient-to-br from-[#5A7ACD]/5 to-[#FEB05D]/5 rounded-xl p-5 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[11px] text-gray-500 uppercase tracking-wide mb-1">
                Current Score
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-[#2B2A2A]">
                  {displayScore}%
                </span>
                <span className="text-[12px] text-gray-600">
                  / {submission.totalPoints} pts
                </span>
              </div>
            </div>
            {displayScore >= 90 ? (
              <CheckCircle className="w-8 h-8 text-green-500" strokeWidth={2} />
            ) : displayScore >= 70 ? (
              <AlertCircle className="w-8 h-8 text-[#FEB05D]" strokeWidth={2} />
            ) : (
              <AlertCircle className="w-8 h-8 text-red-500" strokeWidth={2} />
            )}
          </div>

          {submission.manualScore !== null && (
            <div className="pt-3 border-t border-gray-200">
              <div className="flex items-center gap-2 text-[11px] text-[#FEB05D]">
                <AlertCircle className="w-3.5 h-3.5" strokeWidth={2} />
                <span className="font-medium">
                  Manually adjusted from {submission.autoScore}%
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Test Results Summary */}
      <div className="mb-6">
        <h3 className="text-[13px] font-semibold text-[#5A7ACD] mb-3 flex items-center gap-2 uppercase tracking-wide">
          <div className="w-0.5 h-4 bg-[#5A7ACD] rounded-full"></div>
          Test Results
        </h3>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="text-[11px] text-gray-500 uppercase tracking-wide mb-2">
              Public Tests
            </div>
            <div className="text-xl font-bold text-[#2B2A2A] mb-1">
              {submission.publicTestResults.filter((t: any) => t.passed).length}/
              {submission.publicTestResults.length}
            </div>
            <div className="text-[11px] text-gray-600">
              {submission.publicTestResults.filter((t: any) => t.passed).length === 
                submission.publicTestResults.length
                ? "All passed ✓"
                : "Some failed"}
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="text-[11px] text-gray-500 uppercase tracking-wide mb-2">
              Private Tests
            </div>
            <div className="text-xl font-bold text-[#2B2A2A] mb-1">
              {submission.privateTestResults.passed}/{submission.privateTestResults.total}
            </div>
            <div className="text-[11px] text-gray-600">
              {Math.round(
                (submission.privateTestResults.passed / submission.privateTestResults.total) * 100
              )}% passed
            </div>
          </div>
        </div>
      </div>

      {/* Integrity Indicators */}
      <div>
        <h3 className="text-[13px] font-semibold text-[#5A7ACD] mb-3 flex items-center gap-2 uppercase tracking-wide">
          <div className="w-0.5 h-4 bg-[#5A7ACD] rounded-full"></div>
          Academic Integrity
        </h3>
        
        <div className="bg-white rounded-xl p-4 border border-gray-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-[12px] text-[#2B2A2A]">Code Similarity Score</div>
            <div className="text-[13px] font-bold text-[#2B2A2A]">
              {submission.similarityScore}%
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="text-[12px] text-[#2B2A2A]">AI Generation Likelihood</div>
            <div className="text-[13px] font-bold text-[#2B2A2A]">
              {submission.aiLikelihood}%
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100">
            <p className="text-[10px] text-gray-500 italic">
              These scores are for reference only. No automatic penalties are applied. 
              Review code manually before making academic integrity decisions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
