// EXAMPLE picture add-on — a house. Draw inside box; scale everything from box.w / box.h so it fits any frame.
CP.register({
  api: 1, version: '1.0.0',
  type: 'addon', kind: 'picture', id: 'house', name: 'House', order: 10,
  draw(pen, b) {
    const X = (u) => b.x + u * b.w, Y = (v) => b.y + v * b.h; // 0..1 inside the box
    pen.line([[X(0.05), Y(0.9)], [X(0.95), Y(0.9)]], { stroke: '#43a047', w: 3 });
    pen.rect(X(0.3), Y(0.48), b.w * 0.4, b.h * 0.42, { stroke: '#e53935', w: 3, fill: 'paper', hatch: '#e53935', hg: 4, halpha: 0.35 });
    pen.poly([[X(0.24), Y(0.5)], [X(0.5), Y(0.2)], [X(0.76), Y(0.5)]], { stroke: '#8a5a2b', w: 3, hatch: '#8a5a2b', hg: 3.5, halpha: 0.7 });
    pen.rect(X(0.45), Y(0.68), b.w * 0.1, b.h * 0.22, { stroke: '#1e88e5', w: 2.5, fill: '#1e88e5' });
    pen.rect(X(0.34), Y(0.56), b.w * 0.08, b.h * 0.09, { stroke: '#1e88e5', w: 2 }); pen.rect(X(0.58), Y(0.56), b.w * 0.08, b.h * 0.09, { stroke: '#1e88e5', w: 2 });
    pen.circ(X(0.83), Y(0.2), Math.min(b.w, b.h) * 0.08, { stroke: '#fbc02d', w: 2.5, hatch: '#fbc02d', hg: 2.5, halpha: 0.9 });
  },
});
