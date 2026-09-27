#!/usr/bin/env python3
"""Rebuild everything that depends on the manual PDFs' page numbers, from the PDFs themselves - per OS.

    python3 tools/rebuild_page_maps.py            # rebuild, then run check_consistency

The site carries four manuals: Mac JP / Mac EN / Windows JP / Windows EN (data/manual.json "pdf").
What it regenerates (and nothing else):
  * js/app.js  const chapterPages          {mac:{ja,en}, win:{ja,en}} first page of each chapter, from the
                                           chapter headings printed in each PDF
  * js/app.js  const embeddedChapterPages  same shape, every page a chapter appears on
  * data/manual.json  page_counts          {mac:{ja,en}, win:{ja,en}} from pdfinfo
  * data/faq.json                          Mac view: manual_page_ja/en and the "p.NN" parts of source
                                           Windows view: win.manual_page_ja/en and win.source
                                           by finding each entry's anchor text in that OS's PDF; if the anchor is
                                           on no page, or on several pages within the chapter, the entry is left
                                           untouched and reported (a human decides - nothing is guessed)
Page images (manual-pages/) are no longer produced: nothing in the site showed them (checked 2026-09-27).

Why: the 2026-09-21 update did this by hand; the next PDF rebuild (2026-09-23, one note added) shifted a
page and 243 references went stale at once. The rule is the same one check_consistency.py enforces, so the
two scripts share its helpers.
"""
import json, os, re, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import check_consistency as cc   # noqa: E402  (norm, pdf_pages, pdf_text, heading_re, HEADINGS, OSES, LANGS, view)


def chapter_pages(text):
    """{chapter: page} from the printed headings (upper-case line next to the chapter number)."""
    out = {}
    for ch in cc.HEADINGS:
        pat = cc.heading_re(ch)          # same rule as check_consistency
        for p in sorted(text):
            if pat.search(text[p]):
                out[ch] = p
                break
    return out


def chapter_page_lists(starts, text, n):
    """{chapter: [pages]}: a chapter runs to the page before the next one starts, and also owns the next
    chapter's first page when its own text continues above that heading."""
    out = {}
    order = sorted(starts, key=lambda c: starts[c])
    for i, c in enumerate(order):
        a = starts[c]
        if i + 1 < len(order):
            b = starts[order[i + 1]]
            pages = list(range(a, b))
            t = text.get(b, '')
            m = cc.heading_re(order[i + 1]).search(t)
            above = [l for l in t[:m.start()].splitlines() if l.strip()] if m else []
            body = [l for l in above if 'USER MANUAL' not in l and 'PART ' not in l]   # drop the running header / PART band
            if body:                # the previous chapter's text runs onto this page
                pages.append(b)
        else:
            pages = list(range(a, n + 1))
        out[str(c)] = pages
    return out


def rewrite_source(src, pj, pe):
    """Rewrite only the "p.NN" after "JP Manual ..." / "EN Manual ..." so any other wording survives."""
    src = re.sub(r'(JP Manual [^/]*?p\.)\d+', lambda m: m.group(1) + str(pj), src)
    src = re.sub(r'(EN Manual [^/]*?p\.)\d+', lambda m: m.group(1) + str(pe), src)
    return src


def main():
    manual = json.load(open(os.path.join(ROOT, 'data/manual.json'), encoding='utf-8'))
    counts, text, chapters = {}, {}, {}
    for osk in cc.OSES:
        counts[osk], text[osk], chapters[osk] = {}, {}, {}
        for lang in cc.LANGS:
            pdf = os.path.join(ROOT, manual['pdf'][osk][lang].lstrip('./'))
            counts[osk][lang] = cc.pdf_pages(pdf)
            text[osk][lang] = cc.pdf_text(pdf)
            chapters[osk][lang] = chapter_pages(text[osk][lang])
            missing = [c for c in cc.HEADINGS if c not in chapters[osk][lang]]
            if missing:
                sys.exit('X %s %s: chapter headings not found for %s' % (osk, lang, missing))
            print('%s %s: %d pages, chapters %s' % (osk, lang, counts[osk][lang], chapters[osk][lang]))

    # 1. js/app.js page maps
    cp = {osk: {lang: {str(c): chapters[osk][lang][c] for c in sorted(chapters[osk][lang])} for lang in cc.LANGS} for osk in cc.OSES}
    ecp = {osk: {lang: chapter_page_lists(chapters[osk][lang], text[osk][lang], counts[osk][lang]) for lang in cc.LANGS} for osk in cc.OSES}
    app_path = os.path.join(ROOT, 'js/app.js')
    app = open(app_path, encoding='utf-8').read()
    for name, data in (('chapterPages', cp), ('embeddedChapterPages', ecp)):
        lit = 'const %s=%s;' % (name, json.dumps(data, separators=(',', ':')))
        app, n = re.subn(r'const %s=\{.*?\};' % name, lambda m: lit, app, count=1, flags=re.S)
        if n != 1:
            sys.exit('X js/app.js: const %s not found' % name)
    open(app_path, 'w', encoding='utf-8').write(app)

    # 2. manual.json
    manual['page_counts'] = counts
    with open(os.path.join(ROOT, 'data/manual.json'), 'w', encoding='utf-8') as f:
        json.dump(manual, f, ensure_ascii=False, indent=2); f.write('\n')

    # 3. faq.json: re-find each anchor, per OS
    faq_path = os.path.join(ROOT, 'data/faq.json')
    faq = json.load(open(faq_path, encoding='utf-8'))
    today = subprocess.run(['date', '+%Y-%m-%d'], capture_output=True, text=True).stdout.strip()
    moved, unresolved = 0, []
    for e in faq:
        for osk in cc.OSES:
            v = cc.view(e, osk)
            if v is None or not isinstance(v.get('chapter'), int):
                continue
            ch = v['chapter']
            target = e if osk == 'mac' else e['win']      # where this OS keeps its page numbers
            if osk == 'win' and 'source' not in target:
                # first Windows reference: start from the Mac wording, labelled as the Windows manual
                target['source'] = re.sub(r'\b(JP|EN) Manual\b', r'\1 Manual (Windows)', e['source'])
            pages = {}
            for lang in cc.LANGS:
                anchor = v.get('anchor_' + lang)
                if not anchor:          # nothing to look for: keep what is there, never borrow the other OS's page
                    pages[lang] = target.get('manual_page_' + lang)
                    if pages[lang] is None:
                        unresolved.append((e['id'], osk, lang, '(no anchor text)', []))
                    continue
                want = cc.norm(anchor, lang)
                t = text[osk][lang]
                start = chapters[osk][lang][ch]
                nxt = min([p for p in chapters[osk][lang].values() if p > start] + [counts[osk][lang] + 1])
                hits = [p for p in range(start, nxt) if want in cc.norm(t.get(p, ''), lang)]
                if not hits:
                    hits = [p for p in sorted(t) if want in cc.norm(t[p], lang)]
                if len(hits) != 1:
                    unresolved.append((e['id'], osk, lang, anchor, hits))
                    pages[lang] = target.get('manual_page_' + lang)
                    continue
                if target.get('manual_page_' + lang) != hits[0]:
                    moved += 1
                target['manual_page_' + lang] = hits[0]
                pages[lang] = hits[0]
            if all(isinstance(pages[l], int) for l in cc.LANGS):
                target['source'] = rewrite_source(target['source'], pages['ja'], pages['en'])
        if e.get('page_mapping'):
            e['page_mapping']['verified_against'] = 'v1.5.1 Mac + Windows PDFs, anchor-text match per page (%s)' % today
    with open(faq_path, 'w', encoding='utf-8') as f:
        json.dump(faq, f, ensure_ascii=False, indent=2); f.write('\n')
    print('faq: %d page references moved, %d unresolved' % (moved, len(unresolved)))
    for u in unresolved:
        print('   ? %s %s %s %r -> pages %s' % u)

    # 4. prove it
    rc = subprocess.run([sys.executable, os.path.join(HERE, 'check_consistency.py')]).returncode
    sys.exit(rc)


if __name__ == '__main__':
    main()
