import { CheckCircle, XCircle, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import type { PublicTestCase } from "../../../types/submission";

interface PublicTestsPanelProps {
  // NOTE: Test cases are passed in so the panel stays reusable and data-agnostic.
  testCases: PublicTestCase[];
}

export function PublicTestsPanel({ testCases }: PublicTestsPanelProps) {
  const [expandedTests, setExpandedTests] = useState<Set<number>>(new Set([1]));

  const toggleTest = (testId: number) => {
    const newExpanded = new Set(expandedTests);
    if (newExpanded.has(testId)) {
      newExpanded.delete(testId);
    } else {
      newExpanded.add(testId);
    }
    setExpandedTests(newExpanded);
  };

  const passedCount = testCases.filter(t => t.passed).length;
  const totalCount = testCases.length;

  return (
    <div className="p-6">
      {/* Summary */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-[#2B2A2A]">Public Test Cases</h2>
          <div className="text-[14px] font-semibold">
            <span className={passedCount === totalCount ? "text-green-600" : "text-[#FEB05D]"}>
              {passedCount}/{totalCount} Passed
            </span>
          </div>
        </div>
        <p className="text-[13px] text-gray-600">
          Run your code to see results for these test cases. Private tests will run on final submission.
        </p>
      </div>

      {/* Test Cases */}
      <div className="space-y-3">
        {testCases.map((test) => (
          <div 
            key={test.id}
            className="border border-gray-200 rounded-xl overflow-hidden bg-white"
          >
            {/* Test Header */}
            <button
              onClick={() => toggleTest(test.id)}
              className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors"
            >
              {/* Pass/Fail Icon */}
              {test.passed ? (
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" strokeWidth={2} />
              ) : (
                <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" strokeWidth={2} />
              )}

              {/* Test Name */}
              <div className="flex-1 text-left">
                <div className="text-[14px] font-medium text-[#2B2A2A]">{test.name}</div>
                {test.executionTime && (
                  <div className="text-[12px] text-gray-500 mt-0.5">
                    Runtime: {test.executionTime}
                  </div>
                )}
              </div>

              {/* Expand Icon */}
              {expandedTests.has(test.id) ? (
                <ChevronDown className="w-4 h-4 text-gray-400" strokeWidth={2} />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-400" strokeWidth={2} />
              )}
            </button>

            {/* Test Details */}
            {expandedTests.has(test.id) && (
              <div className="border-t border-gray-200 bg-gray-50 p-4 space-y-4">
                {/* Input */}
                <div>
                  <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Input
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <code className="text-[13px] text-[#2B2A2A] font-mono">{test.input}</code>
                  </div>
                </div>

                {/* Expected Output */}
                <div>
                  <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Expected Output
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <code className="text-[13px] text-[#2B2A2A] font-mono">{test.expectedOutput}</code>
                  </div>
                </div>

                {/* Actual Output */}
                <div>
                  <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Your Output
                  </div>
                  <div className={`bg-white rounded-lg p-3 border ${test.passed ? 'border-green-200' : 'border-red-200'}`}>
                    <code className={`text-[13px] font-mono ${test.passed ? 'text-green-700' : 'text-red-700'}`}>
                      {test.actualOutput}
                    </code>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-[#5A7ACD]/5 border border-[#5A7ACD]/20 rounded-xl">
        <p className="text-[13px] text-gray-700">
          <strong className="text-[#2B2A2A]">Note:</strong> These are only the public test cases. 
          Your final submission will be graded against additional private test cases that verify 
          edge cases and advanced scenarios.
        </p>
      </div>
    </div>
  );
}
