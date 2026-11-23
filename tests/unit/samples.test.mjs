// Every sample project only uses things that exist (a typo would otherwise show only as a "?" placeholder on the page), with valid option values.
import test from 'node:test'; import assert from 'node:assert/strict';
import { deepEqual } from 'node:assert'; // loose: arrays made inside the vm have another prototype
import fs from 'node:fs'; import path from 'node:path';
import { createApp, ROOT } from '../helpers/sandbox.mjs';

const { CP, STORE } = await createApp();
const files = fs.readdirSync(path.join(ROOT, 'plugins/projects')).filter((f) => f.endsWith('.json'));

test('the sample projects on disk are all registered', () => { deepEqual(CP.projects.map((p) => p.id).sort(), files.map((f) => JSON.parse(fs.readFileSync(path.join(ROOT, 'plugins/projects', f), 'utf8')).id).sort()); });
for (const f of files) {
  const sp = JSON.parse(fs.readFileSync(path.join(ROOT, 'plugins/projects', f), 'utf8'));
  test(`${sp.id}: every character, prop, option value and picture it uses exists`, () => {
    const cast = new Set((sp.cast || []).map((c) => (typeof c === 'string' ? c : c.id)));
    for (const [i, pg] of sp.pages.entries()) for (const it of pg.items || []) {
      const where = `${sp.id} page ${i + 1} ${it.kind || it.cast || it.type}`;
      if (it.type === 'figure') { assert.ok(cast.has(it.cast), `${where}: character not in the cast`); assert.ok(CP.poses.some((p) => p.id === (it.pose || 'stand')), `${where}: unknown pose "${it.pose}"`); continue; }
      if (it.type !== 'prop') continue;
      const d = CP.props[it.kind]; assert.ok(d, `${where}: unknown prop`);
      for (const [k, v] of Object.entries(it.params || {})) {
        const q = (d.params || []).find((r) => r.key === k); const slot = (d.slots || []).find((s) => s.key === k);
        if (slot) { assert.ok(v === 'none' || (CP.addons[v] && CP.addons[v].kind === slot.kind), `${where}: picture "${v}" does not fit "${k}"`); continue; }
        assert.ok(q, `${where}: no option called "${k}"`);
        if (q.type === 'select') assert.ok(Object.keys(q.options).map(String).includes(String(v)), `${where}: "${v}" is not a choice of "${k}"`);
        if (q.type === 'toggle') assert.equal(typeof v, 'boolean', `${where}: "${k}" is on or off`);
        if (q.type === 'range') assert.ok(v >= q.min && v <= q.max, `${where}: "${k}" ${v} is outside ${q.min}-${q.max}`);
      }
    }
  });
  test(`${sp.id}: opens with every item it lists (nothing silently dropped)`, () => {
    const P = STORE.fresh('project:' + sp.id); sp.pages.forEach((pg, i) => assert.equal(P.pages[i].items.length, (pg.items || []).length, `${sp.id} page ${i + 1}`));
  });
}
