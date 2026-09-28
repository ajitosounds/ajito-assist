#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""AJITO Assist consistency checker (Mac + Windows).

Run from anywhere:   python3 tools/check_consistency.py            (exit 0 = consistent, 1 = problems)
Prove it works:      python3 tools/check_consistency.py --self-test (breaks a temp copy on purpose)

The site serves one manual per OS (Mac / Windows) and per language (JP / EN), four PDFs in all.
The visitor's OS is picked in the page (js/app.js); every page number below is therefore checked per OS.

What it fails on
  * a PDF that is referenced anywhere (config.json, manual.json, js/app.js) is missing, or its name does not
    carry the manual version, the OS and the language
  * manual.json page_counts differ from the PDFs (pdfinfo)
  * the page maps in js/app.js disagree with each other or with the chapter headings in the PDFs of that OS
  * a FAQ entry, as seen on either OS, points outside that OS's PDF, at a chapter that does not exist, or at a
    page that does not carry its anchor text (page_mapping.anchor_* / win.anchor_*)
  * an entry shown on Windows has no Windows page numbers of its own, or its Windows text still carries a
    Mac-only term (Finder, Cmd, ~/Library, .pkg, AU, Logic, ...) that is not explicitly allowed below
  * hand-typed counts / versions in index.html, config.json, manual.json disagree with the data
  * index.html has no Mac / Windows switch
  * the cache-busting values (?v=...) are not all equal

FAQ schema (data/faq.json), per entry, in this key order:
  FAQ_KEYS below. The top-level text and manual_page_* / source / page_mapping anchors are the Mac view.
  platform: "all" (both OSes), "mac" (Mac only) or "win" (Windows only)
  win:      null when platform is "mac"; otherwise an object whose keys override the top-level ones on
            Windows (WIN_KEYS). It must carry the Windows manual_page_ja / manual_page_en / source whenever
            the entry has a chapter, so a Windows page number is never a Mac one by accident.

Needs poppler (pdfinfo, pdftotext).  Nothing is written to the repository.
"""
import json, os, re, shutil, subprocess, sys, tempfile, unicodedata

FIRST_CONTENT_PAGE = 3        # page 1 = cover, page 2 = contents: no chapter starts before page 3
LANGS = {'ja': 'JP', 'en': 'EN'}
OSES = {'mac': 'Mac', 'win': 'Win'}     # value = the tag in the PDF file name
PLATFORMS = ('all', 'mac', 'win')
# Chapter headings as printed in all four manuals (upper-case line next to the chapter number).
HEADINGS = {1: ('01', 'WELCOME FROM GOTA'), 2: ('02', 'WHAT IS GROOVE ACTIVATOR'), 3: ('03', 'INSTALLATION & ACTIVATION'),
            4: ('04', 'FIRST SOUND IN 5 MINUTES'), 5: ('05', 'INTERFACE OVERVIEW'), 6: ('06', 'PADS'),
            7: ('07', 'MIXER & OUTPUTS'), 8: ('08', 'THE EDIT PANEL'), 9: ('09', 'PAD SETTINGS'), 10: ('10', 'HI-HAT'),
            11: ('11', 'HAND DAMPING'), 12: ('12', 'MIDI LEARN & MAPS'), 13: ('13', 'ANALOG ACTIVATOR'),
            14: ('14', 'SLICE ACTIVATOR'), 15: ('15', 'INSTANT ACTIVATOR'), 16: ('16', 'GROOVE PLAYER'),
            17: ('17', 'FACTORY KITS & PRESETS'), 18: ('18', 'SHARING KITS'), 19: ('19', 'ORGANISING THE LIBRARY'),
            20: ('20', 'RECORDING & BOUNCING'), 21: ('21', 'BACKUP & RECOVERY'), 22: ('A', 'KEYBOARD SHORTCUTS'),
            23: ('B', 'TROUBLESHOOTING'), 24: ('C', 'CREDITS'), 25: ('D', 'ABOUT AJITO SOUNDS'), 26: ('E', 'COLOPHON')}
FAQ_KEYS = ['id', 'category', 'q_ja', 'a_ja', 'q_en', 'a_en', 'keywords', 'source', 'chapter', 'source_type',
            'manual_page_ja', 'manual_page_en', 'verification', 'page_mapping', 'platform', 'win']
WIN_KEYS = {'q_ja', 'a_ja', 'q_en', 'a_en', 'keywords', 'source', 'chapter', 'manual_page_ja', 'manual_page_en',
            'anchor_ja', 'anchor_en'}
# Words that belong to the Mac only. Case-sensitive on purpose: the BROWSE panel's button is printed "FINDER"
# in the Windows manual too, while "Finder" (the Mac app) must not reach a Windows visitor.
MAC_TERMS = {
    'Finder': r'Finder', 'Cmd': r'(?<![A-Za-z])Cmd(?![A-Za-z])', '⌘': r'⌘', 'Option': r'(?<![A-Za-z])Option(?![A-Za-z])',
    '~/Library': r'~/Library', '/Library/': r'/Library/', '/Applications': r'/Applications', '.pkg': r'\.pkg\b',
    '.component': r'\.component\b', 'Audio Unit': r'Audio ?Units?', 'AU': r'(?<![A-Za-z])AU(?![A-Za-z])',
    'macOS': r'macOS', 'Mac': r'(?<![A-Za-z])Macs?(?![A-Za-z])', 'Logic': r'Logic', 'Gatekeeper': r'Gatekeeper',
    'notarize': r'公証|[Nn]otari[sz]', 'Terminal': r'Terminal|ターミナル|killall', 'Core Audio': r'Core ?Audio',
}
# Mac terms a Windows answer may carry, because the Windows manual says the same thing in the same place.
WIN_ALLOWED_TERMS = {
    'SYS-002': {'AU', 'Audio Unit', 'macOS'},   # "There is no AU (Audio Units) build for Windows. AU is a macOS-only format."
    'SYS-003': {'AU', 'Audio Unit', 'macOS'},   # same note
    'INS-007': {'macOS'},                       # "(On macOS they sit in a separate place; on Windows there is only one.)"
    'LIC-001': {'Mac'},                         # "up to two (2) machines — Mac and Windows in any mix"
    'LIC-003': {'Mac'},                         # same note
    'UI-005': {'Logic'},                        # "the same idea as Logic's Quick Help" (Ch.5, both OS manuals)
}


def norm(s, lang):
    s = unicodedata.normalize('NFKC', s)
    for a, b in (('’', "'"), ('‘', "'"), ('“', '"'), ('”', '"'), ('—', '-'), ('–', '-'), ('─', '-')):
        s = s.replace(a, b)
    s = re.sub(r'-+', '-', s)
    return re.sub(r'\s+', '' if lang == 'ja' else ' ', s).lower()


def pdf_pages(path):
    out = subprocess.run(['pdfinfo', path], capture_output=True, text=True, check=True).stdout
    return int(re.search(r'^Pages:\s+(\d+)', out, re.M).group(1))


def pdf_text(path):
    out = subprocess.run(['pdftotext', '-layout', path, '-'], capture_output=True, text=True, check=True).stdout
    pages = out.split('\f')
    return {i + 1: t for i, t in enumerate(pages) if i + 1 <= len(pages)}


def heading_re(ch):
    num, title = HEADINGS[int(ch)]
    return re.compile(r'^\s*%s\s{3,}%s\s*$' % (re.escape(num), re.escape(title)), re.M)


def js_const(src, name):
    m = re.search(r'const %s=(\{.*?\});' % re.escape(name), src, re.S)
    if not m:
        return None
    body = m.group(1)
    body = re.sub(r"'", '"', body)
    body = re.sub(r'([{,]\s*)([A-Za-z_0-9]+)\s*:', r'\1"\2":', body)   # quote bare keys (ja:, 1:, ...)
    return json.loads(body)


def view(e, osk):
    """The entry as a visitor on `osk` sees it (same merge as js/app.js faqView), or None if it is hidden there.
    Anchors come back as anchor_ja / anchor_en."""
    platform = e.get('platform', 'all')
    pm = e.get('page_mapping') or {}
    if osk == 'mac':
        if platform == 'win':
            return None
        v = dict(e)
        v['anchor_ja'], v['anchor_en'] = pm.get('anchor_ja'), pm.get('anchor_en')
        return v
    if platform == 'mac':
        return None
    w = e.get('win') or {}
    v = dict(e)
    v['anchor_ja'], v['anchor_en'] = pm.get('anchor_ja'), pm.get('anchor_en')
    v.update(w)
    return v


def run_checks(root, use_pdf=True):
    E, W = [], []
    rd = lambda p: open(os.path.join(root, p), encoding='utf-8').read()
    exists = lambda p: os.path.isfile(os.path.join(root, p.lstrip('./')))

    config = json.loads(rd('data/config.json'))
    manual = json.loads(rd('data/manual.json'))
    faq = json.loads(rd('data/faq.json'))
    index = rd('index.html')
    app = rd('js/app.js')
    loader = rd('js/data-loader.js')

    # ---- 1. versions and PDF paths ------------------------------------------------------------------
    mv = config.get('manual_version')
    if manual.get('version') != mv:
        E.append(f"manual version: config.json says {mv!r}, manual.json says {manual.get('version')!r}")
    m = re.search(r'User Manual (v[\d.]+ \w+ Edition)', index)
    if not m or m.group(1) != mv:
        E.append(f"index.html 'Primary source' says {m.group(1) if m else None!r}, config.json says {mv!r}")
    vnum = (mv or '').split(' ')[0]
    pdfs = config.get('manual_pdf') or {}
    if pdfs != manual.get('pdf'):
        E.append('config.json manual_pdf and manual.json pdf differ')
    orig = js_const(app, 'ORIGINAL_MANUAL_PDF')
    if orig != pdfs:
        E.append(f'js/app.js ORIGINAL_MANUAL_PDF {orig} differs from config.json manual_pdf')
    referenced = set()
    for osk, tag in OSES.items():
        if not isinstance(pdfs.get(osk), dict):
            E.append(f'config.json manual_pdf has no {osk!r} map (one PDF per OS and language)')
            continue
        for lang, ltag in LANGS.items():
            p = pdfs[osk].get(lang)
            if not p:
                E.append(f'config.json manual_pdf.{osk}.{lang} is missing'); continue
            referenced.add(p)
            base = os.path.basename(p)
            if vnum and vnum not in base:
                E.append(f'{osk}/{lang} PDF path {p!r} does not carry the manual version {vnum}')
            if f'_{tag}_' not in base or not base.endswith(f'_{ltag}.pdf'):
                E.append(f'{osk}/{lang} PDF path {p!r} does not carry _{tag}_ and _{ltag}.pdf')
            if not exists(p):
                E.append(f'missing PDF referenced by config.json/manual.json: {p}')
    for f in sorted(os.listdir(os.path.join(root, 'manual-pdf'))):
        if f.endswith('.pdf') and ('./manual-pdf/' + f) not in referenced:
            W.append(f'manual-pdf/{f} is published but nothing references it')
    for mm in re.finditer(r"""['"](\./manual-(?:pdf|pages)/[^'"]+)['"]""", app + index):
        if not exists(mm.group(1)):
            E.append(f'js/app.js or index.html references a missing file: {mm.group(1)}')

    # ---- 2. page counts: manual.json vs PDFs ---------------------------------------------------------------
    counts, texts = {}, {}
    for osk in OSES:
        counts[osk], texts[osk] = {}, {}
        for lang in LANGS:
            declared = ((manual.get('page_counts') or {}).get(osk) or {}).get(lang)
            if not isinstance(declared, int):
                E.append(f'manual.json page_counts.{osk}.{lang} is missing')
            counts[osk][lang] = declared or 0
            pdf = os.path.join(root, ((pdfs.get(osk) or {}).get(lang) or '').lstrip('./'))
            if use_pdf and os.path.isfile(pdf):
                real = pdf_pages(pdf)
                if real != declared:
                    E.append(f'manual.json page_counts.{osk}.{lang}={declared} but the PDF has {real} pages')
                counts[osk][lang] = real
                texts[osk][lang] = pdf_text(pdf)

    # ---- 3. page maps in js/app.js ---------------------------------------------------------------------
    chapters = json.loads(re.search(r'const chapters=(\{.*?\});', app).group(1))
    ecp = js_const(app, 'embeddedChapterPages') or {}
    cp = js_const(app, 'chapterPages') or {}
    total_sections = (manual.get('chapters') or 0) + (manual.get('appendices') or 0)
    if len(chapters) != total_sections:
        E.append(f'js/app.js has {len(chapters)} chapters but manual.json says {manual.get("chapters")} chapters + {manual.get("appendices")} appendices')
    if set(map(int, chapters)) != set(HEADINGS):
        E.append('js/app.js chapter numbers differ from the heading table in this checker')
    for osk in OSES:
        for lang in LANGS:
            cmap = (cp.get(osk) or {}).get(lang) if isinstance(cp.get(osk), dict) else None
            emap = (ecp.get(osk) or {}).get(lang) if isinstance(ecp.get(osk), dict) else None
            if not isinstance(cmap, dict) or not isinstance(emap, dict):
                E.append(f'js/app.js chapterPages / embeddedChapterPages has no per-OS, per-language map for {osk}.{lang} '
                         '(Mac and Windows, JP and EN page numbers differ)')
                continue
            n = counts[osk][lang]
            if set(emap) != set(chapters):
                E.append(f'embeddedChapterPages.{osk}.{lang} chapters differ from the chapters map')
            for ch, pages in emap.items():
                if not pages or any(not (FIRST_CONTENT_PAGE <= p <= n) for p in pages):
                    E.append(f'embeddedChapterPages.{osk}.{lang}[{ch}]={pages} is outside pages {FIRST_CONTENT_PAGE}..{n}')
                    continue
                if cmap.get(str(ch)) != pages[0]:
                    E.append(f'chapterPages.{osk}.{lang}[{ch}]={cmap.get(str(ch))} but embeddedChapterPages starts at {pages[0]}')
                if lang in texts[osk] and not heading_re(ch).search(texts[osk][lang].get(pages[0], '')):
                    num, title = HEADINGS[int(ch)]
                    E.append(f'{osk} {lang} PDF page {pages[0]} does not carry the heading "{num} {title}" (chapter {ch} start page is wrong)')

    # ---- 4. FAQ -------------------------------------------------------------------------------------------
    ids = [e.get('id') for e in faq]
    for d in sorted({i for i in ids if ids.count(i) > 1}):
        E.append(f'FAQ id {d} is used more than once')
    covered = {osk: set() for osk in OSES}
    mac_res = {k: re.compile(p) for k, p in MAC_TERMS.items()}
    for e in faq:
        i = e.get('id')
        if list(e.keys()) != FAQ_KEYS:
            E.append(f'{i}: keys/order differ from the expected FAQ schema'); continue
        platform, w = e['platform'], e['win']
        if platform not in PLATFORMS:
            E.append(f'{i}: platform {platform!r} is not one of {PLATFORMS}'); continue
        if platform == 'mac' and w is not None:
            E.append(f'{i}: platform "mac" but it carries Windows data (win should be null)')
        if platform != 'mac':
            if not isinstance(w, dict):
                E.append(f'{i}: platform {platform!r} needs a win object (at least the Windows page numbers)'); continue
            extra = set(w) - WIN_KEYS
            if extra:
                E.append(f'{i}: win has unknown keys {sorted(extra)}')
        for osk in OSES:
            v = view(e, osk)
            if v is None:
                continue
            where = f'{i} [{osk}]'
            if not isinstance(v['keywords'], list) or not all(isinstance(k, str) for k in v['keywords']):
                E.append(f'{where}: keywords must be a JSON array of strings (js/search.js joins it)')
            for k in ('q_ja', 'a_ja', 'q_en', 'a_en', 'category', 'source', 'source_type'):
                if not isinstance(v[k], str) or not v[k].strip():
                    E.append(f'{where}: {k} is empty')
            ch, pj, pe = v['chapter'], v['manual_page_ja'], v['manual_page_en']
            text = ' '.join([v['a_ja'], v['a_en']])
            if osk == 'win':
                allowed = WIN_ALLOWED_TERMS.get(i, set())
                hay = ' '.join([v['q_ja'], v['a_ja'], v['q_en'], v['a_en']])
                for name, rx in mac_res.items():
                    if name not in allowed and rx.search(hay):
                        E.append(f'{where}: Windows text carries the Mac-only term {name!r} '
                                 f'(give it Windows text from the Windows manual, or set platform "mac")')
            for mm in re.finditer(r'マニュアル第(\d{1,2})章|Chapter\s+(\d{1,2})', text):
                n = int(mm.group(1) or mm.group(2))
                if n > (manual.get('chapters') or 0):
                    E.append(f'{where}: answer links to {mm.group(0)!r}, but the manual has only {manual.get("chapters")} numbered chapters')
            if ch == '':
                if pj != '' or pe != '':
                    E.append(f'{where}: has manual pages but no chapter')
                if re.search(r'(?:マニュアル第|Chapter\s*|Ch\.?\s*)(\d{1,2})', ' '.join([text, v['source']])):
                    E.append(f'{where}: no chapter set, but its text/source would make js/app.js infer one')
                continue
            if not isinstance(ch, int) or str(ch) not in chapters:
                E.append(f'{where}: chapter {ch!r} is not in the chapter map (1..{len(chapters)})'); continue
            if osk == 'win':
                missing = [k for k in ('manual_page_ja', 'manual_page_en', 'source') if k not in (w or {})]
                if missing:
                    E.append(f'{where}: no Windows page reference of its own ({", ".join("win." + k for k in missing)} missing) '
                             '- it would open the Windows manual on a Mac page number')
                    continue
                if 'Windows' not in v['source']:
                    E.append(f'{where}: Windows source {v["source"]!r} does not say it cites the Windows manual')
            covered[osk].add(ch)
            for lang, pg in (('ja', pj), ('en', pe)):
                n = counts[osk][lang]
                if not isinstance(pg, int) or not (1 <= pg <= n):
                    E.append(f'{where}: manual_page_{lang}={pg!r} is outside the {osk} {lang} PDF (1..{n})'); continue
                span = ((ecp.get(osk) or {}).get(lang) or {}).get(str(ch)) or []
                if pg not in span:
                    W.append(f'{where}: {lang} page {pg} is outside chapter {ch} ({span})')
                anchor = v.get('anchor_' + lang)
                if anchor and lang in texts[osk] and norm(anchor, lang) not in norm(texts[osk][lang].get(pg, ''), lang):
                    E.append(f'{where}: anchor text not found on {osk} {lang} page {pg}: {anchor!r}')
                if not re.search(r'p\.%d\b' % pg, v['source']):
                    E.append(f'{where}: source {v["source"]!r} does not mention {lang} page {pg}')

    # ---- 5. hand-typed numbers and the OS switch in index.html -------------------------------------------
    m = re.search(r'(\d+) base FAQs', index)
    if not m or int(m.group(1)) != len(faq):
        E.append(f"index.html says {m.group(1) if m else None} base FAQs, data/faq.json has {len(faq)}")
    m = re.search(r'Manual coverage: (\d+) / (\d+) sections \((\d+) chapters \+ appendices', index)
    if not m:
        E.append('index.html: "Manual coverage: X / Y sections (N chapters + appendices ...)" not found')
    else:
        x, y, n = map(int, m.groups())
        if y != len(chapters) or n != manual.get('chapters'):
            E.append(f'index.html coverage denominator {y} ({n} chapters) differs from the chapter map {len(chapters)} / manual.json {manual.get("chapters")}')
        for osk in OSES:
            if x != len(covered[osk]):
                E.append(f'index.html claims {x} sections covered, FAQ data covers {len(covered[osk])} on {osk} '
                         f'(missing: {sorted(set(map(int, chapters)) - covered[osk])})')
    for osk in OSES:
        if not re.search(r'<button[^>]*data-os="%s"' % osk, index):
            E.append(f'index.html has no OS switch button data-os="{osk}"')

    # ---- 6. cache-busting -----------------------------------------------------------------------------------
    vals = {}
    for mm in re.finditer(r'(?:href|src)="([^"]+)\?v=([^"]+)"', index):
        vals[f'index.html {mm.group(1)}'] = mm.group(2)
    for mm in re.finditer(r'[?&]?v=(\d+\.\d+\.\d+)', loader):
        vals['js/data-loader.js'] = mm.group(1)
    vals['data/config.json version'] = config.get('version')
    if len(vals) < 8:
        E.append(f'expected 8 cache-busting/version values, found {len(vals)}: {sorted(vals)}')
    if len(set(vals.values())) != 1:
        E.append('cache-busting values are not all equal: ' + ', '.join(f'{k}={v}' for k, v in sorted(vals.items())))
    m = re.search(r'Stable Experience v(\d+\.\d+)', index)
    if m and config.get('version') and not str(config['version']).startswith(m.group(1) + '.'):
        E.append(f"index.html subtitle says v{m.group(1)}, config.json version is {config['version']}")
    return E, W


def report(root, use_pdf=True, quiet=False):
    E, W = run_checks(root, use_pdf)
    if not quiet:
        for w in W: print('  warn :', w)
        for e in E: print('  ERROR:', e)
        print(f'{"FAIL" if E else "OK"}: {len(E)} error(s), {len(W)} warning(s)')
    return E, W


def self_test(root):
    tmp = tempfile.mkdtemp(prefix='ajito_check_')
    try:
        dst = os.path.join(tmp, 'site')
        shutil.copytree(root, dst, ignore=shutil.ignore_patterns('.git', 'app', 'releases'))
        base, _ = run_checks(dst)
        if base:
            print('self-test needs a clean tree first; current errors:'); [print('  ', e) for e in base]; return 1

        def edit(rel, fn):
            p = os.path.join(dst, rel); old = open(p, encoding='utf-8').read()
            open(p, 'w', encoding='utf-8').write(fn(old)); return lambda: open(p, 'w', encoding='utf-8').write(old)

        def json_edit(rel, fn):
            def g(old):
                data = json.loads(old); fn(data); return json.dumps(data, ensure_ascii=False, indent=2)
            return edit(rel, g)

        def js_edit(name, fn):
            def g(src):
                data = js_const(src, name); fn(data)
                return re.sub(r'const %s=\{.*?\};' % name, lambda m: 'const %s=%s;' % (name, json.dumps(data)), src, count=1, flags=re.S)
            return edit('js/app.js', g)

        def remove_pdf():
            p = os.path.join(dst, json.load(open(os.path.join(dst, 'data/config.json')))['manual_pdf']['win']['en'].lstrip('./'))
            bak = p + '.bak'; os.rename(p, bak)
            return lambda: os.rename(bak, p)

        faq = json.load(open(os.path.join(dst, 'data/faq.json'), encoding='utf-8'))
        first_ch = next(k for k, e in enumerate(faq) if isinstance(e['chapter'], int) and e['page_mapping'] and e['page_mapping'].get('anchor_en'))
        wrong_en = 40 if faq[first_ch]['manual_page_en'] != 40 else 41
        win_ch = next(k for k, e in enumerate(faq) if e['platform'] != 'mac' and isinstance(view(e, 'win')['chapter'], int)
                      and view(e, 'win').get('anchor_ja'))
        common = next(k for k, e in enumerate(faq) if e['platform'] == 'all' and not (set(e['win']) & {'a_ja', 'a_en'}))
        cfg_version = json.load(open(os.path.join(dst, 'data/config.json')))['version']
        mv = json.load(open(os.path.join(dst, 'data/config.json')))['manual_version'].split(' ')[0]

        def shift_win_en_ch4(d):
            d['win']['en']['4'][0] -= 1

        cases = [
            ('a Windows PDF is deleted', remove_pdf, 'missing PDF'),
            ('a FAQ page number beyond the PDF', lambda: json_edit('data/faq.json', lambda d: d[first_ch].__setitem__('manual_page_ja', 999)), 'outside the mac ja PDF'),
            ('a FAQ chapter that does not exist', lambda: json_edit('data/faq.json', lambda d: d[first_ch].__setitem__('chapter', 27)), 'not in the chapter map'),
            ('a FAQ page that does not contain its anchor', lambda: json_edit('data/faq.json', lambda d: d[first_ch].__setitem__('manual_page_en', wrong_en)), 'anchor text not found on mac en'),
            ('a Windows page left at a wrong number', lambda: json_edit('data/faq.json', lambda d: d[win_ch]['win'].__setitem__('manual_page_ja', d[win_ch]['win']['manual_page_ja'] + (7 if d[win_ch]['win']['manual_page_ja'] < 40 else -7))), 'anchor text not found on win ja'),
            ('a Windows page reference missing', lambda: json_edit('data/faq.json', lambda d: d[win_ch]['win'].pop('manual_page_en')), 'no Windows page reference'),
            ('a Mac-only word in a Windows answer', lambda: json_edit('data/faq.json', lambda d: d[common].__setitem__('a_en', d[common]['a_en'] + ' Open it in the Finder.')), "Mac-only term 'Finder'"),
            ('an unknown platform value', lambda: json_edit('data/faq.json', lambda d: d[common].__setitem__('platform', 'linux')), 'is not one of'),
            ('manual.json page count off by one', lambda: json_edit('data/manual.json', lambda d: d['page_counts']['win'].__setitem__('ja', d['page_counts']['win']['ja'] - 1)), 'but the PDF has'),
            ('index.html FAQ count left stale', lambda: edit('index.html', lambda s: re.sub(r'\d+ base FAQs', '87 base FAQs', s)), 'base FAQs'),
            ('index.html still names the old manual', lambda: edit('index.html', lambda s: s.replace('User Manual ' + mv, 'User Manual v1.2.2')), "'Primary source'"),
            ('index.html lost the Windows switch', lambda: edit('index.html', lambda s: s.replace('data-os="win"', 'data-os="x"')), 'no OS switch'),
            ('one cache-busting value not bumped', lambda: edit('js/data-loader.js', lambda s: s.replace('v=' + cfg_version, 'v=0.0.0')), 'cache-busting values are not all equal'),
            ('page maps collapsed to one shared OS', lambda: js_edit('chapterPages', lambda d: d.pop('win')), 'no per-OS, per-language map'),
            ('a Windows EN chapter start page shifted', lambda: js_edit('embeddedChapterPages', shift_win_en_ch4), 'chapter 4'),
        ]
        bad = 0
        for name, breaker, expect in cases:
            undo = breaker()
            E, _ = run_checks(dst)
            undo()
            hit = [e for e in E if expect in e]
            ok = bool(hit)
            bad += (not ok)
            print(f'  {"caught" if ok else "MISSED"}: {name}')
            if hit: print(f'           -> {hit[0][:150]}')
        E, _ = run_checks(dst)
        if E:
            print('  tree not clean after restoring:', E[:3]); bad += 1
        print(f'self-test: {len(cases) - bad}/{len(cases)} broken cases caught, clean copy passes again = {not E}')
        return 1 if bad else 0
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


if __name__ == '__main__':
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    for tool in ('pdfinfo', 'pdftotext'):
        if not shutil.which(tool):
            print(f'ERROR: {tool} (poppler) is required - e.g. brew install poppler'); sys.exit(2)
    if '--self-test' in sys.argv:
        sys.exit(self_test(root))
    E, _ = report(root)
    sys.exit(1 if E else 0)
