'use strict';

const Anthropic = require('@anthropic-ai/sdk');
const { SYSTEM_PROMPT, buildBatchPrompt, creativeHeader, buildSchema, buildRepairPrompt, REPAIR_SCHEMA, requestedFields, exampleLines } = require('./prompt');
const { cleanCopy, countChars, findProblems, findSimilar } = require('./copy-rules');
const { imageBlocks } = require('./media');

const MODEL = process.env.CLAUDE_MODEL || 'claude-opus-5-5';
const EFFORT = process.env.CLAUDE_EFFORT || 'medium';
const MAX_REPAIR_ROUNDS = 2;

let client;
function anthropic() {
  if (!client) client = new Anthropic();
  return client;
}

// One structured-output call. `fallbacks: "default"` lets the API re-run a
// request on Anthropic's recommended fallback model if a safety classifier
// declines it, instead of failing the whole generation.
async function callClaude(content, schema, system = SYSTEM_PROMPT) {
  const response = await anthropic().beta.messages.create({
    model: MODEL,
    max_tokens: 16000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: EFFORT, format: { type: 'json_schema', schema } },
    system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content }]
  });

  if (response.stop_reason === 'refusal') {
    throw new Error('Claude declined this request. Try rewording the brief or removing sensitive claims.');
  }
  if (response.stop_reason === 'max_tokens') {
    throw new Error('The response was cut off. Try requesting fewer variations.');
  }
  const textBlocks = response.content.filter(b => b.type === 'text');
  const raw = textBlocks.length ? textBlocks[textBlocks.length - 1].text : '';
  try {
    return JSON.parse(raw);
  } catch (e) {
    throw new Error('Could not read the copy Claude returned. Please try again.');
  }
}

function normaliseCopy(result, platform, counts) {
  const copy = { creative_read: result.creative_read || null };
  requestedFields(platform, counts).forEach(f => {
    copy[f.key] = (result[f.key] || [])
      .slice(0, counts[f.key])
      .map(item => ({ text: cleanCopy(item.text), angle: cleanCopy(item.angle) }));
  });
  if (copy.creative_read) {
    for (const k of Object.keys(copy.creative_read)) copy.creative_read[k] = cleanCopy(copy.creative_read[k]);
  }
  return copy;
}

function applyFix(copy, fix, platform, counts) {
  const field = platform.fields.find(f => f.key === fix.field);
  if (!field || !copy[fix.field]) return;
  if (fix.index < 0 || fix.index >= counts[fix.field]) return;
  const item = { text: cleanCopy(fix.text), angle: cleanCopy(fix.angle) };
  if (!item.text) return;
  if (fix.index < copy[fix.field].length) copy[fix.field][fix.index] = item;
  else copy[fix.field].push(item);
}

// Adds char counts, pass/fail flags and any unresolved similarity for the UI.
function annotate(copy, platform, counts, similar) {
  const fields = requestedFields(platform, counts).map(f => ({
    key: f.key,
    label: f.label,
    limit: f.limit,
    hardMax: f.hardMax,
    note: f.note,
    items: (copy[f.key] || []).map((item, index) => {
      const length = countChars(item.text, platform.countMode);
      const clash = similar.find(p => p.field === f.key && p.index === index);
      return { ...item, length, ok: length <= f.limit, ...(clash ? { similarTo: clash.otherLabel || 'an approved example' } : {}) };
    })
  }));
  return { creative_read: copy.creative_read, fields };
}

// Writes copy for a whole batch of creatives in one call, so Claude can plan
// distinct angles across them, then checks limits and cross-creative
// similarity and sends only the broken lines back for repair.
//
// items:  [{ label, creative, current? }]  creative is null (brief only), an
//         image/video from lib/media, or { type: 'read', read } on revisions
// others: [{ label, copy }]  copy from creatives that are not being rewritten
async function generateBatch(opts) {
  const { items, others = [], client, platform, counts } = opts;
  const content = [];
  items.forEach((item, i) => {
    content.push({ type: 'text', text: creativeHeader(item, i, platform, counts) });
    content.push(...imageBlocks(item.creative));
  });
  const prompt = buildBatchPrompt(opts);
  content.push({ type: 'text', text: prompt });

  const result = await callClaude(content, buildSchema(platform, counts));
  const returned = Array.isArray(result.creatives) ? result.creatives : [];
  const batch = items.map((item, i) => {
    const raw = returned.find(c => c.creative_number === i + 1) || returned[i];
    if (!raw) return { label: item.label, error: 'No copy came back for this creative. Please try again.' };
    const copy = normaliseCopy(raw, platform, counts);
    // Keep the original diagnosis on revisions; the images weren't re-sent.
    if (item.creative && item.creative.type === 'read' && item.creative.read) copy.creative_read = item.creative.read;
    return { label: item.label, copy };
  });

  const live = batch.filter(b => !b.error);
  const examples = exampleLines(client);
  const check = () => {
    const limits = [];
    batch.forEach((b, creative) => {
      if (b.error) return;
      findProblems(b.copy, platform, counts).forEach(p => limits.push({ ...p, creative }));
    });
    const similar = findSimilar(batch.map(b => (b.error ? { label: b.label, copy: {} } : b)), platform, counts, others, examples);
    return { limits, similar };
  };

  let repairs = 0;
  let state = check();
  for (let round = 0; round < MAX_REPAIR_ROUNDS && live.length; round++) {
    const problems = [...state.limits, ...state.similar];
    if (!problems.length) break;
    repairs++;
    // The repair pass is text-only: the diagnosis is already done, it only
    // needs the context, the current copy and what to fix.
    const current = batch.map((b, i) => `[Creative ${i + 1}: ${b.label}]\n` + JSON.stringify(b.copy || {}, null, 2)).join('\n\n');
    const repairText = [prompt, 'COPY YOU WROTE:\n' + current, buildRepairPrompt(problems, platform, batch)].join('\n\n');
    const fixed = await callClaude([{ type: 'text', text: repairText }], REPAIR_SCHEMA);
    (fixed.fixes || []).forEach(fix => {
      const target = batch[fix.creative_number - 1];
      if (target && !target.error) applyFix(target.copy, fix, platform, counts);
    });
    state = check();
  }

  const results = batch.map((b, creative) => {
    if (b.error) return { label: b.label, error: b.error };
    const similar = state.similar.filter(p => p.creative === creative);
    return { label: b.label, ...annotate(b.copy, platform, counts, similar) };
  });
  return { results, repairs, model: MODEL };
}

module.exports = { generateBatch, callClaude, normaliseCopy, annotate, MODEL };
