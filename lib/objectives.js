'use strict';

// Ad objectives, matching the "Objective-Based Guidance" sections of
// prompts/copywriter-system-prompt.md. `tags` are the objective tags used on
// approved examples in data/clients/*.json, so matching examples surface first.

const OBJECTIVES = [
  { id: 'branding', label: 'Branding / Awareness', promptName: 'Branding Ads', tags: ['branding'] },
  { id: 'traffic', label: 'Traffic', promptName: 'Traffic Ads', tags: ['traffic'] },
  { id: 'lead_gen', label: 'Lead generation', promptName: 'Lead Generation Ads', tags: ['lead_gen'] },
  { id: 'conversion', label: 'Conversion / Sales', promptName: 'Conversion / Sales Ads', tags: ['conversion'] },
  { id: 'retention', label: 'Retention / Membership', promptName: 'Retention / Membership / Subscription Ads', tags: ['retention'] },
  { id: 'social_commerce', label: 'Social commerce', promptName: 'Social Commerce Creative', tags: ['conversion'] }
];

const OBJECTIVE_MAP = Object.fromEntries(OBJECTIVES.map(o => [o.id, o]));

function getObjective(id) {
  return OBJECTIVE_MAP[id] || null;
}

module.exports = { OBJECTIVES, getObjective };
