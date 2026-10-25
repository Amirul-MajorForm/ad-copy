// Reads messages and sale periods from a Google Sheet (shared "Anyone with the
// link"). Used by the background worker and the popup.
//
// Sheet layout (one tab, header row first):
//   Promo set | Type | Sale name / Keyword / Minutes left | Starts | Ends | Pin | Message
// Type "sale" rows define when a promo set is active; other types are messages.

const SHEET_REFRESH_MINUTES = 10;
const KNOWN_CODES = ['product', 'price', 'lowprice', 'sale'];

function sheetDocId(url) {
  const m = (url || '').match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]{20,})/);
  return m && m[1] !== 'e' ? m[1] : null;
}

// CSV export of the tab in the link (#gid=...), or the first tab.
function sheetCsvUrl(url) {
  const id = sheetDocId(url);
  if (!id) return null;
  const gid = (url.match(/[#&?]gid=(\d+)/) || [])[1] || '0';
  return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') {
        quoted = false;
      } else {
        field += c;
      }
    } else if (c === '"') {
      quoted = true;
    } else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += c;
    }
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

// "2026-11-24 20:00", "2026-11-24", "24/11/2026 20:00:00" (day first, as in
// Singapore), "24 Nov 2026 8:00 PM". A date without a time is the whole day:
// the start of it for Starts, the end of it for Ends.
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

function parseSheetDate(text, endOfDay) {
  const s = (text || '').trim();
  if (!s) return null;
  let y, mo, d;
  let rest = '';
  let m;
  if ((m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(.*)$/))) {
    [, y, mo, d, rest] = m;
  } else if ((m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(.*)$/))) {
    [, d, mo, y, rest] = m;
    if (Number(mo) > 12) [d, mo] = [mo, d];
  } else if ((m = s.match(/^(\d{1,2})\s+([A-Za-z]{3})[A-Za-z]*\s+(\d{4})(.*)$/))) {
    [, d, mo, y, rest] = m;
    mo = MONTHS.indexOf(mo.toLowerCase()) + 1;
    if (!mo) return null;
  } else {
    return null;
  }
  let h = endOfDay ? 23 : 0;
  let min = endOfDay ? 59 : 0;
  let sec = endOfDay ? 59 : 0;
  const t = rest.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([ap]m)?/i);
  if (t) {
    h = Number(t[1]);
    min = Number(t[2]);
    sec = Number(t[3] || 0);
    if (t[4] && /pm/i.test(t[4]) && h < 12) h += 12;
    if (t[4] && /am/i.test(t[4]) && h === 12) h = 0;
  }
  const date = new Date(Number(y), Number(mo) - 1, Number(d), h, min, sec);
  return isNaN(date) ? null : date.getTime();
}

const isYes = (v) => /^(y|yes|true|1|✓|✔|x)$/i.test((v || '').trim());

// Rows of the sheet -> { sales, messages, problems }.
function parseSheet(csvText) {
  const rows = parseCsv(csvText).filter((r) => r.some((c) => c.trim()));
  if (!rows.length) return { sales: [], messages: [], problems: ['The sheet is empty.'] };
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const col = (re, fallback) => {
    const i = header.findIndex((h) => re.test(h));
    return i >= 0 ? i : fallback;
  };
  const C = {
    set: col(/promo/, 0),
    type: col(/^type/, 1),
    key: col(/keyword|minutes|sale name/, 2),
    start: col(/start/, 3),
    end: col(/^end/, 4),
    pin: col(/^pin/, 5),
    message: col(/message/, 6)
  };
  const sales = [];
  const messages = [];
  const problems = [];
  rows.slice(1).forEach((r, i) => {
    const line = i + 2;
    const get = (k) => (r[C[k]] || '').trim();
    const type = get('type').toLowerCase();
    const set = get('set');
    if (type === 'sale') {
      const start = parseSheetDate(get('start'), false);
      const end = parseSheetDate(get('end'), true);
      if (!set || start == null || end == null) {
        problems.push(`Row ${line}: sale "${get('key')}" needs a promo set, Starts and Ends (e.g. 2026-11-24 00:00).`);
      } else {
        sales.push({ name: get('key'), set, start, end });
      }
      return;
    }
    const message = get('message');
    if (!type && !message) return;
    if (!['general', 'product', 'tip', 'countdown'].includes(type)) {
      problems.push(`Row ${line}: unknown type "${get('type')}". Use general, product, tip, countdown or sale.`);
      return;
    }
    if (!message) return;
    const entry = { line, set: set || 'Always', type, key: get('key'), pin: isYes(get('pin')), message };
    if (type === 'tip' && !entry.key) problems.push(`Row ${line}: a tip needs a keyword in column C.`);
    if (type === 'countdown') {
      entry.minutes = parseInt(entry.key, 10);
      if (!(entry.minutes > 0)) problems.push(`Row ${line}: a countdown needs the minutes left in column C, e.g. 30 min.`);
    }
    const bad = (message.match(/\{[^}]*\}/g) || []).filter((c) => !KNOWN_CODES.includes(c.slice(1, -1).toLowerCase()));
    if (bad.length) problems.push(`Row ${line}: ${bad.join(' ')} is not a known code. Use {product} {price} {lowprice} {sale}.`);
    messages.push(entry);
  });
  return { sales, messages, problems };
}

// The first sale row covering `now`, or BAU.
function activeSale(sales, now) {
  return sales.find((s) => now >= s.start && now <= s.end) || { name: '', set: 'BAU' };
}

// Message settings for `now`, in the same text formats as the popup boxes.
function sheetSettings(parsed, now) {
  const sale = activeSale(parsed.sales, now);
  const inSet = (m) => /^always$/i.test(m.set) || m.set.toLowerCase() === sale.set.toLowerCase();
  const withSale = (text) =>
    text.replace(/\{sale\}/gi, sale.name).replace(/\s{2,}/g, ' ').replace(/^\s+|\s+(?=[!?.,])/g, '');
  const pin = (m) => (m.pin ? '[pin] ' : '');
  // Rows reported as problems (a tip with no keyword, a countdown with no minutes) are left out.
  const usable = (m) => (m.type !== 'tip' || m.key) && (m.type !== 'countdown' || m.minutes > 0);
  const of = (type) => parsed.messages.filter((m) => m.type === type && inSet(m) && usable(m));
  const warnings = [];
  for (const m of parsed.messages.filter(inSet)) {
    const text = withSale(m.message);
    const fixed = text.replace(/\{(product|price|lowprice)\}/gi, '').length;
    if (fixed > MAX_CHARS) warnings.push(`Row ${m.line}: ${fixed} characters, over Shopee's ${MAX_CHARS}.`);
  }
  return {
    sale,
    warnings,
    settings: {
      generalMessages: of('general').map((m) => pin(m) + withSale(m.message)).join('\n'),
      productMessages: of('product').map((m) => pin(m) + withSale(m.message)).join('\n'),
      productTips: of('tip').map((m) => `${m.key} | ${pin(m)}${withSale(m.message)}`).join('\n'),
      countdownMessages: of('countdown').map((m) => `${m.minutes} | ${pin(m)}${withSale(m.message)}`).join('\n')
    }
  };
}
