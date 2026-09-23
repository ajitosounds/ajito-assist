#!/usr/bin/env python3
"""Rebuild everything that depends on the manual PDFs' page numbers, from the PDFs themselves.

    python3 tools/rebuild_page_maps.py            # rebuild, then run check_consistency

What it regenerates (and nothing else):
  * manual-pages/{ja,en}/page-NN.jpg   from the PDFs (pdftoppm, 804 px wide, from page 3)
  * js/app.js  const chapterPages      from the chapter headings printed in the PDFs
  * data/manual.json  page_counts      from pdfinfo
  * data/faq.json  manual_page_ja/en, source, page_mapping.verified_against
                                        by finding each entry's anchor text in the PDF; if the anchor is on
                                        no page, or on several pages within the chapter, the entry is left
                                        untouched and reported (a human decides)

Why: the 2026-09-21 update did this by hand; the next PDF rebuild (2026-09-23, one note added) shifted a
page and 243 references went stale at once. The rule is the same one check_consistency.py enforces, so the
two scripts share its helpers.
"""
import json, os, re, subprocess, sys, shutil

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import check_consistency as cc   # noqa: E402  (norm, pdf_pages, pdf_text, HEADINGS, FIRST_IMAGE_PAGE, LANGS)

IMG_WIDTH = 804


def chapter_pages(text):
    """{chapter: page} from the printed headings (upper-case line next to the chapter number)."""
    out = {}
    for ch, (num, heading) in cc.HEADINGS.items():
        pat = re.compile(r'^\s*%s\s{3,}%s\s*$' % (re.escape(num), re.escape(heading)), re.M)   # same rule as check_consistency
        for p in sorted(text):
            if pat.search(text[p]):
                out[ch] = p
                break
    return out


def rebuild_images(pdf, outdir, n_pages):
    if os.path.isdir(outdir):
        shutil.rmtree(outdir)
    os.makedirs(outdir)
    for p in range(cc.FIRST_IMAGE_PAGE, n_pages + 1):
        subprocess.run(['pdftoppm', '-jpeg', '-r', '96', '-scale-to-x', str(IMG_WIDTH), '-scale-to-y', '-1',
                        '-f', str(p), '-l', str(p), '-singlefile', pdf,
                        os.path.join(outdir, 'page-%02d' % p)], check=True)


def main():
    manual = json.load(open(os.path.join(ROOT, 'data/manual.json'), encoding='utf-8'))
    pdfs = {lang: os.path.join(ROOT, manual['pdf'][lang].lstrip('./')) for lang in ('ja', 'en')}
    counts, text, chapters = {}, {}, {}
    for lang, pdf in pdfs.items():
        counts[lang] = cc.pdf_pages(pdf)
        text[lang] = cc.pdf_text(pdf)
        chapters[lang] = chapter_pages(text[lang])
        missing = [c for c in cc.HEADINGS if c not in chapters[lang]]
        if missing:
            sys.exit('X %s: chapter headings not found for %s' % (lang, missing))
        print('%s: %d pages, chapters %s' % (lang, counts[lang], chapters[lang]))

    # 1. page images
    for lang, pdf in pdfs.items():
        rebuild_images(pdf, os.path.join(ROOT, 'manual-pages', lang), counts[lang])
        print('%s: images page-%02d .. page-%02d' % (lang, cc.FIRST_IMAGE_PAGE, counts[lang]))

    # 2. js/app.js: chapterPages (first page per chapter), embeddedChapterPages (every page a chapter appears on),
    #    embeddedManualPages (page -> image path). Same literal shapes as the hand-made 2026-09-21 versions.
    def chapter_page_lists(lang):
        starts = chapters[lang]; n = counts[lang]; out = {}
        order = sorted(starts, key=lambda c: starts[c])
        for i, c in enumerate(order):
            a = starts[c]
            b = starts[order[i + 1]] if i + 1 < len(order) else n
            pages = list(range(a, b))
            if i + 1 < len(order):
                # the next chapter's first page also belongs to this one when text sits above its heading
                num, heading = cc.HEADINGS[order[i + 1]]
                t = text[lang].get(b, '')
                m = re.search(r'^\s*%s\s{3,}%s\s*$' % (re.escape(num), re.escape(heading)), t, re.M)
                above = [l for l in t[:m.start()].splitlines() if l.strip()] if m else []
                body = [l for l in above if 'USER MANUAL' not in l and 'PART ' not in l]   # drop the running header / PART band
                if body:                # the previous chapter's text runs onto this page
                    pages.append(b)
            else:
                pages = list(range(a, n + 1))
            out[str(c)] = pages
        return out
    app_path = os.path.join(ROOT, 'js/app.js')
    app = open(app_path, encoding='utf-8').read()
    subs = [
        (r'const chapterPages=\{.*?\};',
         'const chapterPages={ja:{%s},en:{%s}};' % (
             ','.join('%d:%d' % (c, chapters['ja'][c]) for c in sorted(chapters['ja'])),
             ','.join('%d:%d' % (c, chapters['en'][c]) for c in sorted(chapters['en'])))),
        (r'const embeddedChapterPages=\{.*?\};',
         'const embeddedChapterPages=' + json.dumps({lang: chapter_page_lists(lang) for lang in ('ja', 'en')}, separators=(',', ':')) + ';'),
        (r'const embeddedManualPages=\{.*?\};',
         'const embeddedManualPages=' + json.dumps({lang: {str(p): './manual-pages/%s/page-%02d.jpg' % (lang, p)
                                                          for p in range(cc.FIRST_IMAGE_PAGE, counts[lang] + 1)}
                                                   for lang in ('ja', 'en')}, separators=(',', ':')) + ';'),
    ]
    for pat, lit in subs:
        app, n = re.subn(pat, lambda m: lit, app, count=1, flags=re.S)
        if n != 1:
            sys.exit('X js/app.js: %s not found' % pat[:30])
    open(app_path, 'w', encoding='utf-8').write(app)

    # 3. manual.json
    manual['page_counts'] = {'ja': counts['ja'], 'en': counts['en']}
    json.dump(manual, open(os.path.join(ROOT, 'data/manual.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
    open(os.path.join(ROOT, 'data/manual.json'), 'a', encoding='utf-8').write('\n')

    # 4. faq.json: re-find each anchor
    faq_path = os.path.join(ROOT, 'data/faq.json')
    faq = json.load(open(faq_path, encoding='utf-8'))
    today = subprocess.run(['date', '+%Y-%m-%d'], capture_output=True, text=True).stdout.strip()
    moved, unresolved = 0, []
    for e in faq:
        pm = e.get('page_mapping') or {}
        ch = e.get('chapter')
        for lang in ('ja', 'en'):
            anchor = pm.get('anchor_' + lang)
            if not anchor:
                continue
            want = cc.norm(anchor, lang)
            # search inside the chapter's page span first, then the whole book
            span = []
            if ch in chapters[lang]:
                start = chapters[lang][ch]
                nxt = min([p for c, p in chapters[lang].items() if p > start] + [counts[lang] + 1])
                span = list(range(start, nxt))
            hits = [p for p in span if want in cc.norm(text[lang].get(p, ''), lang)]
            if not hits:
                hits = [p for p in sorted(text[lang]) if want in cc.norm(text[lang][p], lang)]
            if len(hits) != 1:
                unresolved.append((e['id'], lang, anchor, hits))
                continue
            key = 'manual_page_' + lang
            if e.get(key) != hits[0]:
                e[key] = hits[0]
                moved += 1
        # the source line repeats the page numbers; rewrite only the "p.NN" parts so any other wording survives
        if isinstance(e.get('source'), str) and isinstance(ch, int):
            src = e['source']
            src = re.sub(r'(JP Manual [^/]*?p\.)\d+', lambda m: m.group(1) + str(e.get('manual_page_ja')), src)
            src = re.sub(r'(EN Manual [^/]*?p\.)\d+', lambda m: m.group(1) + str(e.get('manual_page_en')), src)
            e['source'] = src
        if pm:
            pm['verified_against'] = 'v1.5.0 PDFs, anchor-text match per page (%s)' % today
    json.dump(faq, open(faq_path, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
    open(faq_path, 'a', encoding='utf-8').write('\n')
    print('faq: %d page references moved, %d unresolved' % (moved, len(unresolved)))
    for u in unresolved:
        print('   ? %s %s %r -> pages %s' % u)

    # 5. prove it
    rc = subprocess.run([sys.executable, os.path.join(HERE, 'check_consistency.py')]).returncode
    sys.exit(rc)


if __name__ == '__main__':
    main()
