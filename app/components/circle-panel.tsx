"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { cropToCircle, defaultCircleFilename } from "@/lib/circle-svg";
import type { UseOutputDir } from "@/lib/use-output-dir";
import { Dropzone, readSvgFile, type LoadedSvg } from "./dropzone";
import { placeholderSvg } from "./placeholder-svg";

interface Props {
  output: UseOutputDir;
}

export function CirclePanel({ output }: Props) {
  const [source, setSource] = useState<LoadedSvg | null>(null);
  const [filename, setFilename] = useState<string>("");
  const [filenameEdited, setFilenameEdited] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    if (filenameEdited) return;
    setFilename(source ? defaultCircleFilename(source.name) : "");
  }, [source, filenameEdited]);

  const cropped = useMemo(() => {
    if (!source) return null;
    try {
      const out = cropToCircle(source.content);
      setError(null);
      return out;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      return null;
    }
  }, [source]);

  const handleFile = useCallback(async (file: File | null) => {
    if (!file) return;
    try {
      const loaded = await readSvgFile(file);
      setSource(loaded);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  const handleSave = useCallback(async () => {
    if (!cropped || !filename) return;
    const res = await output.saveOrDownload(filename, cropped);
    setStatus(res.message);
    setError(res.error ?? null);
  }, [cropped, filename, output]);

  const reset = useCallback(() => {
    setSource(null);
    setFilename("");
    setFilenameEdited(false);
    setError(null);
    setStatus("");
  }, []);

  return (
    <>
      <header className="app-header">
        <h1>Make Circle</h1>
        <p>
          Drop an SVG and it&apos;ll be cropped to a circle filling a 256×256
          canvas. Anything outside the circle is clipped — non-square sources
          are centred via <kbd>preserveAspectRatio</kbd>.
        </p>
      </header>

      <div className="dropzones single">
        <Dropzone
          inputId="circle-file-source"
          role="Source SVG"
          hint="Drop SVG to crop"
          loaded={source}
          onFile={handleFile}
          onClear={() => setSource(null)}
        />
      </div>

      <section className="preview-section">
        <div
          className="canvas"
          dangerouslySetInnerHTML={
            cropped
              ? { __html: cropped }
              : { __html: placeholderSvg("drop an SVG to crop") }
          }
        />
        <div className="meta">
          <div>
            <div className="label">Output filename</div>
            <div className="filename-row">
              <input
                type="text"
                value={filename}
                placeholder="(awaiting an SVG)"
                onChange={(e) => {
                  setFilename(e.target.value);
                  setFilenameEdited(true);
                }}
                disabled={!cropped}
              />
              <button
                onClick={() => {
                  if (source) {
                    setFilename(defaultCircleFilename(source.name));
                    setFilenameEdited(false);
                  }
                }}
                disabled={!source}
                title="Reset to {NAME}-CIRCLE.svg convention"
              >
                Reset name
              </button>
            </div>
          </div>
          <div className="actions">
            <button
              className="primary"
              onClick={handleSave}
              disabled={!cropped || !filename}
            >
              {output.outDir ? `Save to ${output.outDir.name}` : "Download"}
            </button>
            <button onClick={reset} disabled={!source}>
              Clear
            </button>
          </div>
          {error && <div className="error">{error}</div>}
          <div className="status">{status}</div>
        </div>
      </section>

      <p className="footer-note">
        Source name (uppercased, minus <kbd>.svg</kbd>) becomes the stem;{" "}
        <kbd>-CIRCLE</kbd> is appended. Example: <kbd>logo.svg</kbd> →{" "}
        <kbd>LOGO-CIRCLE.svg</kbd>.
      </p>
    </>
  );
}
