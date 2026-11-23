// Props: Park - playground (slide, swings, seesaw, roundabout, climbing frame, sandpit). Storybook scale: platform about 220 high. Floor props: origin = bottom centre.
(() => {
  const PACK = 'Park props', CAT = 'Playground';
  const o = { stroke: 'line', w: 4.5 }, d = { stroke: 'line', w: 3 }, f = { stroke: 'line', w: 2.2 };
  const rot = (a) => { const c = Math.cos(U.rad(a)), s = Math.sin(U.rad(a)); return (x, y) => [x * c - y * s, x * s + y * c]; };
  CP.register({ api: 1, version: '1.0.0', pack: PACK, items: [
    // ---------- slide ----------
    { type: 'prop', id: 'park-slide', name: 'Slide', cat: CAT, tags: ['playground', 'chute', 'ladder', 'climb', 'slide down'],
      colors: { line: '#6f6f6f', chute: '#1e88e5', deck: '#fbc02d', roof: '#e53935' },
      params: [{ key: 'roof', label: 'Roof', type: 'toggle', def: false }],
      draw(p, P) {
        p.line([[-150, 0], [-112, -204]], o); p.line([[-114, 0], [-74, -204]], o);
        for (let i = 1; i <= 5; i++) { const t = i / 6; p.line([[-150 + 36 * t, -204 * t], [-114 + 40 * t, -204 * t]], d); }
        p.line([[-50, 0], [-50, -210]], o);
        const top = [], bot = []; for (let i = 0; i <= 8; i++) { const t = i / 8; const x = -40 + 190 * t, y = -216 + 202 * (1 - (1 - t) * (1 - t)); top.push([x, y]); bot.push([x, y + 16]); }
        p.poly([...top, ...bot.reverse()], { ...o, stroke: 'line', fill: 'paper', hatch: 'chute', hg: 5, halpha: 0.5, ha: 70 });
        p.line([[-14, -150], [50, 0]], d);
        p.rect(-122, -226, 82, 14, { ...o, fill: 'paper', hatch: 'deck', hg: 5, halpha: 0.5 });
        for (const x of [-116, -46]) p.line([[x, -226], [x, -292]], d); p.line([[-116, -292], [-46, -292]], d);
        if (P.roof) p.poly([[-134, -292], [-28, -292], [-81, -336]], { ...d, stroke: 'roof', fill: 'paper', hatch: 'roof', hg: 5, halpha: 0.55 });
      } },
    // ---------- swings ----------
    { type: 'prop', id: 'park-swing', name: 'Swings', cat: CAT, tags: ['swing set', 'seat', 'chains', 'playground', 'swinging'],
      colors: { line: '#6f6f6f', seat: '#e53935', chain: '#9e9e9e' },
      params: [{ key: 'count', label: 'Swings', type: 'range', min: 1, max: 3, step: 1, def: 2 }, { key: 'sway', label: 'Swinging', type: 'range', min: -30, max: 30, step: 5, def: 0 }],
      draw(p, P) {
        const n = Math.round(P.count), W = 70 + 66 * n;
        for (const s of [-1, 1]) p.line([[s * (W + 40), 0], [s * W, -330], [s * (W - 40), 0]], o);
        p.line([[-W, -330], [W, -330]], { ...o, w: 6 });
        for (let i = 0; i < n; i++) {
          const cx = (i - (n - 1) / 2) * 130, dx = P.sway * 2.2, dy = Math.abs(P.sway) * 0.7;
          for (const s of [-1, 1]) p.line([[cx + s * 28, -330], [cx + s * 28 + dx, -86 - dy]], { stroke: 'chain', w: 2.5 });
          p.rect(cx - 36 + dx, -90 - dy, 72, 12, { ...d, stroke: 'seat', fill: 'paper', hatch: 'seat', hg: 5, halpha: 0.55 });
        }
      } },
    // ---------- seesaw ----------
    { type: 'prop', id: 'park-seesaw', name: 'Seesaw', cat: CAT, tags: ['see-saw', 'teeter totter', 'playground', 'balance', 'plank'],
      colors: { line: '#6f6f6f', plank: '#fbc02d', handle: '#e53935' },
      params: [{ key: 'tilt', label: 'Tilt', type: 'select', options: { level: 'Level', left: 'Left side up', right: 'Right side up' }, def: 'level' }],
      draw(p, P) {
        const a = P.tilt === 'left' ? -13 : P.tilt === 'right' ? 13 : 0, R = rot(a), cy = -78;
        p.poly([[-30, 0], [0, cy], [30, 0]], { ...o, fill: 'paper', hatch: 'line', hg: 7, halpha: 0.3 });
        const pl = [[-190, -7], [190, -7], [190, 7], [-190, 7]].map(([x, y]) => { const q = R(x, y); return [q[0], q[1] + cy]; });
        p.poly(pl, { ...o, fill: 'paper', hatch: 'plank', hg: 5, halpha: 0.5 });
        for (const s of [-1, 1]) { const b = R(s * 150, -7), t = R(s * 150, -50), hx = R(s * 120, -7), ht = R(s * 120, -40); p.line([[b[0], b[1] + cy], [t[0], t[1] + cy]], { stroke: 'handle', w: 4 }); p.line([[hx[0], hx[1] + cy], [ht[0], ht[1] + cy]], { stroke: 'handle', w: 3 }); p.line([[ht[0], ht[1] + cy], [t[0], t[1] + cy]], { stroke: 'handle', w: 3 }); }
        for (const s of [-1, 1]) { const e = R(s * 190, 7); p.circ(e[0], e[1] + cy + 14, 11, { ...f, fill: 'paper' }); }
        p.circ(0, cy, 6, { ...d, fill: 'paper' });
      } },
    // ---------- roundabout ----------
    { type: 'prop', id: 'park-roundabout', name: 'Roundabout', cat: CAT, tags: ['merry-go-round', 'spinner', 'playground', 'spin', 'carousel'],
      colors: { line: '#6f6f6f', deck: '#43a047', rail: '#e53935' },
      params: [{ key: 'colours', label: 'Stripes', type: 'toggle', def: true }],
      draw(p, P) {
        p.rect(-14, -56, 28, 56, { ...d, fill: 'paper' });
        p.ell(0, -64, 150, 34, { ...o, fill: 'paper', hatch: 'deck', hg: 6, halpha: 0.35 });
        if (P.colours) for (const a of [0, 90, 180, 270]) { const r = U.rad(a + 45); p.line([[0, -64], [Math.cos(r) * 150, -64 + Math.sin(r) * 34]], { stroke: 'rail', w: 3 }); }
        p.line([[0, -64], [0, -196]], { ...o, w: 5 });
        p.circ(0, -200, 10, { ...d, fill: 'paper' });
        for (const s of [-1, 1]) { p.line([[0, -190], [s * 124, -82]], { stroke: 'rail', w: 4 }); p.line([[s * 62, -136], [s * 62, -66]], { stroke: 'rail', w: 3 }); }
        p.curve([[-60, -112], [0, -128], [60, -112]], { stroke: 'rail', w: 3 });
      } },
    // ---------- climbing frame ----------
    { type: 'prop', id: 'park-climbingframe', name: 'Climbing frame', cat: CAT, tags: ['monkey bars', 'climb', 'jungle gym', 'playground', 'frame'],
      colors: { line: '#6f6f6f', bar: '#1e88e5', roof: '#e53935', rope: '#8a5a33' },
      params: [{ key: 'rope', label: 'Rope net', type: 'toggle', def: true }],
      draw(p, P) {
        p.rect(-130, -240, 260, 240, { ...o, fill: 'paper' });
        for (const y of [-60, -120, -180]) p.line([[-130, y], [130, y]], { stroke: 'bar', w: 4 });
        for (const x of [-65, 0, 65]) p.line([[x, -240], [x, 0]], { stroke: 'bar', w: 3 });
        if (P.rope) { p.line([[-130, 0], [-65, -120], [0, 0], [65, -120], [130, 0]], { stroke: 'rope', w: 3 }); p.line([[-130, -120], [-65, 0], [0, -120], [65, 0], [130, -120]], { stroke: 'rope', w: 3 }); }
        p.poly([[-146, -240], [146, -240], [0, -318]], { ...o, stroke: 'roof', fill: 'paper', hatch: 'roof', hg: 6, halpha: 0.5 });
        p.line([[0, -318], [0, -340]], d); p.poly([[0, -340], [26, -332], [0, -324]], { stroke: 'roof', w: 3, fill: 'roof' });
      } },
    // ---------- sandpit ----------
    { type: 'prop', id: 'park-sandpit', name: 'Sandpit', cat: CAT, tags: ['sandbox', 'sand', 'bucket', 'spade', 'castle', 'play'],
      colors: { line: '#8a5a33', sand: '#e0b060', bucket: '#e53935', spade: '#1e88e5' },
      params: [{ key: 'toys', label: 'Bucket and spade', type: 'toggle', def: true }, { key: 'castle', label: 'Sandcastle', type: 'toggle', def: false }],
      draw(p, P) {
        p.poly([[-170, -44], [170, -44], [146, -78], [-146, -78]], { ...o, fill: 'paper', hatch: 'sand', hg: 5, halpha: 0.6, ha: 0 });
        p.rect(-170, -44, 340, 44, { ...o, fill: 'paper', hatch: 'line', hg: 7, halpha: 0.3, ha: 90 });
        p.curve([[-90, -64], [-30, -86], [30, -70], [80, -76]], { stroke: 'sand', w: 3 });
        if (P.toys) { p.poly([[78, -60], [74, -96], [112, -96], [108, -60]], { stroke: 'bucket', w: 3.5, fill: 'paper', hatch: 'bucket', hg: 4, halpha: 0.6 }); p.curve([[76, -94], [92, -118], [110, -94]], { stroke: 'line', w: 2.5 }); p.line([[-70, -60], [-40, -102]], { stroke: 'spade', w: 4 }); p.poly([[-44, -98], [-30, -106], [-26, -94], [-40, -88]], { stroke: 'spade', w: 3, fill: 'spade' }); }
        if (P.castle) { p.poly([[-24, -66], [-26, -96], [26, -96], [24, -66]], { ...d, stroke: 'sand', fill: 'paper', hatch: 'sand', hg: 4, halpha: 0.6 }); p.poly([[-14, -96], [-14, -116], [14, -116], [14, -96]], { ...d, stroke: 'sand', fill: 'paper' }); for (const x of [-14, 0, 14]) p.line([[x, -116], [x, -124]], { stroke: 'sand', w: 3 }); }
      } },
  ] });
})();
