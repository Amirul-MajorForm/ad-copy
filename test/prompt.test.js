'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { buildUserPrompt, buildSchema, SYSTEM_PROMPT } = require('../lib/prompt');
const { getPlatform } = require('../lib/platforms');
const { getObjective } = require('../lib/objectives');
const { getClient, CLIENTS } = require('../lib/clients');
const { countChars } = require('../lib/copy-rules');

test('client database loads the four clients from the activation sheet', () => {
  const names = CLIENTS.map(c => c.name);
  for (const n of ['STRONG Singapore', 'Yoga Movement Singapore', 'Yoga Movement Hong Kong', 'Yoga Movement Academy']) {
    assert.ok(names.includes(n), n);
  }
  for (const c of CLIENTS) {
    for (const ex of c.approved_copy) {
      const text = [...(ex.headlines || []), ...(ex.primary_texts || [])].join(' ');
      assert.ok(!/[–—]/.test(text), `${c.id} / ${ex.name} contains a dash`);
    }
  }
});

test('system prompt keeps the MajorForm method and adds the app rules', () => {
  assert.match(SYSTEM_PROMPT, /MajorForm Creative Strategist/);
  assert.match(SYSTEM_PROMPT, /Ad Copy Studio Operating Rules/);
});

test('user prompt includes limits, objective, brief and ranks matching examples first', () => {
  const platform = getPlatform('meta');
  const objective = getObjective('retention');
  const prompt = buildUserPrompt({
    creative: null,
    client: getClient('yoga-movement-sg'),
    platform,
    objective,
    counts: { headlines: 3, primary_texts: 2, descriptions: 0 },
    brief: '30 + 8 free classes, ends 31 Oct'
  });
  assert.match(prompt, /headlines \("Headline"\): exactly 3 item\(s\), each <= 40 characters/);
  assert.match(prompt, /primary_texts \("Primary text"\): exactly 2 item\(s\), each <= 125 characters/);
  assert.doesNotMatch(prompt, /descriptions \(/);
  assert.match(prompt, /Retention \/ Membership/);
  assert.match(prompt, /30 \+ 8 free classes, ends 31 Oct/);
  assert.match(prompt, /Past offers \(history only/);
  const firstExample = prompt.split('APPROVED COPY')[1].match(/objective: (\w+)/)[1];
  assert.strictEqual(firstExample, 'retention');
});

test('schema only asks for requested fields', () => {
  const schema = buildSchema(getPlatform('google_rsa'), { headlines: 10, descriptions: 0 });
  assert.deepStrictEqual(schema.required, ['creative_read', 'headlines']);
  assert.strictEqual(schema.additionalProperties, false);
});

test('approved STRONG headlines fit the Meta headline limit', () => {
  const limit = getPlatform('meta').fields.find(f => f.key === 'headlines').limit;
  for (const ex of getClient('strong-sg').approved_copy) {
    for (const h of ex.headlines) assert.ok(countChars(h) <= limit, h);
  }
});
