// Props: Scenery backdrops (ground, sky, hills, wall). Shared pieces that make a page look like a place; the Home, School and Park kits sit on them.
// They are page-wide: up to 1000 wide. Put them at the back (Position > Send to back) and lock them. Floor pieces stand on y = 0, centred on x = 0.
// Style guide: docs/PROP-STYLE-GUIDE.md. These use paper fills (so what is behind is hidden) and hatching for colour.
(() => {
  const PACK = 'Scenery', CAT = 'Scenery';
  const rngOf = (item, k) => U.rng(U.hash(item.id + ':' + k));
  const O = { stroke: 'line', w: 4.5 };

  CP.register({ api: 1, version: '1.0.0', pack: PACK, items: [
    // ---------- ground ----------
    { type: 'prop', id: 'scenery-ground', name: 'Ground', cat: CAT, tags: ['grass', 'lawn', 'floor', 'road', 'path', 'pavement', 'field'],
      colors: { line: '#6f6f6f', grass: '#43a047', sand: '#c9a15a', road: '#78909c', wood: '#a0724a', lane: '#f9a825' },
      params: [
        { key: 'kind', label: 'Ground', type: 'select', options: { grass: 'Grass', sand: 'Sandy path', road: 'Road', floor: 'Wooden floor' }, def: 'grass' },
        { key: 'width', label: 'Width', type: 'range', min: 200, max: 1000, step: 20, def: 1000 },
        { key: 'depth', label: 'Depth', type: 'range', min: 60, max: 300, step: 10, def: 150 }],
      draw(p, P, item) {
        const W = P.width / 2, D = P.depth, r = rngOf(item, 'g'); const none = { stroke: false };
        if (P.kind === 'grass') {
          p.rect(-W, -D, W * 2, D, { ...none, fill: 'paper', hatch: 'grass', hg: 9, ha: -55, halpha: 0.5 });
          const top = []; for (let x = -W; x <= W; x += 20) top.push([x, -D + Math.sin(x / 60) * 4 + (r() - 0.5) * 4]); p.curve(top, { stroke: 'grass', w: 4.5 });
          for (let x = -W + 30; x < W - 20; x += 46 + r() * 40) { const y = -D + 16 + r() * (D - 40); p.line([[x, y], [x - 5, y - 13]], { stroke: 'grass', w: 2.5 }); p.line([[x, y], [x + 1, y - 16]], { stroke: 'grass', w: 2.5 }); p.line([[x, y], [x + 7, y - 12]], { stroke: 'grass', w: 2.5 }); }
        } else if (P.kind === 'sand') {
          p.rect(-W, -D, W * 2, D, { ...none, fill: 'paper', hatch: 'sand', hg: 8, ha: -20, halpha: 0.45 });
          const top = []; for (let x = -W; x <= W; x += 25) top.push([x, -D + Math.sin(x / 70) * 5]); p.curve(top, { stroke: 'sand', w: 4.5 });
          for (let i = 0; i < Math.round(W / 22); i++) p.ell(-W + 20 + r() * W * 2 - 40, -D + 14 + r() * (D - 30), 5 + r() * 5, 3 + r() * 3, { stroke: 'sand', w: 2, fill: 'paper' });
        } else if (P.kind === 'road') {
          p.rect(-W, -D, W * 2, D, { ...none, fill: 'paper', hatch: 'road', hg: 7, ha: 0, halpha: 0.4 });
          p.line([[-W, -D], [W, -D]], O); p.line([[-W, -D + 12], [W, -D + 12]], { stroke: 'line', w: 2.5 });
          for (let x = -W + 20; x < W - 60; x += 110) p.line([[x, -D / 2], [x + 60, -D / 2]], { stroke: 'lane', w: 6 });
        } else { // wooden floor
          p.rect(-W, -D, W * 2, D, { ...none, fill: 'paper', hatch: 'wood', hg: 14, ha: 0, halpha: 0.25 });
          p.line([[-W, -D], [W, -D]], { stroke: 'wood', w: 4.5 }); const rows = Math.max(2, Math.round(D / 38)); const rh = D / rows;
          for (let i = 1; i < rows; i++) p.line([[-W, -D + i * rh], [W, -D + i * rh]], { stroke: 'wood', w: 2.5 });
          for (let i = 0; i < rows; i++) for (let x = -W + r() * 120 + 40; x < W; x += 170 + r() * 90) p.line([[x, -D + i * rh], [x, -D + (i + 1) * rh]], { stroke: 'wood', w: 2 });
        }
      } },

    // ---------- sky ----------
    { type: 'prop', id: 'scenery-sky', name: 'Sky', cat: CAT, tags: ['day', 'night', 'dusk', 'sunset', 'sun', 'moon', 'stars', 'background'],
      colors: { line: '#6f6f6f', sky: '#64b5f6', sun: '#f9a825', dusk: '#ff8a65', dusk2: '#7e57c2', night: '#3949ab', star: '#fff59d' },
      params: [
        { key: 'time', label: 'Time of day', type: 'select', options: { day: 'Day', dusk: 'Sunset', night: 'Night' }, def: 'day' },
        { key: 'width', label: 'Width', type: 'range', min: 200, max: 1000, step: 20, def: 1000 },
        { key: 'height', label: 'Height', type: 'range', min: 200, max: 700, step: 20, def: 560 }],
      draw(p, P, item) {
        const W = P.width / 2, H = P.height, r = rngOf(item, 's'); const none = { stroke: false };
        if (P.time === 'night') {
          p.rect(-W, -H, W * 2, H, { ...none, fill: 'paper', hatch: 'night', hg: 5, ha: 0, halpha: 0.8 }); // dense hatching: a solid dark fill would turn to grey dust in chalk
          for (let i = 0; i < Math.round(W / 14); i++) { const x = -W + 24 + r() * (W * 2 - 48), y = -H + 24 + r() * (H - 90), s = 4 + r() * 6; p.line([[x - s, y], [x + s, y]], { stroke: 'star', w: 2.2 }); p.line([[x, y - s], [x, y + s]], { stroke: 'star', w: 2.2 }); }
          const mx = W * 0.55, my = -H * 0.72; p.poly([[mx + 4, my - 46], [mx - 22, my - 36], [mx - 44, my - 6], [mx - 40, my + 24], [mx - 14, my + 46], [mx + 20, my + 46], [mx - 4, my + 30], [mx - 18, my + 4], [mx - 12, my - 24]], { stroke: 'star', w: 3.5, fill: 'star', smooth: true });
        } else if (P.time === 'dusk') {
          p.rect(-W, -H, W * 2, H, { ...none, fill: 'paper' });
          p.rect(-W, -H, W * 2, H * 0.55, { ...none, hatch: 'dusk2', hg: 9, ha: 0, halpha: 0.38 });
          p.rect(-W, -H * 0.45, W * 2, H * 0.45, { ...none, hatch: 'dusk', hg: 8, ha: 0, halpha: 0.5 });
          p.arc(-W * 0.3, 0, 90, 90, 180, 360, { stroke: 'sun', w: 4.5, fill: 'sun', hatch: 'sun', hg: 4, halpha: 0.5 }); // a setting sun on the bottom edge
          for (let i = 0; i < 6; i++) { const a = U.rad(200 + i * 28); p.line([[-W * 0.3 + Math.cos(a) * 104, Math.sin(a) * 104], [-W * 0.3 + Math.cos(a) * 130, Math.sin(a) * 130]], { stroke: 'sun', w: 4.5 }); }
        } else {
          p.rect(-W, -H, W * 2, H, { ...none, fill: 'paper', hatch: 'sky', hg: 10, ha: 0, halpha: 0.35 });
          const sx = W * 0.6, sy = -H * 0.8; p.circ(sx, sy, 52, { stroke: 'sun', w: 4.5, fill: 'paper', hatch: 'sun', hg: 4, halpha: 0.6 });
          for (let i = 0; i < 12; i++) { const a = U.rad(i * 30); p.line([[sx + Math.cos(a) * 68, sy + Math.sin(a) * 68], [sx + Math.cos(a) * (i % 2 ? 84 : 94), sy + Math.sin(a) * (i % 2 ? 84 : 94)]], { stroke: 'sun', w: 4.5 }); }
        }
      } },

    // ---------- hills ----------
    { type: 'prop', id: 'scenery-hills', name: 'Hills', cat: CAT, tags: ['hill', 'mountain', 'countryside', 'horizon', 'background'],
      colors: { line: '#6f6f6f', far: '#5c8fb5', near: '#43a047' },
      params: [{ key: 'width', label: 'Width', type: 'range', min: 300, max: 1000, step: 20, def: 1000 }, { key: 'height', label: 'Height', type: 'range', min: 80, max: 300, step: 10, def: 190 }],
      draw(p, P) {
        const W = P.width / 2, H = P.height; const hill = (amp, ph, base, col, hg, ha) => { const pts = [[-W, 0]]; for (let x = -W; x <= W; x += 20) pts.push([x, Math.min(-8, -base - amp * (0.5 + 0.5 * Math.sin(x / 150 + ph)) - amp * 0.25 * Math.sin(x / 55 + ph * 2))]); pts.push([W, 0]); p.poly(pts, { stroke: col, w: 4.5, fill: 'paper', hatch: col, hg, ha, halpha: 0.45 }); };
        hill(H * 0.55, 1.2, H * 0.3, 'far', 9, -35); hill(H * 0.45, 3.4, H * 0.08, 'near', 8, -50);
      } },

    // ---------- wall ----------
    { type: 'prop', id: 'scenery-wall', name: 'Room wall', cat: CAT, tags: ['room', 'indoor', 'inside', 'wallpaper', 'interior', 'background'],
      colors: { line: '#8a5a33', wall: '#f4a261', trim: '#8a5a33', glass: '#4fc3f7', door: '#1e88e5' },
      params: [
        { key: 'paper', label: 'Wallpaper', type: 'select', options: { plain: 'Plain', stripes: 'Stripes', dots: 'Dots' }, def: 'plain' },
        { key: 'window', label: 'Window', type: 'toggle', def: true }, { key: 'door', label: 'Door', type: 'toggle', def: false },
        { key: 'width', label: 'Width', type: 'range', min: 400, max: 1000, step: 20, def: 1000 }, { key: 'height', label: 'Height', type: 'range', min: 400, max: 700, step: 20, def: 520 }],
      draw(p, P, item) {
        const W = P.width / 2, H = P.height; const none = { stroke: false };
        p.rect(-W, -H, W * 2, H, { ...none, fill: 'paper', hatch: 'wall', hg: 12, ha: 90, halpha: 0.22 });
        if (P.paper === 'stripes') for (let x = -W + 40; x < W; x += 80) p.line([[x, -H + 6], [x, -34]], { stroke: 'wall', w: 4 });
        if (P.paper === 'dots') for (let y = -H + 70, row = 0; y < -60; y += 90, row++) for (let x = -W + 50 + (row % 2 ? 45 : 0); x < W - 20; x += 90) p.circ(x, y, 5, { stroke: 'wall', w: 2.5, fill: 'wall' });
        p.rect(-W, -34, W * 2, 34, { ...O, stroke: 'trim', fill: 'paper' }); p.line([[-W, -H], [W, -H]], { stroke: 'trim', w: 4.5 }); // skirting board and top edge
        if (P.window) { const cx = W * 0.3, top = -420, h = 190, w = 170;
          p.rect(cx - w / 2, top, w, h, { stroke: 'trim', w: 4.5, fill: 'paper', hatch: 'glass', hg: 6, halpha: 0.4, ha: 55 });
          p.line([[cx, top], [cx, top + h]], { stroke: 'trim', w: 3 }); p.line([[cx - w / 2, top + h / 2], [cx + w / 2, top + h / 2]], { stroke: 'trim', w: 3 });
          p.rect(cx - w / 2 - 12, top + h, w + 24, 12, { stroke: 'trim', w: 3.5, fill: 'paper' }); }
        if (P.door) { const cx = -W * 0.3, h = 340, w = 100;
          p.rect(cx - w / 2, -34 - h + 34, w, h - 0, { stroke: 'trim', w: 4.5, fill: 'paper', hatch: 'door', hg: 7, halpha: 0.35, ha: 90 });
          p.rect(cx - w / 2 + 14, -h + 30, w - 28, 120, { stroke: 'door', w: 2.5 }); p.rect(cx - w / 2 + 14, -h + 170, w - 28, 120, { stroke: 'door', w: 2.5 }); p.circ(cx + w / 2 - 16, -h / 2 - 10, 6, { stroke: 'trim', w: 3, fill: 'paper' }); }
      } },
  ] });
})();
