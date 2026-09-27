# AJITO Assist v3.2 — Stable Refresh

This release restores the proven v3.0 application logic and applies a visual-only refresh.

## Safety policy
- FAQ search logic: unchanged from the working v3.0 release
- 87-FAQ dataset: retained
- Diagnostics, learning, Smart Manual and PDF viewer: retained
- Visual changes: CSS only, apart from version labels and cache-busting query strings

## Deployment
Upload every item inside this folder to the repository root and overwrite matching files.
After GitHub Pages finishes deploying, hard-refresh the public page with Command + Shift + R.

## Content update for Groove Activator v1.5.0 (site v3.3)

- Manual PDFs, page images, page maps (`js/app.js`) and `data/faq.json` now follow the v1.5.0 Queen Edition manual
  (JP 76 pages / EN 78 pages, chapters 1–21 plus A–E, carried as chapter numbers 22–26).
- Before publishing, run `python3 tools/check_consistency.py` (needs poppler). It fails when PDFs, page images,
  page maps, FAQ page references, the hand-typed counts in `index.html` or the cache-busting values disagree.
  `python3 tools/check_consistency.py --self-test` proves the checks still bite.
- Publish by merging the branch with git, not by drag-and-drop upload: this update also deletes files
  (old PDFs and page images), which an upload cannot do.

## Mac + Windows, Groove Activator v1.5.1 (site v3.4)

- One site for both OSes. `js/app.js` guesses the OS (`navigator.userAgentData.platform` / `userAgent`; Windows,
  everything else = Mac), shows a "Mac / Windows" switch in the header and remembers the choice in localStorage
  (`ga_os_v1`). The plugin keeps opening the same URL on both OSes.
- Four manuals in `manual-pdf/`: `GrooveActivator_UserManual_v1.5.1_{Mac,Win}_{JP,EN}.pdf`. Page maps and page counts
  are kept per OS and language (`{mac:{ja,en}, win:{ja,en}}`). `manual-pages/` images were removed: nothing showed them.
- `data/faq.json`: each entry has `platform` (`all` / `mac` / `win`) and `win` (null for Mac-only; otherwise the
  fields that differ on Windows, always including the Windows manual pages and source). Windows text comes only
  from the Windows manual; where it has no fact, the entry is Mac-only.
- After replacing a PDF: `python3 tools/rebuild_page_maps.py` (all four PDFs), then `python3 tools/check_consistency.py`
  and `--self-test`.
