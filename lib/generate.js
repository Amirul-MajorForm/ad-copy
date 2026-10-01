'use strict';

const Anthropic = require('@anthropic-ai/sdk');
const { SYSTEM_PROMPT, buildUserPrompt, buildSchema, buildRepairPrompt, REPAIR_SCHEMA, requestedFields } = require('./prompt');
const { cleanCopy, countChars, findProblems } = require('./copy-rules');
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
async function callClaude(content, schema) {
  const response = await anthropic().beta.messages.create({
    model: MODEL,
    max_tokens: 16000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: EFFORT, format: { type: 'json_schema', schema } },
    system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
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

function applyFixes(copy, fixes, platform, counts) {
  for (const fix of fixes || []) {
    const field = platform.fields.find(f => f.key === fix.field);
    if (!field || !copy[fix.field]) continue;
    if (fix.index < 0 || fix.index >= counts[fix.field]) continue;
    const item = { text: cleanCopy(fix.text), angle: cleanCopy(fix.angle) };
    if (!item.text) continue;
    if (fix.index < copy[fix.field].length) copy[fix.field][fix.index] = item;
    else copy[fix.field].push(item);
  }
}

// Adds char counts and pass/fail flags for the UI.
function annotate(copy, platform, counts) {
  const fields = requestedFields(platform, counts).map(f => ({
    key: f.key,
    label: f.label,
    limit: f.limit,
    hardMax: f.hardMax,
    note: f.note,
    items: (copy[f.key] || []).map(item => {
      const length = countChars(item.text, platform.countMode);
      return { ...item, length, ok: length <= f.limit };
    })
  }));
  return { creative_read: copy.creative_read, fields };
}

// Generates copy for one creative (or a brief-only run), then validates the
// character limits and asks Claude to repair anything that breaks them.
async function generateCopy(opts) {
  const { creative, platform, counts } = opts;
  const userPrompt = buildUserPrompt(opts);
  const content = [...imageBlocks(creative), { type: 'text', text: userPrompt }];

  const result = await callClaude(content, buildSchema(platform, counts));
  const copy = normaliseCopy(result, platform, counts);
  // Keep the original diagnosis on revisions; the images weren't re-sent.
  if (creative && creative.type === 'read' && creative.read) copy.creative_read = creative.read;

  let repairs = 0;
  for (let round = 0; round < MAX_REPAIR_ROUNDS; round++) {
    const problems = findProblems(copy, platform, counts);
    if (!problems.length) break;
    repairs++;
    // The repair pass is text-only: the diagnosis is already done, it only
    // needs the context, the current copy and what to fix.
    const repairText = [
      userPrompt,
      'COPY YOU WROTE:\n' + JSON.stringify(copy, null, 2),
      buildRepairPrompt(problems, platform, copy)
    ].join('\n\n');
    const fixed = await callClaude([{ type: 'text', text: repairText }], REPAIR_SCHEMA);
    applyFixes(copy, fixed.fixes, platform, counts);
  }

  return { ...annotate(copy, platform, counts), repairs, model: MODEL };
}

module.exports = { generateCopy, normaliseCopy, applyFixes, annotate, MODEL };
