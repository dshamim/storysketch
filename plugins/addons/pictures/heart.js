// Picture add-on: Heart. Fits any prop with a "picture" slot (easel, frame, paper, mural…).
// box = the area to draw in { x, y, w, h, cx, cy }; a.seed keeps random details the same every time.
CP.register({
  api: 1, version: '1.0.0',
  type: 'addon', kind: 'picture', id: 'heart', name: 'Heart', order: 2,
  draw(pen, box, a) { CP.helpers.paintingOn(pen, 'heart', box.x, box.y, box.w, box.h, a.seed); },
});
