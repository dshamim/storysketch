// Prop: shelves & cupboards. Origin = floor, centre (the wall shelf hangs with its lowest plank at y = 0).
// Styles: bookcase, tall bookcase, low shelf, cupboard (shelves over doors), cube storage, wall shelves.
// "What's on the shelves" fills every shelf: full of books, a few books (emptier), books and boxes,
// boxes of books, or empty. "Arrangement" shuffles the books and boxes into a different layout.
(() => {
  const BOOKS = ['#e53935', '#1e88e5', '#43a047', '#fb8c00', '#8e24aa', '#00897b', '#f4c20d', '#6d4c41', '#d81b60', '#3949ab'];
  const pick = (r, a) => a[Math.floor(r() * a.length)];

  // ---- small drawing helpers (y grows downwards; `base` = the shelf the thing stands on) ----
  // an upright book; lean > 0 tips it to the right, resting on its bottom-left corner
  function book(p, x, base, w, h, c, lean = 0) {
    const a = U.rad(lean), ca = Math.cos(a), sa = Math.sin(a);
    const R = (u, v) => [x + u * ca - v * sa, base + u * sa + v * ca]; // u along the bottom, v upwards (negative)
    const pts = [R(0, 0), R(w, 0), R(w, -h), R(0, -h)];
    p.poly(pts, { stroke: c, w: 3, fill: 'paper', hatch: c, hg: 4, halpha: 0.55, ha: 80 + lean, smooth: false });
    p.line([R(2, -h * 0.8), R(w - 2, -h * 0.8)], { stroke: c, w: 2 }); // spine band
  }
  // books lying flat in a little pile
  function pile(p, r, cx, base, n, maxW) {
    let y = base;
    for (let i = 0; i < n; i++) { const w = Math.min(maxW, 44 + r() * 22), h = 9 + r() * 4, c = pick(r, BOOKS), dx = (r() - 0.5) * 10; p.rect(cx - w / 2 + dx, y - h, w, h, { stroke: c, w: 3, fill: 'paper', hatch: c, hg: 4, halpha: 0.5, ha: 5 }); y -= h; }
    return base - y;
  }
  // a row of upright books from x0 to at most x1; returns where the row ended
  function row(p, r, x0, x1, base, room, { lean = true } = {}) {
    let x = x0;
    while (x < x1 - 12) {
      const w = 11 + r() * 9, h = Math.min(room - 4, room * (0.62 + r() * 0.32));
      if (x + w > x1) break; book(p, x, base, w, h, pick(r, BOOKS)); x += w + 1.5 + r() * 2.5;
    }
    // sometimes the last one leans on its neighbour
    if (lean && r() < 0.6) { const h = room * 0.72; const ang = 14 + r() * 10; const reach = 13 * Math.cos(U.rad(ang)) + h * Math.sin(U.rad(ang)); if (x + reach < x1 - 2) { book(p, x, base, 13, h, pick(r, BOOKS), ang); x += reach; } }
    return x;
  }
  // a storage box sitting on the shelf, optionally with books standing in it (drawn first so the front hides their bottoms)
  function box(p, r, x, base, w, h, room, withBooks, style) {
    if (withBooks) { let bx = x + 6; while (bx < x + w - 16) { const bw = 9 + r() * 7; book(p, bx, base - 4, bw, Math.min(room - 6, h + 12 + r() * (room - h) * 0.6), pick(r, BOOKS)); bx += bw + 1 + r() * 2; } }
    if (style === 'bin') { // fabric bin with a hand hole
      const c = pick(r, ['#5c9ded', '#ef6c6c', '#6cc08b', '#f2b84b', '#a678d6']);
      p.poly([[x, base - h], [x + w, base - h], [x + w - 4, base], [x + 4, base]], { stroke: c, w: 3.5, fill: 'paper', hatch: c, hg: 6, halpha: 0.45, ha: 15, smooth: false });
      p.ell(x + w / 2, base - h + 16, Math.min(16, w * 0.18), 5, { stroke: c, w: 3, fill: c });
    } else { // cardboard box with a label
      p.rect(x, base - h, w, h, { stroke: 'box', w: 3.5, fill: 'paper', hatch: 'box', hg: 6, halpha: 0.45, ha: 10 });
      p.rect(x + w / 2 - Math.min(15, w * 0.22), base - h * 0.62, Math.min(30, w * 0.44), Math.min(16, h * 0.3), { stroke: 'box', w: 2, fill: 'paper' });
      if (!withBooks) p.line([[x + 3, base - h + 5], [x + w - 3, base - h + 5]], { stroke: 'box', w: 2 }); // closed lid
    }
  }

  // fill one shelf space: x0..x1 wide, the shelf it stands on at `base`, `room` = free height above it
  function fill(p, r, x0, x1, base, room, mode, k, boxStyle) {
    const W = x1 - x0; if (W < 24 || mode === 'empty') return;
    if (mode === 'books') {
      const end = row(p, r, x0 + 4, x1 - (r() < 0.45 ? 62 : 4), base, room, { lean: false });
      if (x1 - end > 55) pile(p, r, (end + x1) / 2, base, 2 + Math.floor(r() * 3), x1 - end - 8);
      return;
    }
    if (mode === 'few') { // emptier: a handful of books at one side, a little pile, or nothing at all
      const what = (k + Math.floor(r() * 3)) % 3;
      if (what === 0) {
        const ws = []; for (let n = 2 + Math.floor(r() * 3), i = 0; i < n; i++) ws.push(11 + r() * 6);
        while (ws.length > 1 && ws.reduce((a, w) => a + w + 2, 0) > W - 12) ws.pop(); // narrow space: fewer books
        const left = r() < 0.5; let x = left ? x0 + 6 : x1 - 4 - ws.reduce((a, w) => a + w + 2, 0);
        for (const w of ws) { book(p, x, base, w, room * (0.6 + r() * 0.3), pick(r, BOOKS)); x += w + 2; }
        const h = room * 0.7, ang = 18 + r() * 8; // one leaning on them, if it fits
        if (left && x + 2 + 13 * Math.cos(U.rad(ang)) + h * Math.sin(U.rad(ang)) < x1 - 2) book(p, x + 2, base, 13, h, pick(r, BOOKS), ang);
      }
      else if (what === 1) pile(p, r, x0 + W * (0.3 + r() * 0.4), base, 2 + Math.floor(r() * 2), W - 10);
      return;
    }
    if (mode === 'mixed') { // books and a box, side by side
      const bw = Math.min(W * 0.48, 90), bh = Math.min(room - 6, room * (0.55 + r() * 0.25));
      if ((k + Math.floor(r() * 2)) % 2) { box(p, r, x0 + 5, base, bw, bh, room, r() < 0.5, boxStyle); row(p, r, x0 + bw + 12, x1 - 4, base, room); }
      else { row(p, r, x0 + 4, x1 - bw - 10, base, room, { lean: false }); box(p, r, x1 - bw - 5, base, bw, bh, room, r() < 0.5, boxStyle); }
      return;
    }
    if (mode === 'boxes') { // boxes on the shelf, most holding books
      const n = Math.max(1, Math.round(W / 95)); const gap = 7; const bw = (W - gap * (n + 1)) / n;
      for (let i = 0; i < n; i++) { const bh = Math.min(room - 8, room * (0.5 + r() * 0.2)); box(p, r, x0 + gap + i * (bw + gap), base, bw, bh, room, r() < 0.8, boxStyle); }
    }
  }

  // which way each style divides into spaces: list of [x0, x1, base, room]
  function frame(p, P, o) {
    const S = [];
    const plinth = (x0, x1) => p.rect(x0, -12, x1 - x0, 12, { ...o, fill: 'paper', hatch: 'frame', hg: 5, halpha: 0.4 });
    const caseOf = (W, H, n) => { // outer box, n shelves (n spaces)
      p.rect(-W / 2, -H, W, H, { ...o, fill: 'paper' });
      p.rect(-W / 2 + 7, -H + 7, W - 14, H - 19, { stroke: 'frame', w: 1.5, hatch: 'frame', hg: 10, halpha: 0.12 }); // back panel
      plinth(-W / 2, W / 2);
      const top = -H + 7, bot = -12, step = (bot - top) / n;
      for (let i = 1; i < n; i++) p.rect(-W / 2, top + i * step - 3, W, 6, { ...o, w: 3.5, fill: 'paper' });
      for (let i = 0; i < n; i++) { const base = top + (i + 1) * step - (i < n - 1 ? 3 : 0); S.push([-W / 2 + 8, W / 2 - 8, base, step - 6]); }
      return S;
    };
    if (P.style === 'tall') return caseOf(190, 380, 4);
    if (P.style === 'low') {
      caseOf(320, 150, 2); p.line([[0, -143], [0, -12]], { ...o, w: 4 }); // middle divider
      return S.splice(0).flatMap(([x0, x1, b, rm]) => [[x0, -4, b, rm], [4, x1, b, rm]]);
    }
    if (P.style === 'cubby') { // 3 × 2 cubes
      const W = 300, H = 210, cw = W / 3; caseOf(W, H, 2);
      for (const dx of [-cw / 2, cw / 2]) p.line([[dx, -H], [dx, -12]], { ...o, w: 4 });
      return S.splice(0).flatMap(([, , b, rm]) => [0, 1, 2].map((i) => [-W / 2 + i * cw + 6, -W / 2 + (i + 1) * cw - 6, b, rm]));
    }
    if (P.style === 'cupboard') { // open shelves above, doors below
      const W = 230, H = 320, dh = 125; p.rect(-W / 2, -H, W, H, { ...o, fill: 'paper' });
      p.rect(-W / 2 + 7, -H + 7, W - 14, H - dh - 14, { stroke: 'frame', w: 1.5, hatch: 'frame', hg: 10, halpha: 0.12 });
      plinth(-W / 2, W / 2); p.rect(-W / 2, -dh - 12, W, 6, { ...o, w: 3.5, fill: 'paper' });
      const top = -H + 7, bot = -dh - 12, mid = (top + bot) / 2;
      p.rect(-W / 2, mid - 3, W, 6, { ...o, w: 3.5, fill: 'paper' });
      S.push([-W / 2 + 8, W / 2 - 8, mid - 3, mid - top - 6], [-W / 2 + 8, W / 2 - 8, bot, bot - mid - 6]);
      const dt = -dh - 6, db = -12;
      if (P.doors === true || P.doors === 'true') { // open: the inside shelf shows, doors swing out
        p.rect(-W / 2 + 7, dt, W - 14, db - dt, { stroke: 'frame', w: 1.5, hatch: 'frame', hg: 9, halpha: 0.22 });
        S.push([-W / 2 + 8, W / 2 - 8, db, db - dt - 4]);
        for (const s of [-1, 1]) { p.poly([[s * W / 2, dt], [s * (W / 2 + 58), dt - 14], [s * (W / 2 + 58), db + 14], [s * W / 2, db]], { ...o, fill: 'paper', hatch: 'frame', hg: 8, halpha: 0.3, ha: s * 50, smooth: false }); p.circ(s * (W / 2 + 46), (dt + db) / 2, 4, { stroke: 'frame', fill: 'frame' }); }
      } else {
        for (const s of [-1, 1]) { p.rect(s < 0 ? -W / 2 + 6 : 3, dt + 4, W / 2 - 9, db - dt - 8, { ...o, w: 3, fill: 'paper' }); p.circ(s * 14, (dt + db) / 2, 4.5, { stroke: 'frame', fill: 'frame' }); }
      }
      return S;
    }
    if (P.style === 'wall') { // two floating planks on brackets
      const W = 260;
      for (const y of [0, -120]) {
        p.rect(-W / 2, y - 9, W, 9, { ...o, fill: 'paper', hatch: 'frame', hg: 5, halpha: 0.4 });
        for (const s of [-1, 1]) p.poly([[s * (W / 2 - 30), y], [s * (W / 2 - 30), y + 30], [s * (W / 2 - 58), y]], { stroke: 'frame', w: 3, smooth: false });
        S.push([-W / 2 + 6, W / 2 - 6, y - 9, y ? 104 : 76]); // the lower plank's books stay clear of the brackets above
      }
      return S;
    }
    return caseOf(230, 280, 3); // bookcase
  }

  CP.register({
    api: 1, version: '1.0.0',
    type: 'prop', id: 'shelves', name: 'Shelves & cupboards', pack: 'Classroom props', cat: 'Furniture',
    colors: { frame: '#8d6e4f', box: '#b08454' },
    params: [
      { key: 'style', label: 'Style', type: 'select', def: 'bookcase', options: { bookcase: 'Bookcase', tall: 'Tall bookcase', low: 'Low shelf', cupboard: 'Cupboard (shelves + doors)', cubby: 'Cube storage', wall: 'Wall shelves' } },
      { key: 'fill', label: "What's on the shelves", type: 'select', def: 'books', options: { books: 'Full of books', few: 'A few books (emptier)', mixed: 'Books and boxes', boxes: 'Boxes of books', empty: 'Empty' } },
      { key: 'boxes', label: 'Box type', type: 'select', def: 'card', options: { card: 'Cardboard boxes', bin: 'Coloured bins' }, when: { fill: ['mixed', 'boxes'] } },
      { key: 'doors', label: 'Doors open', type: 'toggle', def: false, when: { style: 'cupboard' } },
      { key: 'shuffle', label: 'Arrangement', type: 'range', min: 1, max: 20, step: 1, def: 1 },
    ],
    draw(p, P, it) {
      const o = { stroke: 'frame', w: 4.5 };
      const spaces = frame(p, P, o);
      const r = U.rng(U.hash(it.id + ':' + (P.shuffle || 1)));
      // cube storage with boxes: one bin per cube looks tidier than two
      spaces.forEach(([x0, x1, base, room], k) => fill(p, r, x0, x1, base, room, P.fill || 'books', k, P.boxes || 'card'));
    },
  });
})();
