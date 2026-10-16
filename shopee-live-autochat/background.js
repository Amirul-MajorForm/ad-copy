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

async function postOnce() {
  const s = await getSettings();
  const tab = await findLiveTab();
  if (!tab) {
    await addLog({ ok: false, text: 'No Shopee Live tab open.' });
    return { ok: false, error: 'No Shopee Live tab open.' };
  }

  const res = await sendToTab(tab.id, { type: 'getProduct' });
  const product = res && res.product;
  const listKey = product ? 'productMessages' : 'generalMessages';
  const lines = parseLines(s[listKey]);
  if (!lines.length) {
    await addLog({ ok: false, text: `No ${product ? 'product' : 'general'} messages set.` });
    return { ok: false, error: 'No messages set.' };
  }

  const idxKey = listKey + 'Index';
  const { [idxKey]: idx = 0 } = await chrome.storage.local.get(idxKey);
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
    await postOnce();
  } catch (e) {
    await addLog({ ok: false, text: 'Error: ' + e.message });
  }
  await scheduleNext();
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    if (msg.type === 'start') {
      await chrome.storage.local.set({ running: true });
      await scheduleNext();
      return { ok: true };
    }
    if (msg.type === 'stop') {
      await chrome.storage.local.set({ running: false, nextAt: null });
      await chrome.alarms.clear(ALARM);
      return { ok: true };
    }
    if (msg.type === 'sendNow') return postOnce();
    if (msg.type === 'getProduct') {
      const tab = await findLiveTab();
      if (!tab) return { ok: false, error: 'No Shopee Live tab open.' };
      return sendToTab(tab.id, { type: 'getProduct' });
    }
  })().then(sendResponse, (e) => sendResponse({ ok: false, error: e.message }));
  return true;
});
