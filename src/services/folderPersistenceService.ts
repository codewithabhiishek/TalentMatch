/**
 * folderPersistenceService.ts
 *
 * Persists the FileSystemDirectoryHandle (browser) or folder path (Electron)
 * across page reloads and laptop restarts so the user never has to re-grant
 * folder access after the first time.
 *
 * Strategy:
 * - Browser: FileSystemDirectoryHandle stored in IndexedDB (the ONLY web storage
 *   that can hold live FileSystem handles — localStorage cannot).
 * - Electron (Windows): folder path stored in localStorage; the native OS
 *   `fs.readdirSync` path never needs re-authorization.
 *
 * On startup:
 *   1. Load handle/path from storage.
 *   2. Call queryPermission() — if already 'granted', silently reconnect.
 *   3. If 'prompt', surface a small "Reconnect to [FolderName]?" banner.
 *   4. The user clicks once → requestPermission() → auto-scan.
 */

const DB_NAME    = 'talentmatch-idb';
const DB_VERSION = 1;
const STORE_NAME = 'folder-handles';
const HANDLE_KEY = 'resume-folder-handle';

// localStorage key for storing folder metadata (name) so we can show UI without loading IDB first
const META_KEY_WEB      = 'talentmatch_folder_meta_web';
const META_KEY_ELECTRON = 'talentmatch_folder_path_electron';

// ─── IndexedDB helpers ────────────────────────────────────────────────────────

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess  = () => resolve(req.result);
    req.onerror    = () => reject(req.error);
    req.onblocked  = () => reject(new Error('IDB blocked'));
  });
}

export async function saveHandleToIDB(handle: FileSystemDirectoryHandle): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(handle, HANDLE_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror    = () => reject(tx.error);
    });
    // Also save metadata so we can show "Reconnect to X" without opening IDB
    localStorage.setItem(META_KEY_WEB, JSON.stringify({ name: handle.name }));
  } catch (e) {
    console.warn('[FolderPersistence] Could not save handle to IDB:', e);
  }
}

export async function loadHandleFromIDB(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const db = await openDB();
    return await new Promise<FileSystemDirectoryHandle | null>((resolve, reject) => {
      const tx  = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(HANDLE_KEY);
      req.onsuccess = () => resolve((req.result as FileSystemDirectoryHandle) || null);
      req.onerror   = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export async function clearHandleFromIDB(): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(HANDLE_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror    = () => reject(tx.error);
    });
    localStorage.removeItem(META_KEY_WEB);
  } catch {
    /* ignore */
  }
}

// ─── Permission helpers ───────────────────────────────────────────────────────

/**
 * Returns the current permission state without showing a browser prompt.
 * Use this on startup to silently reconnect if already granted.
 */
export async function queryHandlePermission(
  handle: FileSystemDirectoryHandle
): Promise<'granted' | 'prompt' | 'denied'> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return await (handle as any).queryPermission({ mode: 'read' }) as 'granted' | 'prompt' | 'denied';
  } catch {
    return 'prompt';
  }
}

/**
 * Shows the browser permission dialog.  Call only in response to a user gesture.
 */
export async function requestHandlePermission(
  handle: FileSystemDirectoryHandle
): Promise<boolean> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (handle as any).requestPermission({ mode: 'read' });
    return result === 'granted';
  } catch {
    return false;
  }
}

// ─── Web folder metadata (for "Reconnect?" banner) ───────────────────────────

export function getSavedFolderMeta(): { name: string } | null {
  try {
    const raw = localStorage.getItem(META_KEY_WEB);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// ─── Electron (Windows) path persistence ─────────────────────────────────────

export function saveElectronFolderPath(path: string, name: string): void {
  try {
    localStorage.setItem(META_KEY_ELECTRON, JSON.stringify({ path, name }));
  } catch { /* quota */ }
}

export function loadElectronFolderMeta(): { path: string; name: string } | null {
  try {
    const raw = localStorage.getItem(META_KEY_ELECTRON);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearElectronFolderMeta(): void {
  localStorage.removeItem(META_KEY_ELECTRON);
}
