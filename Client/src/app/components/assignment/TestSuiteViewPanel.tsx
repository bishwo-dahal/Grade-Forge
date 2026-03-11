import { ChevronDown, ChevronRight, Lock, FileInput } from "lucide-react";
import { useState } from "react";
import type { TestSuiteDetail } from "../../../types/testSuite";

interface TestSuiteViewPanelProps {
  testSuite: TestSuiteDetail;
}

export function TestSuiteViewPanel({ testSuite }: TestSuiteViewPanelProps) {
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const toggle = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const publicCount = testSuite.testCases.filter((tc) => !tc.isPrivate).length;
  const privateCount = testSuite.testCases.length - publicCount;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-[#2B2A2A]">{testSuite.title || "Test Suite"}</h2>
        {testSuite.description ? (
          <p className="mt-1 text-[13px] text-gray-600">{testSuite.description}</p>
        ) : null}
        <p className="mt-2 text-[13px] text-gray-500">
          {publicCount} public, {privateCount} private test case{testSuite.testCases.length !== 1 ? "s" : ""}.
          Private tests run on submission only.
        </p>
      </div>

      <div className="space-y-3">
        {testSuite.testCases.map((tc, index) => {
          const id = tc.id ?? index;
          const expanded = expandedIds.has(id);
          return (
            <div
              key={tc.id ?? index}
              className="border border-gray-200 rounded-xl overflow-hidden bg-white"
            >
              <button
                type="button"
                onClick={() => toggle(id)}
                className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors text-left"
              >
                {tc.isPrivate ? (
                  <Lock className="w-5 h-5 text-amber-600 flex-shrink-0" strokeWidth={2} />
                ) : (
                  <FileInput className="w-5 h-5 text-gray-500 flex-shrink-0" strokeWidth={2} />
                )}
                <div className="flex-1 min-w-0">
                  <span className="text-[14px] font-medium text-[#2B2A2A]">{tc.title || "Untitled test"}</span>
                  {tc.isPrivate && (
                    <span className="ml-2 text-[11px] font-medium text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                      Private
                    </span>
                  )}
                </div>
                {expanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" strokeWidth={2} />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" strokeWidth={2} />
                )}
              </button>
              {expanded && (
                <div className="border-t border-gray-200 bg-gray-50 p-4 space-y-4">
                  {(tc.input != null && tc.input !== "") && (
                    <div>
                      <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        Input{tc.fileName ? ` (file: ${tc.fileName})` : " (stdin)"}
                      </div>
                      <pre className="bg-white rounded-lg p-3 border border-gray-200 text-[13px] font-mono text-[#2B2A2A] whitespace-pre-wrap break-words">
                        {tc.input}
                      </pre>
                    </div>
                  )}
                  <div>
                    <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      Expected output
                    </div>
                    <pre className="bg-white rounded-lg p-3 border border-gray-200 text-[13px] font-mono text-[#2B2A2A] whitespace-pre-wrap break-words">
                      {tc.output ?? "(none)"}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
