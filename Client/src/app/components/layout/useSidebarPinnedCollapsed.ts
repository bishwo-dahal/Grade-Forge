import { useCallback, useSyncExternalStore } from "react";
import {
  getSidebarPinnedCollapsed,
  setSidebarPinnedCollapsed,
  subscribeSidebarPinnedCollapsed,
} from "./sidebarCollapsePreference";

export function useSidebarPinnedCollapsed() {
  const pinnedCollapsed = useSyncExternalStore(
    subscribeSidebarPinnedCollapsed,
    getSidebarPinnedCollapsed,
    () => false,
  );

  const setPinnedCollapsed = useCallback((value: boolean) => {
    setSidebarPinnedCollapsed(value);
  }, []);

  const togglePinnedCollapsed = useCallback(() => {
    setSidebarPinnedCollapsed(!getSidebarPinnedCollapsed());
  }, []);

  return { pinnedCollapsed, setPinnedCollapsed, togglePinnedCollapsed };
}
