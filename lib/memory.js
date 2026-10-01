'use strict';

// Persistent "team learnings": durable rules distilled from the feedback the
// team types after a run, stored per client (plus an all-clients bucket) and
// fed into every future prompt.
//
// Storage is one JSON file per bucket. On Railway, attach a Volume and it is
// used automatically (Railway sets RAILWAY_VOLUME_MOUNT_PATH); without one the
// files live in ./data/memory and reset whenever the app is redeployed.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const MEMORY_DIR = process.env.RAILWAY_VOLUME_MOUNT_PATH
  ? path.join(process.env.RAILWAY_VOLUME_MOUNT_PATH, 'memory')
  : path.join(__dirname, '..', 'data', 'memory');
const GLOBAL_BUCKET = 'all-clients';
const MAX_LESSONS = 40;

function slug(text) {
  return String(text || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'unnamed';
}

// Bucket id for the client chosen in the form.
function bucketFor({ client, customClient }) {
  if (client) return client.id;
  return 'custom-' + slug(customClient && customClient.name);
}

function validBucket(id) {
  return /^[a-z0-9-]{1,80}$/.test(id || '');
}

function file(bucket, dir) {
  return path.join(dir || MEMORY_DIR, `${bucket}.json`);
}

function read(bucket, dir) {
  try {
    const data = JSON.parse(fs.readFileSync(file(bucket, dir), 'utf8'));
    return Array.isArray(data.lessons) ? data.lessons : [];
  } catch (e) {
    return [];
  }
}

function write(bucket, lessons, dir) {
  const target = file(bucket, dir);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const tmp = `${target}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify({ bucket, lessons: lessons.slice(-MAX_LESSONS) }, null, 2));
  fs.renameSync(tmp, target);
}

// Writes are serialised so two revisions finishing together don't clobber each other.
let queue = Promise.resolve();
function update(bucket, fn, dir) {
  const run = queue.then(() => {
    const next = fn(read(bucket, dir));
    write(bucket, next, dir);
    return next;
  });
  queue = run.catch(() => {});
  return run;
}

function newLesson(text, source) {
  return { id: crypto.randomBytes(5).toString('hex'), text: String(text).trim().slice(0, 300), source, created: new Date().toISOString() };
}

// Lessons that apply to a run: the client's own, then the all-clients ones.
function lessonsFor(bucket, dir) {
  return [...read(bucket, dir), ...read(GLOBAL_BUCKET, dir)];
}

function addLesson(bucket, text, source = 'manual', dir) {
  if (!String(text || '').trim()) return Promise.resolve(read(bucket, dir));
  return update(bucket, lessons => [...lessons, newLesson(text, source)], dir);
}

function removeLesson(bucket, id, dir) {
  return update(bucket, lessons => lessons.filter(l => l.id !== id), dir);
}

// ─── Distilling feedback into lessons ────────────────────────────────────────

const DISTILL_SYSTEM = `You maintain the long-term memory of an ad copywriting tool used by a paid media agency.
The team types feedback after the tool writes ad copy. Your job is to keep only the parts worth remembering for FUTURE copy, written as short imperative rules (under 25 words each).

Keep: lasting preferences about tone, wording, words or phrases to use or avoid, structure, length, what to emphasise, how to talk about the brand.
Ignore: one-off instructions tied to this specific creative, offer, line number or campaign (e.g. "make headline 2 shorter", "mention the October promo"), and anything already covered by an existing rule.
Scope: use "client" by default. Use "all" only when the feedback clearly applies to every client (e.g. "never use exclamation marks in any copy", "for all clients...").
If a new rule contradicts an existing rule in the same scope, put the old rule's id in remove_ids.
Never use em dashes. Return empty arrays when nothing is worth remembering.`;

const DISTILL_SCHEMA = {
  type: 'object',
  properties: {
    add: {
      type: 'array',
      items: {
        type: 'object',
        properties: { text: { type: 'string' }, scope: { type: 'string', enum: ['client', 'all'] } },
        required: ['text', 'scope'],
        additionalProperties: false
      }
    },
    remove_ids: { type: 'array', items: { type: 'string' } }
  },
  required: ['add', 'remove_ids'],
  additionalProperties: false
};

// callClaude is injected (lib/generate.js) to keep this module free of SDK setup.
async function learnFromFeedback({ bucket, clientName, feedback, callClaude, dir }) {
  const own = read(bucket, dir);
  const global = read(GLOBAL_BUCKET, dir);
  const list = ls => (ls.length ? ls.map(l => `- [${l.id}] ${l.text}`).join('\n') : '(none)');
  const prompt = `CLIENT: ${clientName}

EXISTING RULES FOR THIS CLIENT:
${list(own)}

EXISTING RULES FOR ALL CLIENTS:
${list(global)}

NEW FEEDBACK FROM THE TEAM:
${feedback}`;

  const out = await callClaude([{ type: 'text', text: prompt }], DISTILL_SCHEMA, DISTILL_SYSTEM);
  const remove = new Set(out.remove_ids || []);
  const add = (out.add || []).map(a => ({ ...a, text: String(a.text || '').replace(/\s*[–—]\s*/g, ', ').trim() })).filter(a => a.text);
  const forClient = add.filter(a => a.scope !== 'all').map(a => newLesson(a.text, 'feedback'));
  const forAll = add.filter(a => a.scope === 'all').map(a => newLesson(a.text, 'feedback'));

  if (forClient.length || own.some(l => remove.has(l.id))) {
    await update(bucket, ls => [...ls.filter(l => !remove.has(l.id)), ...forClient], dir);
  }
  if (forAll.length || global.some(l => remove.has(l.id))) {
    await update(GLOBAL_BUCKET, ls => [...ls.filter(l => !remove.has(l.id)), ...forAll], dir);
  }
  return {
    added: [...forClient.map(l => ({ ...l, scope: 'client' })), ...forAll.map(l => ({ ...l, scope: 'all' }))],
    removed: [...own, ...global].filter(l => remove.has(l.id))
  };
}

module.exports = {
  MEMORY_DIR, GLOBAL_BUCKET, bucketFor, validBucket, read, lessonsFor, addLesson, removeLesson, learnFromFeedback
};
