// Arranging maths: align, distribute and snapping. Pure functions on boxes { x, y, w, h } (page units) — no DOM, no state —
// so they can be tested on their own. The editor (src/app/arrange.js) turns the answers into item moves.
const ARR = (() => {
  const union = (boxes) => {
    const x0 = Math.min(...boxes.map((b) => b.x)), y0 = Math.min(...boxes.map((b) => b.y));
    const x1 = Math.max(...boxes.map((b) => b.x + b.w)), y1 = Math.max(...boxes.map((b) => b.y + b.h));
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  };
  const MODES = ['left', 'hcenter', 'right', 'top', 'vmiddle', 'bottom'];

  /** How far each box must move to line up with `ref` (default: the box around all of them). Returns [{dx, dy}]. */
  function align(boxes, mode, ref) {
    if (!MODES.includes(mode)) throw new Error('unknown align mode ' + mode);
    if (!boxes.length) return [];
    const r = ref || union(boxes);
    return boxes.map((b) => {
      let dx = 0, dy = 0;
      if (mode === 'left') dx = r.x - b.x;
      else if (mode === 'hcenter') dx = r.x + r.w / 2 - (b.x + b.w / 2);
      else if (mode === 'right') dx = r.x + r.w - (b.x + b.w);
      else if (mode === 'top') dy = r.y - b.y;
      else if (mode === 'vmiddle') dy = r.y + r.h / 2 - (b.y + b.h / 2);
      else dy = r.y + r.h - (b.y + b.h);
      return { dx, dy };
    });
  }

  /** Equal gaps between boxes along an axis ('h' = left to right, 'v' = top to bottom); the outer two stay put. Needs 3 or more. */
  function distribute(boxes, axis) {
    const out = boxes.map(() => ({ dx: 0, dy: 0 }));
    if (boxes.length < 3) return out;
    const p = axis === 'h' ? 'x' : 'y', s = axis === 'h' ? 'w' : 'h';
    const order = boxes.map((b, i) => i).sort((a, b) => boxes[a][p] - boxes[b][p] || a - b);
    const start = boxes[order[0]][p]; const end = Math.max(...boxes.map((b) => b[p] + b[s]));
    const gap = (end - start - boxes.reduce((n, b) => n + b[s], 0)) / (boxes.length - 1);
    let at = start;
    for (const i of order) { out[i][axis === 'h' ? 'dx' : 'dy'] = at - boxes[i][p]; at += boxes[i][s] + gap; }
    return out;
  }

  /**
   * Snapping while moving `box`: its edges and centre are pulled onto the edges and centres of `targets` when within `thr`.
   * Returns { dx, dy, guides } where guides are the lines to draw: { axis: 'x' | 'y', pos, from, to } (a vertical line is axis 'x').
   */
  function snap(box, targets, thr) {
    const lines = (b, a) => (a === 'x' ? [b.x, b.x + b.w / 2, b.x + b.w] : [b.y, b.y + b.h / 2, b.y + b.h]);
    const best = { x: null, y: null };
    for (const a of ['x', 'y']) {
      let bestD = null;
      for (const t of targets) for (const tl of lines(t, a)) for (const ml of lines(box, a)) { const d = tl - ml; if (Math.abs(d) <= thr && (bestD === null || Math.abs(d) < Math.abs(bestD))) bestD = d; }
      best[a] = bestD;
    }
    const dx = best.x ?? 0, dy = best.y ?? 0;
    const moved = { x: box.x + dx, y: box.y + dy, w: box.w, h: box.h };
    const guides = [];
    for (const a of ['x', 'y']) {
      if (best[a] === null) continue;
      const o = a === 'x' ? 'y' : 'x', os = a === 'x' ? 'h' : 'w'; const seen = new Map();
      for (const t of targets) for (const tl of lines(t, a)) for (const ml of lines(moved, a)) {
        if (Math.abs(tl - ml) > 0.5) continue;
        const k = Math.round(tl * 2); const g = seen.get(k) || { axis: a, pos: tl, from: moved[o], to: moved[o] + moved[os] };
        g.from = Math.min(g.from, t[o]); g.to = Math.max(g.to, t[o] + t[os]); seen.set(k, g);
      }
      guides.push(...seen.values());
    }
    return { dx, dy, guides };
  }

  return { union, align, distribute, snap, MODES };
})();
