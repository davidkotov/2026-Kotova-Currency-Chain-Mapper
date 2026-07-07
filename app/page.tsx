"use client";

import { useState } from "react";
import { CirclePanel } from "@/app/components/circle-panel";
import { MergePanel } from "@/app/components/merge-panel";
import { OutputFolderBar } from "@/app/components/output-folder-bar";
import { useOutputDir } from "@/lib/use-output-dir";

type Tool = "merge" | "circle";

const TOOLS: { id: Tool; label: string; blurb: string }[] = [
  { id: "merge", label: "Merge", blurb: "Currency × Chain" },
  { id: "circle", label: "Make Circle", blurb: "Crop SVG to circle" },
];

export default function Home() {
  const [tool, setTool] = useState<Tool>("merge");
  const [barError, setBarError] = useState<string | null>(null);
  const [barStatus, setBarStatus] = useState<string>("");
  const output = useOutputDir();

  return (
    <main className="app">
      <nav className="toolbox" aria-label="Tools">
        {TOOLS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`tool-tab ${tool === t.id ? "active" : ""}`}
            onClick={() => setTool(t.id)}
            aria-pressed={tool === t.id}
          >
            <span className="tool-label">{t.label}</span>
            <span className="tool-blurb">{t.blurb}</span>
          </button>
        ))}
      </nav>

      <OutputFolderBar
        output={output}
        onError={(m) => {
          setBarError(m);
          setBarStatus("");
        }}
        onStatus={(m) => {
          setBarStatus(m);
          setBarError(null);
        }}
      />
      {(barError || barStatus) && (
        <div className="bar-message">
          {barError ? (
            <span className="error">{barError}</span>
          ) : (
            <span className="status">{barStatus}</span>
          )}
        </div>
      )}

      {tool === "merge" ? (
        <MergePanel output={output} />
      ) : (
        <CirclePanel output={output} />
      )}
    </main>
  );
}
