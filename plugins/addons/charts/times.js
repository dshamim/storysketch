// Chart add-on: times tables. Has its own option (text) — options declared here show in the right panel under the slot.
CP.register({
  api: 1, version: '1.0.0',
  type: 'addon', kind: 'chart', id: 'times', name: 'Times tables', order: 1,
  params: [{ key: 'text', label: 'Lines (use | between lines)', type: 'text', def: '2x4|3x5|4x6' }],
  draw(pen, b, a) {
    const lines = String(a.params.text).split('|').slice(0, 5);
    const size = Math.min(38, (b.h + 2) / Math.max(1, lines.length) - 12);
    lines.forEach((ln, i) => pen.text(ln, b.cx, b.y + 8 + i * (size + 12), size, { stroke: ['a', 'b', 'c'][i % 3] }));
  },
});
