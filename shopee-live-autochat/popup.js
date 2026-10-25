const FIELDS = ['sheetUrl', 'intervalMinutes', 'jitterMinutes', 'generalEvery', 'liveDurationMinutes', 'productTips', 'tipDelaySeconds', 'productMessages', 'generalMessages', 'countdownMessages'];
const $ = (id) => document.getElementById(id);
const send = (msg) => chrome.runtime.sendMessage(msg);
// Client name comes from the manifest name, e.g. "Shopee Live Auto Chat (Sebamed)".
const clientMatch = chrome.runtime.getManifest().name.match(/\((.+)\)$/);
$('client').textContent = clientMatch ? clientMatch[1] : '';

// Message boxes that come from the Google Sheet while one is connected.
const SHEET_FIELDS = ['productTips', 'productMessages', 'generalMessages', 'countdownMessages'];

async function save() {
  const values = {};
  for (const f of FIELDS) {
    if ($(f).readOnly) continue;
    values[f] = $(f).type === 'number' ? Number($(f).value) : $(f).value.trim();
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
    const sale = sheet.sale.name ? `${sheet.sale.name} (${sheet.sale.set})` : 'No sale today (BAU)';
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
