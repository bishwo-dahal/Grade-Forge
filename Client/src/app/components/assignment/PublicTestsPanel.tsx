import { CheckCircle, XCircle, ChevronDown, ChevronRight, FileText, Terminal } from "lucide-react";
import { useState } from "react";
import type { PublicTestCase } from "../../../types/submission";
import type { TestRunJobStatus } from "../../../types/runTests";

interface PublicTestsPanelProps {
  testCases: PublicTestCase[];
  /** When provided, show Run tests button and optional last run result / loading / error */
  onRunTests?: () => void;
  isRunning?: boolean;
  runError?: string | null;
  runResult?: { passedCount: number; totalCount: number; results: PublicTestCase[] } | null;
  /** Optional latest job status (QUEUED/RUNNING/COMPLETED/FAILED) so we can show progress text. */
  runStatus?: TestRunJobStatus | null;
  /** When true, show the student-facing 'public tests only' note. Hide for faculty/GA views. */
  showPublicNote?: boolean;
  /** When true, show "Custom input" section so students can enter stdin for an extra run. */
  showCustomStdin?: boolean;
  /** Controlled value for custom stdin (used when Run tests is clicked in the workspace). */
  customStdin?: string;
  /** Called when the user edits the custom stdin textarea. */
  onCustomStdinChange?: (value: string) => void;
}

export function PublicTestsPanel({
  testCases,
  onRunTests,
  isRunning = false,
  runError = null,
  runResult = null,
  runStatus = null,
  showPublicNote = true,
  showCustomStdin = false,
  customStdin = "",
  onCustomStdinChange,
}: PublicTestsPanelProps) {
  const [expandedTests, setExpandedTests] = useState<Set<number>>(new Set([0]));

  const toggleTest = (testId: number) => {
    const newExpanded = new Set(expandedTests);
    if (newExpanded.has(testId)) {
      newExpanded.delete(testId);
    } else {
      newExpanded.add(testId);
    }
    setExpandedTests(newExpanded);
  };

  const displayTests = runResult?.results?.length ? runResult.results : testCases;
  const passedCount = runResult != null ? runResult.passedCount : testCases.filter((t) => t.passed).length;
  const totalCount = runResult != null ? runResult.totalCount : testCases.length;
  const hasResults = displayTests.length > 0;
  const isJobRunning = runStatus === "QUEUED" || runStatus === "RUNNING";

  return (
    <div className="p-6">
      {/* Summary */}
      <div className="mb-6">
        <div className="flex items-center justify-between gap-3 mb-2">
          <h2 className="text-lg font-semibold text-[#2B2A2A]">Test Cases</h2>
        </div>
        {(runResult != null || totalCount > 0) && (
          <div className="text-[14px] font-semibold mb-1">
            <span className={passedCount === totalCount && totalCount > 0 ? "text-green-600" : "text-[#FEB05D]"}>
              {passedCount}/{totalCount} Passed
            </span>
          </div>
        )}
        <p className="text-[13px] text-gray-600">
          {isJobRunning
            ? "Tests are running for this submission. This view will update when they complete."
            : hasResults
              ? "Latest test run results for this submission."
              : "Run tests from the code workspace to see results here."}
        </p>
        {runError && (
          <p className="mt-2 text-[13px] text-red-600" role="alert">
            {runError}
          </p>
        )}
      </div>

      {/* Custom input (students): run tests with this stdin for an extra result row */}
      {showCustomStdin && (
        <div className="mb-6 p-4 border border-gray-200 rounded-xl bg-gray-50">
          <label className="block text-[13px] font-medium text-[#2B2A2A] mb-2">
            Custom input (optional)
          </label>
          <p className="text-[12px] text-gray-600 mb-2">
            Add input here to run your code with it once after the test cases. Click &quot;Run Tests&quot; in the code workspace to run.
          </p>
          <textarea
            value={customStdin}
            onChange={(e) => onCustomStdinChange?.(e.target.value)}
            placeholder="e.g. 1 2 3 or hello"
            className="w-full min-h-[80px] px-3 py-2 text-[13px] text-[#2B2A2A] bg-white border border-gray-200 rounded-lg resize-y placeholder-gray-400"
            aria-label="Custom stdin for run tests"
          />
        </div>
      )}

      {/* Test Cases */}
      <div className="space-y-3">
        {displayTests.map((test, index) => (
          <div
            key={test.id ?? index}
            className="border border-gray-200 rounded-xl overflow-hidden bg-white"
          >
            <button
              onClick={() => toggleTest(test.id ?? index)}
              className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors"
            >
              {/* Pass/Fail/Custom Icon */}
              {test.passed === true ? (
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" strokeWidth={2} />
              ) : test.passed === false ? (
                <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" strokeWidth={2} />
              ) : (
                <Terminal className="w-5 h-5 text-amber-500 flex-shrink-0" strokeWidth={2} title="Custom input run" />
              )}

              {/* Input source: file or console */}
              {test.inputFileName ? (
                <FileText className="w-5 h-5 text-gray-500 flex-shrink-0" strokeWidth={2} title={`Input from file: ${test.inputFileName}`} />
              ) : (
                <Terminal className="w-5 h-5 text-gray-500 flex-shrink-0" strokeWidth={2} title="Input from stdin/console" />
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
              {expandedTests.has(test.id ?? index) ? (
                <ChevronDown className="w-4 h-4 text-gray-400" strokeWidth={2} />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-400" strokeWidth={2} />
              )}
            </button>

            {expandedTests.has(test.id ?? index) && (
              <div className="border-t border-gray-200 bg-gray-50 p-4 space-y-4">
                {/* Input */}
                <div>
                  <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    {test.inputFileName
                      ? `Input (file: ${test.inputFileName})`
                      : "Input (stdin)"}
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <code className="text-[13px] text-[#2B2A2A] font-mono whitespace-pre-wrap break-words">
                      {test.input && test.input.trim() ? test.input : "(no input)"}
                    </code>
                  </div>
                </div>

                {/* Expected Output (hidden for custom input runs) */}
                {test.passed !== undefined && (
                  <div>
                    <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      Expected Output
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <code className="text-[13px] text-[#2B2A2A] font-mono">{test.expectedOutput}</code>
                    </div>
                  </div>
                )}

                {/* Actual Output */}
                <div>
                  <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    {test.passed === undefined ? "Output" : "Your Output"}
                  </div>
                  <div className={`bg-white rounded-lg p-3 border ${test.passed === true ? "border-green-200" : test.passed === false ? "border-red-200" : "border-gray-200"}`}>
                    <code className={`text-[13px] font-mono ${test.passed === true ? "text-green-700" : test.passed === false ? "text-red-700" : "text-[#2B2A2A]"}`}>
                      {test.actualOutput}
                    </code>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Info Box (student copy only) */}
      {showPublicNote && (
        <div className="mt-6 p-4 bg-[#5A7ACD]/5 border border-[#5A7ACD]/20 rounded-xl">
          <p className="text-[13px] text-gray-700">
            <strong className="text-[#2B2A2A]">Note:</strong> These are only the public test cases.
            Your final submission will be graded against additional private test cases that verify
            edge cases and advanced scenarios.
          </p>
        </div>
      )}
    </div>
  );
}
