#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""AJITO Assist consistency checker.

Run from anywhere:   python3 tools/check_consistency.py            (exit 0 = consistent, 1 = problems)
Prove it works:      python3 tools/check_consistency.py --self-test (breaks a temp copy on purpose)

What it fails on
  * a PDF or a manual page image that is referenced anywhere (config.json, manual.json, js/app.js) is missing
  * manual.json page_counts differ from the PDFs (pdfinfo) or from the page images on disk
  * the page maps in js/app.js disagree with each other, with the images, or with the chapter headings in the PDFs
  * a FAQ entry's manual_page_* is outside the PDF, its chapter is not in the chapter map, or its anchor text
    (page_mapping.anchor_ja / anchor_en) is not on the page it points to
  * hand-typed counts / versions in index.html, config.json, manual.json disagree with the data
  * the cache-busting values (?v=...) are not all equal

Needs poppler (pdfinfo, pdftotext).  Nothing is written to the repository.
"""
import json, os, re, shutil, subprocess, sys, tempfile, unicodedata

FIRST_IMAGE_PAGE = 3          # page 1 = cover, page 2 = contents: no chapter points at them, so no image is published
LANGS = {'ja': 'JP', 'en': 'EN'}
# Chapter headings as printed in both manuals (upper-case line next to the chapter number).
HEADINGS = {1: ('01', 'WELCOME FROM GOTA'), 2: ('02', 'WHAT IS GROOVE ACTIVATOR'), 3: ('03', 'INSTALLATION & ACTIVATION'),
            4: ('04', 'FIRST SOUND IN 5 MINUTES'), 5: ('05', 'INTERFACE OVERVIEW'), 6: ('06', 'PADS'),
            7: ('07', 'MIXER & OUTPUTS'), 8: ('08', 'THE EDIT PANEL'), 9: ('09', 'PAD SETTINGS'), 10: ('10', 'HI-HAT'),
            11: ('11', 'HAND DAMPING'), 12: ('12', 'MIDI LEARN & MAPS'), 13: ('13', 'ANALOG ACTIVATOR'),
            14: ('14', 'SLICE ACTIVATOR'), 15: ('15', 'INSTANT ACTIVATOR'), 16: ('16', 'GROOVE PLAYER'),
            17: ('17', 'FACTORY KITS & PRESETS'), 18: ('18', 'SHARING KITS'), 19: ('19', 'ORGANISING THE LIBRARY'),
            20: ('20', 'RECORDING & BOUNCING'), 21: ('21', 'BACKUP & RECOVERY'), 22: ('A', 'KEYBOARD SHORTCUTS'),
            23: ('B', 'TROUBLESHOOTING'), 24: ('C', 'CREDITS'), 25: ('D', 'ABOUT AJITO SOUNDS'), 26: ('E', 'COLOPHON')}
FAQ_KEYS = ['id', 'category', 'q_ja', 'a_ja', 'q_en', 'a_en', 'keywords', 'source', 'chapter', 'source_type',
            'manual_page_ja', 'manual_page_en', 'verification', 'page_mapping']


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


def js_const(src, name):
    m = re.search(r'const %s=(\{.*?\});' % re.escape(name), src, re.S)
    if not m:
        return None
    body = m.group(1)
    body = re.sub(r"'", '"', body)
    body = re.sub(r'([{,]\s*)([A-Za-z_0-9]+)\s*:', r'\1"\2":', body)   # quote bare keys (ja:, 1:, ...)
    return json.loads(body)


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
    if config.get('manual_pdf') != manual.get('pdf'):
        E.append('config.json manual_pdf and manual.json pdf differ')
    orig = js_const(app, 'ORIGINAL_MANUAL_PDF')
    if orig != config.get('manual_pdf'):
        E.append(f'js/app.js ORIGINAL_MANUAL_PDF {orig} differs from config.json manual_pdf')
    m = re.search(r"const MANUAL_PDF_FILE='([^']+)'", app)
    if not m or m.group(1) != os.path.basename(config['manual_pdf']['ja']):
        E.append(f"js/app.js MANUAL_PDF_FILE {m.group(1) if m else None!r} is not the JP PDF in config.json")
    for lang, p in (config.get('manual_pdf') or {}).items():
        if vnum and vnum not in p:
            E.append(f'{lang} PDF path {p!r} does not carry the manual version {vnum}')
        if not exists(p):
            E.append(f'missing PDF referenced by config.json/manual.json: {p}')
    for f in sorted(os.listdir(os.path.join(root, 'manual-pdf'))):
        if f.endswith('.pdf') and ('./manual-pdf/' + f) not in (config.get('manual_pdf') or {}).values():
            W.append(f'manual-pdf/{f} is published but nothing references it')

    # ---- 2. page counts: manual.json vs PDFs vs images ----------------------------------------------
    counts, texts = {}, {}
    for lang in LANGS:
        declared = manual.get('page_counts', {}).get(lang)
        counts[lang] = declared
        pdf = os.path.join(root, config['manual_pdf'][lang].lstrip('./'))
        if use_pdf and os.path.isfile(pdf):
            real = pdf_pages(pdf)
            if real != declared:
                E.append(f'manual.json page_counts.{lang}={declared} but the PDF has {real} pages')
            counts[lang] = real
            texts[lang] = pdf_text(pdf)
        imgdir = os.path.join(root, 'manual-pages', lang)
        have = sorted(int(m.group(1)) for m in (re.match(r'page-(\d+)\.jpg$', f) for f in os.listdir(imgdir)) if m)
        want = list(range(FIRST_IMAGE_PAGE, (counts[lang] or 0) + 1))
        if have != want:
            miss = sorted(set(want) - set(have)); extra = sorted(set(have) - set(want))
            E.append(f'manual-pages/{lang}: images do not match pages {FIRST_IMAGE_PAGE}..{counts[lang]} '
                     f'(have {len(have)}, want {len(want)}; missing {miss[:8]}, unexpected {extra[:8]})')

    # ---- 3. page maps in js/app.js ---------------------------------------------------------------------
    chapters = json.loads(re.search(r'const chapters=(\{.*?\});', app).group(1))
    emp = js_const(app, 'embeddedManualPages') or {}
    ecp = js_const(app, 'embeddedChapterPages') or {}
    cp = js_const(app, 'chapterPages') or {}
    total_sections = (manual.get('chapters') or 0) + (manual.get('appendices') or 0)
    if len(chapters) != total_sections:
        E.append(f'js/app.js has {len(chapters)} chapters but manual.json says {manual.get("chapters")} chapters + {manual.get("appendices")} appendices')
    if set(map(int, chapters)) != set(HEADINGS):
        E.append('js/app.js chapter numbers differ from the heading table in this checker')
    for lang in LANGS:
        if lang not in cp or not isinstance(cp.get(lang), dict):
            E.append(f'js/app.js chapterPages has no per-language map for {lang!r} (JP and EN page numbers differ)')
            continue
        for page, src in (emp.get(lang) or {}).items():
            if not exists(src):
                E.append(f'missing page image referenced by embeddedManualPages.{lang}[{page}]: {src}')
            if not src.endswith(f'/{lang}/page-{int(page):02d}.jpg'):
                E.append(f'embeddedManualPages.{lang}[{page}] points at {src}')
        if sorted(map(int, emp.get(lang) or {})) != list(range(FIRST_IMAGE_PAGE, (counts[lang] or 0) + 1)):
            E.append(f'embeddedManualPages.{lang} does not list pages {FIRST_IMAGE_PAGE}..{counts[lang]}')
        if set(ecp.get(lang) or {}) != set(chapters):
            E.append(f'embeddedChapterPages.{lang} chapters differ from the chapters map')
        for ch, pages in (ecp.get(lang) or {}).items():
            if not pages or any(not (FIRST_IMAGE_PAGE <= p <= (counts[lang] or 0)) for p in pages):
                E.append(f'embeddedChapterPages.{lang}[{ch}]={pages} is outside pages {FIRST_IMAGE_PAGE}..{counts[lang]}')
                continue
            if cp[lang].get(str(ch)) != pages[0]:
                E.append(f'chapterPages.{lang}[{ch}]={cp[lang].get(str(ch))} but embeddedChapterPages starts at {pages[0]}')
            if lang in texts:
                num, title = HEADINGS[int(ch)]
                pat = re.compile(r'^\s*%s\s{3,}%s\s*$' % (re.escape(num), re.escape(title)), re.M)
                if not pat.search(texts[lang].get(pages[0], '')):
                    E.append(f'{lang} PDF page {pages[0]} does not carry the heading "{num} {title}" (chapter {ch} start page is wrong)')

    # ---- 4. FAQ -------------------------------------------------------------------------------------------
    ids = [e.get('id') for e in faq]
    for d in sorted({i for i in ids if ids.count(i) > 1}):
        E.append(f'FAQ id {d} is used more than once')
    covered = set()
    for e in faq:
        i = e.get('id')
        if list(e.keys()) != FAQ_KEYS:
            E.append(f'{i}: keys/order differ from the expected FAQ schema')
            continue
        if not isinstance(e['keywords'], list) or not all(isinstance(k, str) for k in e['keywords']):
            E.append(f'{i}: keywords must be a JSON array of strings (js/search.js joins it)')
        for k in ('q_ja', 'a_ja', 'q_en', 'a_en', 'category', 'source', 'source_type'):
            if not isinstance(e[k], str) or not e[k].strip():
                E.append(f'{i}: {k} is empty')
        ch, pj, pe = e['chapter'], e['manual_page_ja'], e['manual_page_en']
        text = ' '.join([e['a_ja'], e['a_en']])
        for mm in re.finditer(r'マニュアル第(\d{1,2})章|Chapter\s+(\d{1,2})', text):
            n = int(mm.group(1) or mm.group(2))
            if n > (manual.get('chapters') or 0):
                E.append(f'{i}: answer links to {mm.group(0)!r}, but the manual has only {manual.get("chapters")} numbered chapters')
        if ch == '':
            if pj != '' or pe != '':
                E.append(f'{i}: has manual pages but no chapter')
            if re.search(r'(?:マニュアル第|Chapter\s*|Ch\.?\s*)(\d{1,2})', ' '.join([text, e['source']])):
                E.append(f'{i}: no chapter set, but its text/source would make js/app.js infer one')
            continue
        if not isinstance(ch, int) or str(ch) not in chapters:
            E.append(f'{i}: chapter {ch!r} is not in the chapter map (1..{len(chapters)})')
            continue
        covered.add(ch)
        for lang, pg in (('ja', pj), ('en', pe)):
            if not isinstance(pg, int) or not (1 <= pg <= (counts[lang] or 0)):
                E.append(f'{i}: manual_page_{lang}={pg!r} is outside the {lang} PDF (1..{counts[lang]})')
                continue
            if pg not in (ecp.get(lang, {}).get(str(ch)) or []):
                W.append(f'{i}: {lang} page {pg} is outside chapter {ch} ({ecp.get(lang, {}).get(str(ch))}) - JP/EN manuals differ here')
            anchor = (e['page_mapping'] or {}).get('anchor_' + lang)
            if anchor and lang in texts and norm(anchor, lang) not in norm(texts[lang].get(pg, ''), lang):
                E.append(f'{i}: anchor text not found on {lang} page {pg}: {anchor!r}')
            if not re.search(r'p\.%d\b' % pg, e['source']):
                E.append(f'{i}: source {e["source"]!r} does not mention {lang} page {pg}')

    # ---- 5. hand-typed numbers in index.html -------------------------------------------------------------
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
        if x != len(covered):
            E.append(f'index.html claims {x} sections covered, FAQ data covers {len(covered)} (missing: {sorted(set(map(int, chapters)) - covered)})')

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

        def faq_edit(fn):
            def g(old):
                data = json.loads(old); fn(data); return json.dumps(data, ensure_ascii=False, indent=2)
            return edit('data/faq.json', g)

        def remove_image():
            p = os.path.join(dst, 'manual-pages/en/page-40.jpg'); bak = p + '.bak'; os.rename(p, bak)
            return lambda: os.rename(bak, p)

        cases = [
            ('a page image is deleted', remove_image, 'manual-pages/en'),
            ('a FAQ page number beyond the PDF', lambda: faq_edit(lambda d: d[0].__setitem__('manual_page_ja', 99)), 'outside the ja PDF'),
            ('a FAQ chapter that does not exist', lambda: faq_edit(lambda d: d[0].__setitem__('chapter', 27)), 'not in the chapter map'),
            ('a FAQ page that does not contain its anchor', lambda: faq_edit(lambda d: d[0].__setitem__('manual_page_en', 40)), 'anchor text not found'),
            ('manual.json page count off by one', lambda: edit('data/manual.json', lambda s: s.replace('"ja": 76', '"ja": 75')), 'but the PDF has'),
            ('index.html FAQ count left stale', lambda: edit('index.html', lambda s: re.sub(r'\d+ base FAQs', '87 base FAQs', s)), 'base FAQs'),
            ('index.html still names the old manual', lambda: edit('index.html', lambda s: s.replace('User Manual v1.5.0', 'User Manual v1.2.2')), "'Primary source'"),
            ('one cache-busting value not bumped', lambda: edit('js/data-loader.js', lambda s: s.replace('v=3.3.0', 'v=3.2.0')), 'cache-busting values are not all equal'),
            ('chapterPages collapsed to one shared map', lambda: edit('js/app.js', lambda s: re.sub(r'const chapterPages=\{ja:(\{[^}]*\}),en:\{[^}]*\}\};', r'const chapterPages=\1;', s)), 'no per-language map'),
            ('an EN chapter start page shifted', lambda: edit('js/app.js', lambda s: s.replace('"4":[14]', '"4":[13]', 1) if '"4":[14]' in s else s), 'chapter 4'),
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
