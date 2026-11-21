// Picture add-on: Tree. Fits any prop with a "picture" slot (easel, frame, paper, mural…).
// box = the area to draw in { x, y, w, h, cx, cy }; a.seed keeps random details the same every time.
CP.register({
  api: 1, version: '1.0.0',
  type: 'addon', kind: 'picture', id: 'tree', name: 'Tree', order: 1,
  draw(pen, box, a) { CP.helpers.paintingOn(pen, 'tree', box.x, box.y, box.w, box.h, a.seed); },
});
