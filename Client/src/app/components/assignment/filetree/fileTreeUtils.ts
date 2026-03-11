import type { INode } from "react-accessible-treeview";

/** Metadata we attach to file tree nodes. Keep flat for react-accessible-treeview. */
export interface FileTreeMetadata extends Record<string, string | number | boolean | undefined | null> {
  isFolder: boolean;
}

export type FileTreeNode = INode<FileTreeMetadata>;

/** Build the root + empty project tree (no starter files). */
export function buildEmptyFileTree(): { nodes: FileTreeNode[]; fileContents: Record<string, string> } {
  const rootId = "root";
  const projectId = "project";
  const nodes: FileTreeNode[] = [
    { id: rootId, name: "", parent: null, children: [projectId], metadata: { isFolder: true } },
    { id: projectId, name: "project", parent: rootId, children: [], isBranch: true, metadata: { isFolder: true } },
  ];
  return { nodes, fileContents: {} };
}

/** Build the root + default project tree and one starter file. */
export function buildInitialFileTree(
  starterFileName: string,
  starterContent: string
): { nodes: FileTreeNode[]; fileContents: Record<string, string> } {
  const rootId = "root";
  const projectId = "project";
  const mainId = "main";

  const nodes: FileTreeNode[] = [
    { id: rootId, name: "", parent: null, children: [projectId], metadata: { isFolder: true } },
    { id: projectId, name: "project", parent: rootId, children: [mainId], isBranch: true, metadata: { isFolder: true } },
    { id: mainId, name: starterFileName, parent: projectId, children: [], metadata: { isFolder: false } },
  ];

  const fileContents: Record<string, string> = { [mainId]: starterContent };
  return { nodes, fileContents };
}

/** Build file tree from multiple files (e.g. submission with several source files). First file uses id "main". */
export function buildFileTreeFromFiles(
  files: { fileName: string; content: string }[]
): { nodes: FileTreeNode[]; fileContents: Record<string, string> } {
  if (files.length === 0) {
    return buildInitialFileTree("main.py", "");
  }
  const rootId = "root";
  const projectId = "project";
  const childIds = files.map((_, i) => (i === 0 ? "main" : `file-${i}`));
  const nodes: FileTreeNode[] = [
    { id: rootId, name: "", parent: null, children: [projectId], metadata: { isFolder: true } },
    { id: projectId, name: "project", parent: rootId, children: childIds, isBranch: true, metadata: { isFolder: true } },
    ...files.map((f, i) => ({
      id: childIds[i],
      name: f.fileName,
      parent: projectId as string,
      children: [] as string[],
      metadata: { isFolder: false },
    })),
  ];
  const fileContents: Record<string, string> = {};
  files.forEach((f, i) => {
    fileContents[childIds[i]] = f.content;
  });
  return { nodes, fileContents };
}

/** Generate a new unique id for a node. */
export function nextNodeId(prefix: string, existingIds: string[]): string {
  const set = new Set(existingIds);
  let n = 0;
  while (set.has(`${prefix}-${n}`)) n++;
  return `${prefix}-${n}`;
}

/** Return a unique file name for the given extension, e.g. untitled.java, untitled-1.java, untitled-2.java. */
export function nextUntitledFileName(extension: string, existingFileNames: string[]): string {
  const base = "untitled";
  const suffix = extension.startsWith(".") ? extension : `.${extension}`;
  const existing = new Set(existingFileNames.map((n) => n.toLowerCase()));
  if (!existing.has(`${base}${suffix}`.toLowerCase())) {
    return `${base}${suffix}`;
  }
  let n = 1;
  while (existing.has(`${base}-${n}${suffix}`.toLowerCase())) n++;
  return `${base}-${n}${suffix}`;
}

/** Return a unique file name when adding a file (e.g. upload). If "main.py" exists, returns "main-1.py". */
export function uniqueFileName(desiredName: string, existingFileNames: string[]): string {
  const existing = new Set(existingFileNames.map((n) => n.toLowerCase()));
  if (!existing.has(desiredName.toLowerCase())) return desiredName;
  const lastDot = desiredName.lastIndexOf(".");
  const base = lastDot > 0 ? desiredName.slice(0, lastDot) : desiredName;
  const ext = lastDot > 0 ? desiredName.slice(lastDot) : "";
  let n = 1;
  while (existing.has(`${base}-${n}${ext}`.toLowerCase())) n++;
  return `${base}-${n}${ext}`;
}

export function getDefaultExtension(language: string): string {
  const map: Record<string, string> = {
    Python: ".py",
    Java: ".java",
    JavaScript: ".js",
    TypeScript: ".ts",
  };
  return map[language] ?? ".txt";
}
