/**
 * Persists assignment workspace state (file tree, file contents, open tabs) per assignment
 * using IndexedDB. Chosen over localStorage for:
 * - Larger capacity (file contents can be big)
 * - Async API (no main-thread blocking)
 * - Multiple assignments without hitting ~5MB limit
 */

const DB_NAME = "GradeForgeWorkspace";
const STORE_NAME = "assignmentWorkspace";
const DB_VERSION = 1;

export interface PersistedWorkspaceState {
  nodes: Array<{
    id: string;
    name: string;
    parent: string | null;
    children: string[];
    isBranch?: boolean;
    metadata?: { isFolder: boolean };
  }>;
  fileContents: Record<string, string>;
  openTabIds: string[];
  savedContents: Record<string, string>;
  selectedId: string | null;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "assignmentId" });
      }
    };
  });
}

export async function getWorkspaceState(assignmentId: string): Promise<PersistedWorkspaceState | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(assignmentId);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => {
      const row = req.result;
      db.close();
      resolve(row?.state ?? null);
    };
  });
}

export async function setWorkspaceState(
  assignmentId: string,
  state: PersistedWorkspaceState
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.put({ assignmentId, state });
    tx.onerror = () => reject(tx.error);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
  });
}

/** Sanitize loaded state so openTabIds/selectedId only reference existing file nodes. */
export function sanitizeLoadedState(
  state: PersistedWorkspaceState
): PersistedWorkspaceState {
  const fileIds = new Set(
    state.nodes.filter((n) => n.metadata?.isFolder === false).map((n) => String(n.id))
  );
  const openTabIds = state.openTabIds.filter((id) => fileIds.has(id));
  let selectedId = state.selectedId;
  if (selectedId && !fileIds.has(selectedId)) {
    selectedId = openTabIds.length > 0 ? openTabIds[openTabIds.length - 1] : null;
  }
  if (selectedId && !openTabIds.includes(selectedId)) {
    selectedId = openTabIds.length > 0 ? openTabIds[openTabIds.length - 1] : null;
  }
  return {
    ...state,
    openTabIds:
      openTabIds.length > 0 ? openTabIds : (fileIds.has("main") ? ["main"] : []),
    selectedId: selectedId ?? (openTabIds.length > 0 ? openTabIds[openTabIds.length - 1] : null),
  };
}
