import React, { useState, useEffect, useMemo, useRef } from "react";
import { Play, Send, RotateCcw, Save, Upload } from "lucide-react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { MonacoEditor } from "../editors";
import { ConsoleDrawer } from "./ConsoleDrawer";
import { SubmitConfirmModal } from "./SubmitConfirmModal";
import { EditorTabBar } from "./EditorTabBar";
import { UnsavedCloseModal } from "./UnsavedCloseModal";
import { FileTree, buildInitialFileTree, nextNodeId, getDefaultExtension } from "./filetree";
import {
  getWorkspaceState,
  setWorkspaceState,
  sanitizeLoadedState,
  type PersistedWorkspaceState,
} from "./assignmentWorkspaceStorage";
import type { FileTreeNode } from "./filetree";
import type { EditorCodeExamples } from "../../../types/assignment";

interface CodeWorkspaceProps {
  assignmentId: string;
  assignment: {
    language: string;
    hasStarterCode: boolean;
    submissionsUsed: number;
    submissionsAllowed: number | null;
  };
  codeExamples: EditorCodeExamples;
  onRunTests: () => void;
  onSubmit: (file: File) => Promise<void> | void;
  showUploadControls?: boolean;
  isMobile?: boolean;
}

function validateSubmissionFile(file: File): string | null {
  const lowerFileName = file.name.toLowerCase();
  if (!lowerFileName.endsWith(".py") && !lowerFileName.endsWith(".java")) {
    return "Only .py or .java files are allowed.";
  }
  return null;
}

export function CodeWorkspace({
  assignmentId,
  assignment,
  codeExamples,
  onRunTests,
  onSubmit,
  showUploadControls = false,
  isMobile = false,
}: CodeWorkspaceProps) {
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [consoleOutput, setConsoleOutput] = useState<string>("");
  const [lastRunTime, setLastRunTime] = useState<string | null>(null);
  const [autoSaved, setAutoSaved] = useState(true);
  const [cursorPosition, setCursorPosition] = useState({ line: 14, col: 8 });
  const [selectedSubmissionFile, setSelectedSubmissionFile] = useState<File | null>(null);
  const [submissionFileError, setSubmissionFileError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const initialCode = codeExamples[assignment.language] ?? codeExamples.Python ?? "";
  const [code, setCode] = useState(initialCode);

  const starterFileName = `main${getDefaultExtension(assignment.language)}`;
  const [treeState, setTreeState] = useState(() =>
    buildInitialFileTree(starterFileName, initialCode)
  );
  const { nodes, fileContents } = treeState;
  const [selectedId, setSelectedId] = useState<string | null>("main");
  const [openTabIds, setOpenTabIds] = useState<string[]>(["main"]);
  const [savedContents, setSavedContents] = useState<Record<string, string>>(() => ({ main: initialCode }));
  const [pendingCloseTabId, setPendingCloseTabId] = useState<string | null>(null);
  const [hasLoadedPersisted, setHasLoadedPersisted] = useState(false);
  const restoredFromPersistedRef = useRef(false);
  const selectionLockRef = useRef<string | null>(null);

  // Load persisted state for this assignment when assignmentId (or assignment/codeExamples) changes
  useEffect(() => {
    let cancelled = false;
    const starterFileName = `main${getDefaultExtension(assignment.language)}`;
    const initialCode = codeExamples[assignment.language] ?? codeExamples.Python ?? "";

    getWorkspaceState(assignmentId).then((persisted) => {
      if (cancelled) return;
      if (persisted) {
        const sanitized = sanitizeLoadedState(persisted);
        setTreeState({ nodes: sanitized.nodes as FileTreeNode[], fileContents: sanitized.fileContents });
        setOpenTabIds(sanitized.openTabIds);
        setSavedContents(sanitized.savedContents);
        setSelectedId(sanitized.selectedId);
        restoredFromPersistedRef.current = true;
      } else {
        const initial = buildInitialFileTree(starterFileName, initialCode);
        setTreeState(initial);
        setOpenTabIds(["main"]);
        setSavedContents({ main: initialCode });
        setSelectedId("main");
        restoredFromPersistedRef.current = false;
      }
      setHasLoadedPersisted(true);
    });
    return () => {
      cancelled = true;
    };
  }, [assignmentId, assignment.language, codeExamples]);

  // Sync server starter code into main only when we did not restore from persistence
  useEffect(() => {
    if (!hasLoadedPersisted || restoredFromPersistedRef.current) return;
    const next = codeExamples[assignment.language] ?? codeExamples.Python ?? "";
    setCode(next);
    setTreeState((prev) => ({
      ...prev,
      fileContents: { ...prev.fileContents, main: next },
    }));
    setSavedContents((prev) => ({ ...prev, main: next }));
  }, [assignment.language, codeExamples, hasLoadedPersisted]);

  const getNodeName = (id: string) => nodes.find((n) => String(n.id) === id)?.name ?? id;
  const isDirty = (id: string) => (fileContents[id] ?? "") !== (savedContents[id] ?? "");
  const hasAnyDirty = useMemo(
    () => openTabIds.some(isDirty),
    [openTabIds, fileContents, savedContents]
  );

  const handleSelectFile = (id: string) => {
    if (selectionLockRef.current !== null && id !== selectionLockRef.current) return;
    selectionLockRef.current = null;
    setSelectedId(id);
    setOpenTabIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
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
    setSavedContents((prev) => ({ ...prev, main: next }));
  }, [assignment.language, codeExamples, hasLoadedPersisted]);

  // Persist workspace state (debounced)
  const savePayloadRef = useRef<PersistedWorkspaceState | null>(null);
  useEffect(() => {
    if (!hasLoadedPersisted) return;
    const payload: PersistedWorkspaceState = {
      nodes: nodes.map((n) => ({
        id: String(n.id),
        name: n.name,
        parent: n.parent != null ? String(n.parent) : null,
        children: (n.children ?? []).map(String),
        isBranch: n.isBranch,
        metadata: n.metadata,
      })),
      fileContents: { ...fileContents },
      openTabIds: [...openTabIds],
      savedContents: { ...savedContents },
      selectedId,
    };
    savePayloadRef.current = payload;
    const t = setTimeout(() => {
      setWorkspaceState(assignmentId, payload).catch(() => {});
    }, 600);
    return () => clearTimeout(t);
  }, [assignmentId, hasLoadedPersisted, nodes, fileContents, openTabIds, savedContents, selectedId]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasAnyDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
      const payload = savePayloadRef.current;
      if (payload) setWorkspaceState(assignmentId, payload).catch(() => {});
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasAnyDirty, assignmentId]);

  const closeTab = (id: string, dirty?: boolean) => {
    const needConfirm = dirty === undefined ? isDirty(id) : dirty;
    if (needConfirm) {
      setPendingCloseTabId(id);
      return;
    }
    doCloseTab(id);
  };

  const doCloseTab = (id: string) => {
    setOpenTabIds((prev) => {
      const next = prev.filter((tid) => tid !== id);
      if (selectedId === id) {
        const nextActive = next.length > 0 ? next[next.length - 1] : null;
        setSelectedId(nextActive);
      }
      return next;
    });
    setPendingCloseTabId(null);
  };

  const handleSaveAll = () => {
    setSavedContents((prev) => ({ ...prev, ...fileContents }));
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        setSavedContents((prev) => {
          const next = { ...prev, ...fileContents };
          const changed = openTabIds.some((id) => (fileContents[id] ?? "") !== (prev[id] ?? ""));
          return changed ? next : prev;
        });
      }
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [fileContents, openTabIds]);

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
    setSavedContents((prev) => ({ ...prev, [newId]: "" }));
    setSelectedId(newId);
    setOpenTabIds((prev) => (prev.includes(newId) ? prev : [...prev, newId]));
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
    setSavedContents((prev) => {
      const next = { ...prev };
      toRemove.forEach((id) => delete next[id]);
      return next;
    });
    setOpenTabIds((prev) => {
      const next = prev.filter((tid) => !toRemove.has(tid));
      if (selectedId && toRemove.has(selectedId)) {
        const nextActive = next.length > 0 ? next[next.length - 1] : null;
        setSelectedId(nextActive);
      }
      return next;
    });
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
    setSavedContents((prev) => ({ ...prev, [newId]: prev[id] ?? "" }));
    setSelectedId(newId);
    setOpenTabIds((prev) => (prev.includes(newId) ? prev : [...prev, newId]));
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
    if (!showUploadControls) {
      return;
    }
    // FIX: Student submission now requires one valid local source file before opening submit confirmation.
    if (!selectedSubmissionFile) {
      setSubmissionFileError("Select one .py or .java file before submitting.");
      return;
    }
    setShowSubmitModal(true);
  };

  const handleFilePickerOpen = () => {
    uploadInputRef.current?.click();
  };

  const handleFileSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] ?? null;
    if (!selectedFile) {
      return;
    }
    const validationError = validateSubmissionFile(selectedFile);
    if (validationError) {
      setSelectedSubmissionFile(null);
      setSubmissionFileError(validationError);
      event.target.value = "";
      return;
    }
    setSelectedSubmissionFile(selectedFile);
    setSubmissionFileError(null);
  };

  const confirmSubmit = async () => {
    if (!selectedSubmissionFile || isSubmitting) {
      return;
    }
    setShowSubmitModal(false);
    setIsSubmitting(true);
    try {
      // NOTE: Parent page owns API call and status refresh; workspace only forwards the selected file.
      await onSubmit(selectedSubmissionFile);
    } catch {
      // NOTE: Keep selected file for retry and let page-level error banner explain failure reason.
    } finally {
      setIsSubmitting(false);
    }
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

            {/* Auto-save Indicator / Save all */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveAll}
                disabled={!hasAnyDirty}
                className="flex items-center gap-1.5 text-[12px] text-gray-500 hover:text-[#2B2A2A] disabled:opacity-50 disabled:pointer-events-none"
              >
                <Save className="w-3.5 h-3.5" strokeWidth={2} />
                <span>Save all</span>
              </button>
              <span className="text-[11px] text-gray-400">
                {hasAnyDirty ? "Unsaved changes" : "Saved"}
              </span>
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

            {showUploadControls ? (
              <>
                <input
                  ref={uploadInputRef}
                  type="file"
                  accept=".py,.java"
                  className="hidden"
                  onChange={handleFileSelection}
                />
                <button
                  onClick={handleFilePickerOpen}
                  className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-[#2B2A2A] rounded-lg text-[13px] font-medium transition-colors flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" strokeWidth={2} />
                  <span>Upload from computer</span>
                </button>
                {selectedSubmissionFile ? (
                  <span className="max-w-[220px] truncate text-[12px] text-gray-600" title={selectedSubmissionFile.name}>
                    {selectedSubmissionFile.name}
                  </span>
                ) : null}
                <button
                  onClick={handleSubmit}
                  disabled={!selectedSubmissionFile || isSubmitting}
                  className="px-4 py-2 bg-[#2B2A2A] hover:bg-[#3a3939] disabled:bg-[#7E7D7D] disabled:cursor-not-allowed text-white rounded-lg text-[13px] font-medium transition-colors flex items-center gap-2"
                >
                  <Send className="w-4 h-4" strokeWidth={2} />
                  <span>{isSubmitting ? "Submitting..." : "Submit"}</span>
                </button>
              </>
            ) : null}
          </div>
        </div>
        {showUploadControls && submissionFileError ? (
          <p className="mt-2 text-[12px] text-[#C23A42]">{submissionFileError}</p>
        ) : null}
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
                <div className="h-full flex flex-col overflow-hidden bg-[#1e1e1e]">
                  <EditorTabBar
                    tabs={openTabIds.map((id) => ({
                      id,
                      name: getNodeName(id),
                      dirty: isDirty(id),
                    }))}
                    activeId={selectedId}
                    onSelect={handleSelectFile}
                    onClose={closeTab}
                  />
                  <div className="flex-1 min-h-0">
                    <MonacoEditor
                      value={currentContent}
                      language={assignment.language}
                      onChange={setCurrentContent}
                      height="100%"
                      className="h-full"
                    />
                  </div>
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

      {/* Unsaved close tab modal */}
      {pendingCloseTabId && (
        <UnsavedCloseModal
          fileName={getNodeName(pendingCloseTabId)}
          onDiscard={() => doCloseTab(pendingCloseTabId)}
          onCancel={() => setPendingCloseTabId(null)}
        />
      )}
    </div>
  );
}
