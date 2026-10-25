// Reads the sales sheet: one row per sale with its dates and promo facts, plus
// an "Everyday" row (no dates) for days without a sale. The extension builds the
// messages from these facts using the templates in defaults.js, so the sheet
// holds no message wording. Used by the background worker.
//
// Columns are found by their header, so their order doesn't matter:
//   Sale name | Starts | Ends | Live vouchers | Spend & Win: min spend |
//   Spend & Win: prize | Free gift | Gift tiers | Storewide vouchers | Extra messages
// Any other column (e.g. Check) is ignored.

const SHEET_REFRESH_MINUTES = 10;

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

// The same tab through Google's other CSV address, used if the export fails. With
// a tab name, that tab of the sheet instead (e.g. "Product Tips").
function sheetGvizUrl(url, tabName) {
  const id = sheetDocId(url);
  if (!id) return null;
  if (tabName) return `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tabName)}`;
  const gid = (url.match(/[#&?]gid=(\d+)/) || [])[1] || '0';
  return `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&gid=${gid}`;
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

// Fact columns: template code -> header text to look for.
const FACT_COLUMNS = {
  voucher: /live voucher/,
  winspend: /win.*(min|spend)/,
  winprize: /win.*prize/,
  gift: /free gift/,
  gifttiers: /gift tier/,
  storewide: /storewide/
};

// Rows of the sheet -> { sales, everyday, problems }.
function parseSheet(csvText) {
  const rows = parseCsv(csvText).filter((r) => r.some((c) => c.trim()));
  if (!rows.length) return { sales: [], everyday: null, problems: ['The sheet is empty.'] };
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const col = (re) => header.findIndex((h) => re.test(h));
  const C = { name: col(/sale name|^sale$/), start: col(/start/), end: col(/^end/), extra: col(/extra/) };
  if (C.name < 0 || C.start < 0 || C.end < 0) {
    return { sales: [], everyday: null, problems: ['The first row must be the headers: Sale name, Starts, Ends, ...'] };
  }
  const factCols = Object.fromEntries(Object.entries(FACT_COLUMNS).map(([k, re]) => [k, col(re)]));

  const sales = [];
  let everyday = null;
  const problems = [];
  rows.slice(1).forEach((r, i) => {
    const line = i + 2;
    const get = (c) => (c >= 0 ? (r[c] || '').trim() : '');
    const name = get(C.name);
    const facts = Object.fromEntries(Object.entries(factCols).map(([k, c]) => [k, get(c)]));
    const extras = get(C.extra).split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const sale = { line, name, facts, extras };
    const startText = get(C.start);
    const endText = get(C.end);
    if (!startText && !endText) {
      // No dates: the everyday row. Its name isn't used in messages.
      if (everyday) problems.push(`Row ${line}: only one row can have no dates (the everyday row).`);
      else everyday = { ...sale, name: '' };
      return;
    }
    sale.start = parseSheetDate(startText, false);
    sale.end = parseSheetDate(endText, true);
    if (sale.start == null || sale.end == null) {
      problems.push(`Row ${line} (${name || 'no name'}): fill in both Starts and Ends, e.g. 2026-11-24 00:00.`);
    } else if (sale.end < sale.start) {
      problems.push(`Row ${line} (${name || 'no name'}): Ends is before Starts.`);
    } else {
      sales.push(sale);
    }
  });
  return { sales, everyday, problems };
}

// The first sale row covering `now`, else the everyday row.
function activeSale(parsed, now) {
  return parsed.sales.find((s) => now >= s.start && now <= s.end) || parsed.everyday;
}

// Fill a template with the sale's facts. Returns null when a fact it needs is blank,
// so that message is skipped.
function fillFacts(template, sale) {
  let missing = false;
  const text = template.replace(/\{(\w+)\}/g, (code, key) => {
    key = key.toLowerCase();
    if (key === 'sale') return sale.name;
    if (!(key in FACT_COLUMNS)) return code; // {product}, {price}... filled when posting
    if (!sale.facts[key]) missing = true;
    return sale.facts[key];
  });
  if (missing) return null;
  return text.replace(/\s{2,}/g, ' ').replace(/^\s+/, '').replace(/\s+(?=[!?.,])/g, '');
}

// General and countdown messages for `now`, in the same text formats as the
// popup boxes. Product messages and tips stay as set in the extension.
function sheetSettings(parsed, now, templates) {
  const sale = activeSale(parsed, now);
  const warnings = [];
  const general = [];
  const countdown = [];
  if (sale) {
    const label = sale.name || 'Everyday row';
    const check = (text) => {
      const len = text.replace(/^\[pin\]\s*/i, '').length;
      if (len > MAX_CHARS) warnings.push(`${label}: "${text.slice(0, 40)}…" is ${len} characters, over ${MAX_CHARS}. Shorten that cell.`);
    };
    for (const t of (templates.general || '').split('\n').filter((l) => l.trim())) {
      const text = fillFacts(t.trim(), sale);
      if (text) {
        check(text);
        general.push(text);
      }
    }
    for (const extra of sale.extras) {
      check(extra);
      general.push(extra);
    }
    for (const t of (templates.countdown || '').split('\n').filter((l) => l.trim())) {
      const m = t.match(/^\s*(\d+)\s*\|\s*(.+)$/);
      const text = m && fillFacts(m[2], sale);
      if (text) countdown.push(`${m[1]} | ${text}`);
    }
  }
  return { sale, warnings, settings: { generalMessages: general.join('\n'), countdownMessages: countdown.join('\n') } };
}

// Lowercase letters and digits only, so "Wonder Shield" matches "Wondershield".
function normalizeKey(text) {
  return (text || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Product tips tab: Keywords | Only during sale | Pin | Tip message.
function parseTipsSheet(csvText) {
  const rows = parseCsv(csvText).filter((r) => r.some((c) => c.trim()));
  if (!rows.length) return { tips: [], problems: ['The tips sheet is empty.'] };
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const col = (re) => header.findIndex((h) => re.test(h));
  const C = { keywords: col(/keyword/), sale: col(/only during|sale/), pin: col(/^pin/), message: col(/message|tip/) };
  if (C.keywords < 0 || C.message < 0) {
    return {
      tips: [],
      problems: ['No "Product Tips" tab found. Add a tab named Product Tips whose first row is: Keywords, Only during sale, Pin, Tip message.']
    };
  }
  const tips = [];
  const problems = [];
  rows.slice(1).forEach((r, i) => {
    const line = i + 2;
    const get = (c) => (c >= 0 ? (r[c] || '').trim() : '');
    const keywords = get(C.keywords).split(',').map((k) => k.trim()).filter(Boolean);
    const message = get(C.message);
    if (!message && !keywords.length) return;
    if (!keywords.length) return problems.push(`Tips row ${line}: add keywords from the product name.`);
    if (!message) return problems.push(`Tips row ${line} (${keywords.join(', ')}): the tip message is empty.`);
    if (message.length > MAX_CHARS) problems.push(`Tips row ${line} (${keywords.join(', ')}): ${message.length} characters, over ${MAX_CHARS}.`);
    const bad = (message.match(/\{[^}]*\}/g) || []).filter((c) => !/^\{(product|price|lowprice)\}$/i.test(c));
    if (bad.length) problems.push(`Tips row ${line}: ${bad.join(' ')} is not a known code. Use {product} {price} {lowprice}.`);
    tips.push({ line, keywords, onlyDuring: get(C.sale), pin: /^(y|yes|true|1|✓|✔|x)$/i.test(get(C.pin)), message });
  });
  return { tips, problems };
}

// Tips usable now, as "keyword, keyword | message" lines. A tip with "Only during
// sale" is used only while a sale whose name contains it is on.
function tipsSettings(parsed, saleName) {
  const sale = normalizeKey(saleName);
  return parsed.tips
    .filter((t) => !t.onlyDuring || (sale && sale.includes(normalizeKey(t.onlyDuring))))
    .map((t) => `${t.keywords.join(', ')} | ${t.pin ? '[pin] ' : ''}${t.message}`)
    .join('\n');
}
