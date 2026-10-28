// Runs inside the Shopee Live host dashboard. Reads the showing product and
// posts messages into the comment box when the background worker asks.
(() => {
  // A copy left over from before the extension was reloaded or updated can no
  // longer reach the extension: stop it and take over (an extension's scripts
  // share the page's isolated world, so its stop function is visible here).
  if (window.__shopeeAutoChatStop) window.__shopeeAutoChatStop();

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const PRICE_RE = /\$\s?[\d,]+(?:\.\d+)?(?:\s*[~\-–]\s*\$\s?[\d,]+(?:\.\d+)?)?/;
  // Text that is only a price, e.g. "$40.23" or "$18.10 ~ $63.80". Product names
  // can contain prices too ("... $38 (Worth $52)"), so a name is never mistaken
  // for the price or thrown away for containing one.
  const ONLY_PRICE_RE = new RegExp('^S?' + PRICE_RE.source + '$');

  // Text of an element with a space between child elements, so a separate label
  // like "[Buy 2 Get 1]" doesn't run into the rest of the name.
  function textOf(el) {
    const parts = [];
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) parts.push(walker.currentNode.nodeValue);
    return parts.join(' ').replace(/\s+/g, ' ').trim();
  }

  // Name candidates: any element's text that isn't the "Showing" tip, the
  // "Product List" link or a price. The longest one is the product name, which
  // keeps labels such as "[Buy 2 Get 1]" attached to it.
  // Only elements that are a single line of text: no children, or only inline
  // children such as a "[Buy 2 Get 1]" label. Excludes wrappers that bundle the
  // name with other lines like "Stock 12".
  function isTextLine(el) {
    return [...el.children].every((c) => getComputedStyle(c).display.startsWith('inline'));
  }

  // The first text line in the box that is only a price.
  function findPrice(box) {
    const el = [...box.querySelectorAll('*')].find((e) => isTextLine(e) && ONLY_PRICE_RE.test(textOf(e)));
    return el ? textOf(el) : '';
  }

  function nameCandidates(box, price) {
    return [...box.querySelectorAll('*')]
      .filter(isTextLine)
      .map(textOf)
      .filter((t) => t.length >= 4 && !/showing|product list/i.test(t) && !ONLY_PRICE_RE.test(t))
      .filter((t) => !price || !t.includes(price));
  }

  // Shopee's class names carry a build hash (e.g. showing-tip_a09d3), so match the prefix.
  function getShowingProduct() {
    const tip = document.querySelector('[class*="showing-tip_"]');
    if (!tip) return null;
    const count = parseInt(tip.textContent, 10);
    if (count === 0) return null;

    // Climb from the tip to the first box with a name in it, then up to two more
    // levels for a price (bundles may show none). Stop as soon as a level brings
    // in any other product's name, so a price from the product list is never used.
    let box = tip;
    let name = null;
    let priceText = '';
    for (let i = 0, sinceName = 0; i < 6 && box.parentElement && sinceName <= 2; i++) {
      box = box.parentElement;
      const levelPrice = findPrice(box);
      const candidates = nameCandidates(box, levelPrice);
      if (!candidates.length) continue;
      const longest = candidates.sort((a, b) => b.length - a.length)[0];
      if (!name) name = longest;
      else if (candidates.some((c) => !name.includes(c))) break;
      sinceName++;
      if (levelPrice) {
        priceText = levelPrice;
        break;
      }
    }
    if (!name) return null;
    const priceMatch = priceText.match(PRICE_RE);
    const price = priceMatch ? priceMatch[0].replace(/\s*[~\-–]\s*/, ' ~ ') : '';
    const lowprice = price.split('~')[0].trim();
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
        input.dispatchEvent(
          new KeyboardEvent(type, { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true })
        );
      }
      await sleep(1500);
    }
    if (readText(input) !== '') return { ok: false, error: 'Message typed but Send did not go through.' + pinNote };
    return { ok: true, note: pinNote.trim() };
  }

  function onMessage(msg, _sender, sendResponse) {
    if (msg.type === 'getProduct') {
      sendResponse({ ok: true, product: getShowingProduct(), elapsed: getElapsedSeconds() });
    } else if (msg.type === 'post') {
      post(msg.text, msg.pin).then(sendResponse, (e) => sendResponse({ ok: false, error: String(e) }));
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
    if (window.__shopeeAutoChatStop === stop) delete window.__shopeeAutoChatStop;
  }
  window.__shopeeAutoChatStop = stop;

  function send(msg) {
    try {
      if (!chrome.runtime || !chrome.runtime.id) return stop();
      chrome.runtime.sendMessage(msg).catch(() => {});
    } catch {
      stop();
    }
  }

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

  window.__shopeeAutoChat = { getShowingProduct, getElapsedSeconds, post };
})();
