import { CheckCircle, XCircle, Lock } from "lucide-react";
import type { AssignmentResult } from "../../../types/grade";
import type { FacultyAssignmentSubmissionRow } from "../../../types/submission";

interface ResultsPanelProps {
  // NOTE: Results are provided by the page so this panel stays view-only.
  results: AssignmentResult | null;
  facultySubmissionRows?: FacultyAssignmentSubmissionRow[];
}

export function ResultsPanel({ results, facultySubmissionRows }: ResultsPanelProps) {
  const getStatusMessage = (score: number) => {
    if (score >= 95) return "Excellent Work!";
    if (score >= 85) return "Good Effort!";
    if (score >= 70) return "Needs Improvement";
    return "Please Revisit";
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "#5A7ACD";
    if (score >= 70) return "#FEB05D";
    return "#ef4444";
  };

  if (!results) {
    return null;
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Circular Score Display */}
      <div className="mb-6 bg-gradient-to-br from-[#5A7ACD]/5 to-[#FEB05D]/5 rounded-xl p-6 border border-gray-100">
        <div className="flex flex-col items-center">
          {/* Circular Progress */}
          <div className="relative w-28 h-28 mb-4">
            <svg className="w-28 h-28 transform -rotate-90">
              {/* Background circle */}
              <circle
                cx="56"
                cy="56"
                r="50"
                stroke="#e5e7eb"
                strokeWidth="8"
                fill="none"
              />
              {/* Progress circle */}
              <circle
                cx="56"
                cy="56"
                r="50"
                stroke={getScoreColor(results.score)}
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 50}`}
                strokeDashoffset={`${2 * Math.PI * 50 * (1 - results.score / 100)}`}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
            {/* Score text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-3xl font-bold text-[#2B2A2A]">{results.score}</div>
              <div className="text-gray-400 text-xs">/ 100</div>
            </div>
          </div>

          {/* Status Message */}
          <div className="text-[15px] font-semibold text-[#2B2A2A] mb-1">
            {getStatusMessage(results.score)}
          </div>
          
          {/* Timestamp */}
          <div className="text-[11px] text-gray-500">
            Graded on {results.gradedAt}
          </div>
        </div>
      </div>

      {/* Rubric Breakdown */}
      <div className="mb-6">
        <h3 className="text-[13px] font-semibold text-[#5A7ACD] mb-3 flex items-center gap-2 uppercase tracking-wide">
          <div className="w-0.5 h-4 bg-[#5A7ACD] rounded-full"></div>
          Rubric Breakdown
        </h3>
        
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {results.rubricBreakdown.map((item, index) => (
            <div 
              key={index}
              className={`p-4 ${index !== results.rubricBreakdown.length - 1 ? 'border-b border-gray-100' : ''}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="text-[13px] font-semibold text-[#2B2A2A] mb-0.5">
                    {item.category}
                  </div>
                  {item.feedback && (
                    <div className="text-[11px] text-gray-600 italic mt-0.5">
                      {item.feedback}
                    </div>
                  )}
                </div>
                <div className="text-right ml-6">
                  <div className="text-[14px] font-bold text-[#2B2A2A]">
                    {item.earned}/{item.total}
                  </div>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
                <div 
                  className="h-1.5 rounded-full transition-all duration-1000"
                  style={{ 
                    width: `${(item.earned / item.total) * 100}%`,
                    backgroundColor: item.earned === item.total ? '#5A7ACD' : '#FEB05D'
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Private Tests */}
      <div className="mb-6">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[13px] font-semibold text-[#2B2A2A]">
                <Lock className="w-3.5 h-3.5 text-[#FEB05D]" strokeWidth={2} />
                Private Tests
              </div>
              <div className="text-[13px] font-bold text-[#FEB05D]">
                {results.privateTestsPassed}/{results.privateTestsTotal} Passed
              </div>
            </div>
          </div>
          
          <div className="p-4">
            {/* Test Result Icons */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {results.privateTestResults.map((passed, index) => (
                <div
                  key={index}
                  className={`w-6 h-6 rounded-md flex items-center justify-center ${
                    passed 
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-red-100 text-red-600'
                  }`}
                >
                  {passed ? (
                    <CheckCircle className="w-3.5 h-3.5" strokeWidth={2.5} />
                  ) : (
                    <XCircle className="w-3.5 h-3.5" strokeWidth={2.5} />
                  )}
                </div>
              ))}
            </div>

            {/* Failed Test Details */}
            {results.failedTests.length > 0 && (
              <div className="pt-3 border-t border-gray-100">
                <div className="space-y-1.5">
                  {results.failedTests.map((test, index) => (
                    <div 
                      key={index}
                      className="text-[11px] text-gray-600 flex items-start gap-2"
                    >
                      <span className="text-red-500 mt-0.5">&bull;</span>
                      <span>{test}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {facultySubmissionRows ? (
        <div className="mb-6">
          <h3 className="text-[13px] font-semibold text-[#5A7ACD] mb-3 flex items-center gap-2 uppercase tracking-wide">
            <div className="w-0.5 h-4 bg-[#5A7ACD] rounded-full"></div>
            Submitted Files
          </h3>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {facultySubmissionRows.length > 0 ? (
              facultySubmissionRows.map((row, rowIndex) => (
                <div
                  key={row.submissionId}
                  className={`p-4 ${rowIndex !== facultySubmissionRows.length - 1 ? "border-b border-gray-100" : ""}`}
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-[13px] font-semibold text-[#2B2A2A]">{row.studentName}</p>
                    <p className="text-[11px] text-gray-500">{row.submittedAt}</p>
                  </div>
                  {row.files.length > 0 ? (
                    <div className="flex flex-col gap-1.5">
                      {row.files.map((file) =>
                        file.downloadUrl ? (
                          <a
                            key={`${row.submissionId}-${file.id}`}
                            href={file.downloadUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[12px] text-[#5A7ACD] hover:text-[#4a6abd] hover:underline"
                          >
                            {file.fileName}
                          </a>
                        ) : (
                          <span key={`${row.submissionId}-${file.id}`} className="text-[12px] text-gray-500">
                            {file.fileName}
                          </span>
                        ),
                      )}
                    </div>
                  ) : (
                    <p className="text-[12px] text-gray-500">No files uploaded with this submission.</p>
                  )}
                </div>
              ))
            ) : (
              // NOTE: Faculty result tab keeps an explicit empty state when assignment has no uploaded files yet.
              <p className="p-4 text-[12px] text-gray-500">No student submission files available yet.</p>
            )}
          </div>
        </div>
      ) : null}

      {/* Back Button */}
      <div>
        <button 
          onClick={() => window.history.back()}
          className="w-full py-2.5 bg-[#F5F2F2] hover:bg-gray-200 text-[#2B2A2A] rounded-lg text-[13px] font-medium transition-colors flex items-center justify-center gap-2"
        >
          <span>&larr;</span>
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
