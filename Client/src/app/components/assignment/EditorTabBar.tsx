import { X } from "lucide-react";

export interface EditorTab {
  id: string;
  name: string;
  dirty: boolean;
}

interface EditorTabBarProps {
  tabs: EditorTab[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onClose: (id: string, dirty: boolean) => void;
}

export function EditorTabBar({ tabs, activeId, onSelect, onClose }: EditorTabBarProps) {
  if (tabs.length === 0) return null;

  return (
    <div className="flex items-end gap-0 border-b border-[#3c3c3c] bg-[#252526] overflow-x-auto min-h-0">
      {tabs.map((tab) => {
        const isActive = tab.id === activeId;
        return (
          <div
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            className={`
              group flex items-center gap-1.5 pl-3 pr-1 py-2 border-r border-[#3c3c3c] cursor-pointer text-[12px] shrink-0
              ${isActive ? "bg-[#1e1e1e] text-gray-100" : "bg-[#2d2d2d] text-gray-400 hover:bg-[#333] hover:text-gray-300"}
            `}
            onClick={() => onSelect(tab.id)}
          >
            <span className="truncate max-w-[120px]" title={tab.name}>
              {tab.name}
            </span>
            {tab.dirty && (
              <span className="text-[8px] text-amber-400" title="Unsaved changes">
                ●
              </span>
            )}
            <button
              type="button"
              className="p-0.5 rounded hover:bg-[#505050] text-gray-400 hover:text-gray-200 opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none"
              onClick={(e) => {
                e.stopPropagation();
                onClose(tab.id, tab.dirty);
              }}
              aria-label={`Close ${tab.name}`}
            >
              <X className="w-3.5 h-3.5" strokeWidth={2} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
