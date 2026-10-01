'use strict';

let config = null;
let queue = [];            // { file, isVideo, previewUrl }
let objectiveId = null;
let lastRun = null;        // { meta, results } with live edits applied

const $ = id => document.getElementById(id);

// ─── Character counting (mirrors lib/copy-rules.js) ─────────────────────────

const WIDE_CHAR = /[ᄀ-ᅟ⺀-꓏가-힣豈-﫿︰-﹏＀-｠￠-￦]/u;

function countChars(text, mode) {
  const chars = Array.from(text || '');
  if (mode !== 'google') return chars.length;
  return chars.reduce((n, c) => n + (WIDE_CHAR.test(c) ? 2 : 1), 0);
}

function el(tag, attrs, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') node.className = v;
    else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v === true ? '' : v);
  }
  children.flat(Infinity).forEach(c => { if (c !== null && c !== undefined) node.append(c); });
  return node;
}

// ─── Setup ───────────────────────────────────────────────────────────────────

async function init() {
  try {
    const res = await fetch('/api/config');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    config = await res.json();
  } catch (e) {
    $('form-error').textContent = 'Could not load settings: ' + e.message;
    return;
  }
  $('max-files').textContent = config.maxCreatives;
  renderClients();
  renderPlatforms();
  renderObjectives();
  wireUpload();
  $('generate-btn').addEventListener('click', generate);
  $('copy-all-btn').addEventListener('click', e => copyText(allTsv(), e.currentTarget, 'Copy table for Sheets'));
  $('revise-btn').addEventListener('click', revise);
  $('undo-btn').addEventListener('click', undoRevision);
}

function renderClients() {
  const sel = $('client');
  sel.append(el('option', { value: '' }, 'Select a client...'));
  config.clients.forEach(c => sel.append(el('option', { value: c.id }, c.name)));
  sel.append(el('option', { value: 'custom' }, 'Other (not in database)'));
  sel.addEventListener('change', () => {
    const c = config.clients.find(x => x.id === sel.value);
    $('custom-client').hidden = sel.value !== 'custom';
    $('client-hint').textContent = c
      ? `${c.market} · ${c.example_count} approved copy sets used as a style reference.`
      : (sel.value === 'custom' ? 'No approved copy on file. Add brand notes below for a better match.' : '');
  });
}

function renderPlatforms() {
  const sel = $('platform');
  const groups = {};
  config.platforms.forEach(p => {
    if (!groups[p.group]) {
      groups[p.group] = el('optgroup', { label: p.group });
      sel.append(groups[p.group]);
    }
    groups[p.group].append(el('option', { value: p.id }, p.name));
  });
  sel.addEventListener('change', renderCounts);
  renderCounts();
}

function currentPlatform() {
  return config.platforms.find(p => p.id === $('platform').value);
}

function renderCounts() {
  const p = currentPlatform();
  $('platform-hint').textContent = p.summary;
  const wrap = $('counts');
  wrap.innerHTML = '';
  p.fields.forEach(f => {
    const input = el('input', {
      type: 'number', min: 0, max: f.maxCount, value: f.defaultCount,
      'data-field': f.key, 'aria-label': `Number of ${f.label} variations`
    });
    const minus = el('button', { type: 'button', 'aria-label': 'Fewer' }, '−');
    const plus = el('button', { type: 'button', 'aria-label': 'More' }, '+');
    const sync = () => {
      let v = parseInt(input.value, 10);
      if (isNaN(v)) v = 0;
      v = Math.max(0, Math.min(f.maxCount, v));
      input.value = v;
      minus.disabled = v <= 0;
      plus.disabled = v >= f.maxCount;
    };
    minus.addEventListener('click', () => { input.value = +input.value - 1; sync(); });
    plus.addEventListener('click', () => { input.value = +input.value + 1; sync(); });
    input.addEventListener('change', sync);
    sync();

    const slots = f.slots > 1 ? ` Platform takes up to ${f.slots} per ad.` : '';
    wrap.append(el('div', { class: 'count-row' },
      el('div', { class: 'count-info' },
        el('span', { class: 'count-label' }, f.label),
        el('span', { class: 'count-limit' }, `≤ ${f.limit} chars`),
        el('div', { class: 'count-note' }, f.note + slots)
      ),
      el('div', { class: 'stepper' }, minus, input, plus)
    ));
  });
}

function renderObjectives() {
  const wrap = $('objective-chips');
  config.objectives.forEach(o => {
    const chip = el('button', { type: 'button', class: 'chip', role: 'radio', 'aria-checked': 'false', 'data-id': o.id }, o.label);
    chip.addEventListener('click', () => {
      objectiveId = o.id;
      wrap.querySelectorAll('.chip').forEach(c => c.setAttribute('aria-checked', c === chip ? 'true' : 'false'));
    });
    wrap.append(chip);
  });
}

// ─── Upload queue ────────────────────────────────────────────────────────────

function wireUpload() {
  const dz = $('drop-zone');
  const input = $('file-input');
  dz.addEventListener('click', () => input.click());
  dz.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); } });
  dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('drag'); });
  dz.addEventListener('dragleave', () => dz.classList.remove('drag'));
  dz.addEventListener('drop', e => { e.preventDefault(); dz.classList.remove('drag'); addFiles(e.dataTransfer.files); });
  input.addEventListener('change', () => { addFiles(input.files); input.value = ''; });
}

function addFiles(fileList) {
  const room = config.maxCreatives - queue.length;
  Array.from(fileList)
    .filter(f => f.type.startsWith('image/') || f.type.startsWith('video/') || /\.(mp4|mov|webm|m4v)$/i.test(f.name))
    .slice(0, room)
    .forEach(f => {
      const isVideo = f.type.startsWith('video/') || /\.(mp4|mov|webm|m4v)$/i.test(f.name);
      queue.push({ file: f, isVideo, previewUrl: URL.createObjectURL(f) });
    });
  renderQueue();
}

function removeFile(i) {
  URL.revokeObjectURL(queue[i].previewUrl);
  queue.splice(i, 1);
  renderQueue();
}

function renderQueue() {
  $('queue').hidden = !queue.length;
  $('drop-zone').hidden = queue.length > 0;
  const strip = $('thumb-strip');
  strip.innerHTML = '';
  queue.forEach((item, i) => {
    const media = item.isVideo
      ? el('video', { src: item.previewUrl, muted: true, preload: 'metadata' })
      : el('img', { src: item.previewUrl, alt: item.file.name });
    strip.append(el('div', { class: 'thumb', title: item.file.name },
      media,
      el('span', { class: 'thumb-badge' }, item.isVideo ? 'VIDEO' : 'STATIC'),
      el('button', { type: 'button', class: 'thumb-remove', 'aria-label': 'Remove ' + item.file.name, onclick: () => removeFile(i) }, '×')
    ));
  });
  if (queue.length < config.maxCreatives) {
    strip.append(el('button', { type: 'button', class: 'thumb-add', onclick: () => $('file-input').click() }, '+ add more'));
  }
  const videos = queue.filter(q => q.isVideo).length;
  $('queue-note').textContent = `${queue.length} of ${config.maxCreatives} creatives. Each one gets its own copy set.`
    + (videos ? ' Videos are read from 6 key frames, like ROAST.' : '');
}

// ─── Generate ────────────────────────────────────────────────────────────────

function collectSettings() {
  const counts = {};
  document.querySelectorAll('#counts input[data-field]').forEach(i => { counts[i.dataset.field] = parseInt(i.value, 10) || 0; });
  return {
    clientId: $('client').value,
    customClient: { name: $('custom-name').value.trim(), notes: $('custom-notes').value.trim() },
    platformId: $('platform').value,
    objectiveId,
    counts,
    brief: $('brief').value.trim()
  };
}

function validate(s) {
  if (!s.clientId) return 'Choose a client.';
  if (s.clientId === 'custom' && !s.customClient.name) return 'Enter the brand name.';
  if (!s.objectiveId) return 'Choose an ad objective.';
  if (!Object.values(s.counts).some(n => n > 0)) return 'Request at least one variation.';
  if (!queue.length && !s.brief) return 'Upload a creative or write a brief (or both).';
  return '';
}

function setProgress(pct, label, isError) {
  $('progress').hidden = false;
  $('progress-bar').style.width = pct + '%';
  $('progress-label').textContent = label;
  $('progress-label').classList.toggle('error', !!isError);
}

// Reads a server-sent-events response; resolves with the "complete" payload.
async function readSse(res, onProgress) {
  if (!res.ok || !res.body) throw new Error('Server error: ' + res.status);
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const blocks = buffer.split('\n\n');
    buffer = blocks.pop();
    for (const block of blocks) {
      let event = 'message', data = '';
      block.split('\n').forEach(line => {
        if (line.startsWith('event: ')) event = line.slice(7).trim();
        else if (line.startsWith('data: ')) data += line.slice(6);
      });
      if (!data) continue;
      const payload = JSON.parse(data);
      if (event === 'progress') onProgress(payload);
      else if (event === 'error') throw new Error(payload.message);
      else if (event === 'complete') return payload;
    }
  }
  throw new Error('The connection closed before the copy was ready. Please try again.');
}

async function generate() {
  const settings = collectSettings();
  const problem = validate(settings);
  $('form-error').textContent = problem;
  if (problem) return;

  const btn = $('generate-btn');
  btn.disabled = true;
  btn.textContent = 'Generating...';
  $('results').hidden = true;
  setProgress(3, 'Uploading...');

  const form = new FormData();
  queue.forEach(q => form.append('files', q.file));
  form.append('settings', JSON.stringify(settings));
  // Own preview URLs so thumbnails survive later changes to the upload queue
  const thumbs = queue.map(q => ({ isVideo: q.isVideo, url: URL.createObjectURL(q.file) }));

  try {
    const res = await fetch('/api/generate', { method: 'POST', body: form });
    const payload = await readSse(res, p => setProgress(p.pct, p.label));
    setProgress(100, 'Done');
    if (lastRun) lastRun.thumbs.forEach(t => URL.revokeObjectURL(t.url));
    lastRun = { ...payload, settings, thumbs, feedback: [], history: [] };
    $('feedback').value = '';
    renderResults(true);
    setTimeout(() => { $('progress').hidden = true; }, 400);
  } catch (e) {
    thumbs.forEach(t => URL.revokeObjectURL(t.url));
    setProgress(100, 'Error: ' + e.message, true);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Generate ad copy';
  }
}

// ─── Results: one consolidated table ─────────────────────────────────────────
// Same shape as the Google Sheets paste: one row per creative, then
// Headline 1..n, Primary Text 1..n, Description 1..n across the columns.

function okResults() {
  return lastRun.results.filter(r => !r.error);
}

// Flattened column list, e.g. [{ key: 'headlines', label: 'Headline', n: 1, limit: 40 }, ...]
function tableColumns() {
  const ok = okResults();
  if (!ok.length) return [];
  const cols = [];
  ok[0].fields.forEach(f => {
    const width = Math.max(...ok.map(r => (r.fields.find(x => x.key === f.key) || { items: [] }).items.length));
    for (let n = 1; n <= width; n++) cols.push({ key: f.key, label: f.label, n, limit: f.limit });
  });
  return cols;
}

function renderResults(scroll) {
  const { meta, results } = lastRun;
  $('results-meta').textContent = `${meta.client} · ${meta.platform} · ${meta.objective} · ${results.length} creative${results.length > 1 ? 's' : ''}`;
  const cols = tableColumns();

  const head = el('tr', {},
    el('th', { class: 'col-creative', scope: 'col' }, 'Creative'),
    cols.map(c => el('th', { scope: 'col', class: c.n === 1 ? 'group-start' : null },
      `${c.label} ${c.n}`, el('span', { class: 'th-limit' }, `≤ ${c.limit}`)))
  );
  const body = results.map((r, i) => el('tr', {},
    el('th', { class: 'col-creative', scope: 'row' }, creativeCell(r, i)),
    r.error
      ? el('td', { class: 'row-error', colspan: Math.max(cols.length, 1) }, r.error)
      : cols.map(c => copyCell(r, c))
  ));

  const wrap = $('result-table');
  wrap.innerHTML = '';
  wrap.append(el('table', { class: 'copy-table' }, el('thead', {}, head), el('tbody', {}, body)));
  renderReads();
  renderFeedbackControls();
  $('results').hidden = false;
  if (scroll) $('results').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function creativeCell(r, i) {
  const thumb = lastRun.thumbs[i];
  let media;
  if (thumb && thumb.isVideo) media = el('video', { class: 'creative-thumb', src: thumb.url, muted: true, preload: 'metadata' });
  else if (thumb) media = el('img', { class: 'creative-thumb', src: thumb.url, alt: '' });
  else media = el('div', { class: 'creative-thumb placeholder' }, 'BRIEF');
  return el('div', { class: 'creative-cell' }, media,
    el('div', {},
      el('div', { class: 'creative-name' }, r.label),
      el('div', { class: 'creative-sub' }, thumb ? (thumb.isVideo ? 'Video' : 'Static') : 'From brief',
        r.round ? el('span', { class: 'revised-tag' }, `REVISED x${r.round}`) : null)
    ));
}

function copyCell(r, c) {
  const field = r.fields.find(f => f.key === c.key);
  const item = field && field.items[c.n - 1];
  if (!item) return el('td', { class: c.n === 1 ? 'group-start empty' : 'empty' }, '');
  const mode = lastRun.meta.countMode;
  const badge = el('span', { class: 'char-badge' });
  const paint = () => {
    const len = countChars(item.text, mode);
    badge.textContent = `${len}/${c.limit}`;
    badge.className = 'char-badge ' + (len <= c.limit ? 'ok' : 'over');
    badge.title = len <= c.limit ? 'Within the platform limit' : `Over the ${c.limit} character limit`;
  };
  const text = el('div', { class: 'copy-text', contenteditable: 'plaintext-only', spellcheck: 'true', role: 'textbox', 'aria-label': `${r.label}, ${c.label} ${c.n}` }, item.text);
  text.addEventListener('input', () => { item.text = text.textContent.replace(/\s*\n\s*/g, ' '); paint(); });
  paint();
  const copyBtn = el('button', { type: 'button', class: 'icon-btn', title: 'Copy this cell', 'aria-label': 'Copy' }, '⧉');
  copyBtn.addEventListener('click', () => copyText(tsvCell(item.text), copyBtn, '⧉', '✓'));
  return el('td', { class: [c.n === 1 ? 'group-start' : '', item.changed ? 'changed' : ''].join(' ').trim() || null, title: item.changed ? 'Changed in the last revision' : null },
    text,
    el('div', { class: 'cell-foot' }, item.angle ? el('span', { class: 'copy-angle' }, item.angle) : el('span'), el('span', { class: 'cell-tools' }, badge, copyBtn))
  );
}

// How Claude read each creative, tucked under the table.
function renderReads() {
  const list = $('read-list');
  list.innerHTML = '';
  okResults().forEach(r => {
    const read = r.creative_read;
    if (!read) return;
    const rows = [
      ['On-screen text', read.on_screen_text], ['Creative role', read.creative_role], ['Offer', read.offer],
      ['Audience', read.audience], ['Copy job', read.copy_job]
    ].filter(([, v]) => v);
    list.append(el('div', { class: 'read-item' },
      el('div', { class: 'read-name' }, r.label),
      el('dl', { class: 'read-grid' }, rows.map(([k, v]) => [el('dt', {}, k), el('dd', {}, v)]))
    ));
  });
  $('read-card').hidden = !list.children.length;
}

// ─── Feedback and revisions ──────────────────────────────────────────────────

function renderFeedbackControls() {
  const ok = lastRun.results.map((r, i) => ({ r, i })).filter(x => !x.r.error);
  const scope = $('feedback-scope');
  const prev = scope.value;
  scope.innerHTML = '';
  scope.append(el('option', { value: 'all' }, ok.length > 1 ? `All ${ok.length} creatives` : 'This creative'));
  if (ok.length > 1) ok.forEach(({ r, i }) => scope.append(el('option', { value: String(i) }, `Only: ${r.label}`)));
  if ([...scope.options].some(o => o.value === prev)) scope.value = prev;
  scope.hidden = ok.length < 2;

  const hist = $('feedback-history');
  hist.innerHTML = '';
  lastRun.feedback.forEach(f => hist.append(el('li', {}, f)));
  hist.hidden = !lastRun.feedback.length;
  $('undo-btn').hidden = !lastRun.history.length;
}

function setReviseStatus(text, isError) {
  $('revise-status').textContent = text;
  $('revise-status').classList.toggle('error', !!isError);
}

async function revise() {
  const note = $('feedback').value.trim();
  if (!note) { setReviseStatus('Write what you would like changed first.', true); return; }

  const scope = $('feedback-scope').value;
  const indexes = lastRun.results
    .map((r, i) => i)
    .filter(i => !lastRun.results[i].error && (scope === 'all' || String(i) === scope));
  const targets = indexes.map(i => {
    const r = lastRun.results[i];
    const current = {};
    r.fields.forEach(f => { current[f.key] = f.items.map(it => ({ text: it.text, angle: it.angle })); });
    return { index: i, label: r.label, isVideo: r.isVideo, creative_read: r.creative_read, current };
  });

  const btn = $('revise-btn');
  btn.disabled = true;
  btn.textContent = 'Revising...';
  setReviseStatus('Sending feedback...');
  const feedback = [...lastRun.feedback, note];

  try {
    const res = await fetch('/api/revise', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings: lastRun.settings, feedback, targets })
    });
    const payload = await readSse(res, p => setReviseStatus(p.label));

    lastRun.history.push({ results: JSON.parse(JSON.stringify(lastRun.results)), feedback: lastRun.feedback });
    const failed = [];
    lastRun.results.forEach(r => (r.fields || []).forEach(f => f.items.forEach(it => { it.changed = false; })));
    payload.results.forEach(nr => {
      const old = lastRun.results[nr.index];
      if (!old) return;
      if (nr.error) { failed.push(`${nr.label}: ${nr.error}`); return; }
      nr.fields.forEach(f => {
        const before = (old.fields.find(x => x.key === f.key) || { items: [] }).items;
        f.items.forEach((it, j) => { it.changed = !before[j] || before[j].text !== it.text; });
      });
      lastRun.results[nr.index] = { ...nr, round: (old.round || 0) + 1 };
    });
    lastRun.feedback = feedback;
    $('feedback').value = '';
    renderResults(false);
    setReviseStatus(failed.length ? 'Some creatives could not be revised. ' + failed.join(' ') : 'Revised. Changed cells are marked in green.', failed.length > 0);
  } catch (e) {
    setReviseStatus('Error: ' + e.message, true);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Revise copy';
  }
}

function undoRevision() {
  const prev = lastRun.history.pop();
  if (!prev) return;
  lastRun.results = prev.results;
  lastRun.feedback = prev.feedback;
  renderResults(false);
  setReviseStatus('Restored the previous version.');
}

// ─── TSV export for Google Sheets ───────────────────────────────────────────
// Sheets parses pasted plain text as TSV: tabs split columns, new lines split
// rows, a leading straight quote starts a quoted field (which can swallow the
// following cells), and a leading = + @ becomes a formula. tsvCell guards all
// of these so every line lands in exactly one cell, as text.

function tsvCell(s) {
  return String(s || '')
    .replace(/[\t\r\n]+/g, ' ')
    .replace(/(^|[\s(\[])"/g, '$1\u201C')
    .replace(/"/g, '\u201D')
    .replace(/^[=+@]+\s*/, '')
    .trim();
}

function tsvRow(cells) {
  return cells.map(tsvCell).join('\t');
}

// The table above as TSV: header row, then one row per creative.
function allTsv() {
  const cols = tableColumns();
  if (!cols.length) return '';
  const lines = [tsvRow(['Creative', ...cols.map(c => `${c.label} ${c.n}`)])];
  okResults().forEach(r => {
    lines.push(tsvRow([r.label, ...cols.map(c => {
      const f = r.fields.find(x => x.key === c.key);
      const item = f && f.items[c.n - 1];
      return item ? item.text : '';
    })]));
  });
  return lines.join('\n');
}

async function copyText(text, btn, label, doneLabel) {
  try {
    await navigator.clipboard.writeText(text);
  } catch (e) {
    const ta = el('textarea', { style: 'position:fixed;opacity:0' });
    ta.value = text;
    document.body.append(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }
  btn.textContent = doneLabel || 'Copied';
  btn.classList.add('done');
  setTimeout(() => { btn.textContent = label; btn.classList.remove('done'); }, 1400);
}

init();
