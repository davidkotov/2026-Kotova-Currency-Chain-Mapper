export function placeholderSvg(line: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
    <rect x="0" y="0" width="256" height="256" rx="16" fill="#14181d" stroke="#2a313a" stroke-width="2"/>
    <text x="128" y="132" text-anchor="middle" font-family="ui-sans-serif, Inter, sans-serif" font-size="13" fill="#9aa3ad">Preview</text>
    <text x="128" y="152" text-anchor="middle" font-family="ui-sans-serif, Inter, sans-serif" font-size="11" fill="#5b6470">${escapeXml(line)}</text>
  </svg>`;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
