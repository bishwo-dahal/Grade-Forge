import { useEffect, useState } from "react";
import { Terminal, AlertTriangle, FileText } from "lucide-react";
import type { SubmissionConsoleData, SubmissionDetail } from "../../../types/submission";
import { getSubmissionConsoleData } from "../../../services/submissionService";

interface GradingConsoleProps {
  submission: SubmissionDetail;
}

export function GradingConsole({ submission }: GradingConsoleProps) {
  const [activeTab, setActiveTab] = useState<"output" | "errors" | "log">("output");
  // NOTE: Console output now loads from the mock submission service.
  const [consoleData, setConsoleData] = useState<SubmissionConsoleData | null>(null);

  useEffect(() => {
    getSubmissionConsoleData(submission.id).then(setConsoleData);
  }, [submission.id]);

  const output = consoleData?.output ?? "";
  const errors = consoleData?.errors ?? "";
  const executionLog = consoleData?.executionLog ?? "";

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e] border-t border-[#2d2d2d]">
      {/* Tabs */}
      <div className="flex items-center justify-between px-4 bg-[#1e1e1e] border-b border-[#2d2d2d]">
        <div className="flex items-center">
          <button
            onClick={() => setActiveTab("output")}
            className={`relative px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider transition-colors ${
              activeTab === "output" ? "text-[#4a9eff]" : "text-gray-500 hover:text-gray-300"
            }`}
          >
            <Terminal className="w-3 h-3 inline mr-1.5 mb-0.5" strokeWidth={2} />
            OUTPUT
            {activeTab === "output" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#4a9eff]"></div>
            )}
          </button>

          <button
            onClick={() => setActiveTab("errors")}
            className={`relative px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider transition-colors ${
              activeTab === "errors" ? "text-[#4a9eff]" : "text-gray-500 hover:text-gray-300"
            }`}
          >
            <AlertTriangle className="w-3 h-3 inline mr-1.5 mb-0.5" strokeWidth={2} />
            ERRORS
            <span className="ml-2 px-1.5 py-0.5 bg-[#2d2d2d] text-gray-400 rounded text-[10px]">
              1
            </span>
            {activeTab === "errors" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#4a9eff]"></div>
            )}
          </button>

          <button
            onClick={() => setActiveTab("log")}
            className={`relative px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider transition-colors ${
              activeTab === "log" ? "text-[#4a9eff]" : "text-gray-500 hover:text-gray-300"
            }`}
          >
            <FileText className="w-3 h-3 inline mr-1.5 mb-0.5" strokeWidth={2} />
            EXECUTION LOG
            {activeTab === "log" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#4a9eff]"></div>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === "output" && (
          <pre className="text-[12px] font-mono text-gray-300 leading-relaxed whitespace-pre-wrap">
            {output}
          </pre>
        )}

        {activeTab === "errors" && (
          <pre className="text-[12px] font-mono text-red-400 leading-relaxed whitespace-pre-wrap">
            {errors}
          </pre>
        )}

        {activeTab === "log" && (
          <pre className="text-[12px] font-mono text-gray-400 leading-relaxed whitespace-pre-wrap">
            {executionLog}
          </pre>
        )}
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-[#252526] border-t border-[#2d2d2d] text-[11px] text-gray-500">
        <span>Last run: {submission.submittedAt}</span>
        <span className="uppercase">{submission.language} 3.10</span>
      </div>
    </div>
  );
}
