// Runs inside the Shopee Live host dashboard. Reads the showing product and
// posts messages into the comment box when the background worker asks.
(() => {
  if (window.__shopeeAutoChatLoaded) return;
  window.__shopeeAutoChatLoaded = true;

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const PRICE_RE = /\$\s?[\d,]+(?:\.\d+)?(?:\s*~\s*\$\s?[\d,]+(?:\.\d+)?)?/;

  function leafTexts(root) {
    return [...root.querySelectorAll('*')]
      .filter((e) => e.children.length === 0)
      .map((e) => e.textContent.trim())
      .filter(Boolean);
  }

  // Shopee's class names carry a build hash (e.g. showing-tip_a09d3), so match the prefix.
  function getShowingProduct() {
    const tip = document.querySelector('[class*="showing-tip_"]');
    if (!tip) return null;
    const count = parseInt(tip.textContent, 10);
    if (count === 0) return null;

    let box = tip;
    for (let i = 0; i < 6 && box.parentElement; i++) {
      box = box.parentElement;
      if (PRICE_RE.test(box.textContent)) break;
    }
    const full = box.textContent.replace(/\s+/g, ' ');
    const priceMatch = full.match(PRICE_RE);
    if (!priceMatch) return null;
    const price = priceMatch[0].replace(/\s*~\s*/, ' ~ ');
    const lowprice = price.split('~')[0].trim();

    const name = leafTexts(box)
      .filter((t) => !/showing/i.test(t) && !/^product list$/i.test(t) && !PRICE_RE.test(t) && t !== '~')
      .sort((a, b) => b.length - a.length)[0];
    if (!name) return null;
    return { name, price, lowprice };
  }

  // The header shows "Live 00:25:55": seconds since the live started.
  function getElapsedSeconds() {
    const times = [...document.querySelectorAll('body *')].filter(
      (e) => e.children.length === 0 && /^\d{1,2}:\d{2}:\d{2}$/.test(e.textContent.trim())
    );
    const nearLive = times.find((e) => {
      let p = e;
      for (let i = 0; i < 3 && p.parentElement; i++) {
        p = p.parentElement;
        if (/\blive\b/i.test(p.textContent.replace(e.textContent, ''))) return true;
      }
      return false;
    });
    const el = nearLive || times[0];
    if (!el) return null;
    const [h, m, sec] = el.textContent.trim().split(':').map(Number);
    return h * 3600 + m * 60 + sec;
  }

  function getInput() {
    return (
      document.querySelector('[class*="divTextarea_"][contenteditable="true"]') ||
      [...document.querySelectorAll('[contenteditable="true"]')].find((e) => e.offsetParent !== null)
    );
  }

  // The Send button and Pin checkbox sit in the same area as the input.
  function getComposer(input) {
    let box = input;
    for (let i = 0; i < 6 && box.parentElement; i++) {
      box = box.parentElement;
      const hasSend = [...box.querySelectorAll('button, [role="button"], div, span')].some(
        (e) => e.children.length === 0 && e.textContent.trim() === 'Send'
      );
      if (hasSend) return box;
    }
    return document.body;
  }

  function findByText(root, text) {
    return [...root.querySelectorAll('*')].find((e) => e.children.length === 0 && e.textContent.trim() === text);
  }

  function getSendButton(composer) {
    const leaf = findByText(composer, 'Send');
    return leaf && (leaf.closest('button, [role="button"]') || leaf);
  }

  function getPinControl(composer) {
    const leaf = findByText(composer, 'Pin');
    if (!leaf) return null;
    const wrap = leaf.closest('label') || leaf.parentElement;
    const checkbox = wrap.querySelector('input[type="checkbox"]');
    const isChecked = () => {
      if (checkbox) return checkbox.checked;
      return !!wrap.querySelector('[class*="checked"]') || /checked/.test(wrap.className);
    };
    const clickTarget = checkbox || wrap.querySelector('[class*="checkbox"]') || wrap;
    return { isChecked, click: () => clickTarget.click() };
  }

  function readText(input) {
    return input.innerText.replace(/​/g, '').trim();
  }

  async function setText(input, text) {
    input.focus();
    document.execCommand('selectAll', false, null);
    document.execCommand('delete', false, null);
    const ok = document.execCommand('insertText', false, text);
    if (!ok || readText(input) !== text) {
      input.textContent = text;
      input.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text }));
    }
    await sleep(300);
    return readText(input) === text;
  }

  async function post(text, pin) {
    const input = getInput();
    if (!input) return { ok: false, error: 'Chat box not found. Is this the host dashboard?' };
    const composer = getComposer(input);

    if (!(await setText(input, text))) return { ok: false, error: 'Could not type into the chat box.' };

    const pinCtl = getPinControl(composer);
    let pinNote = '';
    if (pinCtl) {
      if (pinCtl.isChecked() !== pin) {
        pinCtl.click();
        await sleep(300);
      }
      if (pinCtl.isChecked() !== pin) pinNote = ' (could not set Pin)';
    } else if (pin) {
      pinNote = ' (Pin checkbox not found)';
    }

    const send = getSendButton(composer);
    if (send) send.click();
    await sleep(1500);

    if (readText(input) !== '') {
      // Fallback: press Enter in the box.
      input.focus();
      for (const type of ['keydown', 'keypress', 'keyup']) {
        input.dispatchEvent(new KeyboardEvent(type, { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
      }
      await sleep(1500);
    }
    if (readText(input) !== '') return { ok: false, error: 'Message typed but Send did not go through.' + pinNote };
    return { ok: true, note: pinNote.trim() };
  }

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg.type === 'getProduct') {
      sendResponse({ ok: true, product: getShowingProduct(), elapsed: getElapsedSeconds() });
    } else if (msg.type === 'post') {
      post(msg.text, msg.pin).then(sendResponse, (e) => sendResponse({ ok: false, error: String(e) }));
      return true;
    }
  });

  // Tell the background worker when the showing product changes, once it has
  // been stable for a couple of seconds (switching products can flicker).
  let lastReported;
  let pending = null;
  function checkProduct() {
    pending = null;
    const product = getShowingProduct();
    const name = product ? product.name : null;
    if (name === lastReported) return;
    lastReported = name;
    chrome.runtime.sendMessage({ type: 'productChanged', product }).catch(() => {});
  }
  function scheduleCheck() {
    if (!pending) pending = setTimeout(checkProduct, 2000);
  }
  new MutationObserver(scheduleCheck).observe(document.body, { subtree: true, childList: true, characterData: true });
  setInterval(scheduleCheck, 30000);
  scheduleCheck();

  // Report the live timer so the background can send countdown messages.
  setInterval(() => {
    const elapsed = getElapsedSeconds();
    if (elapsed != null) chrome.runtime.sendMessage({ type: 'timer', elapsed }).catch(() => {});
  }, 10000);

  window.__shopeeAutoChat = { getShowingProduct, getElapsedSeconds, post };
})();
