"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { defaultFilename, mergeSvg } from "@/lib/merge-svg";
import type { UseOutputDir } from "@/lib/use-output-dir";
import { Dropzone, readSvgFile, type LoadedSvg } from "./dropzone";
import { placeholderSvg } from "./placeholder-svg";

interface Props {
  output: UseOutputDir;
}

export function MergePanel({ output }: Props) {
  const [currency, setCurrency] = useState<LoadedSvg | null>(null);
  const [chain, setChain] = useState<LoadedSvg | null>(null);
  const [filename, setFilename] = useState<string>("");
  const [filenameEdited, setFilenameEdited] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");

  // Auto-name the output as soon as both files are present, unless user typed
  // a custom name.
  useEffect(() => {
    if (filenameEdited) return;
    if (currency && chain) {
      setFilename(defaultFilename(currency.name, chain.name));
    } else {
      setFilename("");
    }
  }, [currency, chain, filenameEdited]);

  const merged = useMemo(() => {
    if (!currency || !chain) return null;
    try {
      const out = mergeSvg(currency.content, chain.content);
      setError(null);
      return out;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      return null;
    }
  }, [currency, chain]);

  const handleFile = useCallback(
    async (slot: "currency" | "chain", file: File | null) => {
      if (!file) return;
      try {
        const loaded = await readSvgFile(file);
        if (slot === "currency") setCurrency(loaded);
        else setChain(loaded);
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    },
    [],
  );

  const handleSave = useCallback(async () => {
    if (!merged || !filename) return;
    const res = await output.saveOrDownload(filename, merged);
    setStatus(res.message);
    setError(res.error ?? null);
  }, [merged, filename, output]);

  const reset = useCallback(() => {
    setCurrency(null);
    setChain(null);
    setFilename("");
    setFilenameEdited(false);
    setError(null);
    setStatus("");
  }, []);

  return (
    <>
      <header className="app-header">
        <h1>Merge</h1>
        <p>
          Drop a currency SVG and a chain SVG. They&apos;ll be merged into a
          single token logo (chain badge in the lower-right quadrant) ready to
          save or download.
        </p>
      </header>

      <div className="dropzones">
        <Dropzone
          inputId="merge-file-currency"
          role="Currency SVG"
          hint="Drop currency SVG here"
          loaded={currency}
          onFile={(f) => handleFile("currency", f)}
          onClear={() => setCurrency(null)}
        />
        <Dropzone
          inputId="merge-file-chain"
          role="Chain SVG"
          hint="Drop chain SVG here"
          loaded={chain}
          onFile={(f) => handleFile("chain", f)}
          onClear={() => setChain(null)}
        />
      </div>

      <section className="preview-section">
        <div
          className="canvas"
          dangerouslySetInnerHTML={
            merged ? { __html: merged } : { __html: placeholderSvg("drop both SVGs to merge") }
          }
        />
        <div className="meta">
          <div>
            <div className="label">Output filename</div>
            <div className="filename-row">
              <input
                type="text"
                value={filename}
                placeholder="(awaiting both files)"
                onChange={(e) => {
                  setFilename(e.target.value);
                  setFilenameEdited(true);
                }}
                disabled={!merged}
              />
              <button
                onClick={() => {
                  if (currency && chain) {
                    setFilename(defaultFilename(currency.name, chain.name));
                    setFilenameEdited(false);
                  }
                }}
                disabled={!currency || !chain}
                title="Reset to {TICKER}-{CHAIN}.svg convention"
              >
                Reset name
              </button>
            </div>
          </div>
          <div className="actions">
            <button
              className="primary"
              onClick={handleSave}
              disabled={!merged || !filename}
            >
              {output.outDir ? `Save to ${output.outDir.name}` : "Download"}
            </button>
            <button onClick={reset} disabled={!currency && !chain}>
              Clear
            </button>
          </div>
          {error && <div className="error">{error}</div>}
          <div className="status">{status}</div>
        </div>
      </section>

      <p className="footer-note">
        Currency name (uppercased, minus <kbd>.svg</kbd>) becomes the prefix;
        chain name becomes the suffix. For variant chains like{" "}
        <kbd>near-dark.svg</kbd>, output is{" "}
        <kbd>{"{TICKER}"}-NEAR_DARK.svg</kbd>.
      </p>
    </>
  );
}
