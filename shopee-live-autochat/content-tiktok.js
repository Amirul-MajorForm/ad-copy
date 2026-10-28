// Runs inside the TikTok Shop LIVE Manager console. Reads the pinned product and
// posts messages into the chat box when the background worker asks. TikTok's
// version of content.js (Shopee); a TikTok build ships this file as content.js.
(() => {
  // A copy left over from before the extension was reloaded or updated can no
  // longer reach the extension: stop it and take over (an extension's scripts
  // share the page's isolated world, so its stop function is visible here).
  if (window.__liveAutoChatStop) window.__liveAutoChatStop();

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const visible = (e) => e && e.offsetParent !== null;
  const PRICE_RE = /\$\s?[\d,]+(?:\.\d+)?(?:\s*[~\-–]\s*S?\$\s?[\d,]+(?:\.\d+)?)?/;
  // Text that is only a price, e.g. "S$14.65" (names can contain prices too).
  const ONLY_PRICE_RE = new RegExp('^S?' + PRICE_RE.source + '$');
  // Lines on a product card that aren't the name.
  const NOT_NAME_RE =
    /^(unpin|pin|pinned|hot deals?|in stock\b.*|clicks\b.*|added to cart\b.*|attr\.? items sold\b.*|\d+)$/i;

  // Text of an element with a space between child elements.
  function textOf(el) {
    const parts = [];
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) parts.push(walker.currentNode.nodeValue);
    return parts.join(' ').replace(/\s+/g, ' ').trim();
  }

  function isTextLine(el) {
    return [...el.children].every((c) => getComputedStyle(c).display.startsWith('inline'));
  }

  // "[Authentic] [NEW] Dettol ..." -> "Dettol ...": the tags only make messages longer.
  function cleanName(name) {
    return name.replace(/^(\s*\[[^\]]*\]\s*)+/, '').trim();
  }

  // The pinned product is the card with the "Unpin" button.
  function getShowingProduct() {
    const unpin = [...document.querySelectorAll('button, [role="button"]')].find(
      (b) => visible(b) && textOf(b) === 'Unpin'
    );
    if (!unpin) return null;
    let box = unpin;
    for (let i = 0; i < 8 && box.parentElement; i++) {
      box = box.parentElement;
      const lines = [...box.querySelectorAll('*')].filter(isTextLine).map(textOf);
      const price = lines.find((t) => ONLY_PRICE_RE.test(t));
      const name = lines
        .filter((t) => t.length >= 8 && !ONLY_PRICE_RE.test(t) && !NOT_NAME_RE.test(t))
        .sort((a, b) => b.length - a.length)[0];
      if (name && price) {
        const p = price.replace(/\s*[~\-–]\s*/, ' ~ ');
        return { name: cleanName(name), price: p, lowprice: p.split('~')[0].trim() };
      }
    }
    return null;
  }

  // The live timer on the video, e.g. "00:15:41".
  function getElapsedSeconds() {
    const el = [...document.querySelectorAll('body *')].find(
      (e) => e.children.length === 0 && /^\d{1,2}:\d{2}:\d{2}$/.test(e.textContent.trim()) && visible(e)
    );
    if (!el) return null;
    const [h, m, s] = el.textContent.trim().split(':').map(Number);
    return h * 3600 + m * 60 + s;
  }

  function getInput() {
    return (
      [...document.querySelectorAll('textarea[placeholder="Type something..."], textarea.m4b-input-textarea')].find(
        visible
      ) ||
      [...document.querySelectorAll('textarea')].find((t) => visible(t) && /type something/i.test(t.placeholder || ''))
    );
  }

  // The textarea is controlled by React: set the value through the native setter
  // so React sees the change.
  async function setText(input, text) {
    input.focus();
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
    setter.call(input, text);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await sleep(300);
    return input.value === text;
  }

  function pressEnter(input) {
    input.focus();
    for (const type of ['keydown', 'keypress', 'keyup']) {
      input.dispatchEvent(
        new KeyboardEvent(type, {
          key: 'Enter',
          code: 'Enter',
          keyCode: 13,
          which: 13,
          bubbles: true,
          cancelable: true
        })
      );
    }
  }

  // The send arrow next to the box: the last clickable icon in the box's area.
  function getSendIcon(input) {
    let box = input;
    for (let i = 0; i < 4 && box.parentElement; i++) {
      box = box.parentElement;
      const icons = [
        ...box.querySelectorAll('button, [role="button"], svg, [class*="send" i], [class*="icon" i]')
      ].filter((e) => visible(e) && !e.contains(input) && !input.contains(e));
      if (icons.length) return icons[icons.length - 1];
    }
    return null;
  }

  function click(el) {
    const target = el.closest('button, [role="button"]') || el;
    for (const type of ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click']) {
      target.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window }));
    }
  }

  // TikTok's dashboard can't pin a comment as it is sent, so `pin` is ignored.
  async function post(text) {
    const input = getInput();
    if (!input) return { ok: false, error: 'Chat box ("Type something...") not found. Is this the LIVE console?' };
    if (!(await setText(input, text))) return { ok: false, error: 'Could not type into the chat box.' };

    pressEnter(input);
    await sleep(1500);
    if (input.value !== '') {
      const icon = getSendIcon(input);
      if (icon) click(icon);
      await sleep(1500);
    }
    if (input.value !== '') return { ok: false, error: 'Message typed but Send did not go through.' };
    return { ok: true };
  }

  function onMessage(msg, _sender, sendResponse) {
    if (msg.type === 'getProduct') {
      sendResponse({ ok: true, product: getShowingProduct(), elapsed: getElapsedSeconds() });
    } else if (msg.type === 'post') {
      post(msg.text).then(sendResponse, (e) => sendResponse({ ok: false, error: String(e) }));
      return true;
    }
  }
  chrome.runtime.onMessage.addListener(onMessage);

  // Stop everything this copy does: when a newer copy loads, or when the
  // extension was reloaded and messages to it throw "Extension context invalidated".
  const timers = [];
  let observer = null;
  function stop() {
    observer && observer.disconnect();
    timers.forEach(clearInterval);
    clearTimeout(pending);
    try {
      chrome.runtime.onMessage.removeListener(onMessage);
    } catch {}
    if (window.__liveAutoChatStop === stop) delete window.__liveAutoChatStop;
  }
  window.__liveAutoChatStop = stop;

  function send(msg) {
    try {
      if (!chrome.runtime || !chrome.runtime.id) return stop();
      chrome.runtime.sendMessage(msg).catch(() => {});
    } catch {
      stop();
    }
  }

  // Tell the background worker when the pinned product changes, once it has
  // been stable for a couple of seconds (switching products can flicker).
  let lastReported;
  let pending = null;
  function checkProduct() {
    pending = null;
    const product = getShowingProduct();
    const name = product ? product.name : null;
    if (name === lastReported) return;
    lastReported = name;
    send({ type: 'productChanged', product });
  }
  function scheduleCheck() {
    if (!pending) pending = setTimeout(checkProduct, 2000);
  }
  observer = new MutationObserver(scheduleCheck);
  observer.observe(document.body, { subtree: true, childList: true, characterData: true });
  timers.push(setInterval(scheduleCheck, 30000));
  scheduleCheck();

  // Report the live timer so the background can send countdown messages.
  timers.push(
    setInterval(() => {
      const elapsed = getElapsedSeconds();
      if (elapsed != null) send({ type: 'timer', elapsed });
    }, 10000)
  );

  window.__liveAutoChat = { getShowingProduct, getElapsedSeconds, post };
})();
