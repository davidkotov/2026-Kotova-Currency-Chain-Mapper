// Helpers around the File System Access API.
// We store the configured directory handle in IndexedDB so the app remembers
// the user's folder across reloads. Not supported in all browsers (Firefox,
// Safari) — callers should feature-detect via `isFsAccessSupported()`.

const DB_NAME = "kotova-mapper";
const DB_VERSION = 1;
const STORE = "handles";
const HANDLE_KEY = "output-dir";

export function isFsAccessSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "showDirectoryPicker" in window &&
    "indexedDB" in window
  );
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveDirectoryHandle(
  handle: FileSystemDirectoryHandle,
): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(handle, HANDLE_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function loadDirectoryHandle(): Promise<FileSystemDirectoryHandle | null> {
  const db = await openDb();
  const handle = await new Promise<FileSystemDirectoryHandle | null>(
    (resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(HANDLE_KEY);
      req.onsuccess = () => resolve((req.result as FileSystemDirectoryHandle) ?? null);
      req.onerror = () => reject(req.error);
    },
  );
  db.close();
  return handle;
}

export async function clearDirectoryHandle(): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(HANDLE_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

interface PermissionOpts {
  mode: "read" | "readwrite";
}

/** Ensure we have readwrite permission on the given handle, prompting if needed. */
export async function ensureWritePermission(
  handle: FileSystemDirectoryHandle,
): Promise<boolean> {
  const opts: PermissionOpts = { mode: "readwrite" };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const queryFn = (handle as any).queryPermission?.bind(handle);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const requestFn = (handle as any).requestPermission?.bind(handle);
  if (!queryFn || !requestFn) return false;
  let state: PermissionState = await queryFn(opts);
  if (state === "granted") return true;
  state = await requestFn(opts);
  return state === "granted";
}

export async function writeFileToDir(
  dir: FileSystemDirectoryHandle,
  filename: string,
  content: string,
): Promise<void> {
  const fileHandle = await dir.getFileHandle(filename, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(content);
  await writable.close();
}
