importScripts('defaults.js', 'sheet.js');

const ALARM = 'shopee-autochat-next';
const SHEET_ALARM = 'shopee-autochat-sheet';
const LIVE_URL = 'https://live.shopee.sg/pc/*';

// Settings saved in the popup, with the messages replaced by the Google Sheet's
// when a sheet link is set and the sheet has been read.
async function getSettings() {
  const stored = await chrome.storage.local.get(Object.keys(DEFAULT_SETTINGS));
  const s = { ...DEFAULT_SETTINGS, ...stored };
  const sheet = await currentSheet(s);
  if (sheet) Object.assign(s, sheet.settings);
  return s;
}

async function currentSheet(s) {
  if (!s.sheetUrl) return null;
  const { sheetCache } = await chrome.storage.local.get('sheetCache');
  if (!sheetCache || sheetCache.url !== s.sheetUrl || !sheetCache.parsed) return null;
  return sheetSettings(sheetCache.parsed, Date.now());
}

// Read the sheet, unless it was read in the last few minutes. If it can't be
// read, the last good copy keeps being used.
async function refreshSheet({ force = false } = {}) {
  const { sheetUrl = DEFAULT_SETTINGS.sheetUrl, sheetCache } = await chrome.storage.local.get(['sheetUrl', 'sheetCache']);
  if (!sheetUrl) return sheetStatus();
  const fresh = sheetCache && sheetCache.url === sheetUrl && sheetCache.parsed && !sheetCache.error;
  if (!force && fresh && Date.now() - sheetCache.fetchedAt < SHEET_REFRESH_MINUTES * 60000) return sheetStatus();

  const keep = sheetCache && sheetCache.url === sheetUrl ? sheetCache : { url: sheetUrl };
  try {
    const csvUrl = sheetCsvUrl(sheetUrl);
    if (/\/d\/e\//.test(sheetUrl)) throw new Error('Use the normal sheet link (Share > Copy link), not the "Publish to web" link.');
    if (!csvUrl) throw new Error("This doesn't look like a Google Sheet link.");
    const res = await fetch(csvUrl, { credentials: 'include', cache: 'no-store' });
    const text = await res.text();
    if (!res.ok || /^\s*</.test(text)) {
      throw new Error("Can't read the sheet. In Google Sheets, set Share > General access to \"Anyone with the link\".");
    }
    const parsed = parseSheet(text);
    if (!parsed.messages.length) throw new Error('No messages found in the sheet.');
    await chrome.storage.local.set({ sheetCache: { url: sheetUrl, fetchedAt: Date.now(), parsed, error: null } });
  } catch (e) {
    if (!keep.error) await addLog({ ok: false, text: 'Google Sheet: ' + e.message });
    await chrome.storage.local.set({ sheetCache: { ...keep, error: e.message, errorAt: Date.now() } });
  }
  return sheetStatus();
}

// What the popup shows about the sheet.
async function sheetStatus() {
  const stored = await chrome.storage.local.get(['sheetUrl', 'sheetCache']);
  const url = stored.sheetUrl === undefined ? DEFAULT_SETTINGS.sheetUrl : stored.sheetUrl;
  if (!url) return { url: '' };
  const cache = stored.sheetCache && stored.sheetCache.url === url ? stored.sheetCache : null;
  const status = { url, fetchedAt: cache && cache.fetchedAt, error: cache && cache.error };
  if (cache && cache.parsed) {
    const sheet = sheetSettings(cache.parsed, Date.now());
    Object.assign(status, { active: true, sale: sheet.sale, warnings: [...cache.parsed.problems, ...sheet.warnings] });
  }
  return status;
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

// Product tips: "keyword | message" lines. The first keyword found in the
// showing product's name picks the tip message for that product.
function findTip(product, tipsText) {
  if (!product) return null;
  const name = product.name.toLowerCase();
  for (const line of (tipsText || '').split('\n')) {
    const m = line.match(/^\s*([^|]+?)\s*\|\s*(.+?)\s*$/);
    if (m && name.includes(m[1].toLowerCase())) {
      return { template: m[2].replace(/^\[pin\]\s*/i, ''), pin: /^\[pin\]/i.test(m[2]) };
    }
  }
  return null;
}

function fill(template, product) {
  // No price shown for this product (some bundles): drop "at/from/only {price}".
  if (product && !product.price) template = template.replace(/\s*(?:at|from|only)?\s*\{(?:low)?price\}/gi, '');
  const render = (name) =>
    template
      .replace(/\{product\}/g, name)
      .replace(/\{price\}/g, product ? product.price : '')
      .replace(/\{lowprice\}/g, product ? product.lowprice : '');
  let name = product ? product.name : '';
  let text = render(name);
  // Too long for Shopee: shorten the product name rather than cut off the end.
  if (text.length > MAX_CHARS && name && template.includes('{product}')) {
    const uses = template.split('{product}').length - 1;
    const keep = name.length - Math.ceil((text.length - MAX_CHARS + 1) / uses);
    if (keep >= 15) {
      name = name.slice(0, keep).trimEnd() + '…';
      text = render(name);
    }
  }
  // Still too long: cut at a whole character so an emoji is never split.
  return text.length > MAX_CHARS ? Array.from(text).slice(0, MAX_CHARS - 1).join('') : text;
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
  // Never post a message with a code that wasn't filled in, e.g. "{range}".
  const leftover = msg.type === 'post' && msg.text.match(/\{[a-z]+\}/i);
  if (leftover) return { ok: false, error: `Not sent: ${leftover[0]} is not a known code. Edit this message in the popup.` };

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
  // A new product's first message is followed by its product tip. Scheduled even
  // if the send looked unconfirmed: Shopee can be slow to clear the chat box.
  if (restartProduct && !useGeneral) await scheduleTip(product, s);
  return result;
}

// Product tip: sent tipDelaySeconds after a new product's first message, if a
// product with the same tip is still showing. The pending tip is stored and
// backed by an alarm, so it survives Chrome pausing the background worker.
const TIP_ALARM = 'shopee-autochat-tip';

async function scheduleTip(product, s) {
  const tip = findTip(product, s.productTips);
  if (!tip) {
    await addLog({ ok: false, text: `No product tip: none of the keywords is in "${product.name}".` });
    return;
  }
  const delay = Math.max(0, Number(s.tipDelaySeconds) || 0) * 1000;
  const at = Date.now() + delay;
  await chrome.storage.local.set({ pendingTip: { template: tip.template, at } });
  await chrome.alarms.create(TIP_ALARM, { when: at });
  setTimeout(() => sendPendingTip(at).catch(() => {}), delay);
}

// Called by the timer (with its own due time) or the alarm, whichever comes
// first; the other finds nothing to send. A timer only sends its own tip.
function sendPendingTip(dueAt) {
  return enqueue(async () => {
    const { pendingTip } = await chrome.storage.local.get('pendingTip');
    if (!pendingTip || (dueAt ? pendingTip.at !== dueAt : Date.now() < pendingTip.at - 500)) return;
    await chrome.storage.local.remove('pendingTip');
    await chrome.alarms.clear(TIP_ALARM);

    const s = await getSettings();
    if (!s.running) return;
    const tab = await findLiveTab();
    if (!tab) return;
    const res = await sendToTab(tab.id, { type: 'getProduct' });
    const product = res && res.product;
    const tip = findTip(product, s.productTips);
    if (!tip || tip.template !== pendingTip.template) {
      await addLog({ ok: false, text: 'Product tip skipped: a different product is showing now.' });
      return;
    }
    const text = fill(tip.template, product);
    const result = await sendToTab(tab.id, { type: 'post', text, pin: tip.pin });
    await addLog({ ok: !!(result && result.ok), pin: tip.pin, text, error: result && (result.error || result.note) });
  });
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === TIP_ALARM) return sendPendingTip();
  if (alarm.name === SHEET_ALARM) return refreshSheet({ force: true });
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
    const product = res && res.product;
    const text = fill(due.template, product);
    const result = await sendToTab(tab.id, { type: 'post', text, pin: due.pin });
    await addLog({ ok: !!(result && result.ok), pin: due.pin, text, error: result && (result.error || result.note) });
    // Give the countdown message room before the next timed one.
    await scheduleNext();
  });
}

// Saved settings from versions that used {range}/{tip} would post those codes as
// text. On update, replace any such messages (and the old-style product tips,
// which were descriptions rather than full messages) with this build's defaults.
chrome.runtime.onInstalled.addListener(async () => {
  refreshSheet({ force: true });
  const keys = ['productMessages', 'generalMessages', 'countdownMessages', 'tipMessages'];
  const stored = await chrome.storage.local.get(keys);
  const old = keys.filter((k) => /\{(range|tip)\}/.test(stored[k] || ''));
  if (!old.length) return;
  await chrome.storage.local.remove([...old, 'productTips', 'tipMessages', 'tipMessagesIndex', 'productMessagesIndex']);
  await addLog({ ok: true, text: 'Updated messages that used the old {range}/{tip} codes to the new defaults.' });
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    if (msg.type === 'start') {
      await chrome.storage.local.set({ running: true, generalMessagesIndex: 0, sinceGeneral: 0 });
      // Latest messages from the Google Sheet before the first post, then every few minutes.
      await refreshSheet({ force: true });
      await chrome.alarms.create(SHEET_ALARM, { periodInMinutes: SHEET_REFRESH_MINUTES });
      const result = await enqueue(() => postOnce({ restartProduct: true }));
      await scheduleNext();
      return result;
    }
    if (msg.type === 'productChanged') return onProductChanged(msg.product);
    if (msg.type === 'timer') return onTimer(msg.elapsed, sender.tab);
    if (msg.type === 'stop') {
      await chrome.storage.local.set({ running: false, nextAt: null });
      await chrome.storage.local.remove('pendingTip');
      await chrome.alarms.clear(ALARM);
      await chrome.alarms.clear(TIP_ALARM);
      await chrome.alarms.clear(SHEET_ALARM);
      return { ok: true };
    }
    if (msg.type === 'sendNow') return enqueue(() => postOnce());
    if (msg.type === 'refreshSheet') return refreshSheet({ force: true });
    if (msg.type === 'getEffective') {
      await refreshSheet();
      return { settings: await getSettings(), sheet: await sheetStatus() };
    }
    if (msg.type === 'getProduct') {
      const tab = await findLiveTab();
      if (!tab) return { ok: false, error: 'No Shopee Live tab open.' };
      return sendToTab(tab.id, { type: 'getProduct' });
    }
  })().then(sendResponse, (e) => sendResponse({ ok: false, error: e.message }));
  return true;
});
