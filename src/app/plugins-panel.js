// Plugins panel: what is installed, problems, rescan.
// (Part of the editor; plain <script> files share globals and load in the order listed in index.html.)
// ---------- plugins panel ----------
const TYPE_LABEL = { hair: 'Hair styles', clothes: 'Clothes', accessory: 'Accessories', prop: 'Props', pose: 'Poses', template: 'Templates', character: 'Characters' };
function updatePluginBadge() {
  const n = CP.warnings.length; const b = $('#plug-badge');
  b.hidden = !n; b.textContent = n; $('#open-plugins').setAttribute('aria-label', n ? `Add-ons, ${n} problem${n === 1 ? '' : 's'}` : 'Add-ons');
}
function openPlugins() {
  const counts = {}; for (const r of CP.loaded) counts[r.type] = (counts[r.type] || 0) + 1;
  $('#plug-intro').innerHTML = `Loaded from <code>plugins/</code> · plugin API <b>v${CP.API}</b> · ${CP.manifest ? CP.manifest.files.length + ' files in the index' : '<b>no index found</b>'}.`;
  $('#plug-summary').innerHTML = '<div class="row">' + Object.entries(TYPE_LABEL).map(([t, l]) => `<span class="chip"><b>${counts[t] || 0}</b> ${l}</span>`).join('') + '</div>';
  $('#plug-warn').innerHTML = CP.warnings.length ? `<p class="warn"><b>${CP.warnings.length} problem${CP.warnings.length === 1 ? '' : 's'}</b> — these were not loaded:<br>${CP.warnings.map((w) => '• ' + U.esc(w)).join('<br>')}</p>` : '<p class="muted small">No problems.</p>';
  $('#plug-list').innerHTML = '<table><tr><th>Type</th><th>Name</th><th>id</th><th>Version</th><th>File</th></tr>' +
    CP.loaded.slice().sort((a, b) => a.type.localeCompare(b.type) || String(a.name).localeCompare(b.name)).map((r) => `<tr><td>${U.esc(r.type)}</td><td>${U.esc(r.name)}</td><td><code>${U.esc(r.id)}</code></td><td>${U.esc(r.version || '')}</td><td>${U.esc(r.file)}</td></tr>`).join('') + '</table>';
  $('#plug-status').textContent = ''; $('#plugins').showModal();
}
async function rescanPlugins() {
  if (!STORAGE.current.supported) { $('#plug-status').textContent = 'This browser can\'t write files — run python3 tools/build_plugins.py, then refresh.'; return; }
  try {
    $('#plug-status').textContent = 'Scanning…';
    const n = await CP.rescan(); if (n == null) { $('#plug-status').textContent = ''; return; }
    try { localStorage.setItem('storysketch/project', JSON.stringify(app.P)); } catch (e) { /* ignore */ }
    $('#plug-status').textContent = `Index rebuilt (${n} files). Reloading…`; setTimeout(() => location.reload(), 700);
  } catch (e) { $('#plug-status').textContent = 'Rescan failed: ' + e.message; }
}
