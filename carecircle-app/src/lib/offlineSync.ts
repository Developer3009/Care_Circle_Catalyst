// Offline-First Synchronization Engine for CareCircle
// Implements an IndexedDB action queue with automatic online sync replay

export interface OfflineAction {
  id: string;
  url: string;
  method: string;
  body: unknown;
  description: string;
  createdAt: string;
  retryCount: number;
}

const DB_NAME = "CareCircleOfflineDB";
const DB_VERSION = 1;
const STORE_NAME = "pending_actions";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB not available in this environment"));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
  });
}

export async function enqueueOfflineAction(action: {
  url: string;
  method: string;
  body: unknown;
  description: string;
}): Promise<OfflineAction> {
  const db = await openDB();
  const item: OfflineAction = {
    id: "off_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
    url: action.url,
    method: action.method,
    body: action.body,
    description: action.description,
    createdAt: new Date().toISOString(),
    retryCount: 0,
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.add(item);
    req.onsuccess = () => resolve(item);
    req.onerror = () => reject(req.error);
  });
}

export async function getOfflineQueue(): Promise<OfflineAction[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

export async function removeOfflineAction(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function clearOfflineQueue(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// Replays all queued actions over the network
export async function syncOfflineQueue(): Promise<{ synced: number; failed: number }> {
  if (typeof window === "undefined" || !navigator.onLine) {
    return { synced: 0, failed: 0 };
  }

  const actions = await getOfflineQueue();
  if (actions.length === 0) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;

  for (const action of actions) {
    try {
      const res = await fetch(action.url, {
        method: action.method,
        headers: { "Content-Type": "application/json" },
        body: action.body !== undefined ? JSON.stringify(action.body) : undefined,
      });

      if (res.ok) {
        await removeOfflineAction(action.id);
        synced++;
      } else if (res.status >= 400 && res.status < 500) {
        // Client error (e.g. invalid payload) — remove to avoid infinite loops
        await removeOfflineAction(action.id);
        failed++;
      } else {
        // Server error — leave in queue for next retry
        failed++;
      }
    } catch {
      failed++;
      break; // Network still unavailable, halt until next sync trigger
    }
  }

  return { synced, failed };
}
