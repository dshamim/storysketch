// Picture add-on: Family. Fits any prop with a "picture" slot (easel, frame, paper, mural…).
// box = the area to draw in { x, y, w, h, cx, cy }; a.seed keeps random details the same every time.
CP.register({
  api: 1, version: '1.0.0',
  type: 'addon', kind: 'picture', id: 'family', name: 'Family', order: 5,
  draw(pen, box, a) { CP.helpers.paintingOn(pen, 'family', box.x, box.y, box.w, box.h, a.seed); },
});
