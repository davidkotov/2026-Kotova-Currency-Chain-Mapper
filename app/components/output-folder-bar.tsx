"use client";

import type { UseOutputDir } from "@/lib/use-output-dir";

interface Props {
  output: UseOutputDir;
  onError: (message: string) => void;
  onStatus: (message: string) => void;
}

export function OutputFolderBar({ output, onError, onStatus }: Props) {
  const { fsSupported, outDir, pickOutputDir, clearOutputDir } = output;

  const handlePick = async () => {
    try {
      const name = await pickOutputDir();
      if (name) onStatus(`Output folder set to ${name}`);
    } catch (e) {
      if ((e as { name?: string })?.name === "AbortError") return;
      onError(e instanceof Error ? e.message : String(e));
    }
  };

  const handleClear = async () => {
    await clearOutputDir();
    onStatus("Output folder cleared — files will download to your Downloads.");
  };

  return (
    <div className="config-bar">
      {fsSupported === null ? (
        // Pre-hydration placeholder — must render identically on server and
        // client. Real branch resolves after the first effect runs.
        <>
          <span className="label">Output folder:</span>
          <span className="folder">…</span>
        </>
      ) : fsSupported ? (
        <>
          <span className="label">Output folder:</span>
          <span className="folder">
            {outDir ? outDir.name : "Downloads (default)"}
          </span>
          <button onClick={handlePick}>
            {outDir ? "Change folder" : "Choose folder"}
          </button>
          {outDir && (
            <button onClick={handleClear}>Use Downloads instead</button>
          )}
        </>
      ) : (
        <span className="label">
          File System Access API not available in this browser — files will
          download to your Downloads folder. (Try Chrome/Edge for direct folder
          save.)
        </span>
      )}
    </div>
  );
}
