// Crop-to-circle: wraps the source SVG in a 256×256 canvas masked by a circle
// that fills the canvas. The source is fitted with preserveAspectRatio so
// non-square inputs stay centred without distortion.

import {
  CANVAS,
  namespaceIds,
  parseAttrs,
  parseSvg,
  preserveAspectOf,
  viewBoxOf,
} from "@/lib/svg-utils";

const CLIP_ID = "kotova-circle-clip";

export function cropToCircle(sourceSvg: string): string {
  const src = parseSvg(sourceSvg);
  const attrs = parseAttrs(src.attrs);
  const viewBox = viewBoxOf(attrs);
  const par = preserveAspectOf(attrs);
  const inner = namespaceIds(src.inner, "k_");

  const r = CANVAS / 2;

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ` +
    `viewBox="0 0 ${CANVAS} ${CANVAS}" width="${CANVAS}" height="${CANVAS}">` +
    `<defs><clipPath id="${CLIP_ID}">` +
    `<circle cx="${r}" cy="${r}" r="${r}"/>` +
    `</clipPath></defs>` +
    `<g clip-path="url(#${CLIP_ID})">` +
    `<svg x="0" y="0" width="${CANVAS}" height="${CANVAS}" ` +
    `viewBox="${viewBox}" preserveAspectRatio="${par}" overflow="visible">` +
    `${inner}` +
    `</svg>` +
    `</g>` +
    `</svg>`
  );
}

/** Append `-CIRCLE` to the input stem; keeps the existing uppercase convention. */
export function defaultCircleFilename(sourceName: string): string {
  const stem = (sourceName.replace(/\.svg$/i, "") || "ICON").toUpperCase();
  return `${stem}-CIRCLE.svg`;
}
