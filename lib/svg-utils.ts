// Shared SVG parsing helpers used by both the merge and circle-crop features.

export const CANVAS = 256;
export const QUADRANT = CANVAS / 2; // 128

const XML_DECL_RE = /^\s*<\?xml[^?]*\?>\s*/i;
const DOCTYPE_RE = /^\s*<!DOCTYPE[^>]*>\s*/i;
const COMMENT_RE = /<!--[\s\S]*?-->/g;
const SVG_OPEN_RE = /<svg\b([^>]*)>/i;

const ATTR_RE = /(\w[\w:-]*)\s*=\s*"([^"]*)"|(\w[\w:-]*)\s*=\s*'([^']*)'/g;
const ID_DECL_RE = /\bid\s*=\s*(?:"([^"]+)"|'([^']+)')/g;

export interface ParsedSvg {
  attrs: string;
  inner: string;
}

function stripPrelude(svg: string): string {
  svg = svg.replace(XML_DECL_RE, "");
  svg = svg.replace(DOCTYPE_RE, "");
  return svg.trim();
}

export function parseSvg(svg: string): ParsedSvg {
  svg = stripPrelude(svg);
  const m = SVG_OPEN_RE.exec(svg);
  if (!m) throw new Error("No <svg> element found");
  const attrs = (m[1] ?? "").trim();
  const after = svg.slice(m.index + m[0].length);
  const closeIdx = after.lastIndexOf("</svg>");
  if (closeIdx === -1) throw new Error("No closing </svg> tag");
  let inner = after.slice(0, closeIdx).trim();
  inner = inner.replace(COMMENT_RE, "").trim();
  return { attrs, inner };
}

export function parseAttrs(attrStr: string): Record<string, string> {
  const out: Record<string, string> = {};
  ATTR_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = ATTR_RE.exec(attrStr)) !== null) {
    if (m[1] !== undefined) {
      out[m[1].toLowerCase()] = m[2];
    } else {
      out[m[3].toLowerCase()] = m[4];
    }
  }
  return out;
}

export function viewBoxOf(attrs: Record<string, string>): string {
  if (attrs.viewbox) return attrs.viewbox;
  const w = attrs.width;
  const h = attrs.height;
  if (w && h) {
    const wn = parseFloat(w.replace(/[^\d.\-eE]/g, ""));
    const hn = parseFloat(h.replace(/[^\d.\-eE]/g, ""));
    if (!isNaN(wn) && !isNaN(hn)) return `0 0 ${wn} ${hn}`;
  }
  return `0 0 ${CANVAS} ${CANVAS}`;
}

export function preserveAspectOf(attrs: Record<string, string>): string {
  return attrs.preserveaspectratio ?? "xMidYMid meet";
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Prefix every id and id-reference so two SVGs composed into one document
// don't collide on shared ids (common with gradients, masks, clip paths).
export function namespaceIds(svgInner: string, prefix: string): string {
  const ids = new Set<string>();
  ID_DECL_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = ID_DECL_RE.exec(svgInner)) !== null) {
    ids.add(m[1] ?? m[2]);
  }
  if (ids.size === 0) return svgInner;

  let out = svgInner.replace(ID_DECL_RE, (whole, dq, sq) => {
    const val: string = dq ?? sq;
    if (!ids.has(val)) return whole;
    return `id="${prefix}${val}"`;
  });

  const sorted = [...ids].sort((a, b) => b.length - a.length);
  for (const raw of sorted) {
    const esc = escapeRegex(raw);
    out = out.replace(
      new RegExp(`url\\(\\s*(['"]?)#${esc}\\1\\s*\\)`, "g"),
      (_w, q) => `url(${q}#${prefix}${raw}${q})`,
    );
    out = out.replace(
      new RegExp(`(xlink:href|href)\\s*=\\s*"#${esc}"`, "g"),
      (_w, attr) => `${attr}="#${prefix}${raw}"`,
    );
    out = out.replace(
      new RegExp(`(xlink:href|href)\\s*=\\s*'#${esc}'`, "g"),
      (_w, attr) => `${attr}='#${prefix}${raw}'`,
    );
  }
  return out;
}
