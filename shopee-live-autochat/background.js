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
  // Mix general messages in while a product is showing. A new product's first
  // message is always the product one.
  const { sinceGeneral = 0 } = await chrome.storage.local.get('sinceGeneral');
  const every = Number(s.generalEvery) || 0;
  const useGeneral =
    !product ||
    (!restartProduct && every > 0 && sinceGeneral >= every - 1 && parseLines(s.generalMessages).length > 0);
  await chrome.storage.local.set({ sinceGeneral: useGeneral ? 0 : (restartProduct ? 0 : sinceGeneral) + 1 });
  const listKey = useGeneral ? 'generalMessages' : 'productMessages';
  const lines = parseLines(s[listKey]);
  if (!lines.length) {
    await addLog({ ok: false, text: `No ${useGeneral ? 'general' : 'product'} messages set.` });
    return { ok: false, error: 'No messages set.' };
  }

  const idxKey = listKey + 'Index';
  let { [idxKey]: idx = 0 } = await chrome.storage.local.get(idxKey);
  if (restartProduct && !useGeneral) idx = 0;
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

function parseCountdown(text) {
  return (text || '')
    .split('\n')
    .map((l) => l.match(/^\s*(\d+)\s*\|\s*(.+)$/))
    .filter(Boolean)
    .map((m) => {
      const pin = /^\[pin\]/i.test(m[2]);
      return { minutesLeft: Number(m[1]), template: m[2].replace(/^\[pin\]\s*/i, ''), pin };
    });
}

// Only send a countdown message within this many seconds after its mark, so
// starting the extension late in a live doesn't fire old marks.
const COUNTDOWN_WINDOW = 300;

function onTimer(elapsed, tab) {
  return enqueue(async () => {
    const s = await getSettings();
    if (!s.running || !tab) return;
    const session = new URL(tab.url).searchParams.get('session') || tab.url;
    const { countdownSent = {} } = await chrome.storage.local.get('countdownSent');
    const sent = countdownSent[session] || [];
    const total = Number(s.liveDurationMinutes) * 60;

    const due = parseCountdown(s.countdownMessages).find((c) => {
      const mark = total - c.minutesLeft * 60;
      return !sent.includes(c.minutesLeft) && elapsed >= mark && elapsed < mark + COUNTDOWN_WINDOW;
    });
    if (!due) return;

    await chrome.storage.local.set({ countdownSent: { [session]: [...sent, due.minutesLeft] } });
    const res = await sendToTab(tab.id, { type: 'getProduct' });
    const text = fill(due.template, res && res.product);
    const result = await sendToTab(tab.id, { type: 'post', text, pin: due.pin });
    await addLog({ ok: !!(result && result.ok), pin: due.pin, text, error: result && (result.error || result.note) });
    // Give the countdown message room before the next timed one.
    await scheduleNext();
  });
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    if (msg.type === 'start') {
      await chrome.storage.local.set({ running: true, generalMessagesIndex: 0, sinceGeneral: 0 });
      const result = await enqueue(() => postOnce({ restartProduct: true }));
      await scheduleNext();
      return result;
    }
    if (msg.type === 'productChanged') return onProductChanged(msg.product);
    if (msg.type === 'timer') return onTimer(msg.elapsed, sender.tab);
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
