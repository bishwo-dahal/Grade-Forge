import React, { useState, useEffect, useMemo, useRef } from "react";
import { Eye, Loader2, Play, Send, RotateCcw, Save, Upload } from "lucide-react";
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
import type {
  FacultyEditorPreviewPayload,
  FacultySubmissionFileOption,
} from "../../../types/submission";

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
  showFacultyViewerControls?: boolean;
  facultySubmissionFileOptions?: FacultySubmissionFileOption[];
  onRequestFacultyEditorPreview?: (optionId: string) => Promise<FacultyEditorPreviewPayload>;
  isMobile?: boolean;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  const apiMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
  if (typeof apiMessage === "string" && apiMessage.trim()) {
    return apiMessage;
  }
  return "Unable to submit file.";
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
  showFacultyViewerControls = false,
  facultySubmissionFileOptions = [],
  onRequestFacultyEditorPreview,
  isMobile = false,
}: CodeWorkspaceProps) {
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [consoleOutput, setConsoleOutput] = useState<string>("");
  const [lastRunTime, setLastRunTime] = useState<string | null>(null);
  const [autoSaved, setAutoSaved] = useState(true);
  const [cursorPosition, setCursorPosition] = useState({ line: 14, col: 8 });
  const [selectedSubmissionFile, setSelectedSubmissionFile] = useState<File | null>(null);
  const [submissionFileError, setSubmissionFileError] = useState<string | null>(null);
  const [submissionStatusMessage, setSubmissionStatusMessage] = useState<string | null>(null);
  const [submitModalError, setSubmitModalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFacultyViewerModal, setShowFacultyViewerModal] = useState(false);
  const [selectedFacultyOptionId, setSelectedFacultyOptionId] = useState<string>("");
  const [isFacultyViewerLoading, setIsFacultyViewerLoading] = useState(false);
  const [facultyViewerError, setFacultyViewerError] = useState<string | null>(null);
  const [facultyPreviewLanguage, setFacultyPreviewLanguage] = useState<string | null>(null);
  const [isFacultyEditorReadOnly, setIsFacultyEditorReadOnly] = useState(false);
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

  useEffect(() => {
    // NOTE: Reset faculty preview state when assignment context changes.
    setFacultyPreviewLanguage(null);
    setIsFacultyEditorReadOnly(false);
    setShowFacultyViewerModal(false);
    setFacultyViewerError(null);
    setSelectedFacultyOptionId("");
  }, [assignmentId]);

  useEffect(() => {
    if (!showFacultyViewerModal) {
      return;
    }

    if (!facultySubmissionFileOptions.length) {
      setSelectedFacultyOptionId("");
      return;
    }

    const selectedStillExists = facultySubmissionFileOptions.some(
      (option) => option.optionId === selectedFacultyOptionId,
    );
    if (!selectedStillExists) {
      // NOTE: Default to first available file so faculty can preview quickly without extra clicks.
      setSelectedFacultyOptionId(facultySubmissionFileOptions[0].optionId);
    }
  }, [showFacultyViewerModal, facultySubmissionFileOptions, selectedFacultyOptionId]);

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
    setSubmitModalError(null);
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
      // CLEANUP: Clear stale success state whenever a new invalid file is selected.
      setSubmissionStatusMessage(null);
      event.target.value = "";
      return;
    }
    setSelectedSubmissionFile(selectedFile);
    setSubmissionFileError(null);
    setSubmissionStatusMessage(null);
  };

  const confirmSubmit = async () => {
    if (!selectedSubmissionFile || isSubmitting) {
      return;
    }
    setSubmitModalError(null);
    setIsSubmitting(true);
    try {
      // NOTE: Parent page owns API call and status refresh; workspace only forwards the selected file.
      await onSubmit(selectedSubmissionFile);
      setShowSubmitModal(false);
      // FIX: Success message is shown only after backend confirms persistence.
      setSubmissionStatusMessage("Submitted successfully.");
    } catch (error) {
      // NOTE: Keep modal open and selected file for retry when API save fails.
      setSubmitModalError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const openFacultyViewer = () => {
    setFacultyViewerError(null);
    setShowFacultyViewerModal(true);
  };

  const closeFacultyViewer = () => {
    if (isFacultyViewerLoading) {
      return;
    }
    setShowFacultyViewerModal(false);
    setFacultyViewerError(null);
  };

  const showSelectedFacultyFileInEditor = async () => {
    if (!selectedFacultyOptionId) {
      setFacultyViewerError("Choose a submission file first.");
      return;
    }
    if (!onRequestFacultyEditorPreview) {
      setFacultyViewerError("Preview action is unavailable.");
      return;
    }

    setFacultyViewerError(null);
    setIsFacultyViewerLoading(true);
    try {
      const previewPayload = await onRequestFacultyEditorPreview(selectedFacultyOptionId);
      // FIX: Replace current workspace content with selected submission code so faculty can inspect exact source.
      const previewTree = buildInitialFileTree(previewPayload.fileName, previewPayload.content);
      setTreeState(previewTree);
      setOpenTabIds(["main"]);
      setSavedContents({ main: previewPayload.content });
      setSelectedId("main");
      setCode(previewPayload.content);
      setFacultyPreviewLanguage(previewPayload.language);
      setIsFacultyEditorReadOnly(true);
      setShowFacultyViewerModal(false);
    } catch (error) {
      setFacultyViewerError(getErrorMessage(error));
    } finally {
      setIsFacultyViewerLoading(false);
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

            {showFacultyViewerControls ? (
              <button
                onClick={openFacultyViewer}
                className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-[#2B2A2A] rounded-lg text-[13px] font-medium transition-colors flex items-center gap-2"
              >
                <Eye className="w-4 h-4" strokeWidth={2} />
                <span>See in editor</span>
              </button>
            ) : null}

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
        {showUploadControls && (submissionFileError || submissionStatusMessage) ? (
          <p className={`mt-2 text-[12px] ${submissionFileError ? "text-[#C23A42]" : "text-[#1E7A3F]"}`}>
            {submissionFileError ?? submissionStatusMessage}
          </p>
        ) : null}
        {showFacultyViewerControls && isFacultyEditorReadOnly ? (
          <p className="mt-2 text-[12px] text-[#5D6A80]">
            {/* NOTE: Faculty preview opens submissions in read-only mode to prevent accidental edits during review. */}
            Viewing selected submission in read-only editor mode.
          </p>
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
                      language={facultyPreviewLanguage ?? assignment.language}
                      onChange={setCurrentContent}
                      readOnly={isFacultyEditorReadOnly}
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

      {showFacultyViewerModal ? (
        <div className="fixed inset-0 bg-black/40 z-50 p-4 flex items-center justify-center">
          <div className="w-full max-w-lg bg-white rounded-xl border border-gray-200 shadow-2xl">
            <div className="px-5 py-4 border-b border-gray-200">
              <h3 className="text-[16px] font-semibold text-[#2B2A2A]">See in editor</h3>
              <p className="text-[12px] text-gray-600 mt-1">
                Select a student submission file, then load it into the editor in read-only mode.
              </p>
            </div>
            <div className="px-5 py-4">
              {facultySubmissionFileOptions.length > 0 ? (
                <div className="space-y-2">
                  <label className="block text-[12px] font-medium text-[#2B2A2A]">Submission file</label>
                  <select
                    value={selectedFacultyOptionId}
                    onChange={(event) => setSelectedFacultyOptionId(event.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-gray-300 text-[13px] text-[#2B2A2A] focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]/30"
                  >
                    {facultySubmissionFileOptions.map((option) => (
                      <option key={option.optionId} value={option.optionId}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                // NOTE: Explicit empty state avoids a confusing disabled action when no submissions exist yet.
                <p className="text-[13px] text-gray-600">No submission files are available for this assignment yet.</p>
              )}
              {facultyViewerError ? (
                <p className="mt-3 text-[12px] text-[#C23A42]">{facultyViewerError}</p>
              ) : null}
            </div>
            <div className="px-5 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeFacultyViewer}
                disabled={isFacultyViewerLoading}
                className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-100 rounded-lg text-[13px] text-[#2B2A2A] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void showSelectedFacultyFileInEditor()}
                disabled={!selectedFacultyOptionId || isFacultyViewerLoading || facultySubmissionFileOptions.length === 0}
                className="px-4 py-2 bg-[#2B2A2A] hover:bg-[#3a3939] rounded-lg text-[13px] text-white disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isFacultyViewerLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
                    <span>Loading...</span>
                  </>
                ) : (
                  <span>Show in editor</span>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <SubmitConfirmModal
          submissionsUsed={assignment.submissionsUsed}
          submissionsAllowed={assignment.submissionsAllowed}
          onConfirm={confirmSubmit}
          onCancel={() => {
            if (isSubmitting) {
              return;
            }
            setShowSubmitModal(false);
            setSubmitModalError(null);
          }}
          isSubmitting={isSubmitting}
          errorMessage={submitModalError}
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
