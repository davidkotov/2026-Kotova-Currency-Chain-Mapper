"use client";

import { useCallback, useEffect, useState } from "react";
import {
  clearDirectoryHandle,
  ensureWritePermission,
  isFsAccessSupported,
  loadDirectoryHandle,
  saveDirectoryHandle,
  writeFileToDir,
} from "@/lib/fs-access";

export interface SaveResult {
  message: string;
  error?: string;
}

export interface UseOutputDir {
  // `null` before hydration — components must render a stable placeholder
  // until this resolves to avoid SSR/CSR mismatch (window APIs are absent
  // on the server but may be present in the browser).
  fsSupported: boolean | null;
  outDir: FileSystemDirectoryHandle | null;
  pickOutputDir: () => Promise<string | null>;
  clearOutputDir: () => Promise<void>;
  saveOrDownload: (filename: string, svg: string) => Promise<SaveResult>;
}

export function useOutputDir(): UseOutputDir {
  const [fsSupported, setFsSupported] = useState<boolean | null>(null);
  const [outDir, setOutDir] = useState<FileSystemDirectoryHandle | null>(null);

  useEffect(() => {
    const supported = isFsAccessSupported();
    setFsSupported(supported);
    if (!supported) return;
    loadDirectoryHandle().then((h) => {
      if (h) setOutDir(h);
    });
  }, []);

  const pickOutputDir = useCallback(async (): Promise<string | null> => {
    if (!fsSupported) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handle: FileSystemDirectoryHandle = await (
      window as any
    ).showDirectoryPicker({ mode: "readwrite" });
    const ok = await ensureWritePermission(handle);
    if (!ok) {
      throw new Error("Folder permission denied.");
    }
    await saveDirectoryHandle(handle);
    setOutDir(handle);
    return handle.name;
  }, [fsSupported]);

  const clearOutputDir = useCallback(async () => {
    await clearDirectoryHandle();
    setOutDir(null);
  }, []);

  const saveOrDownload = useCallback(
    async (filename: string, svg: string): Promise<SaveResult> => {
      const blob = new Blob([svg], { type: "image/svg+xml" });

      if (outDir) {
        const ok = await ensureWritePermission(outDir);
        if (!ok) {
          downloadBlob(blob, filename);
          return {
            message: `Downloaded ${filename}`,
            error: "Folder permission not granted. Downloaded instead.",
          };
        }
        try {
          await writeFileToDir(outDir, filename, svg);
          return { message: `Saved to ${outDir.name}/${filename}` };
        } catch (e) {
          downloadBlob(blob, filename);
          return {
            message: `Downloaded ${filename}`,
            error: `Could not write to folder: ${
              e instanceof Error ? e.message : String(e)
            }. Downloaded instead.`,
          };
        }
      }

      downloadBlob(blob, filename);
      return { message: `Downloaded ${filename}` };
    },
    [outDir],
  );

  return { fsSupported, outDir, pickOutputDir, clearOutputDir, saveOrDownload };
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
