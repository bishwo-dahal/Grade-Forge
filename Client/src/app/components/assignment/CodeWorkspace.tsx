import React, { useState, useEffect, useMemo, useRef } from "react";
import { Loader2, Play, Send, RotateCcw, Save, Upload, CheckSquare, X, AlertCircle } from "lucide-react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { MonacoEditor } from "../editors";
import { ConsoleDrawer } from "./ConsoleDrawer";
import { SubmitConfirmModal } from "./SubmitConfirmModal";
import { EditorTabBar } from "./EditorTabBar";
import { UnsavedCloseModal } from "./UnsavedCloseModal";
import { FileTree, buildEmptyFileTree, buildInitialFileTree, buildFileTreeFromFiles, nextNodeId, nextUntitledFileName, uniqueFileName, getDefaultExtension } from "./filetree";
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
  FacultySubmissionGradePayload,
  FacultySubmissionGradeOption,
  FacultyAssignmentSubmissionRow,
} from "../../../types/submission";
import type { TestRunJobStatusResponse } from "../../../types/runTests";

interface CodeWorkspaceProps {
  assignmentId: string;
  assignment: {
    language: string;
    hasStarterCode: boolean;
    submissionsUsed: number;
    submissionsAllowed: number | null;
    /** Optional comma-separated list of allowed source extensions for this assignment's language (e.g. ".py,.txt,.csv"). */
    languageAllowedExtensions?: string | null;
  };
  codeExamples: EditorCodeExamples;
  /** Called when Run Tests is clicked. Receives current workspace files and optional custom stdin (students only). */
  onRunTests: (files?: File[], customStdin?: string) => void;
  /** When true, pass customStdin when Run Tests is clicked (students; value comes from Test Cases tab). */
  showCustomStdin?: boolean;
  /** Custom stdin from Test Cases tab; used when Run Tests is clicked. */
  customStdin?: string;
  onSubmit: (files: File[]) => Promise<void> | void;
  showUploadControls?: boolean;
  showFacultyGradeControls?: boolean;
  facultySubmissionRows?: FacultyAssignmentSubmissionRow[];
  onSubmitFacultyGrade?: (payload: FacultySubmissionGradePayload) => Promise<void>;
  maxGradePoints?: number;
  facultyEditorPreviewPayload?: FacultyEditorPreviewPayload | null;
  isMobile?: boolean;
  /** When provided, console shows live run state and results instead of mock output */
  runLoading?: boolean;
  runError?: string | null;
  runResult?: TestRunJobStatusResponse | null;
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

function validateSubmissionFile(
  file: File,
  opts: { languageName: string; languageAllowedExtensions?: string | null }
): string | null {
  const lowerFileName = file.name.toLowerCase();
  const dotIndex = lowerFileName.lastIndexOf(".");
  const ext = dotIndex >= 0 ? lowerFileName.slice(dotIndex) : "";

  const normalizedLang = opts.languageName.toLowerCase();

  const allowedFromLanguage = (opts.languageAllowedExtensions ?? "")
    .split(",")
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);

  if (!allowedFromLanguage.length) {
    if (normalizedLang.includes("python")) {
      allowedFromLanguage.push(".py");
    } else if (normalizedLang.includes("java")) {
      allowedFromLanguage.push(".java");
    }
  }

  const alwaysAllowed = [".txt", ".csv"];
  const allowedExtensions = Array.from(new Set([...allowedFromLanguage, ...alwaysAllowed]));

  if (allowedExtensions.includes(ext)) {
    return null;
  }

  if (!ext) {
    return `This assignment only accepts files with extensions: ${allowedExtensions.join(", ")}.`;
  }

  const distinctAllowed = allowedExtensions.join(", ");
  return `Only ${distinctAllowed} files are allowed for this assignment. '${ext}' is not an allowed file type.`;
}

function getSubmissionMimeType(fileName: string): string {
  return fileName.toLowerCase().endsWith(".java") ? "text/x-java-source" : "text/x-python";
}

export function CodeWorkspace({
  assignmentId,
  assignment,
  codeExamples,
  onRunTests,
  onSubmit,
  showUploadControls = false,
  showFacultyGradeControls = false,
  showCustomStdin = false,
  customStdin: customStdinProp = "",
  facultySubmissionRows = [],
  onSubmitFacultyGrade,
  maxGradePoints,
  facultyEditorPreviewPayload = null,
  isMobile = false,
  runLoading = false,
  runError = null,
  runResult = null,
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
  /** Modal for workspace errors/success (upload validation, add file, submit success, run progress). */
  const [workspaceNotification, setWorkspaceNotification] = useState<{
    message: string;
    type: "error" | "success" | "info";
  } | null>(null);
  const [showFacultyGradeModal, setShowFacultyGradeModal] = useState(false);
  const [selectedGradeSubmissionId, setSelectedGradeSubmissionId] = useState<string>("");
  const [facultyGradeInput, setFacultyGradeInput] = useState<string>("");
  const [facultyGradeFeedback, setFacultyGradeFeedback] = useState<string>("");
  const [facultyGradeError, setFacultyGradeError] = useState<string | null>(null);
  const [facultyGradeStatusMessage, setFacultyGradeStatusMessage] = useState<string | null>(null);
  const [isFacultyGradeSubmitting, setIsFacultyGradeSubmitting] = useState(false);
  const [facultyPreviewLanguage, setFacultyPreviewLanguage] = useState<string | null>(null);
  const [isFacultyEditorReadOnly, setIsFacultyEditorReadOnly] = useState(false);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const addToEditorInputRef = useRef<HTMLInputElement | null>(null);
  // Start with an empty workspace for new assignments; starter code is no longer auto-loaded.
  const [code, setCode] = useState("");

  const [treeState, setTreeState] = useState(() => buildEmptyFileTree());
  const { nodes, fileContents } = treeState;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [openTabIds, setOpenTabIds] = useState<string[]>([]);
  const [savedContents, setSavedContents] = useState<Record<string, string>>({});
  const [pendingCloseTabId, setPendingCloseTabId] = useState<string | null>(null);
  const [hasLoadedPersisted, setHasLoadedPersisted] = useState(false);
  const restoredFromPersistedRef = useRef(false);
  const selectionLockRef = useRef<string | null>(null);
  const facultyEditorPreviewPayloadRef = useRef(facultyEditorPreviewPayload);
  facultyEditorPreviewPayloadRef.current = facultyEditorPreviewPayload;

  /** Review mode = viewing a submission (faculty/GA). No load/save from IndexedDB. Edit mode = student or editing; use persistence. */
  const isReviewMode = facultyEditorPreviewPayload != null;

  // Load persisted state for this assignment (edit mode only; review mode never touches IndexedDB)
  useEffect(() => {
    let cancelled = false;
    if (facultyEditorPreviewPayloadRef.current) {
      // Review mode: initialize from payload only, do not read from IndexedDB
      const payload = facultyEditorPreviewPayloadRef.current;
      const files = payload.files && payload.files.length > 0 ? payload.files : null;
      if (files) {
        const { nodes: previewNodes, fileContents: previewContents } = buildFileTreeFromFiles(files);
        const childIds = previewNodes
          .filter((n) => (n.metadata as { isFolder?: boolean })?.isFolder === false)
          .map((n) => String(n.id));
        setTreeState({ nodes: previewNodes, fileContents: previewContents });
        setOpenTabIds(childIds);
        setSavedContents(previewContents);
        setSelectedId(childIds[0] ?? "main");
        setCode(previewContents[childIds[0] ?? "main"] ?? "");
      } else {
        const previewTree = buildInitialFileTree(payload.fileName, payload.content);
        setTreeState(previewTree);
        setOpenTabIds(["main"]);
        setSavedContents({ main: payload.content });
        setSelectedId("main");
        setCode(payload.content);
      }
      setFacultyPreviewLanguage(payload.language);
      setIsFacultyEditorReadOnly(true);
      restoredFromPersistedRef.current = false;
      setHasLoadedPersisted(true);
      return;
    }

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
        const initial = buildEmptyFileTree();
        setTreeState(initial);
        setOpenTabIds([]);
        setSavedContents({});
        setSelectedId(null);
        setCode("");
        restoredFromPersistedRef.current = false;
      }
      setHasLoadedPersisted(true);
    });
    return () => {
      cancelled = true;
    };
  }, [assignmentId, assignment.language, codeExamples, facultyEditorPreviewPayload]);

  useEffect(() => {
    // NOTE: Reset faculty preview state when assignment context changes.
    setFacultyPreviewLanguage(null);
    setIsFacultyEditorReadOnly(false);
    setShowFacultyGradeModal(false);
    setSelectedGradeSubmissionId("");
    setFacultyGradeInput("");
    setFacultyGradeFeedback("");
    setFacultyGradeError(null);
    setFacultyGradeStatusMessage(null);
  }, [assignmentId]);

  useEffect(() => {
    if (!facultyEditorPreviewPayload) {
      return;
    }
    const payload = facultyEditorPreviewPayload;
    const files = payload.files && payload.files.length > 0 ? payload.files : null;
    if (files) {
      const { nodes: previewNodes, fileContents: previewContents } = buildFileTreeFromFiles(files);
      const childIds = previewNodes
        .filter((n) => (n.metadata as { isFolder?: boolean })?.isFolder === false)
        .map((n) => String(n.id));
      setTreeState({ nodes: previewNodes, fileContents: previewContents });
      setOpenTabIds(childIds);
      setSavedContents(previewContents);
      setSelectedId(childIds[0] ?? "main");
      setCode(previewContents[childIds[0] ?? "main"] ?? "");
    } else {
      const previewTree = buildInitialFileTree(payload.fileName, payload.content);
      setTreeState(previewTree);
      setOpenTabIds(["main"]);
      setSavedContents({ main: payload.content });
      setSelectedId("main");
      setCode(payload.content);
    }
    setFacultyPreviewLanguage(payload.language);
    setIsFacultyEditorReadOnly(true);
  }, [facultyEditorPreviewPayload]);

  const facultyGradeOptions = useMemo<FacultySubmissionGradeOption[]>(() => {
    // NOTE: Grade choices are submission-based (not file-based) so one grade maps to one submission record.
    return facultySubmissionRows.map((submissionRow) => ({
      submissionId: submissionRow.submissionId,
      studentName: submissionRow.studentName,
      submittedAt: submissionRow.submittedAt,
      currentMarks: submissionRow.marks,
      label: `${submissionRow.studentName} - ${submissionRow.submittedAt}`,
    }));
  }, [facultySubmissionRows]);

  useEffect(() => {
    if (!showFacultyGradeModal) {
      return;
    }
    if (!facultyGradeOptions.length) {
      setSelectedGradeSubmissionId("");
      return;
    }
    const selectedExists = facultyGradeOptions.some(
      (option) => option.submissionId === selectedGradeSubmissionId,
    );
    if (!selectedExists) {
      setSelectedGradeSubmissionId(facultyGradeOptions[0].submissionId);
      if (facultyGradeOptions[0].currentMarks !== null) {
        setFacultyGradeInput(String(facultyGradeOptions[0].currentMarks));
      }
    }
  }, [showFacultyGradeModal, facultyGradeOptions, selectedGradeSubmissionId]);

  // Show run tests progress/error in workspace notification modal
  useEffect(() => {
    if (runLoading) {
      setWorkspaceNotification({ message: "Running tests...", type: "info" });
      return;
    }
    setWorkspaceNotification((prev) => {
      if (prev?.message === "Running tests...") {
        if (runError) return { message: runError, type: "error" };
        return null;
      }
      return prev;
    });
  }, [runLoading, runError]);

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
    if (isReviewMode) return;
    const next = codeExamples[assignment.language] ?? codeExamples.Python ?? "";
    if (!next) return;

    const hasAnyFileNode = nodes.some(
      (node) => (node.metadata as { isFolder?: boolean })?.isFolder === false,
    );
    if (!hasAnyFileNode) {
      const fallbackFileName = `main${getDefaultExtension(assignment.language)}`;
      const seededTree = buildInitialFileTree(fallbackFileName, next);
      setTreeState(seededTree);
      setOpenTabIds(["main"]);
      setSelectedId("main");
      setSavedContents({ main: next });
      setCode(next);
      return;
    }

    setCode(next);
    setTreeState((prev) => ({
      ...prev,
      fileContents: { ...prev.fileContents, main: next },
    }));
    setSavedContents((prev) => ({ ...prev, main: next }));
  }, [assignment.language, codeExamples, hasLoadedPersisted, isReviewMode, nodes]);

  // Persist workspace state (debounced) — edit mode only; review mode never writes to IndexedDB
  const savePayloadRef = useRef<PersistedWorkspaceState | null>(null);
  useEffect(() => {
    if (!hasLoadedPersisted || isReviewMode) return;
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
  }, [assignmentId, hasLoadedPersisted, isReviewMode, nodes, fileContents, openTabIds, savedContents, selectedId]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasAnyDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
      if (isReviewMode) return;
      const payload = savePayloadRef.current;
      if (payload) setWorkspaceState(assignmentId, payload).catch(() => {});
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasAnyDirty, assignmentId, isReviewMode]);

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

  // Sync run-tests state from parent to console (student/faculty run tests)
  useEffect(() => {
    if (runLoading) {
      setConsoleOutput("Running tests...\n");
      return;
    }
    if (runError) {
      setConsoleOutput(`Running tests...\n\nError: ${runError}`);
      return;
    }
    if (runResult) {
      const lines: string[] = ["Running tests...\n"];
      runResult.results.forEach((r, i) => {
        const status =
          r.passed === true ? "PASSED \u2713" : r.passed === false ? "FAILED \u2717" : "Custom input";
        lines.push(`Test ${i + 1}: ${r.testCaseTitle} - ${status}`);
        if (r.passed === false) {
          if (r.expectedOutput != null) lines.push(`  Expected: ${r.expectedOutput}`);
          if (r.actualOutput != null) lines.push(`  Got: ${r.actualOutput}`);
          if (r.errorMessage) lines.push(`  Error: ${r.errorMessage}`);
        } else if (r.passed === null && (r.actualOutput != null || r.errorMessage)) {
          if (r.actualOutput != null) lines.push(`  Output: ${r.actualOutput}`);
          if (r.errorMessage) lines.push(`  Error: ${r.errorMessage}`);
        }
        if (r.runtimeMs != null) lines.push(`  (${r.runtimeMs}ms)`);
      });
      lines.push("", `${runResult.passedCount}/${runResult.totalCount} tests passed`);
      setConsoleOutput(lines.join("\n"));
    }
  }, [runLoading, runError, runResult]);

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
    const existingFileNames = nodes
      .filter((n) => (n.metadata as { isFolder?: boolean })?.isFolder === false)
      .map((n) => n.name);
    const uniqueName = nextUntitledFileName(ext, existingFileNames);
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
          name: uniqueName,
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
    setConsoleOutput("Running tests...\n");
    const fileNodes = nodes.filter((n) => !(n.metadata as { isFolder?: boolean })?.isFolder);
    const files = fileNodes.map((n) => new File([fileContents[String(n.id)] ?? ""], n.name));
    onRunTests(files, showCustomStdin ? (customStdinProp.trim() || undefined) : undefined);
  };

  const handleSubmit = () => {
    if (!showUploadControls) {
      return;
    }
    // FIX: Student can submit either an uploaded source file or non-empty editor code.
    if (!canSubmit) {
      setSubmissionFileError("Upload a .py/.java file or add code in the editor before submitting.");
      return;
    }
    setSubmissionFileError(null);
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
    const validationError = validateSubmissionFile(selectedFile, {
      languageName: assignment.language,
      languageAllowedExtensions: assignment.languageAllowedExtensions ?? null,
    });
    if (validationError) {
      setSelectedSubmissionFile(null);
      setSubmissionFileError(validationError);
      setSubmissionStatusMessage(null);
      setWorkspaceNotification({ message: validationError, type: "error" });
      event.target.value = "";
      return;
    }
    setSelectedSubmissionFile(selectedFile);
    setSubmissionFileError(null);
    setSubmissionStatusMessage(null);
  };

  const handleAddFileToEditor = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    event.target.value = "";
    if (!fileList?.length) return;
    const validationOpts = {
      languageName: assignment.language,
      languageAllowedExtensions: assignment.languageAllowedExtensions ?? null,
    };
    const invalidResults: string[] = [];
    const validFiles: File[] = [];
    for (const f of Array.from(fileList)) {
      const err = validateSubmissionFile(f, validationOpts);
      if (err) invalidResults.push(`${f.name}: ${err}`);
      else validFiles.push(f);
    }
    if (invalidResults.length > 0) {
      const message =
        invalidResults.length === 1
          ? invalidResults[0]
          : `${invalidResults.length} file(s) not allowed. ${invalidResults[0].split(": ")[1] ?? invalidResults[0]}`;
      setWorkspaceNotification({ message, type: "error" });
      return;
    }
    if (!validFiles.length) return;
    const files = validFiles;
    const contents = await Promise.all(
      files.map(
        (f) =>
          new Promise<string>((res, rej) => {
            const r = new FileReader();
            r.onload = () => res(String(r.result ?? ""));
            r.onerror = () => rej(r.error);
            r.readAsText(f);
          })
      )
    );
    const projectId = "project";
    let ids = [...allIds];
    const newIds: string[] = [];
    for (let i = 0; i < files.length; i++) {
      newIds.push(nextNodeId("file", ids));
      ids = [...ids, newIds[newIds.length - 1]];
    }
    const existingFileNames = nodes
      .filter((n) => (n.metadata as { isFolder?: boolean })?.isFolder === false)
      .map((n) => n.name);
    const namesToUse: string[] = [];
    let currentExisting = [...existingFileNames];
    for (const f of files) {
      const uniqueName = uniqueFileName(f.name, currentExisting);
      namesToUse.push(uniqueName);
      currentExisting.push(uniqueName);
    }
    const newNodes: FileTreeNode[] = files.map((f, i) => ({
      id: newIds[i],
      name: namesToUse[i],
      parent: projectId,
      children: [] as string[],
      metadata: { isFolder: false },
    }));
    setNodes((prev) => {
      const next = prev.map((n) =>
        String(n.id) === projectId
          ? { ...n, children: [...(n.children || []), ...newIds], isBranch: true }
          : n
      );
      return [...next, ...newNodes];
    });
    const newContents = Object.fromEntries(newIds.map((id, i) => [id, contents[i]]));
    setFileContents((prev) => ({ ...prev, ...newContents }));
    setSavedContents((prev) => ({ ...prev, ...newContents }));
    setOpenTabIds((prev) => [...new Set([...prev, ...newIds])]);
    setSelectedId(newIds[newIds.length - 1] ?? null);
    setWorkspaceNotification({
      message: files.length === 1 ? "File added to workspace." : `${files.length} files added to workspace.`,
      type: "success",
    });
  };

  const confirmSubmit = async () => {
    if (isSubmitting) {
      return;
    }
    const filesToSubmit: File[] = selectedSubmissionFile
      ? [selectedSubmissionFile]
      : editorSubmissionFiles.map(({ fileName, content }) =>
          new File([content], fileName, { type: getSubmissionMimeType(fileName) })
        );
    if (!filesToSubmit.length) {
      setSubmitModalError("Upload a .py/.java file or add code in the editor before submitting.");
      return;
    }
    setSubmitModalError(null);
    setIsSubmitting(true);
    try {
      await onSubmit(filesToSubmit);
      setShowSubmitModal(false);
      setSubmissionStatusMessage("Submitted successfully.");
      setWorkspaceNotification({ message: "Submitted successfully.", type: "success" });
    } catch (error) {
      setSubmitModalError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const openFacultyGradeModal = () => {
    setFacultyGradeError(null);
    setFacultyGradeStatusMessage(null);
    setShowFacultyGradeModal(true);
    if (facultyGradeOptions.length > 0 && !selectedGradeSubmissionId) {
      setSelectedGradeSubmissionId(facultyGradeOptions[0].submissionId);
      if (facultyGradeOptions[0].currentMarks !== null) {
        setFacultyGradeInput(String(facultyGradeOptions[0].currentMarks));
      }
    }
  };

  const closeFacultyGradeModal = () => {
    if (isFacultyGradeSubmitting) {
      return;
    }
    setShowFacultyGradeModal(false);
    setFacultyGradeError(null);
  };

  const submitFacultyGrade = async () => {
    if (!onSubmitFacultyGrade) {
      setFacultyGradeError("Grade action is unavailable.");
      return;
    }
    if (!selectedGradeSubmissionId) {
      setFacultyGradeError("Choose a submission first.");
      return;
    }
    const parsedMarks = Number(facultyGradeInput);
    if (!Number.isFinite(parsedMarks) || parsedMarks < 0) {
      setFacultyGradeError("Enter a valid grade (0 or higher).");
      return;
    }
    if (typeof maxGradePoints === "number" && parsedMarks > maxGradePoints) {
      setFacultyGradeError(`Grade cannot exceed ${maxGradePoints}.`);
      return;
    }

    setFacultyGradeError(null);
    setIsFacultyGradeSubmitting(true);
    try {
      await onSubmitFacultyGrade({
        submissionId: selectedGradeSubmissionId,
        marks: parsedMarks,
        feedback: facultyGradeFeedback.trim(),
      });
      // FIX: Show explicit success after backend grade update so faculty knows save completed.
      setFacultyGradeStatusMessage("Grade submitted successfully.");
      setShowFacultyGradeModal(false);
    } catch (error) {
      setFacultyGradeError(getErrorMessage(error));
    } finally {
      setIsFacultyGradeSubmitting(false);
    }
  };

  const allowedExtensionsAccept = useMemo(() => {
    const ext = assignment.languageAllowedExtensions?.trim();
    if (ext) return ext;
    const lang = assignment.language.toLowerCase();
    if (lang.includes("python")) return ".py,.txt,.csv";
    if (lang.includes("java")) return ".java,.txt,.csv";
    return ".py,.java,.txt,.csv";
  }, [assignment.language, assignment.languageAllowedExtensions]);

  const editorSubmissionFiles = useMemo(() => {
    // Submit exactly the files visible in the tree (no hidden extras or renamed files).
    const list: { fileName: string; content: string }[] = [];
    const fileNodes = nodes.filter(
      (n) => !(n.metadata as { isFolder?: boolean })?.isFolder
    );
    for (const node of fileNodes) {
      const id = String(node.id);
      const content = fileContents[id] ?? "";
      if (!content.trim()) continue;
      const rawFileName = node.name;
      const normalized = rawFileName.toLowerCase();
      const hasAnyExtension = normalized.includes(".");
      const fileName = hasAnyExtension
        ? rawFileName
        : `main${getDefaultExtension(assignment.language)}`;
      list.push({ fileName, content });
    }
    return list;
  }, [assignment.language, fileContents, nodes]);

  const hasAnyFiles = useMemo(
    () => nodes.some((n) => !(n.metadata as { isFolder?: boolean })?.isFolder),
    [nodes]
  );

  const canSubmitFromEditor = editorSubmissionFiles.length > 0;
  const canSubmit = Boolean(selectedSubmissionFile) || canSubmitFromEditor;

  const workspaceStatus = useMemo(() => {
    if (showUploadControls && submissionFileError) return { message: submissionFileError, type: 'error' as const };
    if (showUploadControls && submissionStatusMessage) return { message: submissionStatusMessage, type: 'success' as const };
    if (showFacultyGradeControls && facultyGradeStatusMessage) return { message: facultyGradeStatusMessage, type: 'success' as const };
    if (isFacultyEditorReadOnly) return { message: 'Read-only — viewing submission.', type: 'info' as const };
    if (showUploadControls && !selectedSubmissionFile && canSubmitFromEditor) {
      const text = editorSubmissionFiles.length === 1
        ? `Submitting editor file as ${editorSubmissionFiles[0].fileName}`
        : `Submitting editor files (${editorSubmissionFiles.length} files)`;
      return { message: text, type: 'info' as const };
    }
    return { message: null, type: 'info' as const };
  }, [
    showUploadControls,
    submissionFileError,
    submissionStatusMessage,
    showFacultyGradeControls,
    facultyGradeStatusMessage,
    isFacultyEditorReadOnly,
    selectedSubmissionFile,
    canSubmitFromEditor,
    editorSubmissionFiles,
  ]);

  return (
    <div className="flex flex-col h-full">
      {/* Hidden inputs for upload flows */}
      {!isReviewMode ? (
        <input
          ref={addToEditorInputRef}
          type="file"
          accept={allowedExtensionsAccept}
          multiple
          className="hidden"
          onChange={handleAddFileToEditor}
        />
      ) : null}
      {showUploadControls ? (
        <input
          ref={uploadInputRef}
          type="file"
          accept={allowedExtensionsAccept}
          className="hidden"
          onChange={handleFileSelection}
        />
      ) : null}

      {/* Resizable Editor and Console - no separate top bar; toolbar lives inside editor */}
      <div className="flex-1 overflow-hidden relative">
        <PanelGroup direction="horizontal">
          <Panel defaultSize={18} minSize={12} maxSize={35}>
            <FileTree
              nodes={nodes}
              selectedId={selectedId}
              onSelect={handleSelectFile}
              protectedFileIds={assignment.hasStarterCode ? ["main"] : []}
              onCreateFile={onCreateFile}
              onUploadFile={!isReviewMode ? () => addToEditorInputRef.current?.click() : undefined}
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
                  {/* Editor toolbar - language, save, run, actions (dark theme) */}
                  <div className="flex-shrink-0 flex items-center justify-between gap-2 px-3 py-2 bg-[#252526] border-b border-[#3c3c3c]">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-gray-500 uppercase tracking-wide">Language</span>
                      <span className="text-[13px] font-medium text-gray-200">
                        {facultyPreviewLanguage ?? assignment.language}
                      </span>
                      <span className="text-gray-600">·</span>
                      <button
                        type="button"
                        onClick={handleSaveAll}
                        disabled={!hasAnyDirty}
                        className="flex items-center gap-1.5 text-[12px] text-gray-400 hover:text-gray-200 disabled:opacity-50 disabled:pointer-events-none"
                      >
                        <Save className="w-3.5 h-3.5" strokeWidth={2} />
                        <span>Save all</span>
                      </button>
                      <span className="text-[11px] text-gray-500">
                        {hasAnyDirty ? "Unsaved" : "Saved"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {assignment.hasStarterCode && (
                        <button className="px-2 py-1.5 text-[12px] text-gray-400 hover:text-gray-200 hover:bg-[#3c3c3c] rounded transition-colors flex items-center gap-1.5">
                          <RotateCcw className="w-3.5 h-3.5" strokeWidth={2} />
                          <span className="hidden sm:inline">Reset</span>
                        </button>
                      )}
                      <button
                        onClick={handleRunTests}
                        className="px-3 py-1.5 text-[12px] text-gray-300 hover:text-white hover:bg-[#3c3c3c] rounded transition-colors flex items-center gap-1.5 border border-[#3c3c3c] flex-shrink-0"
                      >
                        <Play className="w-3.5 h-3.5" strokeWidth={2} />
                        <span>Run Tests</span>
                      </button>
                      {showFacultyGradeControls && (
                        <button
                          onClick={openFacultyGradeModal}
                          className="px-3 py-1.5 text-[12px] text-gray-300 hover:text-white hover:bg-[#3c3c3c] rounded transition-colors flex items-center gap-1.5 border border-[#3c3c3c]"
                        >
                          <CheckSquare className="w-3.5 h-3.5" strokeWidth={2} />
                          <span>Grade</span>
                        </button>
                      )}
                      {showUploadControls && (
                        <>
                          <button
                            onClick={handleFilePickerOpen}
                            className="px-3 py-1.5 text-[12px] text-gray-300 hover:text-white hover:bg-[#3c3c3c] rounded transition-colors flex items-center gap-1.5 border border-[#3c3c3c]"
                          >
                            <Upload className="w-3.5 h-3.5" strokeWidth={2} />
                            <span className="hidden sm:inline">Upload</span>
                          </button>
                          {selectedSubmissionFile && (
                            <span className="max-w-[160px] truncate text-[11px] text-gray-500" title={selectedSubmissionFile.name}>
                              {selectedSubmissionFile.name}
                            </span>
                          )}
                          <button
                            onClick={handleSubmit}
                            disabled={!canSubmit || isSubmitting}
                            className="px-3 py-1.5 bg-[#2B2A2A] hover:bg-[#3a3939] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded text-[12px] font-medium transition-colors flex items-center gap-1.5"
                          >
                            <Send className="w-3.5 h-3.5" strokeWidth={2} />
                            <span>{isSubmitting ? "Submitting…" : "Submit"}</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
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
                    {selectedId && hasAnyFiles ? (
                      <MonacoEditor
                        value={currentContent}
                        language={facultyPreviewLanguage ?? assignment.language}
                        onChange={setCurrentContent}
                        readOnly={isFacultyEditorReadOnly}
                        height="100%"
                        className="h-full"
                      />
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center text-gray-400">
                        <p className="text-[14px] mb-3">No file open.</p>
                        <button
                          type="button"
                          onClick={() => onCreateFile("project")}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#2B2A2A] hover:bg-[#3a3939] text-[12px] text-white font-medium"
                        >
                          <span>Create new file</span>
                        </button>
                        <p className="mt-2 text-[12px] text-gray-500">
                          Or use the file tree to upload or add files.
                        </p>
                      </div>
                    )}
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
                statusMessage={workspaceStatus.message}
                statusMessageType={workspaceStatus.type}
              />
            </div>
          </Panel>
        </PanelGroup>
      </Panel>
        </PanelGroup>

        {/* Workspace notification modal – scoped to editor area, dark themed */}
        {workspaceNotification && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10 p-4">
            <div className="bg-[#252526] rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-[#3c3c3c]">
              <div className="flex items-start gap-3 p-5">
                {workspaceNotification.type === "error" && (
                  <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" strokeWidth={2} />
                )}
                {workspaceNotification.type === "success" && (
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-green-500/20 text-green-400 text-sm font-medium">✓</span>
                )}
                {workspaceNotification.type === "info" && (
                  <AlertCircle className="w-6 h-6 text-[#5A7ACD] flex-shrink-0 mt-0.5" strokeWidth={2} />
                )}
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-[14px] ${
                      workspaceNotification.type === "error"
                        ? "text-red-400 font-medium"
                        : workspaceNotification.type === "success"
                          ? "text-green-400"
                          : "text-gray-200"
                    }`}
                  >
                    {workspaceNotification.message}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setWorkspaceNotification(null)}
                  className="p-1.5 hover:bg-[#3c3c3c] rounded-lg transition-colors flex-shrink-0 text-gray-400 hover:text-gray-200"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" strokeWidth={2} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {showFacultyGradeModal ? (
        <div className="fixed inset-0 bg-black/40 z-50 p-4 flex items-center justify-center">
          <div className="w-full max-w-lg bg-white rounded-xl border border-gray-200 shadow-2xl">
            <div className="px-5 py-4 border-b border-gray-200">
              <h3 className="text-[16px] font-semibold text-[#2B2A2A]">Grade submission</h3>
              <p className="text-[12px] text-gray-600 mt-1">
                Choose a submission, enter marks, and save the grade.
              </p>
            </div>
            <div className="px-5 py-4 space-y-4">
              <div className="space-y-2">
                <label className="block text-[12px] font-medium text-[#2B2A2A]">Submission</label>
                <select
                  value={selectedGradeSubmissionId}
                  onChange={(event) => {
                    const nextSubmissionId = event.target.value;
                    setSelectedGradeSubmissionId(nextSubmissionId);
                    const selectedOption = facultyGradeOptions.find(
                      (option) => option.submissionId === nextSubmissionId,
                    );
                    if (selectedOption != null && selectedOption.currentMarks !== null) {
                      setFacultyGradeInput(String(selectedOption.currentMarks));
                    }
                  }}
                  className="w-full h-10 px-3 rounded-lg border border-gray-300 text-[13px] text-[#2B2A2A] focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]/30"
                >
                  <option value="">Select submission</option>
                  {facultyGradeOptions.map((option) => (
                    <option key={option.submissionId} value={option.submissionId}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-[12px] font-medium text-[#2B2A2A]">
                  Marks {typeof maxGradePoints === "number" ? `(max ${maxGradePoints})` : ""}
                </label>
                <input
                  type="number"
                  min={0}
                  value={facultyGradeInput}
                  onChange={(event) => setFacultyGradeInput(event.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-gray-300 text-[13px] text-[#2B2A2A] focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]/30"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[12px] font-medium text-[#2B2A2A]">Feedback (optional)</label>
                <textarea
                  rows={3}
                  value={facultyGradeFeedback}
                  onChange={(event) => setFacultyGradeFeedback(event.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-[13px] text-[#2B2A2A] focus:outline-none focus:ring-2 focus:ring-[#5A7ACD]/30"
                />
              </div>

              {facultyGradeError ? (
                <p className="text-[12px] text-[#C23A42]">{facultyGradeError}</p>
              ) : null}
            </div>
            <div className="px-5 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeFacultyGradeModal}
                disabled={isFacultyGradeSubmitting}
                className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-100 rounded-lg text-[13px] text-[#2B2A2A] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void submitFacultyGrade()}
                disabled={isFacultyGradeSubmitting || facultyGradeOptions.length === 0}
                className="px-4 py-2 bg-[#2B2A2A] hover:bg-[#3a3939] rounded-lg text-[13px] text-white disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isFacultyGradeSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Submit Grade</span>
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
