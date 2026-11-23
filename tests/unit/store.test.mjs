import test from 'node:test'; import assert from 'node:assert/strict';
import { createApp } from '../helpers/sandbox.mjs';
const app = await createApp(); const { STORE, APP, CP } = app;

test('fresh blank project has one page and the project style default', () => {
  const p = STORE.fresh('blank');
  assert.equal(p.app, 'StorySketch'); assert.equal(p.schema, APP.schema); assert.equal(p.pages.length, 1);
  assert.equal(p.settings.style, 'crayon'); assert.ok(p.cast.length > 0);
});
test('serialize → migrate round-trips', () => {
  const p = STORE.fresh('blank'); const back = STORE.migrate(JSON.parse(STORE.serialize(p)));
  assert.equal(back.pages.length, 1); assert.equal(back.settings.paper, '#ffffff'); assert.equal(back.cast.length, p.cast.length);
});
test('opens project files saved before the rename (app: "Crayon Poser")', () => {
  const old = { app: 'Crayon Poser', appVersion: '0.20.0', schema: 2, settings: { pageW: 1000, pageH: 750, paper: '#ffffff' }, cast: [], templates: [], pages: [{ id: 'p1', name: 'P', notes: '', items: [] }] };
  const p = STORE.migrate(old);
  assert.equal(p.settings.style, 'crayon'); // gap filled, no schema bump needed
});
test('refuses files from other apps, files with no pages, and newer schemas', () => {
  assert.throws(() => STORE.migrate({ app: 'Something Else', pages: [] }), /Not a StorySketch/);
  assert.throws(() => STORE.migrate({ app: 'StorySketch' }), /Not a StorySketch/);
  assert.throws(() => STORE.migrate({ app: 'StorySketch', schema: APP.schema + 1, pages: [] }), /newer version/);
});
test('schema 1 files are upgraded: accessory booleans become accessory options', () => {
  const v1 = { schema: 1, pages: [{ id: 'p', name: 'P', items: [] }], cast: [{ id: 'a', name: 'A', glasses: true, crown: true, crownColor: '#ff0000', cape: false }] };
  const p = STORE.migrate(v1); const a = p.cast[0];
  assert.ok(a.accessories.glasses); assert.equal(a.accessories.crown.color, '#ff0000'); assert.ok(!a.accessories.cape); assert.ok(!('crown' in a));
});
test('a chosen style survives a save/load', () => {
  const p = STORE.fresh('blank'); p.settings.style = 'chalk';
  assert.equal(STORE.migrate(JSON.parse(STORE.serialize(p))).settings.style, 'chalk');
});
test('undo / redo walk through snapshots', () => {
  const p = STORE.fresh('blank'); STORE.snapshot(p); p.settings.paper = '#111111'; STORE.snapshot(p);
  assert.equal(STORE.undo().settings.paper, '#ffffff'); assert.equal(STORE.redo().settings.paper, '#111111'); assert.equal(STORE.redo(), null);
});
test('autosave keys carry over from the Crayon Poser name on first load', async () => {
  const old = STORE.fresh('blank'); old.pages[0].name = 'Carried over';
  const app = await createApp({ plugins: false, storage: { 'crayon-poser/project': JSON.stringify(old), 'crayon-poser/dirty': '1' } });
  assert.equal(app.localStorage.getItem('storysketch/dirty'), '1');
  assert.equal(app.STORE.load().pages[0].name, 'Carried over');
  assert.ok(app.localStorage.getItem('crayon-poser/project'), 'old key kept, not deleted');
});
test('the new key wins over an old one', async () => {
  const app = await createApp({ plugins: false, storage: { 'crayon-poser/dirty': 'old', 'storysketch/dirty': 'new' } });
  assert.equal(app.localStorage.getItem('storysketch/dirty'), 'new');
});
test('starter cast comes from the character plugins and each is a complete look', () => {
  for (const c of STORE.starterCast()) { assert.ok(c.id && c.name); assert.ok(typeof c.accessories === 'object'); assert.equal(c.build !== undefined, true); }
  assert.ok(CP.characters.length >= 10);
});
test('new projects are one blank page by default', () => {
  const p = STORE.fresh(); assert.equal(p.pages.length, 1); assert.equal(p.pages[0].items.length, 0); assert.equal(STORE.fresh('blank').pages.length, 1);
  assert.equal(STORE.fresh('project:does-not-exist').pages.length, 1, 'unknown sample falls back to one blank page');
});
test('the sample projects are all there', () => {
  assert.equal(JSON.stringify(CP.projects.map((p) => p.id).sort()), JSON.stringify(['sample-airport', 'sample-animals', 'sample-chalkboard', 'sample-classroom', 'sample-home']));
  for (const sp of CP.projects) { assert.ok(sp.name && sp.description, sp.id); assert.ok(sp.pages.length >= 1); }
});
test('samples: every item in the file becomes a real item (nothing silently dropped), with a unique id', () => {
  for (const sp of CP.projects) {
    const p = STORE.fresh('project:' + sp.id);
    assert.equal(p.pages.length, sp.pages.length);
    sp.pages.forEach((pg, i) => assert.equal(p.pages[i].items.length, pg.items.length, `${sp.id} page ${i + 1}: an item was dropped (unknown cast, kind or type?)`));
    const ids = p.pages.flatMap((pg) => pg.items.map((it) => it.id)); assert.equal(new Set(ids).size, ids.length);
    for (const pg of p.pages) for (const it of pg.items) if (it.type === 'figure') assert.ok(p.cast.some((c) => c.id === it.cast), `${sp.id}: ${it.cast} is not in the cast`);
  }
});
test('samples: settings, cast and notes come through; they survive a save and reopen', () => {
  const p = STORE.fresh('project:sample-chalkboard');
  assert.equal(p.settings.style, 'chalk'); assert.equal(p.settings.paper, '#2b3a35'); assert.ok(p.pages[0].notes.length > 20);
  const dogs = STORE.fresh('project:sample-animals').cast.filter((c) => c.rig === 'quadruped'); assert.equal(dogs.length, 3);
  for (const id of CP.projects.map((x) => x.id)) { const q = STORE.fresh('project:' + id); const back = STORE.migrate(JSON.parse(STORE.serialize(q))); assert.equal(JSON.stringify(back.pages), JSON.stringify(q.pages)); }
});
test('samples: cast entries can be plugin characters or templates with overrides', () => {
  const cast = STORE.fresh('project:sample-animals').cast; const rex = cast.find((c) => c.id === 'rex'), mit = cast.find((c) => c.id === 'mittens');
  assert.equal(rex.name, 'Rex'); assert.equal(rex.build, 'dog'); assert.equal(mit.build, 'cat'); assert.equal(mit.color, '#8a8f98', 'override beats the template colour');
});
test('`floor` puts a figure\'s lowest point on the line, whatever the pose or size', () => {
  const { FIG, RENDER, CP } = app;
  for (const [pose, s] of [['stand', 1], ['sitread', 1], ['jump', 0.7], ['walk', 1.4]]) {
    CP.projects.push({ id: 'tmp', name: 'tmp', pages: [{ name: 'p', items: [{ type: 'figure', cast: 'lily', x: 100, floor: 600, s, pose }] }] });
    const p = STORE.fresh('project:tmp'); CP.projects.pop();
    const it = p.pages[0].items[0]; const c = p.cast.find((x) => x.id === 'lily');
    const b = RENDER.primsBBox(FIG.prims(c, it, 'main')); const bottom = it.y + (b.y1 - 2) * it.s;
    assert.ok(Math.abs(bottom - 600) <= 1.5, `${pose} x${s}: bottom at ${bottom}`);
  }
});
