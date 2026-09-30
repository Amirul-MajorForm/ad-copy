'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { countChars, cleanCopy, findProblems } = require('../lib/copy-rules');
const { getPlatform, PLATFORMS } = require('../lib/platforms');

test('countChars counts code points, and wide characters as 2 in google mode', () => {
  assert.strictEqual(countChars('Find What Moves You'), 19);
  assert.strictEqual(countChars('Move 🧘'), 6);
  assert.strictEqual(countChars('瑜伽 Yoga'), 7);
  assert.strictEqual(countChars('瑜伽 Yoga', 'google'), 9);
});

test('cleanCopy removes em and en dashes', () => {
  assert.strictEqual(cleanCopy('Keep your routine going — get 6 free classes'), 'Keep your routine going, get 6 free classes');
  assert.strictEqual(cleanCopy('Classes run 7–9pm'), 'Classes run 7-9pm');
  assert.strictEqual(cleanCopy('  Spaced   out  '), 'Spaced out');
});

test('findProblems flags over-limit, missing and short-variant issues', () => {
  const meta = getPlatform('meta');
  const copy = {
    headlines: [{ text: 'Short one' }, { text: 'x'.repeat(41) }],
    primary_texts: [{ text: 'Fine.' }]
  };
  const problems = findProblems(copy, meta, { headlines: 3, primary_texts: 1, descriptions: 0 });
  assert.deepStrictEqual(problems.map(p => [p.field, p.index, p.type]), [
    ['headlines', 1, 'over_limit'],
    ['headlines', 2, 'missing']
  ]);

  const dg = getPlatform('google_demand_gen');
  const long = { headlines: [{ text: 'x'.repeat(35) }, { text: 'y'.repeat(38) }] };
  const p2 = findProblems(long, dg, { headlines: 2, long_headlines: 0, descriptions: 0 });
  assert.strictEqual(p2.length, 1);
  assert.strictEqual(p2[0].type, 'short_variant');
});

test('every platform field has a sane limit configuration', () => {
  for (const p of PLATFORMS) {
    assert.ok(p.fields.length, p.id);
    for (const f of p.fields) {
      assert.ok(f.limit > 0 && f.limit <= f.hardMax, `${p.id}.${f.key} limit`);
      assert.ok(f.defaultCount <= f.maxCount, `${p.id}.${f.key} default`);
      assert.ok(['headlines', 'long_headlines', 'primary_texts', 'descriptions'].includes(f.key));
    }
  }
});
