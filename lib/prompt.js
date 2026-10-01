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
- Character limits are hard limits. Count characters (spaces and punctuation included) before you answer. When in doubt, go shorter.
- Headline counts from the "Headline Rules" section (3 to 7 words) give way to the platform limit and field purpose. Long headlines and descriptions follow their own limits.
- Tag every item with a short "angle" (2 to 4 words, e.g. "Offer clarity", "Community", "Bigger-pack value").
- Never use em dashes or en dashes. Use commas, full stops or colons instead.
- Never start a line with =, +, @ or a straight double quote (the team pastes copy into Google Sheets, which reads those as formulas or quoted fields). Write "Plus" or reorder the sentence instead.
- Only state offers, prices, dates, codes and claims that appear in the brief, the creative, or the client profile's evergreen facts. Past offers in the client database are history: do not reuse them unless the brief or the creative confirms they are live.
- When a client profile is supplied, match its voice, naming rules and approved examples. Treat the examples as a style benchmark, never copy them word for word.
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
    return `CREATIVE: "${creative.label}" (already analysed in the first round, images not re-sent).
On-screen text: ${r.on_screen_text || 'n/a'}
Creative role: ${r.creative_role || 'n/a'}
Offer: ${r.offer || 'n/a'}
Audience: ${r.audience || 'n/a'}
Copy job: ${r.copy_job || 'n/a'}`;
  }
  if (!creative) {
    return 'CREATIVE: none uploaded. Work from the brief alone.';
  }
  if (creative.type === 'video') {
    return `CREATIVE: "${creative.label}", a video ad. The images above are ${creative.frames.length} key frames in chronological order. Read the hook in the first frame, the narrative across frames, any on-screen text and the end card or CTA.`;
  }
  return `CREATIVE: "${creative.label}", a static ad (image above). Read the visual, the on-screen text, the offer and any CTA.`;
}

function revisionBlock(revision, platform, counts) {
  const lines = ['REVISION ROUND. The team reviewed your copy and wants changes.', '', 'CURRENT COPY (may include the team\'s own edits, treat those as approved):'];
  requestedFields(platform, counts).forEach(f => {
    (revision.current[f.key] || []).forEach((item, i) => lines.push(`${f.key} ${i + 1}: "${item.text}"`));
  });
  const history = revision.feedback.filter(Boolean);
  if (history.length > 1) {
    lines.push('', 'EARLIER FEEDBACK (already applied, keep respecting it):');
    history.slice(0, -1).forEach(f => lines.push(`- ${f}`));
  }
  lines.push('', `NEW FEEDBACK:\n${history[history.length - 1]}`, '',
    'Apply the new feedback. Return the full set with the same number of items per field, in the same order. If the feedback only concerns some fields or lines, keep the others exactly as they are. Every line must still meet its character limit.');
  return lines.join('\n');
}

// Builds the user-turn text for one creative (or brief-only run).
function buildUserPrompt({ creative, client, customClient, platform, objective, counts, brief, revision }) {
  const parts = [
    creativeIntro(creative),
    client ? clientBlock(client, objective) : customClientBlock(customClient),
    platformBlock(platform, counts),
    `OBJECTIVE: ${objective.label}. Follow the "${objective.promptName}" guidance in your instructions.`,
    brief ? `BRIEF / INSTRUCTIONS FROM THE TEAM (these take priority over generic rules):\n${brief}` : 'BRIEF: none supplied. Infer the offer and audience from the creative, and only state facts you can see.',
    `TASK:
1. Diagnose the ad first ("How You Should Think"): objective, what the creative already says, the offer, the likely audience, and the job the copy must do. Classify the creative role.
2. Write the requested fields for ${platform.name}. Do not repeat the creative's on-screen text word for word; add a different layer.
3. Check every item against its character limit and the quality checklist before answering.
Fill "creative_read" with your diagnosis in one short line per field.`
  ];
  if (revision) parts.push(revisionBlock(revision, platform, counts));
  return parts.filter(Boolean).join('\n\n');
}

// JSON schema for structured outputs, restricted to the requested fields.
function buildSchema(platform, counts) {
  const item = {
    type: 'object',
    properties: { text: { type: 'string' }, angle: { type: 'string' } },
    required: ['text', 'angle'],
    additionalProperties: false
  };
  const properties = {
    creative_read: {
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
    }
  };
  const required = ['creative_read'];
  requestedFields(platform, counts).forEach(f => {
    properties[f.key] = { type: 'array', items: item };
    required.push(f.key);
  });
  return { type: 'object', properties, required, additionalProperties: false };
}

const REPAIR_SCHEMA = {
  type: 'object',
  properties: {
    fixes: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          field: { type: 'string' },
          index: { type: 'integer' },
          text: { type: 'string' },
          angle: { type: 'string' }
        },
        required: ['field', 'index', 'text', 'angle'],
        additionalProperties: false
      }
    }
  },
  required: ['fixes'],
  additionalProperties: false
};

function buildRepairPrompt(problems, platform, copy) {
  const lines = ['Some of the copy you wrote breaks the platform rules. Fix only the items listed below and return them as "fixes".', ''];
  problems.forEach(p => {
    const label = fieldLabel(platform, p.field);
    if (p.type === 'over_limit') {
      lines.push(`- ${p.field} index ${p.index} (${label}) is ${p.length} characters, limit ${p.limit}: "${p.text}". Rewrite it to ${p.limit} characters or fewer, keeping the same angle.`);
    } else if (p.type === 'missing') {
      lines.push(`- ${p.field} index ${p.index} (${label}) is missing. Write a new, distinct item of ${p.limit} characters or fewer.`);
    } else if (p.type === 'short_variant') {
      const items = copy[p.field] || [];
      const longest = items
        .map((it, index) => ({ index, len: Array.from(it.text || '').length }))
        .sort((a, b) => b.len - a.len)
        .slice(0, p.needed)
        .map(x => x.index);
      lines.push(`- ${p.field} (${label}) needs ${p.needed} more item(s) of ${p.max} characters or fewer. Rewrite index ${longest.join(', ')} to ${p.max} characters or fewer.`);
    }
  });
  lines.push('', 'Keep the same client voice and objective. Count characters carefully. Use field names exactly as given.');
  return lines.join('\n');
}

module.exports = { SYSTEM_PROMPT, buildUserPrompt, buildSchema, buildRepairPrompt, REPAIR_SCHEMA, requestedFields };
