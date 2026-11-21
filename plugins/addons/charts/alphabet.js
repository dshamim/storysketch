// Chart add-on: A B C with little pictures. Colours 'a', 'b', 'c' come from the prop's colour slots when it has them.
CP.register({
  api: 1, version: '1.0.0',
  type: 'addon', kind: 'chart', id: 'alphabet', name: 'A B C', order: 2,
  draw(pen, b) {
    const s = Math.min(b.w / 4, b.h / 2.6);
    pen.text('ABC', b.cx, b.y + b.h * 0.1, s, { stroke: '#1e88e5' });
    const y = b.y + b.h * 0.1 + s * 1.7, step = b.w / 3;
    pen.circ(b.x + step * 0.5, y, s * 0.28, { stroke: '#e53935', w: 2.5, hatch: '#e53935', hg: 3, halpha: 0.8 }); pen.line([[b.x + step * 0.5, y - s * 0.28], [b.x + step * 0.55, y - s * 0.45]], { stroke: '#6d4c41', w: 2 }); // apple
    pen.circ(b.x + step * 1.5, y, s * 0.28, { stroke: '#1e88e5', w: 2.5 }); pen.arc(b.x + step * 1.5, y, s * 0.28, s * 0.12, 0, 180, { stroke: '#1e88e5', w: 2 }); // ball
    pen.poly([[b.x + step * 2.5 - s * 0.32, y + s * 0.2], [b.x + step * 2.5 + s * 0.12, y - s * 0.3], [b.x + step * 2.5 + s * 0.32, y + s * 0.2]], { stroke: '#8e24aa', w: 2.5, hatch: '#8e24aa', hg: 3, halpha: 0.6 }); // cat-ish ears → "cat"
    pen.circ(b.x + step * 2.5, y + s * 0.15, s * 0.22, { stroke: '#8e24aa', w: 2.5, fill: 'paper' });
  },
});
