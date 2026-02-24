import type { INode } from "react-accessible-treeview";

/** Metadata we attach to file tree nodes. Keep flat for react-accessible-treeview. */
export interface FileTreeMetadata extends Record<string, string | number | boolean | undefined | null> {
  isFolder: boolean;
}

export type FileTreeNode = INode<FileTreeMetadata>;

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

/** Generate a new unique id for a node. */
export function nextNodeId(prefix: string, existingIds: string[]): string {
  const set = new Set(existingIds);
  let n = 0;
  while (set.has(`${prefix}-${n}`)) n++;
  return `${prefix}-${n}`;
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
