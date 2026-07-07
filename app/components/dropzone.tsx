"use client";

import { useState } from "react";

export interface LoadedSvg {
  name: string;
  content: string;
}

interface DropzoneProps {
  /** Stable id for the underlying <input> so multiple zones on one page coexist. */
  inputId: string;
  /** Uppercase label shown in the corner (e.g. "Currency SVG"). */
  role: string;
  /** Centered hint text shown when no file is loaded. */
  hint: string;
  loaded: LoadedSvg | null;
  onFile: (file: File | null) => void;
  onClear: () => void;
}

export function Dropzone({
  inputId,
  role,
  hint,
  loaded,
  onFile,
  onClear,
}: DropzoneProps) {
  const [dragOver, setDragOver] = useState(false);

  return (
    <label
      htmlFor={inputId}
      className={`dropzone ${dragOver ? "drag-over" : ""} ${
        loaded ? "has-file" : ""
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0] ?? null;
        onFile(file);
      }}
    >
      <span className="role">{role}</span>
      {loaded && (
        <button
          className="clear"
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClear();
          }}
          aria-label="Clear"
        >
          ✕
        </button>
      )}
      {loaded ? (
        <>
          <div
            className="preview"
            dangerouslySetInnerHTML={{ __html: loaded.content }}
          />
          <div className="filename">{loaded.name}</div>
        </>
      ) : (
        <div className="hint">
          {hint}
          <br />
          <span style={{ fontSize: 11, opacity: 0.7 }}>or click to pick</span>
        </div>
      )}
      <input
        id={inputId}
        type="file"
        accept=".svg,image/svg+xml"
        style={{ display: "none" }}
        onChange={(e) => onFile(e.target.files?.[0] ?? null)}
      />
    </label>
  );
}

export async function readSvgFile(file: File): Promise<LoadedSvg> {
  if (!file.name.toLowerCase().endsWith(".svg")) {
    throw new Error(`${file.name} is not an SVG file.`);
  }
  const text = await file.text();
  return { name: file.name, content: text };
}
