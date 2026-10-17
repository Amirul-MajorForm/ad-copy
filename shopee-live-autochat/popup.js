const FIELDS = ['intervalMinutes', 'jitterMinutes', 'generalEvery', 'liveDurationMinutes', 'productTips', 'productMessages', 'generalMessages', 'countdownMessages'];
const inTab = location.hash === '#tab';
if (inTab) document.body.classList.add('tab');
const $ = (id) => document.getElementById(id);
const send = (msg) => chrome.runtime.sendMessage(msg);

async function save() {
  const values = {};
  for (const f of FIELDS) values[f] = $(f).type === 'number' ? Number($(f).value) : $(f).value;
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
  const s = { ...DEFAULT_SETTINGS, ...(await chrome.storage.local.get(FIELDS)) };
  for (const f of FIELDS) $(f).value = s[f];
  const { clientName = '' } = await chrome.storage.local.get('clientName');
  $('clientName').value = clientName;
  document.title = clientName ? `${clientName} | Shopee Live Auto Chat` : 'Shopee Live Auto Chat';
}

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

// Export / import a client's setup as a file. A file picker closes the popup on
// Mac, so importing happens in a full tab.
$('exportBtn').onclick = async () => {
  await save();
  const s = { ...DEFAULT_SETTINGS, ...(await chrome.storage.local.get(FIELDS)) };
  const data = { clientName: $('clientName').value.trim() };
  for (const f of FIELDS) data[f] = s[f];
  const name = (data.clientName || 'shopee-live').toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  a.download = `${name}-autochat.json`;
  a.click();
};
$('importBtn').onclick = () => {
  if (!inTab) {
    chrome.tabs.create({ url: chrome.runtime.getURL('popup.html#tab') });
    window.close();
  } else {
    $('importFile').click();
  }
};
$('importFile').onchange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    const values = {};
    for (const f of [...FIELDS, 'clientName']) if (f in data) values[f] = data[f];
    if (!Object.keys(values).length) throw new Error('No settings found in this file.');
    // New messages: start each list from the top.
    await chrome.storage.local.set({ ...values, productMessagesIndex: 0, generalMessagesIndex: 0 });
    await loadForm();
    alert(`Imported${values.clientName ? ' ' + values.clientName : ''} settings.`);
  } catch (err) {
    alert('Could not import this file: ' + err.message);
  }
  e.target.value = '';
};
$('clientName').onchange = () => chrome.storage.local.set({ clientName: $('clientName').value.trim() });

chrome.storage.onChanged.addListener(render);
loadForm();
render();
showProduct();
