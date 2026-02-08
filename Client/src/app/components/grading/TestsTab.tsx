import { useState } from "react";
import { CheckCircle, XCircle, ChevronDown, ChevronUp, Lock } from "lucide-react";

interface TestsTabProps {
  submission: any;
}

export function TestsTab({ submission }: TestsTabProps) {
  const [expandedTests, setExpandedTests] = useState<Set<number>>(new Set());

  const toggleTest = (index: number) => {
    setExpandedTests((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  return (
    <div className="p-6">
      {/* Public Tests */}
      <div className="mb-6">
        <h3 className="text-[13px] font-semibold text-[#5A7ACD] mb-3 flex items-center gap-2 uppercase tracking-wide">
          <div className="w-0.5 h-4 bg-[#5A7ACD] rounded-full"></div>
          Public Tests
        </h3>

        <div className="space-y-2">
          {submission.publicTestResults.map((test: any, index: number) => (
            <div
              key={index}
              className={`bg-white rounded-xl border overflow-hidden ${
                test.passed ? "border-green-200" : "border-red-200"
              }`}
            >
              {/* Test Header */}
              <button
                onClick={() => toggleTest(index)}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  {test.passed ? (
                    <CheckCircle
                      className="w-5 h-5 text-green-600 flex-shrink-0"
                      strokeWidth={2}
                    />
                  ) : (
                    <XCircle
                      className="w-5 h-5 text-red-600 flex-shrink-0"
                      strokeWidth={2}
                    />
                  )}
                  <div className="text-left">
                    <div className="text-[13px] font-semibold text-[#2B2A2A]">
                      {test.name}
                    </div>
                    <div className="text-[11px] text-gray-500">
                      {test.passed ? "Passed" : "Failed"}
                    </div>
                  </div>
                </div>

                {expandedTests.has(index) ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" strokeWidth={2} />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" strokeWidth={2} />
                )}
              </button>

              {/* Test Details */}
              {expandedTests.has(index) && (
                <div className="px-4 pb-4 border-t border-gray-100 space-y-3 pt-3">
                  <div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">
                      Input
                    </div>
                    <div className="bg-gray-50 rounded px-3 py-2 text-[12px] font-mono text-[#2B2A2A]">
                      {test.input}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">
                      Expected Output
                    </div>
                    <div className="bg-gray-50 rounded px-3 py-2 text-[12px] font-mono text-[#2B2A2A]">
                      {test.expected}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">
                      Student Output
                    </div>
                    <div
                      className={`rounded px-3 py-2 text-[12px] font-mono ${
                        test.passed
                          ? "bg-green-50 text-green-900"
                          : "bg-red-50 text-red-900"
                      }`}
                    >
                      {test.actual}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Private Tests */}
      <div>
        <h3 className="text-[13px] font-semibold text-[#5A7ACD] mb-3 flex items-center gap-2 uppercase tracking-wide">
          <div className="w-0.5 h-4 bg-[#5A7ACD] rounded-full"></div>
          Private Tests
        </h3>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-[13px] font-semibold text-[#2B2A2A]">
              <Lock className="w-4 h-4 text-[#FEB05D]" strokeWidth={2} />
              Hidden Test Cases
            </div>
            <div className="text-[14px] font-bold text-[#2B2A2A]">
              {submission.privateTestResults.passed}/{submission.privateTestResults.total}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-100 rounded-full h-2 mb-3">
            <div
              className="bg-[#5A7ACD] h-2 rounded-full transition-all"
              style={{
                width: `${
                  (submission.privateTestResults.passed /
                    submission.privateTestResults.total) *
                  100
                }%`
              }}
            />
          </div>

          <div className="text-[11px] text-gray-600">
            {Math.round(
              (submission.privateTestResults.passed /
                submission.privateTestResults.total) *
                100
            )}
            % of private tests passed
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-[11px] text-gray-500 italic">
              Private test inputs and expected outputs are hidden to prevent reverse
              engineering. Only pass/fail status is available.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
