// Project files: file version tracking, in-app dialogs, Save / Save as / Open, applying a loaded file.
// (Part of the editor; plain <script> files share globals and load in the order listed in index.html.)
// ---------- project files ----------
const suggestedName = () => STORAGE.current.name || `storysketch-${new Date().toISOString().slice(0, 10)}.json`;
// ---- file version tracking ----
const PLUGIN_REG = { hair: () => CP.hair, clothes: () => CP.clothes, accessory: () => CP.accessories, prop: () => CP.props, addon: () => CP.addons };
const TYPE_NAME = { hair: 'Hair', clothes: 'Clothes', accessory: 'Accessory', prop: 'Prop', addon: 'Add-on', style: 'Style' };
// which plugins (and versions) this book uses — recorded in every saved file
function pluginsUsed(P) {
  const prev = new Map((P.plugins || []).map((r) => [r.type + ':' + r.id, r])); const used = new Map();
  const add = (type, id) => {
    if (EMPTY_SLOT.has(id) || (type === 'hair' && id === 'none')) return;
    const d = PLUGIN_REG[type]()[id]; const old = prev.get(type + ':' + id);
    used.set(type + ':' + id, { type, id, name: d?.name || old?.name || id, version: d ? (d.version || '') : (old?.version || '') });
  };
  for (const c of P.cast) { add('hair', c.hair); add('clothes', c.body); for (const id of Object.keys(c.accessories || {})) add('accessory', id); }
  for (const pgx of P.pages) for (const it of pgx.items) if (it.type === 'prop') {
    add('prop', it.kind); const def = CP.props[it.kind];
    for (const sl of def?.slots || []) add('addon', it.params?.[sl.key] ?? sl.def);
  }
  return [...used.values()].sort((a, b) => a.type.localeCompare(b.type) || a.id.localeCompare(b.id));
}
function pluginIssues(recorded) {
  const out = [];
  for (const r of recorded || []) {
    const reg = PLUGIN_REG[r.type]; if (!reg) continue; const d = reg()[r.id];
    if (!d) out.push(`${TYPE_NAME[r.type]} <b>${U.esc(r.name || r.id)}</b>${r.version ? ` v${U.esc(r.version)}` : ''} — not installed (shows as a placeholder)`);
    else if (r.version && (d.version || '') !== r.version) out.push(`${TYPE_NAME[r.type]} <b>${U.esc(d.name || r.id)}</b> — book made with v${U.esc(r.version)}, you have v${U.esc(d.version || '?')} (may look slightly different)`);
  }
  return out;
}
function setFileInfo(fi, upgradePending) {
  app.fileInfo = fi; app.upgradePending = !!upgradePending;
  try { localStorage.setItem('storysketch/fileinfo', JSON.stringify({ fi, upgradePending: app.upgradePending })); } catch (e) { /* ignore */ }
  setDirty(app.dirty);
}
function askUpgrade() {
  return new Promise((res) => {
    const d = $('#upgradedlg'); const fi = app.fileInfo || {};
    $('#upgrade-msg').innerHTML = `<b>${U.esc(STORAGE.current.name)}</b> was saved by StorySketch v${U.esc(fi.appVersion || '?')} (file format ${fi.schema ?? '?'}). This version uses format ${APP.schema}.`;
    d.returnValue = ''; d.addEventListener('close', () => res(d.returnValue || 'cancel'), { once: true }); d.showModal();
  });
}
// About and the "opened a file" report are a card in the corner, not a modal: the page stays usable while it is shown
function showBookInfo(title, html) { const d = $('#bookinfo'); $('#bookinfo-title').textContent = title; $('#bookinfo-body').innerHTML = html; if (d.open) d.close(); d.show(); }

// After a refresh Chrome needs a fresh OK to write the remembered file. Ask from our own dialog so the
// click that triggers Chrome's prompt is a direct user gesture (otherwise the prompt can silently fail).
// Resolves 'granted' | 'saveas' | 'cancel'.
function askWritePermission() {
  return new Promise((res) => {
    const d = $('#permdlg'); const err = $('#perm-err'); err.hidden = true;
    $('#perm-msg').innerHTML = `Save will overwrite <b>${U.esc(STORAGE.current.name)}</b>.`;
    const done = (v) => { d.removeEventListener('click', onClick); d.removeEventListener('cancel', onCancel); d.close(); res(v); };
    const onCancel = (e) => { e.preventDefault(); done('cancel'); };
    const onClick = async (e) => {
      const b = e.target.closest('[data-perm]'); if (!b) return;
      if (b.dataset.perm === 'allow') {
        const ok = await STORAGE.current.requestWrite(); // called directly from this click
        if (ok) return done('granted');
        err.hidden = false; err.textContent = 'Chrome did not allow editing the file. Use "Save as a new file…" (you can pick the same file to replace it).';
      } else done(b.dataset.perm);
    };
    d.addEventListener('click', onClick); d.addEventListener('cancel', onCancel); d.showModal();
  });
}

// ---------- in-app dialogs ----------
// Used instead of alert()/confirm(): if Chrome was ever told to block this page's pop-ups, those return
// instantly and show nothing, so an error would look like "nothing happened".
let msgDone = null;
function uiDialog(title, html, buttons) {
  if (msgDone) msgDone('superseded', true);
  return new Promise((res) => {
    const d = $('#msgdlg');
    $('#msg-title').textContent = title; $('#msg-body').innerHTML = html;
    $('#msg-buttons').innerHTML = buttons.map((b) => `<button type="button" data-v="${b.value}" class="${b.primary ? 'primary' : ''}">${U.esc(b.label)}</button>`).join('');
    const finish = (v, keepOpen) => { d.removeEventListener('click', onClick); d.removeEventListener('cancel', onCancel); msgDone = null; if (!keepOpen && d.open) d.close(); res(v); };
    const onClick = (e) => { const b = e.target.closest('[data-v]'); if (b) finish(b.dataset.v); };
    const onCancel = (e) => { e.preventDefault(); finish('cancel'); };
    msgDone = finish; d.addEventListener('click', onClick); d.addEventListener('cancel', onCancel); if (!d.open) d.showModal();
  });
}
const uiAlert = (title, msg) => uiDialog(title, `<p>${U.esc(msg)}</p>`, [{ value: 'ok', label: 'OK', primary: true }]);
const uiConfirm = async (title, msg, ok = 'OK') => (await uiDialog(title, `<p>${U.esc(msg)}</p>`, [{ value: 'ok', label: ok, primary: true }, { value: 'cancel', label: 'Cancel' }])) === 'ok';

// ---------- Save ----------
// Save shows its progress on the button, names the step if one is slow (watchdog), and reports errors in
// our own dialog. Each step is also logged to the console as "[save] …".
const SAVE_STEP = { perm: 'checking permission to edit the file', ask: 'waiting for you to allow editing the file', peek: 'reading the file to check its format', upgrade: 'waiting for your choice about the older file', write: 'writing the file', picker: 'waiting for the Save as window' };
const WAITS_ON_USER = new Set(['ask', 'upgrade', 'picker']); // no watchdog while a dialog is waiting for you
const SAVE_SLOW_MS = 4000;
let saveRun = null;
function setSaveButtons(state) {
  const st = $('#save-state');
  for (const id of ['#save', '#saveas']) $(id).disabled = state === 'busy';
  if (state === 'busy') { st.hidden = false; st.textContent = 'Saving…'; st.className = 'ui-badge accent'; return; }
  setDirty(app.dirty); // back to "Saved ✓" / "Unsaved ●"
}
// Chrome stopped answering about the remembered file (happens after a refresh on some setups): pick it again once.
function askRepick() {
  const nm = U.esc(STORAGE.current.name);
  return uiDialog('Choose the file once more',
    `<p>After the page was refreshed, Chrome stopped answering about <b>${nm}</b>, so the tool can't write to it directly.</p>` +
    `<p>Click <b>Choose file…</b>. The Save window opens with the name <b>${nm}</b>: click <b>Save</b>, then <b>Yes</b> to replace it. Saves after that go straight to the file again.</p>`,
    [{ value: 'pick', label: 'Choose file…', primary: true }, { value: 'cancel', label: 'Cancel' }]);
}
async function saveProject(asNew = false) {
  if (saveRun) { toast('Still saving — please wait'); return; }
  const run = saveRun = { step: '', t: Date.now(), limit: SAVE_SLOW_MS, warned: false };
  const live = () => saveRun === run; // false once abandoned (you chose Save as while this one was stuck)
  const step = (k) => { run.step = k; run.t = Date.now(); console.info('[save] ' + SAVE_STEP[k]); };
  setSaveButtons('busy');
  run.dog = setInterval(async () => {
    if (!live() || run.warned || WAITS_ON_USER.has(run.step) || Date.now() - run.t < run.limit) return;
    run.warned = true; console.warn('[save] slow: still ' + SAVE_STEP[run.step]);
    const c = await uiDialog('Saving is taking a long time',
      `<p>Still <b>${SAVE_STEP[run.step]}</b> after ${Math.round((Date.now() - run.t) / 1000)} seconds.</p>` +
      `<p class="muted small">If Chrome is showing a prompt near the address bar, answer it. Otherwise save a copy with <b>Save as</b>; you can pick the same file to replace it.</p>`,
      [{ value: 'saveas', label: 'Save as a new file…', primary: true }, { value: 'wait', label: 'Keep waiting' }]);
    if (!live() || c === 'superseded') return;
    if (c === 'saveas') { clearInterval(run.dog); saveRun = null; setSaveButtons('idle'); saveProject(true); }
    else { run.warned = false; run.t = Date.now(); run.limit = 10000; }
  }, 400);
  let ok = false, failed = null, repick = false;
  try {
    flushCommit(); const rev = app.rev;
    if (!asNew && STORAGE.current.name) {
      step('perm');
      const pm = await STORAGE.current.permission();
      if (pm === 'stale') { step('ask'); const r = await askRepick(); if (!live() || r !== 'pick') return; asNew = true; repick = true; }
      else if (pm !== 'granted') {
        step('ask'); const r = await askWritePermission(); if (!live() || r === 'cancel') return; if (r === 'saveas') asNew = true;
      }
    }
    // an older-format file is never overwritten without asking
    if (!asNew && STORAGE.current.name) {
      let ask = app.upgradePending;
      if (!ask) { step('peek'); const pk = await STORAGE.current.peek(); if (!live()) return; if (pk && pk.schema < APP.schema) { app.fileInfo = { ...(app.fileInfo || {}), appVersion: pk.appVersion || '?', schema: pk.schema }; ask = true; } }
      if (ask) { step('upgrade'); const c = await askUpgrade(); if (!live() || c === 'cancel') return; if (c === 'new') asNew = true; }
    }
    const plugins = pluginsUsed(app.P);
    const text = STORE.serialize(app.P, { plugins });
    step(asNew || !STORAGE.current.name || !STORAGE.current.supported ? 'picker' : 'write');
    const name = asNew ? await STORAGE.current.saveAs(text, repick ? STORAGE.current.name : suggestedName()) : await STORAGE.current.save(text, suggestedName());
    if (!live() || !name) return; // abandoned, or the Save as window was cancelled
    app.P.plugins = plugins;
    setFileInfo({ appVersion: APP.version, schema: APP.schema, savedAt: new Date().toISOString(), plugins: plugins.length }, false);
    setDirty(app.rev !== rev); // an edit made while saving keeps the book marked unsaved
    ok = true; console.info('[save] done: ' + name);
    toast(STORAGE.current.supported ? `Saved to ${name}` : `Downloaded ${name}`);
  } catch (e) {
    failed = e; console.error('[save] failed while ' + (SAVE_STEP[run.step] || 'starting'), e);
  } finally {
    clearInterval(run.dog);
    if (live()) { saveRun = null; setSaveButtons(ok ? 'done' : 'idle'); if (run.warned && msgDone) msgDone('done'); }
  }
  if (failed && !saveRun) {
    const c = await uiDialog('Could not save', `<p>Saving stopped while <b>${SAVE_STEP[run.step] || 'starting'}</b>:</p><p class="warn">${U.esc((failed.name ? failed.name + ': ' : '') + failed.message)}</p><p class="muted small">Your work is still here, and it is autosaved in this browser. Save as writes a copy; you can pick the same file to replace it.</p>`,
      [{ value: 'saveas', label: 'Save as a new file…', primary: true }, { value: 'close', label: 'Close' }]);
    if (c === 'saveas') saveProject(true);
  }
}
function applyLoaded(text, label) {
  const raw = JSON.parse(text); const fromSchema = raw.schema || 1; const savedBy = raw.appVersion || '?';
  const recorded = Array.isArray(raw.plugins) ? raw.plugins : null;
  const P = STORE.migrate(raw); app.page = 0; app.sel = []; restore(P); STORE.snapshot(app.P);
  setFileInfo({ appVersion: savedBy, schema: fromSchema, savedAt: raw.savedAt || '', plugins: recorded ? recorded.length : null }, fromSchema < APP.schema);
  const issues = recorded ? pluginIssues(recorded) : [];
  const upgraded = fromSchema < APP.schema ? `<p>Saved by v${U.esc(savedBy)} in file format ${fromSchema} — upgraded to format ${APP.schema} for editing. The file itself is unchanged until you save; the first Save will ask whether to keep it and save a new file.</p>` : '';
  if (issues.length || upgraded) showBookInfo(`Opened ${label}`, upgraded + (issues.length ? `<p><b>Plugins this book uses that differ here:</b></p><ul>${issues.map((i) => `<li>${i}</li>`).join('')}</ul>` : ''));
  else toast(`Opened ${label} (saved by v${savedBy})`);
}
async function openProject() {
  if (app.dirty && !await uiConfirm('Unsaved changes', 'You have unsaved changes. Open another project anyway?', 'Open anyway')) return;
  if (!STORAGE.current.supported) return $('#load-file').click();
  try { const r = await STORAGE.current.open(); if (!r) return; applyLoaded(r.text, r.name); await r.commit(); setDirty(false); }
  catch (e) { console.error('[open] failed', e); uiAlert('Could not open', e.message); }
}
function loadProject(file) {
  const r = new FileReader(); r.onload = () => { try { applyLoaded(r.result, file.name); } catch (e) { uiAlert('Could not load', e.message); } }; r.readAsText(file);
}
