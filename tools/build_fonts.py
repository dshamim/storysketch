#!/usr/bin/env python3
"""Turn the bundled OFL fonts into StorySketch font plugins (plugins/fonts/<id>.js) — letter outlines as plain data.

    uv run --with fonttools --with skia-pathops --with uharfbuzz python -I tools/build_fonts.py            # rebuild
    uv run --with fonttools --with skia-pathops --with uharfbuzz python -I tools/build_fonts.py --check    # exit 1 if out of date

Why data, not font files: the page never asks the computer to draw text in a font. It reads these outlines and draws them as
ordinary shapes, so a page looks the same on every machine and in every export, with nothing to install, and a font plugin
is declarative (outlines, spacing, licence; no drawing code), so a shared gallery could later accept one as plain data.

What it does for every font in tools/fonts/sources.json:
  1. downloads the exact files (pinned commit), checks the sha256 and the licence, keeps the full OFL text next to the plugin;
  2. picks the weights (a variable font is cut at the wanted weight with fontTools.varLib.instancer);
  3. removes overlapping contours (so every style can fill with the even-odd rule and handwriting fonts do not show gaps);
  4. keeps Basic Latin plus curly quotes, dashes, ellipsis and bullet (this tool is English only);
  5. kerning: shapes every pair of kept letters with HarfBuzz and keeps the pairs that move (ligatures and alternates off);
  6. writes one .js plugin: outlines y-down on a 1000-unit em, integers only, plus metrics, kerning and the licence record.
The output is deterministic: same inputs, same bytes.
"""
import hashlib, io, json, os, sys, tempfile, urllib.parse, urllib.request

from fontTools.ttLib import TTFont
from fontTools.ttLib.removeOverlaps import removeOverlaps
from fontTools.varLib import instancer
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
import uharfbuzz as hb
import pathops

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, '..'))
OUT = os.path.join(ROOT, 'plugins', 'fonts')
CHARS = [chr(c) for c in range(0x20, 0x7F)] + list('‘’“”–—…•')
MIN_KERN = 8  # of 1000 em: smaller adjustments are not worth the bytes
EMBOLDEN = 34  # of 1000 em: total extra stroke width for fonts that have no real Bold (each side grows by half)
check = '--check' in sys.argv

def fetch(url, want):
    data = urllib.request.urlopen(url, timeout=60).read()
    got = hashlib.sha256(data).hexdigest()
    if want and got != want:
        sys.exit(f'sha256 mismatch for {url}\n  wanted {want}\n  got    {got}')
    return data

def load(src, spec, base):
    data = fetch(f"{base}/{src['dir']}/{urllib.parse.quote(spec['file'])}", spec['sha256'])
    font = TTFont(io.BytesIO(data))
    if 'fvar' in font:
        font = instancer.instantiateVariableFont(font, {'wght': spec.get('wght', 400)})
    removeOverlaps(font)
    buf = io.BytesIO(); font.save(buf)
    return TTFont(io.BytesIO(buf.getvalue())), buf.getvalue()

def build_weight(font, raw, embolden=0):
    upm = font['head'].unitsPerEm; k = 1000 / upm
    cmap = font.getBestCmap(); gs = font.getGlyphSet(); hmtx = font['hmtx']
    glyphs = {}
    for ch in CHARS:
        name = cmap.get(ord(ch))
        if name is None: continue
        adv = round(hmtx[name][0] * k)
        d = ''
        if ch != ' ':
            pen = SVGPathPen(gs, ntos=lambda v: str(int(round(v))))
            if embolden:  # a real Bold is better; without one, grow the outline (stroke + union) so bold text is a true outline too
                path = pathops.Path(); gs[name].draw(TransformPen(path.getPen(glyphSet=gs), (k, 0, 0, -k, 0, 0)))
                grown = pathops.Path(path); grown.stroke(embolden, pathops.LineCap.ROUND_CAP, pathops.LineJoin.ROUND_JOIN, 4); grown.convertConicsToQuads()
                merged = pathops.op(path, grown, pathops.PathOp.UNION); merged.draw(pen); adv += embolden // 2
            else:
                gs[name].draw(TransformPen(pen, (k, 0, 0, -k, 0, 0)))  # 1000-unit em, y down, baseline at 0
            d = pen.getCommands()
        glyphs[ch] = {'a': adv, 'd': d}
    # kerning: shape pairs with HarfBuzz (features that would swap letters are off, the model is one letter at a time)
    hbfont = hb.Font(hb.Face(raw)); feats = {'kern': True, 'liga': False, 'clig': False, 'calt': False, 'dlig': False, 'rlig': False, 'ccmp': False, 'locl': False, 'mark': False, 'mkmk': False}
    def first_adv(text):
        buf = hb.Buffer(); buf.add_str(text); buf.guess_segment_properties(); hb.shape(hbfont, buf, feats)
        return buf.glyph_positions[0].x_advance * k
    letters = [c for c in glyphs if c != ' ']
    single = {c: first_adv(c) for c in letters}
    kern = {}
    for a in letters:
        for b in letters:
            delta = round(first_adv(a + b) - single[a])
            if abs(delta) >= MIN_KERN: kern[a + b] = delta
    os2 = font['OS/2']
    cap = getattr(os2, 'sCapHeight', 0) or 0; xh = getattr(os2, 'sxHeight', 0) or 0
    if not cap: cap = max(-int(c) for c in [0]) if False else round(700 * upm / 1000)
    if not xh: xh = round(500 * upm / 1000)
    hh = font['hhea']
    return {'glyphs': glyphs, 'kern': dict(sorted(kern.items())),
            'metrics': {'cap': round(cap * k), 'x': round(xh * k), 'asc': round(hh.ascent * k), 'desc': round(-hh.descent * k)}}

def js_str(s): return json.dumps(s, ensure_ascii=True)

def plugin_text(src, weights, licence_file, base, commit):
    lines = ["// Generated by tools/build_fonts.py from the files listed in tools/fonts/sources.json — do not edit by hand.",
             f"// {src['name']}: {src['copyright']}",
             "// Licensed under the SIL Open Font License 1.1 (full text: " + licence_file + "). Letter outlines converted to data; no font program is included.",
             "CP.register({", "  api: 1, version: '1.0.0', type: 'font',",
             f"  id: {js_str(src['id'])}, name: {js_str(src['name'])}, kind: {js_str(src['kind'])}, upm: 1000,",
             "  licence: " + json.dumps({'name': 'SIL Open Font License 1.1', 'copyright': src['copyright'], 'file': 'plugins/fonts/' + licence_file,
                                        'source': f"{base}/{src['dir']}", 'commit': commit, 'files': [w['file'] + ' ' + w['sha256'] for w in {id(x): x for x in [src['regular'], src['bold']] if x}.values()]}, ensure_ascii=True) + ",",
             "  weights: {"]
    parts = []
    for wname, w in weights.items():
        g = ',\n'.join(f"      {js_str(ch)}: [{v['a']}, {js_str(v['d'])}]" for ch, v in w['glyphs'].items())
        kern = ', '.join(f"{js_str(p)}: {v}" for p, v in w['kern'].items())
        parts.append(f"    {wname}: {{ metrics: {json.dumps(w['metrics'])},\n      kern: {{ {kern} }},\n      glyphs: {{\n{g}\n      }} }}")
    lines.append(',\n'.join(parts)); lines.append("  }"); lines.append("});")
    return '\n'.join(lines) + '\n'

def main():
    cfg = json.load(open(os.path.join(HERE, 'fonts', 'sources.json'), encoding='utf-8'))
    base = f"{cfg['repo']}/{cfg['commit']}"; stale = []
    os.makedirs(OUT, exist_ok=True)
    for src in cfg['fonts']:
        weights = {}
        font, raw = load(src, src['regular'], base); weights['regular'] = build_weight(font, raw)
        if src.get('bold'):
            font, raw = load(src, src['bold'], base); weights['bold'] = build_weight(font, raw)
        else:
            weights['bold'] = build_weight(*load(src, src['regular'], base), embolden=EMBOLDEN)
        lic = fetch(f"{base}/{src['dir']}/OFL.txt", None)
        text = lic.decode('utf-8-sig')
        if src['copyright'].split(' (')[0] not in text.replace('\r', '') and src['copyright'][:30] not in text:
            sys.exit(f"{src['id']}: the copyright line in sources.json is not in the downloaded OFL.txt")
        if 'with Reserved Font Name' in text or 'with Reserved Font Names' in text:
            sys.exit(f"{src['id']}: declares a Reserved Font Name; it cannot be bundled under another form without renaming")
        lic_name = f"{src['id']}-OFL.txt"
        for name, content in ((lic_name, text.replace('\r\n', '\n')), (src['id'] + '.js', plugin_text(src, weights, lic_name, cfg['repo'], cfg['commit']))):
            path = os.path.join(OUT, name); cur = open(path, encoding='utf-8').read() if os.path.exists(path) else None
            if cur != content:
                stale.append(name)
                if not check: open(path, 'w', encoding='utf-8', newline='\n').write(content)
        print(f"{src['id']}: {len(weights)} weight(s), {len(weights['regular']['glyphs'])} letters, {len(weights['regular']['kern'])} kerning pairs")
    if check and stale:
        print('font plugins are out of date: ' + ', '.join(stale) + ' — run tools/build_fonts.py', file=sys.stderr); sys.exit(1)
    print('fonts up to date' if check else 'fonts written to plugins/fonts')

main()
