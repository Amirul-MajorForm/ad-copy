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
