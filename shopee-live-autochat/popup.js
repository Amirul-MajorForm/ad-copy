const FIELDS = ['sheetUrl', 'intervalMinutes', 'jitterMinutes', 'generalEvery', 'liveDurationMinutes', 'productTips', 'tipDelaySeconds', 'productMessages', 'generalMessages', 'countdownMessages'];
const $ = (id) => document.getElementById(id);
const send = (msg) => chrome.runtime.sendMessage(msg);
// Client name comes from the manifest name, e.g. "Shopee Live Auto Chat (Sebamed)".
const clientMatch = chrome.runtime.getManifest().name.match(/\((.+)\)$/);
$('client').textContent = clientMatch ? clientMatch[1] : '';

// Message boxes that come from the Google Sheet while one is connected.
const SHEET_FIELDS = ['generalMessages', 'countdownMessages'];

async function save() {
  const values = {};
  for (const f of FIELDS) {
    if ($(f).readOnly) continue;
    values[f] = $(f).type === 'number' ? Number($(f).value) : $(f).value.trim();
  }
  // Keep following the built-in sheet link (so updates can change it) unless it was changed here.
  for (const key of ['sheetUrl']) {
    if (values[key] === DEFAULT_SETTINGS[key]) {
      delete values[key];
      await chrome.storage.local.remove(key);
    }
  }
  await chrome.storage.local.set(values);
}

async function render() {
  const s = { ...DEFAULT_SETTINGS, ...(await chrome.storage.local.get(null)) };
  $('toggle').textContent = s.running ? 'Stop' : 'Start';
  const status = $('status');
  status.className = s.running ? 'on' : '';
  status.textContent = s.running
    ? 'Running' + (s.nextAt ? `, next message at ${new Date(s.nextAt).toLocaleTimeString()}` : '')
    : 'Stopped';

  $('log').innerHTML = '';
  for (const e of s.log || []) {
    const div = document.createElement('div');
    div.className = e.ok ? '' : 'bad';
    div.textContent = `${e.time} ${e.ok ? '✓' : '✗'} ${e.pin ? '[pin] ' : ''}${e.text}${e.error ? ' (' + e.error + ')' : ''}`;
    $('log').appendChild(div);
  }
}

async function loadForm() {
  const res = await send({ type: 'getEffective' }).catch(() => null);
  const s = res ? res.settings : { ...DEFAULT_SETTINGS, ...(await chrome.storage.local.get(FIELDS)) };
  for (const f of FIELDS) $(f).value = s[f];
  showSheet(res && res.sheet);
  showTipsSheet(res && res.sheet && res.sheet.tips);
}

function ago(time) {
  const mins = Math.round((Date.now() - time) / 60000);
  return mins < 1 ? 'just now' : mins === 1 ? '1 min ago' : `${mins} min ago`;
}

function showSheet(sheet) {
  const fromSheet = !!(sheet && sheet.active);
  for (const f of SHEET_FIELDS) $(f).readOnly = fromSheet;
  document.querySelectorAll('.from-sheet').forEach((e) => (e.hidden = !fromSheet));
  const status = $('sheetStatus');
  const problems = $('sheetProblems');
  problems.innerHTML = '';
  status.className = 'hint';
  if (!sheet || !sheet.url) {
    status.textContent = 'No sheet connected: the messages below are used.';
    return;
  }
  if (fromSheet) {
    const sale = !sheet.sale
      ? 'No sale on and no Everyday row: built-in messages used'
      : sheet.sale.name || 'No sale on: Everyday row';
    status.textContent = `Messages from Google Sheet · ${sale} · read ${ago(sheet.fetchedAt)}`;
  } else {
    status.textContent = 'Sheet not read yet.';
  }
  if (sheet.error) {
    const div = document.createElement('div');
    div.className = 'bad';
    div.textContent = sheet.error + (fromSheet ? ' Using the last copy read.' : ' Using the messages below.');
    problems.appendChild(div);
  }
  for (const w of sheet.warnings || []) {
    const div = document.createElement('div');
    div.className = 'bad';
    div.textContent = w;
    problems.appendChild(div);
  }
}

function showTipsSheet(tips) {
  const fromSheet = !!(tips && tips.active);
  $('productTips').readOnly = fromSheet;
  document.querySelectorAll('.from-tips').forEach((e) => (e.hidden = !fromSheet));
  const status = $('tipsStatus');
  const problems = $('tipsProblems');
  problems.innerHTML = '';
  if (!tips || !tips.url) {
    status.textContent = '';
    return;
  }
  status.textContent = fromSheet
    ? `Product tips: ${tips.count} from the "${tips.tab}" tab · read ${ago(tips.fetchedAt)}`
    : `Product tips: "${tips.tab}" tab not read yet, so the tips below are used.`;
  for (const text of [tips.error && tips.error + (fromSheet ? ' Using the last copy read.' : ''), ...(tips.warnings || [])]) {
    if (!text) continue;
    const div = document.createElement('div');
    div.className = 'bad';
    div.textContent = text;
    problems.appendChild(div);
  }
}

// Preview: everything that will be posted today, from the boxes as loaded.
function previewSection(title, lines, note) {
  const box = $('preview');
  const h = document.createElement('h2');
  h.textContent = title + (note ? ` (${note})` : '');
  box.appendChild(h);
  if (!lines.length) {
    const p = document.createElement('div');
    p.className = 'hint';
    p.textContent = 'None';
    box.appendChild(p);
    return;
  }
  const ol = document.createElement('ol');
  for (const line of lines) {
    const li = document.createElement('li');
    const pinned = /^\[pin\]/i.test(line.text);
    if (pinned) {
      const tag = document.createElement('span');
      tag.className = 'pin';
      tag.textContent = 'PIN';
      li.appendChild(tag);
    }
    li.appendChild(document.createTextNode((line.prefix || '') + line.text.replace(/^\[pin\]\s*/i, '')));
    ol.appendChild(li);
  }
  box.appendChild(ol);
}

function showPreview() {
  const box = $('preview');
  box.innerHTML = '';
  const lines = (id) => $(id).value.split('\n').map((l) => l.trim()).filter(Boolean);
  const split = (l) => {
    const i = l.indexOf('|');
    return { prefix: l.slice(0, i).trim(), text: l.slice(i + 1).trim() };
  };
  previewSection('General messages', lines('generalMessages').map((text) => ({ text })), `every ${$('intervalMinutes').value} min, in this order`);
  previewSection('When a product is pinned', lines('productMessages').map((text) => ({ text })));
  previewSection(`Product tips, ${$('tipDelaySeconds').value}s later`, lines('productTips').map(split).map((t) => ({ prefix: `${t.prefix}: `, text: t.text })));
  previewSection('Countdown', lines('countdownMessages').map(split).map((t) => ({ prefix: `${t.prefix} min left: `, text: t.text })));
  const problems = [...$('sheetProblems').children, ...$('tipsProblems').children].map((d) => ({ text: d.textContent }));
  if (problems.length) previewSection('Problems to fix in the sheets', problems);
}

$('previewBtn').onclick = async () => {
  if (!$('preview').hidden) {
    $('preview').hidden = true;
    $('previewBtn').textContent = 'Preview';
    return;
  }
  await loadForm();
  showPreview();
  $('preview').hidden = false;
  $('previewBtn').textContent = 'Hide preview';
};

$('refreshSheet').onclick = async () => {
  await save();
  $('refreshSheet').disabled = true;
  await send({ type: 'refreshSheet' }).catch(() => null);
  $('refreshSheet').disabled = false;
  await loadForm();
};
$('sheetUrl').onchange = () => $('refreshSheet').click();

async function showProduct() {
  const res = await send({ type: 'getProduct' }).catch(() => null);
  if (!res || res.ok === false) $('product').textContent = (res && res.error) || 'Open the Shopee Live dashboard tab.';
  else {
    const p = res.product ? `${res.product.name} (${res.product.price})` : 'none (general messages will be used)';
    const t = res.elapsed == null ? 'not found' : new Date(res.elapsed * 1000).toISOString().slice(11, 19);
    $('product').textContent = `Showing product: ${p}. Live timer: ${t}`;
  }
}

$('save').onclick = async () => { await save(); $('save').textContent = 'Saved'; setTimeout(() => ($('save').textContent = 'Save'), 1200); };
$('toggle').onclick = async () => {
  await save();
  const { running } = await chrome.storage.local.get('running');
  await send({ type: running ? 'stop' : 'start' });
  render();
};
$('sendNow').onclick = async () => {
  await save();
  $('sendNow').disabled = true;
  await send({ type: 'sendNow' });
  $('sendNow').disabled = false;
  render();
};

chrome.storage.onChanged.addListener(render);
loadForm();
render();
showProduct();
