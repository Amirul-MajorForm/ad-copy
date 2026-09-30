'use strict';

// End-to-end test of /api/generate with the Anthropic SDK stubbed out:
// real multipart upload, real image compression and ffmpeg frame extraction,
// structured-output parsing, and the character-limit repair pass.

const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execFileSync } = require('child_process');

const calls = [];
let replies = [];

class FakeAnthropic {
  constructor() {
    this.beta = {
      messages: {
        create: async (params) => {
          calls.push(params);
          const next = replies.shift();
          return { stop_reason: 'end_turn', content: [{ type: 'text', text: JSON.stringify(next(params)) }] };
        }
      }
    };
  }
}
require.cache[require.resolve('@anthropic-ai/sdk')] = { exports: FakeAnthropic, loaded: true, id: 'fake' };
process.env.ANTHROPIC_API_KEY = 'test';

const { app } = require('../server');

function firstPass() {
  return {
    creative_read: { on_screen_text: '5 + 5 FREE', creative_role: 'Offer-led', offer: '5 + 5 free classes', audience: 'New customers', copy_job: 'Explain the offer' },
    headlines: [
      { text: 'New To YM? Get 5 + 5 Free', angle: 'Offer clarity' },
      { text: 'This Headline Is Far Too Long For A Meta Headline Field', angle: 'Too long' },
      { text: 'Your First 10 Classes — Sorted', angle: 'Starter pack' }
    ],
    primary_texts: [
      { text: 'New to Yoga Movement? Start with 5 classes + 5 free and find what moves you.', angle: 'Offer clarity' }
    ]
  };
}

async function postGenerate(settings, files) {
  const form = new FormData();
  for (const f of files) form.append('files', new Blob([fs.readFileSync(f.path)], { type: f.type }), f.name);
  form.append('settings', JSON.stringify(settings));
  const res = await fetch(`http://127.0.0.1:${server.address().port}/api/generate`, { method: 'POST', body: form });
  const text = await res.text();
  const events = text.trim().split('\n\n').map(b => ({
    event: (b.match(/^event: (.*)$/m) || [])[1],
    data: JSON.parse((b.match(/^data: (.*)$/m) || [])[1])
  }));
  return events;
}

let server;
let tmp;
test.before(async () => {
  server = app.listen(0);
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'adcopy-'));
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

test('static + video upload generates copy, repairs limits and strips dashes', async () => {
  calls.length = 0;
  // Both creatives run in parallel, so answer by request type, not order
  const reply = params => params.output_config.format.schema.required.includes('creative_read')
    ? firstPass()
    : { fixes: [{ field: 'headlines', index: 1, text: 'Start With 10 Classes', angle: 'Starter pack' }] };
  replies = [reply, reply, reply, reply];
  const events = await postGenerate({
    clientId: 'yoga-movement-sg', platformId: 'meta', objectiveId: 'lead_gen',
    counts: { headlines: 3, primary_texts: 1, descriptions: 0 }, brief: 'Starter pack, 5 + 5 free'
  }, [
    { path: path.join(tmp, 'static.png'), type: 'image/png', name: 'static.png' },
    { path: path.join(tmp, 'reel.mp4'), type: 'video/mp4', name: 'reel.mp4' }
  ]);

  const done = events.find(e => e.event === 'complete');
  assert.ok(done, JSON.stringify(events.find(e => e.event === 'error')));
  const [staticRes, videoRes] = done.data.results;
  assert.strictEqual(staticRes.isVideo, false);
  assert.strictEqual(videoRes.isVideo, true);

  const heads = staticRes.fields.find(f => f.key === 'headlines').items;
  assert.strictEqual(heads.length, 3);
  assert.ok(heads.every(h => h.ok), JSON.stringify(heads));
  assert.strictEqual(heads[2].text, 'Your First 10 Classes, Sorted');
  assert.strictEqual(staticRes.repairs, 1);

  // First-pass requests: images attached, structured output, fallbacks on
  const firstCalls = calls.filter(c => c.output_config.format.schema.required.includes('creative_read'));
  assert.strictEqual(firstCalls.length, 2);
  const imageCounts = firstCalls.map(c => c.messages[0].content.filter(b => b.type === 'image').length).sort();
  assert.deepStrictEqual(imageCounts, [1, 6]);
  assert.strictEqual(firstCalls[0].fallbacks, 'default');
  assert.deepStrictEqual(firstCalls[0].betas, ['server-side-fallback-2026-07-01']);
});

test('brief-only run works without uploads', async () => {
  replies = [() => ({
    creative_read: { on_screen_text: '', creative_role: 'Offer-led', offer: 'One week $69', audience: 'New', copy_job: 'Offer' },
    primary_texts: [{ text: 'Try one week of unlimited STRONG classes for $69.', angle: 'Offer' }]
  })];
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
