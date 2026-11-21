// Prop: one crayon / pencil / felt-tip / chalk / brush to put in a character's hand.
// Origin = the place the fingers hold it (the grip), so you drop the origin on the hand and turn it with "Pointing".
// The tip points along "Pointing" (0 = right, 90 = down, -90 = up); "Held at" slides the grip along it.
(() => {
  CP.register({ api: 1, version: '1.0.0', pack: 'Classroom props', items: [
    { type: 'prop', id: 'drawtool', name: 'Crayon / pencil (to hold)', cat: 'Arts',
      colors: { colour: '#e53935' },
      params: [
        { key: 'kind', label: 'What', type: 'select', def: 'crayon', options: { crayon: 'Crayon', pencil: 'Pencil (grey lead)', colpencil: 'Coloured pencil', felt: 'Felt-tip pen', board: 'Whiteboard marker', chalk: 'Chalk', brush: 'Paintbrush (thin)' } },
        { key: 'length', label: 'Length', type: 'range', min: 20, max: 200, step: 2, def: 56 },
        { key: 'angle', label: 'Pointing (turn)', type: 'range', min: -180, max: 180, step: 5, def: 40 },
        { key: 'grip', label: 'Held at (tip ↔ end)', type: 'range', min: 0.1, max: 0.9, step: 0.05, def: 0.3 },
        { key: 'mark', label: 'Drawing a line at the tip', type: 'toggle', def: false },
        { key: 'used', label: 'Worn down (stubby)', type: 'toggle', def: false, when: { kind: ['crayon', 'chalk', 'pencil', 'colpencil'] } },
      ],
      draw(p, P) {
        const kind = P.kind || 'crayon', Lt = (+P.length || 56) * (P.used && kind !== 'felt' && kind !== 'board' && kind !== 'brush' ? 0.6 : 1);
        const g = +P.grip || 0.3, tipX = g * Lt, backX = -(1 - g) * Lt, c = 'colour', n0 = p.o.length;
        const box = (x0, x1, hw, o) => p.poly([[x0, -hw], [x1, -hw], [x1, hw], [x0, hw]], { smooth: false, ...o });
        const lw = Math.max(1.5, Lt * 0.03);
        if (kind === 'crayon') {
          const hw = Lt * 0.085, cone = hw * 1.3;
          box(backX, tipX - cone, hw, { stroke: c, w: lw * 1.2, fill: c, hatch: c, hg: 3, halpha: 0.9 });
          box(backX + Lt * 0.12, tipX - cone - Lt * 0.12, hw, { stroke: c, w: lw, fill: 'paper', hatch: c, hg: 3, halpha: 0.35 }); // paper wrapper
          for (const f of [0.3, 0.6]) { const xx = U.lerp(backX + Lt * 0.12, tipX - cone - Lt * 0.12, f); p.line([[xx, -hw], [xx, hw]], { stroke: c, w: lw * 0.8 }); }
          p.poly([[tipX - cone, -hw], [tipX - cone * 0.15, -hw * 0.35], [tipX, 0], [tipX - cone * 0.15, hw * 0.35], [tipX - cone, hw]], { stroke: c, w: lw, fill: c, smooth: !!P.used });
        } else if (kind === 'pencil' || kind === 'colpencil') {
          const hw = Lt * 0.05, cone = hw * 3.2, body = kind === 'pencil' ? '#fbc02d' : c, lead = kind === 'pencil' ? '#424242' : c;
          if (kind === 'pencil') { box(backX, backX + Lt * 0.07, hw, { stroke: '#c2185b', w: lw, fill: '#f48fb1' }); box(backX + Lt * 0.07, backX + Lt * 0.13, hw, { stroke: '#757575', w: lw, fill: '#bdbdbd' }); }
          box(kind === 'pencil' ? backX + Lt * 0.13 : backX, tipX - cone, hw, { stroke: kind === 'pencil' ? '#f9a825' : c, w: lw, fill: body, hatch: body, hg: 2.5, halpha: 0.7 });
          p.line([[kind === 'pencil' ? backX + Lt * 0.13 : backX, 0], [tipX - cone, 0]], { stroke: kind === 'pencil' ? '#f9a825' : c, w: lw * 0.6 }); // the flat side of the hexagon
          p.poly([[tipX - cone, -hw], [tipX - cone * 0.3, -hw * 0.35], [tipX - cone * 0.3, hw * 0.35], [tipX - cone, hw]], { stroke: '#b88a4e', w: lw * 0.9, fill: '#ecc894' }); // sharpened wood
          p.poly([[tipX - cone * 0.3, -hw * 0.35], [tipX, 0], [tipX - cone * 0.3, hw * 0.35]], { stroke: lead, w: lw * 0.9, fill: lead });
        } else if (kind === 'felt' || kind === 'board') {
          const hw = Lt * (kind === 'board' ? 0.1 : 0.07), capL = Lt * 0.3, nose = hw * 1.6;
          box(backX + capL * 0.65, tipX - nose, hw, { stroke: '#9e9e9e', w: lw, fill: 'paper' }); // barrel
          if (kind === 'board') box(U.lerp(backX, tipX, 0.4), U.lerp(backX, tipX, 0.65), hw, { stroke: c, w: lw * 0.8, fill: 'paper', hatch: c, hg: 3, halpha: 0.5 }); // label
          box(backX, backX + capL, hw * 1.15, { stroke: c, w: lw, fill: c }); // cap pushed on the end
          p.poly([[tipX - nose, -hw], [tipX - nose * 0.4, -hw * 0.55], [tipX - nose * 0.4, hw * 0.55], [tipX - nose, hw]], { stroke: c, w: lw * 0.9, fill: c, hatch: c, hg: 2.5, halpha: 0.8 });
          p.poly([[tipX - nose * 0.4, -hw * 0.3], [tipX, -hw * (kind === 'board' ? 0.25 : 0.05)], [tipX, hw * 0.05], [tipX - nose * 0.4, hw * 0.3]], { stroke: c, w: lw * 0.8, fill: c, smooth: kind !== 'board' });
        } else if (kind === 'chalk') {
          const hw = Lt * 0.11, cc = c;
          p.poly([[backX, -hw], [tipX - hw * 0.8, -hw], [tipX, -hw * 0.3], [tipX, hw * 0.3], [tipX - hw * 0.8, hw], [backX, hw], [backX - hw * 0.25, 0]], { stroke: cc, w: lw, fill: 'paper', hatch: cc, hg: 3.5, halpha: 0.45, smooth: true });
        } else { // thin artist's brush
          const hw = Lt * 0.03;
          p.poly([[backX, -hw * 0.6], [tipX - Lt * 0.22, -hw], [tipX - Lt * 0.22, hw], [backX, hw * 0.6]], { stroke: '#8a5a33', w: lw * 0.8, fill: '#a1887f' }); // handle
          box(tipX - Lt * 0.22, tipX - Lt * 0.12, hw * 1.1, { stroke: '#757575', w: lw * 0.8, fill: '#bdbdbd' }); // metal ferrule
          p.poly([[tipX - Lt * 0.12, -hw * 1.1], [tipX - Lt * 0.05, -hw * 1.3], [tipX, 0], [tipX - Lt * 0.05, hw * 1.3], [tipX - Lt * 0.12, hw * 1.1]], { stroke: c, w: lw * 0.8, fill: c, smooth: true }); // bristles with paint
        }
        // turn everything around the grip (the origin)
        const a = U.rad(+P.angle || 0), co = Math.cos(a), si = Math.sin(a);
        for (const pr of p.o.slice(n0)) { pr.pts = pr.pts.map(([x, y]) => [x * co - y * si, x * si + y * co]); if (pr.hatch) pr.hatch.angle = (pr.hatch.angle ?? -40) + (+P.angle || 0); }
        if (P.mark) { // the line it has just drawn: a wavy stroke trailing off to the left of the tip
          const tx = tipX * co, ty = tipX * si, pts = [];
          for (let i = 0; i <= 9; i++) pts.push([tx - i * Lt * 0.09, ty + Lt * 0.07 * Math.sin(i * 1.1)]);
          p.curve(pts, { stroke: kind === 'pencil' ? '#616161' : c, w: Math.max(2, Lt * (kind === 'board' ? 0.06 : 0.045)) });
        }
      } },
  ] });
})();
