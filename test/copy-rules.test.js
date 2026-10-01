'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { countChars, cleanCopy, findProblems, tooSimilar, findSimilar } = require('../lib/copy-rules');
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

test('tooSimilar catches shared openings and reworded twins, not different lines', () => {
  const a = "You don't need to be the fittest person in the room. Coaches guide every move so you can build at your pace.";
  const b = "You don't need to be the fittest person in the room. Explore what a STRONG class looks like, start to finish.";
  const c = 'High intensity, low impact. Learn how the class works and plan your unlimited week at STRONG.';
  assert.ok(tooSimilar(a, b));
  assert.ok(!tooSimilar(a, c));
  assert.ok(tooSimilar('One Week Unlimited For $69', 'One week unlimited for $69!'));
  assert.ok(!tooSimilar('Why Pick One?', 'Try Strength, Pilates & Cardio'));
});

test('findSimilar flags the later duplicate across creatives and lifted example phrases', () => {
  const meta = getPlatform('meta');
  const counts = { headlines: 1, primary_texts: 1, descriptions: 0 };
  const batch = [
    { label: 'A', copy: { headlines: [{ text: 'Why Pick One?' }], primary_texts: [{ text: 'Strength, cardio and Pilates in one coach-led class. Try a week for $69.' }] } },
    { label: 'B', copy: { headlines: [{ text: 'All 3 In 45 Minutes' }], primary_texts: [{ text: 'Strength, cardio and Pilates in one coach-led class, now with a $69 week.' }] } },
    { label: 'C', copy: { headlines: [{ text: 'Meet Your New Routine' }], primary_texts: [{ text: 'You do not need to be the fittest person in the room to start with us.' }] } }
  ];
  const examples = ['You do not need to be the fittest person in the room to start. Just show up.'];
  const p = findSimilar(batch, meta, counts, [], examples);
  assert.deepStrictEqual(p.map(x => [x.creative, x.field, x.type]), [
    [1, 'primary_texts', 'too_similar'],
    [2, 'primary_texts', 'copied_example']
  ]);
});
