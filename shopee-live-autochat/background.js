importScripts('defaults.js');

const ALARM = 'shopee-autochat-next';
const LIVE_URL = 'https://live.shopee.sg/pc/*';

async function getSettings() {
  const stored = await chrome.storage.local.get(Object.keys(DEFAULT_SETTINGS));
  return { ...DEFAULT_SETTINGS, ...stored };
}

function parseLines(text) {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const pin = /^\[pin\]/i.test(l);
      return { template: l.replace(/^\[pin\]\s*/i, ''), pin };
    });
}

function fill(template, product) {
  return template
    .replace(/\{product\}/g, product ? product.name : '')
    .replace(/\{price\}/g, product ? product.price : '')
    .replace(/\{lowprice\}/g, product ? product.lowprice : '')
    .slice(0, MAX_CHARS);
}

async function addLog(entry) {
  const { log = [] } = await chrome.storage.local.get('log');
  log.unshift({ time: new Date().toLocaleTimeString(), ...entry });
  await chrome.storage.local.set({ log: log.slice(0, 30) });
}

async function findLiveTab() {
  const tabs = await chrome.tabs.query({ url: LIVE_URL });
  return tabs.find((t) => t.url.includes('/pc/live')) || tabs[0];
}

async function sendToTab(tabId, msg) {
  try {
    return await chrome.tabs.sendMessage(tabId, msg);
  } catch {
    // Content script missing (tab was open before the extension loaded): inject and retry.
    await chrome.scripting.executeScript({ target: { tabId }, files: ['content.js'] });
    return chrome.tabs.sendMessage(tabId, msg);
  }
}

async function scheduleNext() {
  const s = await getSettings();
  const jitter = (Math.random() * 2 - 1) * Number(s.jitterMinutes || 0);
  const delay = Math.max(1, Number(s.intervalMinutes) + jitter);
  await chrome.alarms.create(ALARM, { delayInMinutes: delay });
  await chrome.storage.local.set({ nextAt: Date.now() + delay * 60000 });
}

// Run posts one at a time so a product change and the timer can't collide.
let queue = Promise.resolve();
function enqueue(fn) {
  const run = queue.then(fn);
  queue = run.catch(() => {});
  return run;
}

// restartProduct: start the product list from its first line (used when a new
// product starts showing, or when Start is pressed).
async function postOnce({ restartProduct = false } = {}) {
  const s = await getSettings();
  const tab = await findLiveTab();
  if (!tab) {
    await addLog({ ok: false, text: 'No Shopee Live tab open.' });
    return { ok: false, error: 'No Shopee Live tab open.' };
  }

  const res = await sendToTab(tab.id, { type: 'getProduct' });
  const product = res && res.product;
  await chrome.storage.local.set({ lastProductName: product ? product.name : null });
  const listKey = product ? 'productMessages' : 'generalMessages';
  const lines = parseLines(s[listKey]);
  if (!lines.length) {
    await addLog({ ok: false, text: `No ${product ? 'product' : 'general'} messages set.` });
    return { ok: false, error: 'No messages set.' };
  }

  const idxKey = listKey + 'Index';
  let { [idxKey]: idx = 0 } = await chrome.storage.local.get(idxKey);
  if (restartProduct && product) idx = 0;
  const line = lines[idx % lines.length];
  await chrome.storage.local.set({ [idxKey]: (idx + 1) % lines.length });

  const text = fill(line.template, product);
  const result = await sendToTab(tab.id, { type: 'post', text, pin: line.pin });
  await addLog({ ok: !!(result && result.ok), pin: line.pin, text, error: result && (result.error || result.note) });
  return result;
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== ALARM) return;
  const s = await getSettings();
  if (!s.running) return;
  try {
    await enqueue(() => postOnce());
  } catch (e) {
    await addLog({ ok: false, text: 'Error: ' + e.message });
  }
  await scheduleNext();
});

// A new product started showing: post its first message now and restart the interval.
function onProductChanged(product) {
  return enqueue(async () => {
    const { running, lastProductName } = await chrome.storage.local.get(['running', 'lastProductName']);
    if (!running) return;
    const name = product ? product.name : null;
    if (name === lastProductName) return;
    if (!product) {
      await chrome.storage.local.set({ lastProductName: null });
      return;
    }
    await postOnce({ restartProduct: true });
    await scheduleNext();
  });
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    if (msg.type === 'start') {
      await chrome.storage.local.set({ running: true, generalMessagesIndex: 0 });
      const result = await enqueue(() => postOnce({ restartProduct: true }));
      await scheduleNext();
      return result;
    }
    if (msg.type === 'productChanged') return onProductChanged(msg.product);
    if (msg.type === 'stop') {
      await chrome.storage.local.set({ running: false, nextAt: null });
      await chrome.alarms.clear(ALARM);
      return { ok: true };
    }
    if (msg.type === 'sendNow') return enqueue(() => postOnce());
    if (msg.type === 'getProduct') {
      const tab = await findLiveTab();
      if (!tab) return { ok: false, error: 'No Shopee Live tab open.' };
      return sendToTab(tab.id, { type: 'getProduct' });
    }
  })().then(sendResponse, (e) => sendResponse({ ok: false, error: e.message }));
  return true;
});
