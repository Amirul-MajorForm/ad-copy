'use strict';

// Character counting, clean-up and limit checks for generated copy.
// Shared by the server (validation + repair) and mirrored in public/app.js
// for the live counters while editing.

// East Asian wide characters. Google Ads counts each of these as 2.
const WIDE_CHAR = /[ᄀ-ᅟ⺀-꓏가-힣豈-﫿︰-﹏＀-｠￠-￦]/u;

function countChars(text, mode = 'standard') {
  const chars = Array.from(text || '');
  if (mode !== 'google') return chars.length;
  return chars.reduce((n, c) => n + (WIDE_CHAR.test(c) ? 2 : 1), 0);
}

// House style: no em or en dashes. Mid-sentence em dashes become commas.
function cleanCopy(text) {
  return String(text || '')
    .replace(/\s*[—]\s*/g, ', ')
    .replace(/(\d)\s*[–]\s*(\d)/g, '$1-$2')
    .replace(/\s*[–]\s*/g, ', ')
    .replace(/,\s*,/g, ',')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// Returns a list of problems the repair pass should fix:
//   { field, index, type: 'over_limit' | 'missing' | 'short_variant', ... }
function findProblems(copy, platform, counts) {
  const problems = [];
  for (const field of platform.fields) {
    const wanted = counts[field.key] || 0;
    if (!wanted) continue;
    const items = copy[field.key] || [];

    items.forEach((item, index) => {
      const length = countChars(item.text, platform.countMode);
      if (length > field.limit) {
        problems.push({ field: field.key, index, type: 'over_limit', length, limit: field.limit, text: item.text });
      }
      if (!item.text || !item.text.trim()) {
        problems.push({ field: field.key, index, type: 'missing', limit: field.limit });
      }
    });

    for (let index = items.length; index < wanted; index++) {
      problems.push({ field: field.key, index, type: 'missing', limit: field.limit });
    }

    if (field.shortVariant) {
      const needed = Math.min(field.shortVariant.min, wanted);
      const short = items.filter(i => countChars(i.text, platform.countMode) <= field.shortVariant.max).length;
      if (short < needed) {
        problems.push({ field: field.key, type: 'short_variant', max: field.shortVariant.max, needed: needed - short });
      }
    }
  }
  return problems;
}

module.exports = { countChars, cleanCopy, findProblems };

// ─── Similarity ──────────────────────────────────────────────────────────────
// Catches the "same line, different creative" problem: two lines are too
// similar when they share a run of 5+ words, or most of their meaningful words.

const STOP = new Set('a an and are as at be but by for from has have in into is it its of on or our so that the their this to up was we with you your yours'.split(' '));

function words(text) {
  return String(text || '').toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9$%+]+/g, ' ').trim().split(' ').filter(Boolean);
}

function longestSharedRun(a, b) {
  let best = 0;
  const prev = new Array(b.length + 1).fill(0);
  for (let i = 1; i <= a.length; i++) {
    let diag = 0;
    for (let j = 1; j <= b.length; j++) {
      const keep = prev[j];
      prev[j] = a[i - 1] === b[j - 1] ? diag + 1 : 0;
      if (prev[j] > best) best = prev[j];
      diag = keep;
    }
  }
  return best;
}

function tooSimilar(a, b, runLimit = 5) {
  const wa = words(a);
  const wb = words(b);
  if (!wa.length || !wb.length) return false;
  if (wa.join(' ') === wb.join(' ')) return true;
  if (longestSharedRun(wa, wb) >= runLimit) return true;
  const ca = new Set(wa.filter(w => !STOP.has(w)));
  const cb = new Set(wb.filter(w => !STOP.has(w)));
  if (Math.min(ca.size, cb.size) < 4) return false;
  let shared = 0;
  ca.forEach(w => { if (cb.has(w)) shared++; });
  return shared / (ca.size + cb.size - shared) >= 0.6;
}

// batch: [{ label, copy: { field: [{ text }] } }]
// fixed: copy that must not be duplicated but won't be changed (other creatives during a revision)
// examples: approved lines that must not be lifted word for word
function findSimilar(batch, platform, counts, fixed = [], examples = []) {
  const problems = [];
  for (const f of platform.fields) {
    if (!counts[f.key]) continue;
    const seen = fixed.flatMap(o => ((o.copy || {})[f.key] || []).map(it => ({ label: o.label, text: it.text })));
    batch.forEach((entry, creative) => {
      ((entry.copy || {})[f.key] || []).forEach((item, index) => {
        const clash = seen.find(s => tooSimilar(item.text, s.text));
        const lifted = !clash && examples.find(e => longestSharedRun(words(item.text), words(e)) >= 6);
        if (clash) {
          problems.push({ creative, field: f.key, index, type: 'too_similar', text: item.text, otherLabel: clash.label, otherText: clash.text });
        } else if (lifted) {
          problems.push({ creative, field: f.key, index, type: 'copied_example', text: item.text, otherText: lifted });
        }
        seen.push({ label: entry.label, text: item.text });
      });
    });
  }
  return problems;
}

module.exports.tooSimilar = tooSimilar;
module.exports.findSimilar = findSimilar;
