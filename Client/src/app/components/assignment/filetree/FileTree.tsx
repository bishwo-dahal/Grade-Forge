import React, { useState, useCallback } from "react";
import TreeView, { INodeRendererProps } from "react-accessible-treeview";
import { Folder, FolderOpen, FileCode, FilePlus, Pencil, Copy, Trash2, MoreHorizontal } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from "../../ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "../../ui/dropdown-menu";
import type { FileTreeNode, FileTreeMetadata } from "./fileTreeUtils";

const ROOT_ID = "root";

function getProjectId(nodes: FileTreeNode[]): string | null {
  const root = nodes.find((n) => n.parent === null);
  if (!root || !root.children.length) return null;
  return String(root.children[0]);
}

export interface FileTreeProps {
  nodes: FileTreeNode[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** File ids that cannot be deleted (e.g. starter code file). */
  protectedFileIds?: string[];
  onCreateFile: (parentId: string) => void;
  /** Not shown in UI for now; kept for future folder support. */
  onCreateFolder?: (parentId: string) => void;
  onRename: (id: string, newName: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}

export function FileTree({
  nodes,
  selectedId,
  onSelect,
  protectedFileIds = [],
  onCreateFile,
  onCreateFolder,
  onRename,
  onDelete,
  onDuplicate,
}: FileTreeProps) {
  const [expandedIds, setExpandedIds] = useState<string[]>(() => {
    const pid = getProjectId(nodes);
    return pid ? [pid] : [];
  });
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const projectId = getProjectId(nodes);
  const defaultExpandedIds = projectId ? [projectId] : [];

  const handleExpandFromTree = useCallback((id: string, isExpanded: boolean) => {
    setExpandedIds((prev) => {
      const set = new Set(prev);
      if (isExpanded) set.add(id);
      else set.delete(id);
      return Array.from(set);
    });
  }, []);

  const handleRenameStart = useCallback((id: string, currentName: string) => {
    setRenamingId(id);
    setEditName(currentName);
  }, []);

  const handleRenameSubmit = useCallback(() => {
    if (renamingId && editName.trim()) {
      onRename(renamingId, editName.trim());
    }
    setRenamingId(null);
    setEditName("");
  }, [renamingId, editName, onRename]);

  const nodeRenderer = useCallback(
    (props: INodeRendererProps) => {
      const { element, getNodeProps, isBranch, isExpanded, isSelected, level, handleExpand, handleSelect } = props;
      const id = String(element.id);
      const isFolder = (element.metadata as FileTreeMetadata | undefined)?.isFolder ?? false;
      const isRoot = element.parent === null;

      if (isRoot) return null;

      const nodeProps = getNodeProps({
        onClick: (e) => {
          e.stopPropagation();
          if (isBranch) handleExpand(e);
          else handleSelect(e);
        },
      });

      const paddingLeft = level * 12;

      if (renamingId === id) {
        return (
          <div key={id} style={{ paddingLeft }} className="flex items-center gap-1 py-0.5 pr-2">
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleRenameSubmit}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRenameSubmit();
                if (e.key === "Escape") {
                  setRenamingId(null);
                  setEditName("");
                }
              }}
              className="flex-1 min-w-0 rounded border border-[#5A7ACD] bg-[#2d2d2d] px-1.5 py-0.5 text-[12px] text-gray-200 outline-none"
              autoFocus
            />
          </div>
        );
      }

      const content = (
        <div
          {...nodeProps}
          style={{ paddingLeft }}
          className={`group flex items-center gap-1.5 py-0.5 pr-2 rounded cursor-pointer select-none text-[12px] w-full ${
            isSelected ? "bg-[#5A7ACD]/30 text-gray-100" : "text-gray-300 hover:bg-[#2d2d2d]"
          }`}
        >
          {isFolder ? (
            isExpanded ? (
              <FolderOpen className="w-4 h-4 shrink-0 text-amber-500/90" />
            ) : (
              <Folder className="w-4 h-4 shrink-0 text-amber-500/90" />
            )
          ) : (
            <FileCode className="w-4 h-4 shrink-0 text-blue-400/80" />
          )}
          <span className="truncate flex-1 min-w-0">{element.name}</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-[#3c3c3c] text-gray-400 hover:text-gray-200 focus:opacity-100 focus:outline-none"
                onClick={(e) => e.stopPropagation()}
                aria-label="Actions"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48" onClick={(e) => e.stopPropagation()}>
              {isFolder && (
                <>
                  <DropdownMenuItem onClick={() => onCreateFile(id)}>
                    <FilePlus className="w-4 h-4" />
                    New File
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleRenameStart(id, element.name)}>
                    <Pencil className="w-4 h-4" />
                    Rename
                  </DropdownMenuItem>
                  {!protectedFileIds.includes(id) && (
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => onDelete(id)}
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </>
              )}
              {!isFolder && (
                <>
                  <DropdownMenuItem onClick={() => handleRenameStart(id, element.name)}>
                    <Pencil className="w-4 h-4" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDuplicate(id)}>
                    <Copy className="w-4 h-4" />
                    Duplicate
                  </DropdownMenuItem>
                  {!protectedFileIds.includes(id) && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => onDelete(id)}
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </DropdownMenuItem>
                    </>
                  )}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );

      return (
        <ContextMenu key={id}>
          <ContextMenuTrigger asChild>{content}</ContextMenuTrigger>
          <ContextMenuContent>
            {isFolder && (
              <>
                <ContextMenuItem onSelect={() => onCreateFile(id)}>
                  <FilePlus className="w-4 h-4" />
                  New File
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem onSelect={() => handleRenameStart(id, element.name)}>
                  <Pencil className="w-4 h-4" />
                  Rename
                </ContextMenuItem>
                {!protectedFileIds.includes(id) && (
                  <ContextMenuItem variant="destructive" onSelect={() => onDelete(id)}>
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </ContextMenuItem>
                )}
              </>
            )}
            {!isFolder && (
              <>
                <ContextMenuItem onSelect={() => handleRenameStart(id, element.name)}>
                  <Pencil className="w-4 h-4" />
                  Rename
                </ContextMenuItem>
                <ContextMenuItem onSelect={() => onDuplicate(id)}>
                  <Copy className="w-4 h-4" />
                  Duplicate
                </ContextMenuItem>
                {!protectedFileIds.includes(id) && (
                  <>
                    <ContextMenuSeparator />
                    <ContextMenuItem variant="destructive" onSelect={() => onDelete(id)}>
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </ContextMenuItem>
                  </>
                )}
              </>
            )}
          </ContextMenuContent>
        </ContextMenu>
      );
    },
    [
      renamingId,
      editName,
      handleRenameSubmit,
      handleRenameStart,
      protectedFileIds,
      onCreateFile,
      onDelete,
      onDuplicate,
    ]
  );

  return (
    <div className="h-full flex flex-col bg-[#252526] text-gray-300">
      <div className="flex-shrink-0 flex items-center gap-1 p-2 border-b border-[#3c3c3c]">
        <button
          type="button"
          onClick={() => onCreateFile(projectId ?? ROOT_ID)}
          className="p-1.5 rounded hover:bg-[#3c3c3c] text-gray-400 hover:text-gray-200"
          title="New file"
        >
          <FilePlus className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 min-h-0 overflow-auto py-1">
        <TreeView
          data={nodes}
          nodeRenderer={nodeRenderer}
          selectedIds={selectedId ? [selectedId] : []}
          expandedIds={expandedIds.length > 0 ? expandedIds : defaultExpandedIds}
          onNodeSelect={({ element }) => {
            if ((element.metadata as FileTreeMetadata)?.isFolder) return;
            const id = String(element.id);
            if (id === selectedId) return;
            onSelect(id);
          }}
          onExpand={({ element, isExpanded }) => handleExpandFromTree(String(element.id), isExpanded)}
          className="text-[12px]"
        />
      </div>
    </div>
  );
}
