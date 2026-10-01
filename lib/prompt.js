'use strict';

const fs = require('fs');
const path = require('path');
const { FIELD_ORDER } = require('./platforms');
const { rankExamples } = require('./clients');

// The copywriting method lives in prompts/copywriter-system-prompt.md so the
// team can edit it without touching code. The app appends its own output
// rules because it renders TSV itself from structured JSON.
const METHOD = fs.readFileSync(path.join(__dirname, '..', 'prompts', 'copywriter-system-prompt.md'), 'utf8');

const APP_RULES = `
---

# Ad Copy Studio Operating Rules

These rules come from the Ad Copy Studio app and override the "Output Format" and "Response Behaviour" sections above. The app builds the TSV for the team from your JSON, so return JSON only.

- Return exactly the number of items requested for each field. Every item must be a distinct idea, not a reworded twin.
- When several creatives are written together, every line must be unique across the whole batch: no shared lines, openings or 5+ word phrases between creatives, in any field.
- Character limits are hard limits. Count characters (spaces and punctuation included) before you answer. When in doubt, go shorter.
- Headline counts from the "Headline Rules" section (3 to 7 words) give way to the platform limit and field purpose. Long headlines and descriptions follow their own limits.
- Tag every item with a short "angle" (2 to 4 words, e.g. "Offer clarity", "Community", "Bigger-pack value").
- Never use em dashes or en dashes. Use commas, full stops or colons instead.
- Never start a line with =, +, @ or a straight double quote (the team pastes copy into Google Sheets, which reads those as formulas or quoted fields). Write "Plus" or reorder the sentence instead.
- Only state offers, prices, dates, codes and claims that appear in the brief, the creative, or the client profile's evergreen facts. Past offers in the client database are history: do not reuse them unless the brief or the creative confirms they are live.
- When a client profile is supplied, match its voice, naming rules and approved examples. Treat the examples as a style benchmark, never copy them word for word or lift phrases of 6+ words from them.
`;

const SYSTEM_PROMPT = METHOD.trim() + '\n' + APP_RULES;

function fieldLabel(platform, key) {
  const f = platform.fields.find(x => x.key === key);
  return f ? f.label : key;
}

function requestedFields(platform, counts) {
  return FIELD_ORDER
    .map(key => platform.fields.find(f => f.key === key))
    .filter(f => f && counts[f.key] > 0);
}

function clientBlock(client, objective) {
  if (!client) return '';
  const v = client.brand_voice || {};
  const lines = [
    `CLIENT: ${client.name} (${client.business_unit || ''}, ${client.market || ''})`,
    client.currency ? `Currency: ${client.currency}` : '',
    client.website ? `Website: ${client.website}` : '',
    v.summary ? `Brand voice: ${v.summary}` : '',
    v.tone && v.tone.length ? `Tone: ${v.tone.join(', ')}` : '',
    v.signature_phrases && v.signature_phrases.length ? `Signature phrases (use naturally, do not force): ${v.signature_phrases.join(' | ')}` : '',
    v.rules && v.rules.length ? 'Naming and style rules:\n' + v.rules.map(r => `- ${r}`).join('\n') : '',
    v.avoid && v.avoid.length ? 'Avoid:\n' + v.avoid.map(r => `- ${r}`).join('\n') : '',
    client.products && client.products.length ? 'Products and evergreen facts:\n' + client.products.map(p => `- ${p.name}: ${p.description}`).join('\n') : '',
    client.historical_offers && client.historical_offers.length
      ? 'Past offers (history only, do NOT reuse unless the brief or creative confirms they are live):\n' + client.historical_offers.map(o => `- ${o}`).join('\n')
      : ''
  ].filter(Boolean);

  const examples = rankExamples(client, objective);
  if (examples.length) {
    lines.push(`\nAPPROVED COPY FROM PAST CAMPAIGNS (${examples.length} sets, ones matching this objective first). Style benchmark only:`);
    examples.forEach(ex => {
      lines.push(`\n[${ex.name}] objective: ${ex.objective}, offer type: ${ex.offer_type}, status: ${ex.status}`);
      if (ex.headlines && ex.headlines.length) lines.push('Headlines: ' + ex.headlines.map(h => `"${h}"`).join(' / '));
      (ex.primary_texts || []).forEach((t, i) => lines.push(`Primary text ${i + 1}: "${t}"`));
      (ex.descriptions || []).forEach((t, i) => lines.push(`Description ${i + 1}: "${t}"`));
    });
  }
  return lines.join('\n');
}

function customClientBlock(custom) {
  if (!custom || !custom.name) return '';
  return `CLIENT: ${custom.name} (not in the internal database)\n${custom.notes ? 'Brand notes from the team:\n' + custom.notes : 'No brand notes supplied. Infer tone from the creative and brief, and keep it neutral and on-brand.'}`;
}

function platformBlock(platform, counts) {
  const lines = [`PLATFORM: ${platform.name}`, 'Fields to write:'];
  requestedFields(platform, counts).forEach(f => {
    let line = `- ${f.key} ("${f.label}"): exactly ${counts[f.key]} item(s), each <= ${f.limit} characters. ${f.note}`;
    if (f.shortVariant) line += ` At least ${f.shortVariant.min} must be <= ${f.shortVariant.max} characters.`;
    lines.push(line);
  });
  if (platform.countMode === 'google') lines.push('Character counting: Google counts wide characters (Chinese, Japanese, Korean) as 2.');
  if (platform.rules && platform.rules.length) {
    lines.push('Platform rules:');
    platform.rules.forEach(r => lines.push(`- ${r}`));
  }
  return lines.join('\n');
}

function creativeIntro(creative) {
  if (creative && creative.type === 'read') {
    // Revision rounds don't re-send the images; they reuse the first read.
    const r = creative.read || {};
    return `Already analysed in the first round (images not re-sent).
On-screen text: ${r.on_screen_text || 'n/a'}
Creative role: ${r.creative_role || 'n/a'}
Offer: ${r.offer || 'n/a'}
Audience: ${r.audience || 'n/a'}
Copy job: ${r.copy_job || 'n/a'}`;
  }
  if (!creative) return 'No creative uploaded. Work from the brief alone.';
  if (creative.type === 'video') {
    return `A video ad. The ${creative.frames.length} images below are key frames in chronological order. Read the hook in the first frame, the narrative across frames, any on-screen text and the end card or CTA.`;
  }
  return 'A static ad (image below). Read the visual, the on-screen text, the offer and any CTA.';
}

function copyLines(copy, platform, counts) {
  const lines = [];
  requestedFields(platform, counts).forEach(f => {
    ((copy || {})[f.key] || []).forEach((item, i) => lines.push(`${f.key} ${i + 1}: "${item.text}"`));
  });
  return lines.join('\n');
}

// Header text placed before each creative's images.
function creativeHeader(item, i, platform, counts) {
  const parts = [`=== CREATIVE ${i + 1}: "${item.label}" ===`, creativeIntro(item.creative)];
  if (item.current) {
    parts.push('CURRENT COPY (may include the team\'s own edits, treat those as approved):\n' + copyLines(item.current, platform, counts));
  }
  return parts.join('\n');
}

function lessonsBlock(lessons) {
  if (!lessons || !lessons.length) return '';
  return 'TEAM LEARNINGS (rules learned from this team\'s past feedback. Follow them unless the brief says otherwise):\n'
    + lessons.map(l => `- ${l.text}`).join('\n');
}

// Shared context and task, placed after all creatives.
function buildBatchPrompt({ items, others, client, customClient, platform, objective, counts, brief, feedback, lessons }) {
  const n = items.length;
  const parts = [
    client ? clientBlock(client, objective) : customClientBlock(customClient),
    lessonsBlock(lessons),
    platformBlock(platform, counts),
    `OBJECTIVE: ${objective.label}. Follow the "${objective.promptName}" guidance in your instructions.`,
    brief ? `BRIEF / INSTRUCTIONS FROM THE TEAM (these take priority over generic rules):\n${brief}` : 'BRIEF: none supplied. Infer the offer and audience from each creative, and only state facts you can see.'
  ];

  if (others && others.length) {
    parts.push('OTHER CREATIVES IN THIS CAMPAIGN (not being rewritten; do not duplicate their lines, openings or phrases):\n'
      + others.map(o => `[${o.label}]\n${copyLines(o.copy, platform, counts)}`).join('\n\n'));
  }

  parts.push(`TASK:
1. Diagnose each creative first ("How You Should Think"): what it already says, the offer, the likely audience, and the job the copy must do. Classify its creative role.
2. ${n > 1 ? `Plan the whole table before writing. You are writing for ${n} creatives that will run side by side in the same campaign. Give each creative its own angles, built on what that specific creative shows. Variation 1, 2, 3 of one creative must not take the same angle or opening as variation 1, 2, 3 of the others.` : 'Give each variation its own angle.'}
3. Write the requested fields for ${platform.name}. Do not repeat a creative's on-screen text word for word; add a different layer.
4. Check every line against its character limit, the quality checklist${n > 1 ? ', and against every other creative\'s lines' : ''} before answering.
Return one entry in "creatives" per creative, in order, with "creative_number" (1 to ${n}) and "creative_read" (your diagnosis, one short line per field).`);

  if (feedback && feedback.length) {
    const history = feedback.filter(Boolean);
    const lines = ['REVISION ROUND. The team reviewed the copy above and wants changes.'];
    if (history.length > 1) {
      lines.push('EARLIER FEEDBACK (already applied, keep respecting it):');
      history.slice(0, -1).forEach(f => lines.push(`- ${f}`));
    }
    lines.push(`NEW FEEDBACK:\n${history[history.length - 1]}`, '',
      'Apply the new feedback to each creative listed above. Return the full set for each one with the same number of items per field, in the same order. If the feedback only concerns some fields or lines, keep the others exactly as they are. Every line must still meet its character limit and stay unique across creatives.');
    parts.push(lines.join('\n'));
  }
  return parts.filter(Boolean).join('\n\n');
}

const READ_SCHEMA = {
  type: 'object',
  properties: {
    on_screen_text: { type: 'string' },
    creative_role: { type: 'string' },
    offer: { type: 'string' },
    audience: { type: 'string' },
    copy_job: { type: 'string' }
  },
  required: ['on_screen_text', 'creative_role', 'offer', 'audience', 'copy_job'],
  additionalProperties: false
};

// JSON schema for structured outputs, restricted to the requested fields.
function buildSchema(platform, counts) {
  const item = {
    type: 'object',
    properties: { text: { type: 'string' }, angle: { type: 'string' } },
    required: ['text', 'angle'],
    additionalProperties: false
  };
  const properties = { creative_number: { type: 'integer' }, creative_read: READ_SCHEMA };
  const required = ['creative_number', 'creative_read'];
  requestedFields(platform, counts).forEach(f => {
    properties[f.key] = { type: 'array', items: item };
    required.push(f.key);
  });
  return {
    type: 'object',
    properties: { creatives: { type: 'array', items: { type: 'object', properties, required, additionalProperties: false } } },
    required: ['creatives'],
    additionalProperties: false
  };
}

const REPAIR_SCHEMA = {
  type: 'object',
  properties: {
    fixes: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          creative_number: { type: 'integer' },
          field: { type: 'string' },
          index: { type: 'integer' },
          text: { type: 'string' },
          angle: { type: 'string' }
        },
        required: ['creative_number', 'field', 'index', 'text', 'angle'],
        additionalProperties: false
      }
    }
  },
  required: ['fixes'],
  additionalProperties: false
};

// problems carry a 0-based `creative`; the prompt uses 1-based numbers.
function buildRepairPrompt(problems, platform, batch) {
  const lines = ['Some lines break the rules. Fix only the items listed below and return them as "fixes" (index is 0-based, creative_number is 1-based).', ''];
  problems.forEach(p => {
    const label = fieldLabel(platform, p.field);
    const who = `Creative ${p.creative + 1}`;
    if (p.type === 'over_limit') {
      lines.push(`- ${who}, ${p.field} index ${p.index} (${label}) is ${p.length} characters, limit ${p.limit}: "${p.text}". Rewrite it to ${p.limit} characters or fewer, keeping the same angle.`);
    } else if (p.type === 'missing') {
      lines.push(`- ${who}, ${p.field} index ${p.index} (${label}) is missing. Write a new, distinct item of ${p.limit} characters or fewer.`);
    } else if (p.type === 'short_variant') {
      const items = ((batch[p.creative] || {}).copy || {})[p.field] || [];
      const longest = items
        .map((it, index) => ({ index, len: Array.from(it.text || '').length }))
        .sort((a, b) => b.len - a.len)
        .slice(0, p.needed)
        .map(x => x.index);
      lines.push(`- ${who}, ${p.field} (${label}) needs ${p.needed} more item(s) of ${p.max} characters or fewer. Rewrite index ${longest.join(', ')} to ${p.max} characters or fewer.`);
    } else if (p.type === 'too_similar') {
      lines.push(`- ${who}, ${p.field} index ${p.index} (${label}): "${p.text}" is too close to "${p.otherText}" (${p.otherLabel}). Write a genuinely different line: new angle, new opening, no shared phrases. Keep it to ${(platform.fields.find(f => f.key === p.field) || {}).limit} characters or fewer.`);
    } else if (p.type === 'copied_example') {
      lines.push(`- ${who}, ${p.field} index ${p.index} (${label}): "${p.text}" lifts a phrase from the approved example "${p.otherText}". Rewrite it in fresh words with the same intent, ${(platform.fields.find(f => f.key === p.field) || {}).limit} characters or fewer.`);
    }
  });
  lines.push('', 'Keep the same client voice and objective. Count characters carefully. Use field names exactly as given.');
  return lines.join('\n');
}

// Approved lines for the copied-phrase check.
function exampleLines(client) {
  if (!client) return [];
  return client.approved_copy.flatMap(ex => [...(ex.headlines || []), ...(ex.primary_texts || []), ...(ex.descriptions || [])]);
}

module.exports = { SYSTEM_PROMPT, buildBatchPrompt, creativeHeader, buildSchema, buildRepairPrompt, REPAIR_SCHEMA, requestedFields, exampleLines, copyLines };
