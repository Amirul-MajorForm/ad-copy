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
  $('copy-all-btn').addEventListener('click', e => copyText(allTsv(), e.currentTarget, 'Copy all for Sheets'));
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

  try {
    const res = await fetch('/api/generate', { method: 'POST', body: form });
    if (!res.ok || !res.body) throw new Error('Server error: ' + res.status);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let finished = false;

    while (!finished) {
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
        if (event === 'progress') setProgress(payload.pct, payload.label);
        else if (event === 'error') throw new Error(payload.message);
        else if (event === 'complete') {
          finished = true;
          setProgress(100, 'Done');
          lastRun = payload;
          renderResults();
          setTimeout(() => { $('progress').hidden = true; }, 400);
        }
      }
    }
    if (!finished) throw new Error('The connection closed before the copy was ready. Please try again.');
  } catch (e) {
    setProgress(100, 'Error: ' + e.message, true);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Generate ad copy';
  }
}

// ─── Results ─────────────────────────────────────────────────────────────────

function renderResults() {
  const { meta, results } = lastRun;
  $('results-meta').textContent = `${meta.client} · ${meta.platform} · ${meta.objective}`;
  const tabs = $('result-tabs');
  const panels = $('result-panels');
  tabs.innerHTML = '';
  panels.innerHTML = '';
  tabs.hidden = results.length < 2;

  results.forEach((r, i) => {
    const tab = el('button', { type: 'button', class: 'tab', role: 'tab', 'aria-selected': i === 0 ? 'true' : 'false' },
      (r.isVideo ? '▶ ' : '') + r.label);
    tab.addEventListener('click', () => selectTab(i));
    tabs.append(tab);
    const panel = el('div', { class: 'panel', role: 'tabpanel' }, r.error ? el('div', { class: 'error-card' }, `${r.label}: ${r.error}`) : buildPanel(r));
    panel.hidden = i !== 0;
    panels.append(panel);
  });

  $('results').hidden = false;
  $('results').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function selectTab(i) {
  document.querySelectorAll('#result-tabs .tab').forEach((t, j) => t.setAttribute('aria-selected', j === i ? 'true' : 'false'));
  document.querySelectorAll('#result-panels .panel').forEach((p, j) => { p.hidden = j !== i; });
}

function buildPanel(r) {
  const frag = document.createDocumentFragment();
  const read = r.creative_read;
  if (read) {
    const rows = [
      ['On-screen text', read.on_screen_text], ['Creative role', read.creative_role], ['Offer', read.offer],
      ['Audience', read.audience], ['Copy job', read.copy_job]
    ].filter(([, v]) => v);
    frag.append(el('div', { class: 'read-card' },
      el('div', { class: 'read-title' }, 'How the creative was read'),
      el('dl', { class: 'read-grid' }, rows.map(([k, v]) => [el('dt', {}, k), el('dd', {}, v)]))
    ));
  }
  r.fields.forEach(f => frag.append(buildFieldCard(r, f)));
  return frag;
}

function buildFieldCard(r, f) {
  const mode = lastRun.meta.countMode;
  const rows = f.items.map((item, i) => {
    const badge = el('span', { class: 'char-badge' });
    const paint = () => {
      const n = countChars(item.text, mode);
      badge.textContent = `${n}/${f.limit}`;
      badge.className = 'char-badge ' + (n <= f.limit ? 'ok' : 'over');
      badge.title = n <= f.limit ? 'Within the platform limit' : `Over the ${f.limit} character limit`;
    };
    const text = el('div', { class: 'copy-text', contenteditable: 'plaintext-only', spellcheck: 'true', role: 'textbox', 'aria-label': `${f.label} ${i + 1}` }, item.text);
    text.addEventListener('input', () => { item.text = text.textContent.replace(/\s*\n\s*/g, ' '); paint(); });
    paint();
    const copyBtn = el('button', { type: 'button', class: 'icon-btn', title: 'Copy', 'aria-label': 'Copy line' }, '⧉');
    copyBtn.addEventListener('click', () => copyText(tsvCell(item.text), copyBtn, '⧉', '✓'));
    return el('div', { class: 'copy-row' },
      el('span', { class: 'copy-num' }, String(i + 1)),
      el('div', { class: 'copy-body' }, text, item.angle ? el('div', { class: 'copy-angle' }, item.angle) : null),
      el('div', { class: 'copy-side' }, badge, copyBtn)
    );
  });

  const tsvBtn = el('button', { type: 'button', class: 'ghost-btn' }, 'Copy for Sheets');
  tsvBtn.addEventListener('click', () => copyText(fieldTsv(f.key), tsvBtn, 'Copy for Sheets'));

  return el('div', { class: 'field-card' },
    el('div', { class: 'field-card-head' },
      el('div', { class: 'field-card-title' }, f.label, el('span', { class: 'count-limit' }, `≤ ${f.limit} chars`)),
      el('div', { class: 'field-card-actions' }, tsvBtn)
    ),
    rows
  );
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

function okResults() {
  return lastRun.results.filter(r => !r.error);
}

// One table per field: a header row, then one row per creative.
function fieldTsv(key) {
  const ok = okResults();
  const fields = ok.map(r => r.fields.find(f => f.key === key)).filter(Boolean);
  if (!fields.length) return '';
  const label = fields[0].label;
  const width = Math.max(...fields.map(f => f.items.length));
  const lines = [tsvRow(['Creative', ...Array.from({ length: width }, (_, i) => `${label} ${i + 1}`)])];
  ok.forEach(r => {
    const f = r.fields.find(x => x.key === key);
    if (f) lines.push(tsvRow([r.label, ...f.items.map(it => it.text)]));
  });
  return lines.join('\n');
}

// One row per creative with every field side by side, in the same column
// order as the activation sheet: Headline 1..n, Primary Text 1..n, Description 1..n.
function allTsv() {
  const ok = okResults();
  if (!ok.length) return '';
  const columns = ok[0].fields.map(f => ({
    key: f.key,
    label: f.label,
    width: Math.max(...ok.map(r => (r.fields.find(x => x.key === f.key) || { items: [] }).items.length))
  }));
  const header = ['Creative'];
  columns.forEach(c => { for (let i = 1; i <= c.width; i++) header.push(`${c.label} ${i}`); });
  const lines = [tsvRow(header)];
  ok.forEach(r => {
    const row = [r.label];
    columns.forEach(c => {
      const items = (r.fields.find(x => x.key === c.key) || { items: [] }).items;
      for (let i = 0; i < c.width; i++) row.push(items[i] ? items[i].text : '');
    });
    lines.push(tsvRow(row));
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
