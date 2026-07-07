# Kotova Currency × Chain Mapper

A small Next.js tool to merge a currency SVG with a chain SVG into a single
token logo (chain badge fitted into the bottom-right quadrant, no background
fill). Includes a Python bulk script that already generated
`tokens-internal/` for every `x_asset_chains` row.

## Layout

- `app/` — Next.js App Router pages
- `lib/merge-svg.ts` — TypeScript merge logic (used by the web app)
- `lib/fs-access.ts` — File System Access API helpers (remembers a folder
  across reloads via IndexedDB)
- `scripts/merge_svg.py` — Python merge logic (mirror of the TS one)
- `scripts/bulk_generate.py` — generates the full set
- `data/` — snapshot of `x_blockchains.json`, `x_assets.json`,
  `x_asset_chains.json` used by the bulk script

## Web app

```bash
npm install
npm run dev
# open http://localhost:3000
```

- Drop a currency SVG on the left, a chain SVG on the right.
- Filename auto-populates as `{TICKER}-{CHAIN}.svg` (e.g. `USDT-ETH.svg`).
  Editable; "Reset name" recomputes it.
- Click **Save** to write directly to a configured folder (Chrome/Edge), or
  **Download** to use the browser's default Downloads folder (works
  everywhere, including Vercel deployment).
- The folder handle is persisted across reloads. Use "Use Downloads instead"
  to clear it.

### Chain variant naming

Chain filenames with a `-suffix` produce suffixed outputs:
`near-dark.svg` → `{TICKER}-NEAR_DARK.svg`. Single-token chain names just
uppercase: `eth.svg` → `{TICKER}-ETH.svg`.

## Bulk generation

```bash
python3 scripts/bulk_generate.py --dry-run   # preview counts
python3 scripts/bulk_generate.py             # write files
```

Writes to
`../2026-Kotova-Platform/public/images/tokens-internal/`. PNG/JPG currency
icons are skipped (convert to SVG first, then re-run for those rows only).

## Deploying to Vercel

The app uses only client-side merging (no server-side filesystem) so it
deploys as a static-ish Next app cleanly. The File System Access API only
works on `https://` origins (which Vercel provides automatically) and in
Chromium browsers — other browsers fall back to a normal browser download.
