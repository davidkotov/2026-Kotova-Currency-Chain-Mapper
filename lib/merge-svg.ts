// SVG merge logic — mirror of scripts/merge_svg.py.
// Places the currency SVG as a 256x256 background and the chain SVG as a
// nested SVG in the bottom-right quadrant (max 128x128, fitted via
// preserveAspectRatio="xMidYMid meet"). No background fill on the chain.

import {
  CANVAS,
  QUADRANT,
  namespaceIds,
  parseAttrs,
  parseSvg,
  preserveAspectOf,
  viewBoxOf,
} from "@/lib/svg-utils";

export { CANVAS, QUADRANT };

export function mergeSvg(currencySvg: string, chainSvg: string): string {
  const cur = parseSvg(currencySvg);
  const chn = parseSvg(chainSvg);

  const curAttrs = parseAttrs(cur.attrs);
  const chnAttrs = parseAttrs(chn.attrs);

  const curViewBox = viewBoxOf(curAttrs);
  const chnViewBox = viewBoxOf(chnAttrs);
  const curPar = preserveAspectOf(curAttrs);
  const chnPar = preserveAspectOf(chnAttrs);

  const curInner = namespaceIds(cur.inner, "c_");
  const chnInner = namespaceIds(chn.inner, "n_");

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ` +
    `viewBox="0 0 ${CANVAS} ${CANVAS}" width="${CANVAS}" height="${CANVAS}">` +
    `<svg x="0" y="0" width="${CANVAS}" height="${CANVAS}" ` +
    `viewBox="${curViewBox}" preserveAspectRatio="${curPar}" overflow="visible">` +
    `${curInner}` +
    `</svg>` +
    `<svg x="${QUADRANT}" y="${QUADRANT}" width="${QUADRANT}" height="${QUADRANT}" ` +
    `viewBox="${chnViewBox}" preserveAspectRatio="${chnPar}" overflow="visible">` +
    `${chnInner}` +
    `</svg>` +
    `</svg>`
  );
}

/** Build the conventional output filename, mirroring the bulk script. */
export function defaultFilename(
  currencyName: string,
  chainName: string,
): string {
  const ticker = (currencyName.replace(/\.svg$/i, "") || "CURRENCY").toUpperCase();
  // Chain names like "near-dark" → "NEAR_DARK"; "eth" → "ETH".
  const stem = chainName.replace(/\.svg$/i, "");
  const parts = stem.split("-");
  if (parts.length === 1) return `${ticker}-${parts[0].toUpperCase()}.svg`;
  const [head, ...rest] = parts;
  return `${ticker}-${head.toUpperCase()}_${rest.join("_").toUpperCase()}.svg`;
}
