'use strict';

// Character limits per platform / ad format, last verified September 2026.
//
// `limit`    - the number the generator writes to and validates against. For
//              Meta, TikTok and LinkedIn this is the recommended length before
//              the text truncates ("See more"); for Google it is the hard cap.
// `hardMax`  - the platform's absolute cap, shown for reference only.
// `slots`    - how many variations the platform accepts in a single ad.
// `maxCount` - the most variations the UI lets you request (can exceed `slots`
//              when you want extra options to test across ads).
// `shortVariant` - at least `min` items in the field must be <= `max` chars.
//
// Field keys are shared across platforms so the generator and UI stay generic:
//   headlines, long_headlines, primary_texts, descriptions

const PLATFORMS = [
  {
    id: 'meta',
    group: 'Meta',
    name: 'Meta - Feed, Stories & Reels',
    summary: 'Facebook and Instagram single image or video ads.',
    countMode: 'standard',
    fields: [
      {
        key: 'primary_texts', label: 'Primary text', limit: 125, hardMax: 2200, slots: 5, maxCount: 10, defaultCount: 3,
        note: 'About 125 characters show before "See more". Lead with the key message.'
      },
      {
        key: 'headlines', label: 'Headline', limit: 40, hardMax: 255, slots: 5, maxCount: 10, defaultCount: 3,
        note: 'Recommended 40. Facebook Feed shows about 27 in full on mobile.'
      },
      {
        key: 'descriptions', label: 'Description', limit: 30, hardMax: 255, slots: 5, maxCount: 10, defaultCount: 0,
        note: 'Only shows on some placements (e.g. Facebook Feed, Marketplace).'
      }
    ],
    rules: [
      'Meta personal attributes policy: never imply you know the viewer\'s health, body, weight, age, finances or other personal attributes (avoid "Are you overweight?", "Your stiff back"). Speak to the offer or the experience instead.',
      'Avoid before/after claims, guaranteed results, or body-shaming language.',
      'Emojis are allowed but optional. Use them sparingly, and never in headlines.'
    ],
    sources: [
      'https://www.facebook.com/business/ads-guide',
      'https://superscale.ai/learn/meta-ad-sizes',
      'https://socialrails.com/blog/facebook-ad-character-limits'
    ]
  },
  {
    id: 'meta_carousel',
    group: 'Meta',
    name: 'Meta - Carousel',
    summary: 'Carousel cards on Facebook and Instagram.',
    countMode: 'standard',
    fields: [
      {
        key: 'primary_texts', label: 'Primary text', limit: 80, hardMax: 2200, slots: 1, maxCount: 10, defaultCount: 3,
        note: 'Carousel primary text sits above every card. Keep it to about 80 characters.'
      },
      {
        key: 'headlines', label: 'Card headline', limit: 32, hardMax: 255, slots: 10, maxCount: 10, defaultCount: 3,
        note: 'Published guidance ranges from 20 to 45. We use 32 as a safe middle; cards truncate fast.'
      },
      {
        key: 'descriptions', label: 'Card description', limit: 18, hardMax: 255, slots: 10, maxCount: 10, defaultCount: 0,
        note: 'Very short. Often hidden on Instagram.'
      }
    ],
    rules: [
      'Meta personal attributes policy: never imply you know the viewer\'s health, body, weight, age, finances or other personal attributes.',
      'Card headlines should work as a sequence but each must still make sense on its own.'
    ],
    sources: ['https://www.facebook.com/business/ads-guide', 'https://superscale.ai/learn/meta-ad-sizes', 'https://admanage.ai/blog/meta-carousel-ad-specs']
  },
  {
    id: 'tiktok',
    group: 'TikTok',
    name: 'TikTok - In-Feed',
    summary: 'In-Feed video ads (Auction, Smart+).',
    countMode: 'standard',
    fields: [
      {
        key: 'primary_texts', label: 'Ad text', limit: 100, hardMax: 100, slots: 5, maxCount: 10, defaultCount: 3,
        note: 'Hard cap 100. Only the first 40 to 50 characters show before "See more".'
      }
    ],
    rules: [
      'TikTok has no separate headline or description field. The ad text is the only copy.',
      'Front-load the hook in the first 40 characters.',
      'Do not use emojis, hashtags or curly braces { } in ad text. They are rejected or render inconsistently.',
      'Write like a creator, not a brand. Casual, direct, native to TikTok.'
    ],
    sources: [
      'https://ads.tiktok.com/help/article/tiktok-auction-in-feed-ads',
      'https://blog.adnabu.com/tiktok/tiktok-ad-specs/',
      'https://tlinky.com/tiktok-ad-copy-character-limit/'
    ]
  },
  {
    id: 'google_rsa',
    group: 'Google',
    name: 'Google Search - Responsive Search Ad',
    summary: 'Headlines and descriptions are mixed and matched by Google.',
    countMode: 'google',
    fields: [
      {
        key: 'headlines', label: 'Headline', limit: 30, hardMax: 30, slots: 15, maxCount: 15, defaultCount: 10,
        note: 'Hard cap 30. Google needs at least 3 and accepts up to 15.'
      },
      {
        key: 'descriptions', label: 'Description', limit: 90, hardMax: 90, slots: 4, maxCount: 4, defaultCount: 4,
        note: 'Hard cap 90. Google needs at least 2 and accepts up to 4.'
      }
    ],
    rules: [
      'Every headline must make sense next to any other headline, in any order.',
      'Include the brand name in at least one headline and a keyword-led headline for the core product.',
      'Google Ads editorial policy: no exclamation marks in headlines, no repeated punctuation, no gimmicky capitalisation (e.g. FREE), no emojis.',
      'Wide-character scripts (Chinese, Japanese, Korean) count as 2 characters each.'
    ],
    sources: [
      'https://support.google.com/google-ads/answer/7684791',
      'https://megadigital.ai/en/blog/google-ads-character-limit/'
    ]
  },
  {
    id: 'google_pmax',
    group: 'Google',
    name: 'Google - Performance Max',
    summary: 'Text assets for Performance Max asset groups.',
    countMode: 'google',
    fields: [
      {
        key: 'headlines', label: 'Headline', limit: 30, hardMax: 30, slots: 15, maxCount: 15, defaultCount: 5,
        note: 'Hard cap 30. Up to 15 per asset group.'
      },
      {
        key: 'long_headlines', label: 'Long headline', limit: 90, hardMax: 90, slots: 5, maxCount: 5, defaultCount: 3,
        note: 'Hard cap 90. Up to 5.'
      },
      {
        key: 'descriptions', label: 'Description', limit: 90, hardMax: 90, slots: 5, maxCount: 5, defaultCount: 4,
        note: 'Hard cap 90. At least one description must be 60 or fewer.',
        shortVariant: { max: 60, min: 1 }
      }
    ],
    rules: [
      'Assets are combined automatically, so each one must stand alone.',
      'Google Ads editorial policy: no exclamation marks in headlines, no repeated punctuation, no gimmicky capitalisation, no emojis.',
      'Wide-character scripts (Chinese, Japanese, Korean) count as 2 characters each.'
    ],
    sources: ['https://support.google.com/google-ads/answer/10724896', 'https://megadigital.ai/en/blog/google-ads-character-limit/']
  },
  {
    id: 'google_demand_gen',
    group: 'Google',
    name: 'Google - Demand Gen / YouTube',
    summary: 'Demand Gen image and video ads across YouTube, Discover and Gmail.',
    countMode: 'google',
    fields: [
      {
        key: 'headlines', label: 'Headline', limit: 40, hardMax: 40, slots: 5, maxCount: 5, defaultCount: 5,
        note: 'Hard cap 40. At least one must be 30 or fewer so the ad can serve on Display.',
        shortVariant: { max: 30, min: 1 }
      },
      {
        key: 'long_headlines', label: 'Long headline (video)', limit: 90, hardMax: 90, slots: 5, maxCount: 5, defaultCount: 0,
        note: 'Video ads only. Hard cap 90.'
      },
      {
        key: 'descriptions', label: 'Description', limit: 90, hardMax: 90, slots: 5, maxCount: 5, defaultCount: 3,
        note: 'Hard cap 90.'
      }
    ],
    rules: [
      'Google Ads editorial policy: no exclamation marks in headlines, no repeated punctuation, no gimmicky capitalisation, no emojis.',
      'Wide-character scripts (Chinese, Japanese, Korean) count as 2 characters each.'
    ],
    sources: ['https://support.google.com/google-ads/answer/17091672', 'https://www.datafeedwatch.com/blog/demand-gen-specs-explained']
  },
  {
    id: 'linkedin',
    group: 'LinkedIn',
    name: 'LinkedIn - Sponsored Content',
    summary: 'Single image and video Sponsored Content.',
    countMode: 'standard',
    fields: [
      {
        key: 'primary_texts', label: 'Introductory text', limit: 150, hardMax: 600, slots: 1, maxCount: 10, defaultCount: 3,
        note: 'Hard cap 600. About 150 show before "...see more" (and those clicks are paid).'
      },
      {
        key: 'headlines', label: 'Headline', limit: 70, hardMax: 70, slots: 1, maxCount: 10, defaultCount: 3,
        note: 'Hard cap 70. Keep it tighter on mobile.'
      },
      {
        key: 'descriptions', label: 'Description', limit: 100, hardMax: 300, slots: 1, maxCount: 10, defaultCount: 0,
        note: 'Only shows on LinkedIn Audience Network placements.'
      }
    ],
    rules: ['Professional but human. Lead with a specific benefit, not buzzwords.'],
    sources: ['https://www.linkedin.com/help/lms/answer/a426534', 'https://adplus.com/tools/ad-specs-validator/linkedin-ads-character-limits']
  }
];

const PLATFORM_MAP = Object.fromEntries(PLATFORMS.map(p => [p.id, p]));

const FIELD_ORDER = ['headlines', 'long_headlines', 'primary_texts', 'descriptions'];

function getPlatform(id) {
  return PLATFORM_MAP[id] || null;
}

module.exports = { PLATFORMS, FIELD_ORDER, getPlatform };
