import React, { useState, useEffect, useMemo, useRef } from "react";
import { Play, Send, RotateCcw, Save } from "lucide-react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { MonacoEditor } from "../editors";
import { ConsoleDrawer } from "./ConsoleDrawer";
import { SubmitConfirmModal } from "./SubmitConfirmModal";
import { FileTree, buildInitialFileTree, nextNodeId, getDefaultExtension } from "./filetree";
import type { FileTreeNode } from "./filetree";
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

  const starterFileName = `main${getDefaultExtension(assignment.language)}`;
  const [treeState, setTreeState] = useState(() =>
    buildInitialFileTree(starterFileName, initialCode)
  );
  const { nodes, fileContents } = treeState;
  const [selectedId, setSelectedId] = useState<string | null>("main");
  const selectionLockRef = useRef<string | null>(null);

  const handleSelectFile = (id: string) => {
    if (selectionLockRef.current !== null && id !== selectionLockRef.current) return;
    selectionLockRef.current = null;
    setSelectedId(id);
  };

  const setNodes = (updater: (prev: FileTreeNode[]) => FileTreeNode[]) =>
    setTreeState((prev) => ({ ...prev, nodes: updater(prev.nodes) }));
  const setFileContents = (updater: (prev: Record<string, string>) => Record<string, string>) =>
    setTreeState((prev) => ({ ...prev, fileContents: updater(prev.fileContents) }));

  const currentContent = selectedId ? (fileContents[selectedId] ?? "") : "";
  const setCurrentContent = (value: string) => {
    if (selectedId) setFileContents((prev) => ({ ...prev, [selectedId]: value }));
  };

  useEffect(() => {
    const next = codeExamples[assignment.language] ?? codeExamples.Python ?? "";
    setCode(next);
    setTreeState((prev) => ({
      ...prev,
      fileContents: { ...prev.fileContents, main: next },
    }));
  }, [assignment.language, codeExamples]);

  const allIds = useMemo(() => nodes.map((n) => String(n.id)), [nodes]);
  const getDescendantIds = (id: string): string[] => {
    const node = nodes.find((n) => String(n.id) === id);
    if (!node) return [];
    const kids = (node.children || []).map(String);
    return kids.concat(kids.flatMap(getDescendantIds));
  };

  const onCreateFile = (parentId: string) => {
    const newId = nextNodeId("file", allIds);
    const ext = getDefaultExtension(assignment.language);
    setNodes((prev) => {
      const next = prev.map((n) =>
        String(n.id) === parentId
          ? { ...n, children: [...(n.children || []), newId], isBranch: true }
          : n
      );
      return [
        ...next,
        {
          id: newId,
          name: `untitled${ext}`,
          parent: parentId,
          children: [],
          metadata: { isFolder: false },
        },
      ];
    });
    setFileContents((prev) => ({ ...prev, [newId]: "" }));
    setSelectedId(newId);
    selectionLockRef.current = newId;
    setTimeout(() => {
      selectionLockRef.current = null;
    }, 500);
  };

  const onCreateFolder = (parentId: string) => {
    const newId = nextNodeId("folder", allIds);
    setNodes((prev) => {
      const next = prev.map((n) =>
        String(n.id) === parentId
          ? { ...n, children: [...(n.children || []), newId], isBranch: true }
          : n
      );
      return [
        ...next,
        {
          id: newId,
          name: "New Folder",
          parent: parentId,
          children: [],
          isBranch: true,
          metadata: { isFolder: true },
        },
      ];
    });
  };

  const onRename = (id: string, newName: string) => {
    setNodes((prev) =>
      prev.map((n) => (String(n.id) === id ? { ...n, name: newName } : n))
    );
  };

  const onDelete = (id: string) => {
    const toRemove = new Set([id, ...getDescendantIds(id)]);
    setNodes((prev) => {
      const filtered = prev.filter((n) => !toRemove.has(String(n.id)));
      return filtered.map((n) => {
        if (n.children?.includes(id as never)) {
          return { ...n, children: n.children.filter((c) => !toRemove.has(String(c))) };
        }
        return n;
      });
    });
    setFileContents((prev) => {
      const next = { ...prev };
      toRemove.forEach((id) => delete next[id]);
      return next;
    });
    if (selectedId && toRemove.has(selectedId)) {
      const remaining = nodes.find((n) => !toRemove.has(String(n.id)) && !n.metadata?.isFolder);
      setSelectedId(remaining ? String(remaining.id) : null);
    }
  };

  const onDuplicate = (id: string) => {
    const node = nodes.find((n) => String(n.id) === id);
    if (!node || node.metadata?.isFolder) return;
    const parentId = String(node.parent);
    const newId = nextNodeId("file", allIds);
    const base = node.name.replace(/\.[^.]+$/, "") || "copy";
    const ext = node.name.includes(".") ? node.name.replace(/^.*\./, ".") : getDefaultExtension(assignment.language);
    setNodes((prev) => {
      const next = prev.map((n) =>
        String(n.id) === parentId ? { ...n, children: [...(n.children || []), newId], isBranch: true } : n
      );
      return [
        ...next,
        { ...node, id: newId, name: `${base} (copy)${ext}`, parent: parentId, children: [] },
      ];
    });
    setFileContents((prev) => ({ ...prev, [newId]: prev[id] ?? "" }));
    setSelectedId(newId);
    selectionLockRef.current = newId;
    setTimeout(() => {
      selectionLockRef.current = null;
    }, 500);
  };

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
        <PanelGroup direction="horizontal">
          <Panel defaultSize={18} minSize={12} maxSize={35}>
            <FileTree
              nodes={nodes}
              selectedId={selectedId}
              onSelect={handleSelectFile}
              protectedFileIds={assignment.hasStarterCode ? ["main"] : []}
              onCreateFile={onCreateFile}
              onCreateFolder={onCreateFolder}
              onRename={onRename}
              onDelete={onDelete}
              onDuplicate={onDuplicate}
            />
          </Panel>
          <PanelResizeHandle className="w-1 bg-[#2d2d2d] hover:bg-[#5A7ACD] transition-colors" />
          <Panel defaultSize={82} minSize={50}>
            <PanelGroup direction="vertical">
              {/* Editor Panel */}
              <Panel defaultSize={70} minSize={30}>
                <div className="h-full overflow-hidden bg-[#1e1e1e]">
                  <MonacoEditor
                    value={currentContent}
                    language={assignment.language}
                    onChange={setCurrentContent}
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
