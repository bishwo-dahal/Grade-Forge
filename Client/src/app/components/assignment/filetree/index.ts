export { FileTree } from "./FileTree";
export type { FileTreeProps } from "./FileTree";
export {
  buildEmptyFileTree,
  buildInitialFileTree,
  buildFileTreeFromFiles,
  nextNodeId,
  nextUntitledFileName,
  uniqueFileName,
  getDefaultExtension,
} from "./fileTreeUtils";
export type { FileTreeNode, FileTreeMetadata } from "./fileTreeUtils";
