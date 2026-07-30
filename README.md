# AJITO Assist v3.0 — Modular Architecture

## Structure
- `index.html` — semantic UI shell only
- `css/app.css` — all visual styles
- `js/data-loader.js` — JSON loading and boot lifecycle
- `js/search.js` — reusable search scoring engine
- `js/diagnostics.js` — reusable diagnostic session helpers
- `js/app.js` — FAQ, learning, Smart Manual and application behavior
- `js/viewer.js` — fullscreen original-PDF viewer
- `data/*.json` — editable content databases
- `manual-pdf/` — official Japanese and English manuals

## GitHub Pages deployment
Upload the complete folder contents without changing the directory structure.
Do not open `index.html` directly with `file://`; JSON loading requires GitHub Pages or a local web server.

## Local test
From this directory, run:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.
