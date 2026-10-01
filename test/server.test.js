'use strict';

// End-to-end tests with the Anthropic SDK stubbed out: real multipart upload,
// real image compression and ffmpeg frame extraction, structured-output
// parsing, the limit/uniqueness repair pass, revisions and team memory.

const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execFileSync } = require('child_process');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'adcopy-'));
process.env.RAILWAY_VOLUME_MOUNT_PATH = path.join(tmp, 'volume'); // memory goes here
process.env.ANTHROPIC_API_KEY = 'test';

const calls = [];
// handlers.batch / .repair / .distill answer the three kinds of request
let handlers = {};

function kindOf(params) {
  const req = params.output_config.format.schema.required;
  if (req.includes('creatives')) return 'batch';
  if (req.includes('fixes')) return 'repair';
  return 'distill';
}

class FakeAnthropic {
  constructor() {
    this.beta = {
      messages: {
        create: async (params) => {
          const kind = kindOf(params);
          calls.push({ kind, params });
          const out = handlers[kind] ? handlers[kind](params) : (kind === 'repair' ? { fixes: [] } : { add: [], remove_ids: [] });
          return { stop_reason: 'end_turn', content: [{ type: 'text', text: JSON.stringify(out) }] };
        }
      }
    };
  }
}
require.cache[require.resolve('@anthropic-ai/sdk')] = { exports: FakeAnthropic, loaded: true, id: 'fake' };

const { app } = require('../server');

const READ = { on_screen_text: '5 + 5 FREE', creative_role: 'Offer-led', offer: '5 + 5 free classes', audience: 'New customers', copy_job: 'Explain the offer' };
const SAME_PT = 'You do not need to be an expert to start. Our teachers guide every pose so you can move at your pace.';

function batchReply(params) {
  const n = (JSON.stringify(params.messages).match(/=== CREATIVE \d+/g) || []).length;
  return {
    creatives: Array.from({ length: n }, (_, i) => ({
      creative_number: i + 1,
      creative_read: READ,
      headlines: [
        { text: `Creative ${i + 1}: New To YM? 5 + 5 Free`, angle: 'Offer clarity' },
        { text: i === 0 ? 'This Headline Is Far Too Long For A Meta Headline Field' : `Ten Classes, Creative ${i + 1}`, angle: 'Starter pack' },
        { text: `Your First 10 Classes — Set ${i + 1}`, angle: 'Starter pack' }
      ],
      // Same primary text for every creative: the uniqueness check must catch it
      primary_texts: [{ text: SAME_PT, angle: 'Reassurance' }]
    }))
  };
}

async function sse(pathname, init) {
  const res = await fetch(`http://127.0.0.1:${server.address().port}${pathname}`, init);
  const text = await res.text();
  return text.trim().split('\n\n').map(b => ({
    event: (b.match(/^event: (.*)$/m) || [])[1],
    data: JSON.parse((b.match(/^data: (.*)$/m) || [])[1])
  }));
}

async function postGenerate(settings, files) {
  const form = new FormData();
  for (const f of files) form.append('files', new Blob([fs.readFileSync(f.path)], { type: f.type }), f.name);
  form.append('settings', JSON.stringify(settings));
  return sse('/api/generate', { method: 'POST', body: form });
}

function postJson(pathname, body, method = 'POST') {
  return fetch(`http://127.0.0.1:${server.address().port}${pathname}`, {
    method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
  });
}

let server;
test.before(async () => {
  server = app.listen(0);
  const sharp = require('sharp');
  await sharp({ create: { width: 1080, height: 1080, channels: 3, background: '#e85d3f' } }).png().toFile(path.join(tmp, 'static.png'));
  execFileSync(require('ffmpeg-static'), ['-f', 'lavfi', '-i', 'testsrc=duration=3:size=320x568:rate=10', '-pix_fmt', 'yuv420p', '-y', path.join(tmp, 'reel.mp4')], { stdio: 'ignore' });
});
test.after(() => { server.close(); fs.rmSync(tmp, { recursive: true, force: true }); });

test('config lists platforms, objectives and clients', async () => {
  const res = await fetch(`http://127.0.0.1:${server.address().port}/api/config`);
  const cfg = await res.json();
  assert.ok(cfg.platforms.find(p => p.id === 'tiktok'));
  assert.strictEqual(cfg.objectives.length, 6);
  assert.strictEqual(cfg.clients.length, 4);
});

test('all creatives are written in one call, then limits and duplicates are repaired', async () => {
  calls.length = 0;
  handlers = {
    batch: batchReply,
    repair: params => {
      const text = params.messages[0].content[0].text;
      const fixes = [];
      if (/Creative 1, headlines index 1/.test(text)) fixes.push({ creative_number: 1, field: 'headlines', index: 1, text: 'Ten Classes To Start', angle: 'Starter pack' });
      if (/Creative 2, primary_texts index 0/.test(text)) fixes.push({ creative_number: 2, field: 'primary_texts', index: 0, text: 'Flow, stretch or sweat. Pick the class that suits your day and try ten of them for the price of five.', angle: 'Variety' });
      return { fixes };
    }
  };
  const events = await postGenerate({
    clientId: 'yoga-movement-sg', platformId: 'meta', objectiveId: 'lead_gen',
    counts: { headlines: 3, primary_texts: 1, descriptions: 0 }, brief: 'Starter pack, 5 + 5 free'
  }, [
    { path: path.join(tmp, 'static.png'), type: 'image/png', name: 'static.png' },
    { path: path.join(tmp, 'reel.mp4'), type: 'video/mp4', name: 'reel.mp4' }
  ]);

  const done = events.find(e => e.event === 'complete');
  assert.ok(done, JSON.stringify(events.find(e => e.event === 'error')));
  const [a, b] = done.data.results;
  assert.strictEqual(a.isVideo, false);
  assert.strictEqual(b.isVideo, true);

  // One generation call carrying both creatives (1 image + 6 video frames)
  const gen = calls.filter(c => c.kind === 'batch');
  assert.strictEqual(gen.length, 1);
  const content = gen[0].params.messages[0].content;
  assert.strictEqual(content.filter(x => x.type === 'image').length, 7);
  assert.ok(content.some(x => x.type === 'text' && /=== CREATIVE 2: "reel.mp4"/.test(x.text)));
  assert.match(content[content.length - 1].text, /Plan the whole table before writing/);
  assert.strictEqual(gen[0].params.fallbacks, 'default');

  // Repair pass fixed the over-limit headline and the duplicated primary text
  const repair = calls.find(c => c.kind === 'repair').params.messages[0].content[0].text;
  assert.match(repair, /Creative 2, primary_texts index 0 .* is too close to/);
  assert.ok(a.fields.find(f => f.key === 'headlines').items.every(h => h.ok));
  assert.strictEqual(a.fields.find(f => f.key === 'headlines').items[2].text, 'Your First 10 Classes, Set 1');
  assert.notStrictEqual(a.fields.find(f => f.key === 'primary_texts').items[0].text, b.fields.find(f => f.key === 'primary_texts').items[0].text);
  assert.ok(!b.fields.find(f => f.key === 'primary_texts').items[0].similarTo);
});

test('brief-only run works without uploads', async () => {
  handlers = { batch: () => ({ creatives: [{ creative_number: 1, creative_read: READ, primary_texts: [{ text: 'Try one week of unlimited STRONG classes for $69.', angle: 'Offer' }] }] }) };
  const events = await postGenerate({
    clientId: 'strong-sg', platformId: 'tiktok', objectiveId: 'lead_gen',
    counts: { primary_texts: 1 }, brief: 'One week unlimited $69'
  }, []);
  const done = events.find(e => e.event === 'complete');
  assert.ok(done);
  assert.strictEqual(done.data.results[0].label, 'Brief');
  assert.strictEqual(done.data.meta.platform, 'TikTok - In-Feed');
});

test('rejects a request with neither creative nor brief', async () => {
  const events = await postGenerate({
    clientId: 'strong-sg', platformId: 'meta', objectiveId: 'branding', counts: { headlines: 3 }, brief: ''
  }, []);
  assert.strictEqual(events[0].event, 'error');
  assert.match(events[0].data.message, /Upload a creative or write a brief/);
});

test('revise sends current copy, other creatives and stacked feedback, and saves lessons', async () => {
  calls.length = 0;
  handlers = {
    batch: () => ({ creatives: [{ creative_number: 1, creative_read: READ, headlines: [{ text: 'Lead With 5 + 5 Free', angle: 'Offer' }, { text: 'My Edited Headline', angle: 'Kept' }] }] }),
    distill: () => ({ add: [{ text: 'Lead headlines with the offer.', scope: 'client' }, { text: 'Never use exclamation marks.', scope: 'all' }], remove_ids: [] })
  };
  const events = await sse('/api/revise', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      settings: { clientId: 'yoga-movement-sg', platformId: 'meta', objectiveId: 'lead_gen', counts: { headlines: 2 }, brief: '' },
      feedback: ['No exclamation marks', 'Lead with the offer'],
      targets: [{ index: 1, label: 'reel.mp4', isVideo: true, creative_read: READ,
        current: { headlines: [{ text: 'Old One', angle: 'a' }, { text: 'My Edited Headline', angle: 'b' }] } }],
      others: [{ label: 'static.png', current: { headlines: [{ text: 'Your Mat Is Waiting', angle: 'x' }] } }]
    })
  });
  const done = events.find(e => e.event === 'complete');
  assert.ok(done, JSON.stringify(events));
  const r = done.data.results[0];
  assert.strictEqual(r.index, 1);
  assert.strictEqual(r.fields[0].items[0].text, 'Lead With 5 + 5 Free');
  assert.deepStrictEqual(r.creative_read, READ);
  assert.strictEqual(done.data.learned.added.length, 2);

  const gen = calls.find(c => c.kind === 'batch').params.messages[0].content;
  assert.ok(gen.every(b => b.type === 'text'), 'no images on revision');
  const prompt = gen.map(b => b.text).join('\n');
  assert.match(prompt, /headlines 2: "My Edited Headline"/);
  assert.match(prompt, /OTHER CREATIVES IN THIS CAMPAIGN[\s\S]*Your Mat Is Waiting/);
  assert.match(prompt, /EARLIER FEEDBACK[\s\S]*No exclamation marks/);
  assert.match(prompt, /NEW FEEDBACK:\nLead with the offer/);
  assert.match(prompt, /On-screen text: 5 \+ 5 FREE/);

  // Only the newest note goes to the distiller
  const distill = calls.find(c => c.kind === 'distill').params.messages[0].content[0].text;
  assert.match(distill, /NEW FEEDBACK FROM THE TEAM:\nLead with the offer/);
});

test('learned rules persist, feed into the next run, and can be removed', async () => {
  const res = await fetch(`http://127.0.0.1:${server.address().port}/api/memory?clientId=yoga-movement-sg`);
  const mem = await res.json();
  assert.deepStrictEqual(mem.client.map(l => l.text), ['Lead headlines with the offer.']);
  assert.deepStrictEqual(mem.all.map(l => l.text), ['Never use exclamation marks.']);
  assert.ok(fs.existsSync(path.join(tmp, 'volume', 'memory', 'yoga-movement-sg.json')));

  // A manual rule
  const added = await (await postJson('/api/memory', { clientId: 'yoga-movement-sg', text: 'Call it YM after the first mention.' })).json();
  assert.strictEqual(added.client.length, 2);

  // Next generation includes the rules for this client and for all clients
  calls.length = 0;
  handlers = { batch: () => ({ creatives: [{ creative_number: 1, creative_read: READ, headlines: [{ text: 'Get 5 + 5 Free At YM', angle: 'Offer' }] }] }) };
  const events = await postGenerate({ clientId: 'yoga-movement-sg', platformId: 'meta', objectiveId: 'lead_gen', counts: { headlines: 1 }, brief: 'Starter pack' }, []);
  assert.strictEqual(events.find(e => e.event === 'complete').data.lessonsUsed, 3);
  const prompt = calls[0].params.messages[0].content.map(b => b.text).join('\n');
  assert.match(prompt, /TEAM LEARNINGS[\s\S]*Lead headlines with the offer\.[\s\S]*Call it YM[\s\S]*Never use exclamation marks/);

  // Other clients only see the all-clients rule
  calls.length = 0;
  await postGenerate({ clientId: 'strong-sg', platformId: 'meta', objectiveId: 'lead_gen', counts: { headlines: 1 }, brief: 'Trial' }, []);
  const strongPrompt = calls[0].params.messages[0].content.map(b => b.text).join('\n');
  assert.doesNotMatch(strongPrompt, /Lead headlines with the offer/);
  assert.match(strongPrompt, /Never use exclamation marks/);

  // Delete
  const id = mem.client[0].id;
  await postJson(`/api/memory/yoga-movement-sg/${id}`, {}, 'DELETE');
  const after = await (await fetch(`http://127.0.0.1:${server.address().port}/api/memory?clientId=yoga-movement-sg`)).json();
  assert.ok(!after.client.some(l => l.id === id));
});

test('revise rejects empty feedback', async () => {
  const events = await sse('/api/revise', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ settings: { clientId: 'strong-sg', platformId: 'meta', objectiveId: 'branding', counts: { headlines: 1 } }, feedback: [' '], targets: [{ index: 0 }] })
  });
  assert.match(events[0].data.message, /Write some feedback first/);
});
