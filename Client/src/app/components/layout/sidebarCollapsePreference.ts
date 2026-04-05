const STORAGE_KEY = "gradeforge.sidebar.pinnedCollapsed";
const CHANGE_EVENT = "gradeforge-sidebar-pinned-collapsed-change";

export function getSidebarPinnedCollapsed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setSidebarPinnedCollapsed(value: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
  } catch {
    /* ignore quota / private mode */
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function subscribeSidebarPinnedCollapsed(onStoreChange: () => void): () => void {
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) onStoreChange();
  };
  const onLocal = () => onStoreChange();
  window.addEventListener("storage", onStorage);
  window.addEventListener(CHANGE_EVENT, onLocal);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(CHANGE_EVENT, onLocal);
  };
}
