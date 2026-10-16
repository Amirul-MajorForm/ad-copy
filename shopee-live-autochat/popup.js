const FIELDS = ['intervalMinutes', 'jitterMinutes', 'productMessages', 'generalMessages'];
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
}

async function showProduct() {
  const res = await send({ type: 'getProduct' }).catch(() => null);
  if (!res || res.ok === false) $('product').textContent = (res && res.error) || 'Open the Shopee Live dashboard tab.';
  else if (!res.product) $('product').textContent = 'Showing product: none (general messages will be used)';
  else $('product').textContent = `Showing product: ${res.product.name} (${res.product.price})`;
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
