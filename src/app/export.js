// Export: building the SVG and writing PNG / SVG files.
// (Part of the editor; plain <script> files share globals and load in the order listed in index.html.)
// ---------- export ----------
function download(blob, name) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000); }
function buildSVG(items, box, o) {
  const pad = o.pad ?? 0; const b = { x: box.x - pad, y: box.y - pad, w: box.w + pad * 2, h: box.h + pad * 2 };
  const body = items.map((it, i) => itemSVG(it, o.style, 'x' + i + '_')).join('');
  const bg = o.bg ? `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" fill="${app.P.settings.paper}"/>` : '';
  return { svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.round(b.w * o.scale)}" height="${Math.round(b.h * o.scale)}" viewBox="${b.x} ${b.y} ${b.w} ${b.h}"><defs>${RENDER.defs()}</defs>${bg}${body}</svg>`, w: Math.round(b.w * o.scale), h: Math.round(b.h * o.scale) };
}
async function svgToPng({ svg, w, h }) {
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' })); const img = new Image();
  await new Promise((res, rej) => { img.onload = res; img.onerror = () => rej(new Error('Could not rasterise SVG')); img.src = url; });
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h; cv.getContext('2d').drawImage(img, 0, 0, w, h); URL.revokeObjectURL(url);
  return new Promise((r) => cv.toBlob(r, 'image/png'));
}
const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
async function doExport() {
  const f = new FormData($('#export-form')); const what = f.get('what'), style = f.get('look') === 'clean' ? null : f.get('look'), bg = f.get('bg') === 'paper', scale = +f.get('scale'), fmt = f.get('fmt');
  const vis = pg().items.filter((it) => !it.hidden && !(ownerOf(it) || {}).hidden);
  const pfx = `p${String(app.page + 1).padStart(2, '0')}-${slug(pg().name)}`; const tag = `${style || 'clean'}${bg ? '-white' : ''}`;
  const jobs = [];
  if (what === 'page') jobs.push({ items: vis, box: { x: 0, y: 0, w: app.P.settings.pageW, h: app.P.settings.pageH }, name: `${pfx}-${tag}` });
  else if (what === 'selection') {
    const ids = new Set(app.sel); for (const id of app.sel) { const it = itemById(id); const l = it && it.type === 'figure' && limbsOf(it); if (l) ids.add(l.id); }
    const items = vis.filter((it) => ids.has(it.id)); if (!items.length) return toast('Select something first');
    jobs.push({ items, box: pageBBox(items), pad: 14, name: `${pfx}-selection-${tag}` });
  } else vis.forEach((it, i) => jobs.push({ items: [it], box: pageBBox([it]), pad: 14, name: `${pfx}-${String(i + 1).padStart(2, '0')}-${slug(itemName(it))}-${tag}` }));
  const ask = STORAGE.current.supported && f.get('ask') === 'on';
  try {
    // ask for the destination first (the dialog must open straight from the click)
    let fileH = null, dirH = null;
    if (ask && jobs.length === 1) { fileH = await STORAGE.current.pickExportFile(`${jobs[0].name}.${fmt}`, fmt); if (!fileH) return; }
    if (ask && jobs.length > 1) { dirH = await STORAGE.current.pickExportDir(); if (!dirH) return; }
    $('#export-status').textContent = 'Exporting…';
    for (const j of jobs) {
      const out = buildSVG(j.items, j.box, { style, bg, scale, pad: j.pad });
      const blob = fmt === 'svg' ? new Blob([out.svg], { type: 'image/svg+xml' }) : await svgToPng(out);
      const name = `${j.name}.${fmt}`;
      if (fileH) await STORAGE.current.writeBlob(fileH, blob);
      else if (dirH) await STORAGE.current.writeInDir(dirH, name, blob);
      else { download(blob, name); await new Promise((r) => setTimeout(r, 150)); }
    }
    const where = fileH ? ` → ${fileH.name}` : dirH ? ` → folder "${dirH.name}"` : ' (Downloads)';
    $('#export-status').textContent = `Done — ${jobs.length} file${jobs.length > 1 ? 's' : ''}${where}.`;
  } catch (err) { $('#export-status').textContent = 'Export failed: ' + err.message; }
}
