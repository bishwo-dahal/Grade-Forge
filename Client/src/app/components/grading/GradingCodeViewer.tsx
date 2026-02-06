import { Lock } from "lucide-react";

interface GradingCodeViewerProps {
  submission: any;
}

export function GradingCodeViewer({ submission }: GradingCodeViewerProps) {
  const lines = submission.code.split("\n");

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e]">
      {/* Top Bar */}
      <div className="bg-[#252526] border-b border-[#2d2d2d] px-4 py-2 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-[12px] font-medium text-gray-300">
            {submission.language}
          </span>
          <span className="text-gray-600">•</span>
          <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
            <Lock className="w-3 h-3" strokeWidth={2} />
            <span>Read-only</span>
          </div>
        </div>
        <div className="text-[11px] text-gray-500">
          {lines.length} lines
        </div>
      </div>

      {/* Code Area */}
      <div className="flex-1 overflow-auto">
        <div className="flex">
          {/* Line Numbers */}
          <div className="bg-[#1e1e1e] text-right pr-4 pl-4 py-4 select-none flex-shrink-0 border-r border-[#2d2d2d]">
            {lines.map((_, index) => (
              <div
                key={index}
                className="text-[13px] leading-[1.6] font-mono text-gray-600"
              >
                {index + 1}
              </div>
            ))}
          </div>

          {/* Code Content */}
          <div className="flex-1 px-4 py-4">
            <pre className="text-[13px] leading-[1.6] font-mono text-gray-300">
              {lines.map((line, index) => (
                <div key={index} className="min-h-[1.6em]">
                  {line || " "}
                </div>
              ))}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
