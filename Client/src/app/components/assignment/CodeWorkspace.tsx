import { useState, useEffect } from "react";
import { Play, Send, RotateCcw, Save } from "lucide-react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { MonacoEditor } from "../editors";
import { ConsoleDrawer } from "./ConsoleDrawer";
import { SubmitConfirmModal } from "./SubmitConfirmModal";
import type { EditorCodeExamples } from "../../../types/assignment";

interface CodeWorkspaceProps {
  assignment: {
    language: string;
    hasStarterCode: boolean;
    submissionsUsed: number;
    submissionsAllowed: number | null;
  };
  // NOTE: Code examples are passed in to keep the editor pane stateless.
  codeExamples: EditorCodeExamples;
  onRunTests: () => void;
  onSubmit: () => void;
  isMobile?: boolean;
}

export function CodeWorkspace({ assignment, codeExamples, onRunTests, onSubmit, isMobile = false }: CodeWorkspaceProps) {
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [consoleOutput, setConsoleOutput] = useState<string>("");
  const [lastRunTime, setLastRunTime] = useState<string | null>(null);
  const [autoSaved, setAutoSaved] = useState(true);
  const [cursorPosition, setCursorPosition] = useState({ line: 14, col: 8 });
  const initialCode = codeExamples[assignment.language] ?? codeExamples.Python ?? "";
  const [code, setCode] = useState(initialCode);

  useEffect(() => {
    const next = codeExamples[assignment.language] ?? codeExamples.Python ?? "";
    setCode(next);
  }, [assignment.language, codeExamples]);

  const handleRunTests = () => {
    setLastRunTime(new Date().toLocaleTimeString());
    // NOTE: Use Unicode escapes to avoid mojibake in non-UTF8 environments.
    setConsoleOutput("Running public tests...\n\nTest 1: Basic Insert and In-order Traversal - PASSED \u2713\nTest 2: Search Existing Node - PASSED \u2713\nTest 3: Delete Node with Two Children - FAILED \u2717\n  Expected: [20, 40, 50, 70]\n  Got: [20, 30, 50, 70]\nTest 4: Pre-order Traversal - PASSED \u2713\nTest 5: Search Non-existing Node - PASSED \u2713\n\n4/5 tests passed");
    onRunTests();
  };

  const handleSubmit = () => {
    setShowSubmitModal(true);
  };

  const confirmSubmit = () => {
    setShowSubmitModal(false);
    onSubmit();
    // In real implementation, this would trigger actual submission
  };

  return (
    <div className="flex flex-col h-full">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between gap-4">
          {/* Left Side - Language Display */}
          <div className="flex items-center gap-3">
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-gray-500 font-medium">Language:</span>
                <span className="text-[13px] text-[#2B2A2A] font-semibold">{assignment.language}</span>
              </div>
            </div>

            {/* Auto-save Indicator */}
            <div className="flex items-center gap-1.5 text-[12px] text-gray-500">
              <Save className="w-3.5 h-3.5" strokeWidth={2} />
              <span>{autoSaved ? "Saved" : "Saving..."}</span>
            </div>
          </div>

          {/* Right Side - Action Buttons */}
          <div className="flex items-center gap-2">
            {assignment.hasStarterCode && (
              <button className="px-3 py-1.5 text-[12px] text-gray-600 hover:text-[#2B2A2A] hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5" strokeWidth={2} />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}
            
            <button 
              onClick={handleRunTests}
              className="px-4 py-2 bg-[#5A7ACD] hover:bg-[#4a6abd] text-white rounded-lg text-[13px] font-medium transition-colors flex items-center gap-2"
            >
              <Play className="w-4 h-4" strokeWidth={2} />
              <span>Run Tests</span>
            </button>

            <button 
              onClick={handleSubmit}
              className="px-4 py-2 bg-[#2B2A2A] hover:bg-[#3a3939] text-white rounded-lg text-[13px] font-medium transition-colors flex items-center gap-2"
            >
              <Send className="w-4 h-4" strokeWidth={2} />
              <span>Submit</span>
            </button>
          </div>
        </div>
      </div>

      {/* Resizable Editor and Console */}
      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="vertical">
          {/* Editor Panel */}
          <Panel defaultSize={70} minSize={30}>
            <div className="h-full overflow-hidden bg-[#1e1e1e]">
              <MonacoEditor
                value={code}
                language={assignment.language}
                onChange={setCode}
                height="100%"
                className="h-full"
              />
            </div>
          </Panel>

          {/* Resize Handle */}
          <PanelResizeHandle className="h-1 bg-[#2d2d2d] hover:bg-[#5A7ACD] transition-colors relative group">
            <div className="absolute inset-x-0 -top-1 -bottom-1 flex items-center justify-center">
              <div className="h-1 w-12 bg-[#3d3d3d] group-hover:bg-[#5A7ACD] rounded-full transition-colors"></div>
            </div>
          </PanelResizeHandle>

          {/* Console Panel */}
          <Panel defaultSize={30} minSize={15}>
            <div className="h-full overflow-hidden">
              <ConsoleDrawer 
                output={consoleOutput}
                lastRunTime={lastRunTime}
                language={assignment.language}
                cursorPosition={cursorPosition}
              />
            </div>
          </Panel>
        </PanelGroup>
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <SubmitConfirmModal
          submissionsUsed={assignment.submissionsUsed}
          submissionsAllowed={assignment.submissionsAllowed}
          onConfirm={confirmSubmit}
          onCancel={() => setShowSubmitModal(false)}
        />
      )}
    </div>
  );
}
