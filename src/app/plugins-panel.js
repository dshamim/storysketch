// Plugins panel: what is installed, problems, rescan.
// (Part of the editor; plain <script> files share globals and load in the order listed in index.html.)
// ---------- plugins panel ----------
const TYPE_LABEL = { hair: 'Hair styles', clothes: 'Clothes', accessory: 'Accessories', prop: 'Props', pose: 'Poses', template: 'Templates', character: 'Characters' };
function updatePluginBadge() {
  const n = CP.warnings.length; const b = $('#plug-badge');
  b.hidden = !n; b.textContent = n; $('#rail-addons').setAttribute('aria-label', n ? `Add-ons, ${n} problem${n === 1 ? '' : 's'}` : 'Add-ons');
}
function openPlugins() { setTab('tab-addons'); showFlyout(); } // from the menus: the Add-ons panel in the left flyout
function renderPlugins() {
  const counts = {}; for (const r of CP.loaded) counts[r.type] = (counts[r.type] || 0) + 1;
  $('#plug-intro').innerHTML = `Loaded from <code>plugins/</code> · plugin API <b>v${CP.API}</b> · ${CP.manifest ? CP.manifest.files.length + ' files in the index' : '<b>no index found</b>'}.`;
  $('#plug-summary').innerHTML = '<div class="plug-chips">' + Object.entries(TYPE_LABEL).map(([t, l]) => `<span class="chip"><b>${counts[t] || 0}</b> ${l}</span>`).join('') + '</div>';
  $('#plug-warn').innerHTML = CP.warnings.length ? `<p class="warn"><b>${CP.warnings.length} problem${CP.warnings.length === 1 ? '' : 's'}</b> — these were not loaded:<br>${CP.warnings.map((w) => '• ' + U.esc(w)).join('<br>')}</p>` : '<p class="muted small">No problems.</p>';
  $('#plug-list').innerHTML = CP.loaded.slice().sort((a, b) => a.type.localeCompare(b.type) || String(a.name).localeCompare(b.name)).map((r) =>
    `<div class="plug-row" title="${U.esc(r.file)}"><span class="plug-name">${U.esc(r.name)}</span><span class="plug-meta">${U.esc(TYPE_LABEL[r.type] || r.type)} · <code>${U.esc(r.id)}</code>${r.version ? ' · v' + U.esc(r.version) : ''}</span></div>`).join('');
}
async function rescanPlugins() {
  if (!STORAGE.current.supported) { $('#plug-status').textContent = 'This browser can\'t write files — run python3 tools/build_plugins.py, then reload the page.'; return; }
  try {
    $('#plug-status').textContent = 'Scanning…';
    const n = await CP.rescan(); if (n == null) { $('#plug-status').textContent = ''; return; }
    try { localStorage.setItem('storysketch/project', JSON.stringify(app.P)); } catch (e) { /* ignore */ }
    $('#plug-status').textContent = `Index rebuilt (${n} files). Reloading…`; setTimeout(() => location.reload(), 700);
  } catch (e) { $('#plug-status').textContent = 'Refresh failed: ' + e.message; }
}
