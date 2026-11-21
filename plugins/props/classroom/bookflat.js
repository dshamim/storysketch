// Prop: an open book lying flat on the floor or a table, seen in perspective (like the drawing sheet on the floor).
// Origin = the middle of the book's near edge (put it on the floor line or the table top).
// The pages curve up towards the spine; each page can show words, a picture (any picture add-on), both, or nothing.
(() => {
  const PAGE = { words: 'Words', picture: 'A picture', both: 'Picture + words', blank: 'Blank' };
  CP.register({ api: 1, version: '1.0.0', pack: 'Classroom props', items: [
    { type: 'prop', id: 'bookflat', name: 'Open book (lying flat)', cat: 'Learning',
      colors: { cover: '#2f6fd6', pages: '#9e9e9e', text: '#9a9a9a', ribbon: '#e53935' },
      params: [
        { key: 'width', label: 'Size', type: 'range', min: 100, max: 640, step: 10, def: 240 },
        { key: 'view', label: 'Seen from (low ↔ high)', type: 'range', min: 0.2, max: 0.9, step: 0.05, def: 0.5 },
        { key: 'leftPage', label: 'Left page', type: 'select', def: 'picture', options: PAGE },
        { key: 'rightPage', label: 'Right page', type: 'select', def: 'words', options: PAGE },
        { key: 'thick', label: 'Thickness', type: 'range', min: 2, max: 20, step: 1, def: 6 },
        { key: 'turning', label: 'A page turning over', type: 'toggle', def: false },
        { key: 'ribbon', label: 'Ribbon bookmark', type: 'toggle', def: false },
      ],
      slots: [
        { key: 'left', label: 'Left page picture', kind: 'picture', def: 'tree', box: [-100, -140, 90, 120] },
        { key: 'right', label: 'Right page picture', kind: 'picture', def: 'sun', box: [10, -140, 90, 120] },
      ],
      draw(p, P, it, x) {
        const W = +P.width || 240, view = +P.view || 0.5, Hf = W * 0.64, D = Hf * view, half = W / 2;
        const far = 0.86 + 0.08 * view, Hc = W * 0.07 * (1.1 - view * 0.5), thick = (+P.thick || 6) * W / 240;
        // flat book coordinates (x across, y from -Hf far edge to 0 near edge) → lying on the floor
        const F = (fx, fy, lift = 0) => { const v = (fy + Hf) / Hf; return [fx * U.lerp(far, 1, v), -D * (1 - v) - lift]; };
        const liftAt = (fx) => { const u = Math.min(1, Math.abs(fx) / half); return Hc * Math.sin(Math.PI / 2 * Math.min(1, (1 - u) / 0.8)) * (1 - 0.5 * Math.exp(-((u / 0.05) ** 2))); };
        const G = ([fx, fy]) => F(fx, fy, liftAt(fx));
        const m = W * 0.025;
        // cover (a little bigger than the pages) with its thickness showing along the near edge
        const cov = [F(-half - m, m), F(half + m, m), F(half + m, -Hf - m), F(-half - m, -Hf - m)];
        p.poly([cov[0], cov[1], [cov[1][0], cov[1][1] + thick * 0.6], [cov[0][0], cov[0][1] + thick * 0.6]], { stroke: 'cover', w: 3, fill: 'cover' });
        p.poly(cov, { stroke: 'cover', w: 3.5, fill: 'paper', hatch: 'cover', hg: 4, halpha: 0.7, smooth: false });
        // one page surface: outline along its edges, raised towards the spine
        const pageOutline = (s, dy = 0) => {
          const pts = [], N = 14;
          for (let i = 0; i <= N; i++) pts.push(G([s * half * (i / N), 0]));
          for (let i = N; i >= 0; i--) pts.push(G([s * half * (i / N), -Hf]));
          return pts.map(([a, b]) => [a, b + dy]);
        };
        for (const s of [-1, 1]) { // the stack of pages under the top one, then the top page
          for (let k = 3; k >= 1; k--) p.poly(pageOutline(s, thick * k / 3), { stroke: 'pages', w: 1.8, fill: 'paper', smooth: false });
          p.poly(pageOutline(s), { stroke: 'pages', w: 2.5, fill: 'paper', smooth: false });
        }
        // what's on each page: drawn flat, then laid onto the curved page
        const content = (s, kind, slotKey) => {
          if (kind === 'blank') return;
          const n0 = p.o.length, pm = W * 0.045, x0 = s < 0 ? -half + pm : pm * 1.3, x1 = s < 0 ? -pm * 1.3 : half - pm;
          let yText = -Hf + pm;
          if (kind === 'picture' || kind === 'both') {
            const hh = kind === 'both' ? (Hf - 2 * pm) * 0.55 : Hf - 2 * pm;
            x.slot(slotKey, [x0, -Hf + pm, x1 - x0, hh]);
            yText += hh + pm * 0.6;
          }
          if (kind === 'words' || kind === 'both') {
            const gap = Math.max(7, Hf * 0.085), r = U.rng(U.hash(it.id + slotKey));
            for (let y = yText + gap * 0.4, i = 0; y < -pm; y += gap, i++) {
              const end = (i % 5 === 4 || y + gap >= -pm) ? U.lerp(x0, x1, 0.35 + r() * 0.3) : x1 - r() * W * 0.02;
              p.line([[x0, y], [end, y]], { stroke: 'text', w: 2 });
            }
          }
          const thin = 0.5 + view * 0.5;
          for (const pr of p.o.slice(n0)) {
            pr.pts = pr.pts.flatMap((pt, i, a) => { // add points along long straight bits, so they bend with the page
              if (i === 0 || pr.smooth) return [pt];
              const q = a[i - 1], n = Math.max(1, Math.min(10, Math.ceil(Math.abs(pt[0] - q[0]) / (W * 0.05))));
              const out = []; for (let k = 1; k <= n; k++) out.push([U.lerp(q[0], pt[0], k / n), U.lerp(q[1], pt[1], k / n)]); return out;
            }).map(G);
            pr.w *= thin; if (pr.hatch) pr.hatch.gap *= 0.9;
          }
        };
        content(-1, P.leftPage || 'picture', 'left');
        content(1, P.rightPage || 'words', 'right');
        // the fold in the middle
        p.line([G([0, 0]), G([0, -Hf])], { stroke: 'pages', w: 2.5 });
        for (const s of [-1, 1]) p.line([G([s * W * 0.02, -2]), G([s * W * 0.02, -Hf + 2])], { stroke: 'pages', w: 1.2 });
        if (P.turning) { // the next page, half turned and standing up from the spine
          const pts = [], N = 12, up = W * 0.32 * (1.1 - view * 0.4);
          const T = (t, fy) => { const [bx, by] = G([0, fy]); const ang = U.rad(70 - t * 55); return [bx + Math.cos(ang) * W * 0.36 * t * U.lerp(far, 1, (fy + Hf) / Hf), by - Math.sin(ang) * up * t]; };
          for (let i = 0; i <= N; i++) pts.push(T(i / N, 0));
          for (let i = N; i >= 0; i--) pts.push(T(i / N, -Hf));
          p.poly(pts, { stroke: 'pages', w: 2.5, fill: 'paper', hatch: 'pages', hg: 5, halpha: 0.25, smooth: false });
        }
        if (P.ribbon) { const a = G([W * 0.01, -Hf]), b = G([W * 0.03, -Hf * 0.4]); p.curve([a, [b[0] + W * 0.02, b[1]], G([W * 0.015, 0]), [G([W * 0.02, 0])[0] + 2, m + thick + W * 0.05]], { stroke: 'ribbon', w: Math.max(3, W * 0.015) }); }
      } },
  ] });
})();
