"""Meta Ads page content. None means "not confirmed yet": it stays off the live page and build.py lists it.

Every slot except process and fit is written for Meta specifically. When copying this file for another
platform, rewrite those slots from scratch rather than editing names, so no Meta wording carries over.
"""

PAGE = {
    "key": "meta",
    "name": "Meta Ads",
    "crumb": "Meta advertising",
    "short": "Meta",
    "accent": "#ffefae",
    # Slots placed on the site's navy sections (set those sections' background to this colour in Squarespace)
    "dark": {"shift": "#253551", "problems": "#253551"},
    # Hero numbers as a colour plate from Wada combination 281 (no colour names shown on the page)
    "poster": [
        # tex is the texture colour; hover swaps to another colour from the same Wada combination
        {"value": "$2M+", "label": "Meta ad spend managed", "bg": "#007190", "fg": "#ffffff", "tex": "rgba(255, 255, 255, .22)",
         "hover": {"bg": "#ffefae", "fg": "#233551", "tex": "rgba(35, 53, 81, .2)"}},
        {"value": "10+", "label": "Markets in Asia", "bg": "#ffefae", "fg": "#233551", "tex": "rgba(35, 53, 81, .16)",
         "hover": {"bg": "#00978d", "fg": "#04202c", "num": "#ffffff", "tex": "rgba(255, 255, 255, .25)"}},
        {"value": "1 team", "label": "Strategy, creative, media and data", "bg": "#96d1aa", "fg": "#233551", "tex": "rgba(35, 53, 81, .18)",
         "hover": {"bg": "#007190", "fg": "#ffffff", "tex": "rgba(255, 255, 255, .22)"}},
        {"value": "500", "label": "Meta creatives ran", "bg": "#00978d", "fg": "#04202c", "num": "#ffffff", "tex": "rgba(255, 255, 255, .2)",
         "hover": {"bg": "#96d1aa", "fg": "#233551", "tex": "rgba(35, 53, 81, .16)"}},
    ],

    "logos": [("oatside", "Oatside"), ("yoga-movement", "Yoga Movement"), ("flexar", "Flexar"), ("strong-pilates", "Strong Pilates Singapore")],
    "logos_label": "Brands we work with",  # Social group colour, matching the platforms section on the performance page
    "slug": "meta-ads-agency-singapore",
    "title": "Meta Ads & Advertising Agency Singapore | MajorForm",
    "description": "MajorForm plans, produces and optimises Meta ads on Facebook and Instagram for brands in Singapore and across Asia, with in-house creative and clear reports.",
    "service_name": "Meta Ads Management",
    # Facts used on the page that you should confirm before it goes live
    "confirm": [
        "Oatside's +30% ROAS year on year came from Meta campaigns",
        "Process timings (audit week 1, testing weeks 2 to 4, scaling from month 2)",
        "Which 10+ markets to list in the schema (it names six Southeast Asian countries today)",
        "$2M+ is Meta ad spend specifically, and 500 is Meta creatives run specifically",
    ],
    "markets": ["Singapore", "Malaysia", "Indonesia", "Philippines", "Thailand", "Vietnam"],

    # 1 Hero
    "h1": "From Attention to Action. Powered by Meta.",
    "thesis": "Creative, data and optimisation, working as one system.",
    "answer": ("MajorForm plans, produces and optimises Meta ads across Facebook and Instagram for brands in Singapore and "
               "across Asia. One team runs strategy, creative production, media buying and measurement, so every ad we make "
               "is built to be tested and tied to ROAS, cost per acquisition or brand lift."),
    "stats": [
        ("$2M+", "Meta ad spend managed"),
        ("10+", "Asian markets"),
        ("500", "Meta creatives produced"),
    ],

    # 2 What's changed
    "shift": {
        "label": "What's changed on Meta",
        "title": "How Meta decides who sees your ads",
        "lede": ("Meta's AI now does the targeting. It reads every ad, matches it to the people most likely to act, and learns "
                 "from what happens next. Each step has changed, and each one needs a different skill. Here's the loop, and how we handle it."),
        "who": {"you": "You control this", "meta": "Meta controls this"},
        "we_label": "How we handle it",
        "steps": [
            {"who": "you", "bg": "#ffefae", "fg": "#233551", "title": "You give Meta the ads",
             "changed": "Meta can only find people for the ads it has, and Andromeda now rewards many genuinely different ads over one polished hero.",
             "we": "Our in-house production team makes and tests new angles, hooks and formats continuously."},
            {"who": "meta", "bg": "transparent", "fg": "rgba(243, 242, 247, .86)", "title": "Meta's AI matches them to people",
             "changed": "Broad audiences and Advantage+ have replaced most manual targeting. The AI needs room and budget to learn.",
             "we": "We build fewer, broader campaigns with clear testing rules, so the AI learns fast instead of stalling."},
            {"who": "you", "bg": "#96d1aa", "fg": "#233551", "title": "Results teach it what works",
             "changed": "Every purchase and lead Meta can see sharpens the next round. Since iOS privacy changes, it sees fewer of them unless tracking is set up properly.",
             "we": "We set up Conversions API, GA4 and your sales data, and report on revenue, not just clicks."},
        ],
        "close_lead": "Two of the three steps are yours.",
        "close": "One team of strategy, creative, media and data handles both, and sets up the third to work in your favour.",
    },

    # 3 Problems and fixes
    "problems_title": "The Meta problems we fix",
    "problem_viz": ["fatigue", "structure", "measurement"],
    "problems": [
        ("Creative fatigue", "Winning ads stop working within weeks, and costs creep up.",
         "A creative pipeline", "Our in-house production team makes new angles, hooks and formats every week, so a fresh ad is always ready to test."),
        ("A messy account", "Too many campaigns split the budget and keep Meta stuck in its learning phase.",
         "A simpler structure", "Fewer, broader campaigns with enough budget to learn, and clear rules for what gets tested and when."),
        ("Numbers you can't trust", "What Meta reports doesn't match what you see in sales.",
         "Clean measurement", "Conversions API, GA4 and your sales data set up and reconciled, with reporting tied to revenue."),
    ],

    # 4 The work: add real ads by uploading each image to Squarespace and pasting its URL into src
    "work_title": "Meta ads we've made",
    "work_lede": "Made by our in-house production team for Facebook and Instagram placements, and tested in-market.",
    "work": [
        {"src": None, "alt": "Oatside Reels ad", "title": "Reels hook test", "note": "Oatside"},
        {"src": None, "alt": "", "title": "UGC review", "note": "[brand]: what it tested"},
        {"src": None, "alt": "", "title": "Static offer", "note": "[brand]: what it tested"},
        {"src": None, "alt": "", "title": "Carousel", "note": "[brand]: what it tested"},
        {"src": None, "alt": "", "title": "Founder story", "note": "[brand]: what it tested"},
        {"src": None, "alt": "", "title": "Catalogue ad", "note": "[brand]: what it tested"},
    ],

    # 5 Campaign types
    "types_title": "Meta campaign types we run",
    "types_lede": "We pick the campaign type from your goal, then judge it against one number.",
    "types": [
        ("Advantage+ sales", "Formerly Advantage+ Shopping. For ecommerce brands with a product catalogue.", "Optimised for ROAS"),
        ("Manual sales campaigns", "For tighter control of audiences, placements and offers.", "Optimised for CPA"),
        ("Lead campaigns", "Instant forms and site leads for services, education and property.", "Optimised for CPL"),
        ("Catalogue retargeting", "Shows people the products they viewed but didn't buy.", "Optimised for ROAS"),
        ("Engagement and messaging", "Conversations in Messenger, WhatsApp and Instagram DMs.", "Optimised for cost per conversation"),
        ("Awareness and reach", "For launches and new markets, with frequency control.", "Optimised for CPM and ad recall"),
    ],

    # 6 Results: Meta results only, with brand names
    "results_title": "Meta results",
    "results_lede": "Numbers from Meta campaigns we run.",
    "results": [
        {"brand": "Oatside", "value": "+30%", "label": "Increase in ROAS year on year",
         "url": "https://www.majorform.co/our-work/oatside-digital-marketing-majorform-2026"},
        {"brand": None, "value": None, "label": "[result on Meta]", "url": None},
        {"brand": None, "value": None, "label": "[result on Meta]", "url": None},
    ],
    "quote": {"text": None, "who": None},

    # 7 Process (shared across platform pages)
    "process_lede": "Most accounts are scaling by month two.",
    "process": [
        ("Audit", "We review your account structure, tracking, creative and spend, and agree the one KPI that matters.", "Week 1"),
        ("Test", "We launch structured tests of creative angles, audiences and campaign types against that KPI.", "Weeks 2 to 4"),
        ("Scale", "We move budget to what wins, refresh creative before it tires, and report every week.", "Month 2 onwards"),
    ],

    # 8 Fit and terms
    "fit_title": "Is MajorForm right for you on Meta?",
    "fit": [
        ("Good fit", "Fast-growing startups, DTC brands and regional businesses that want to scale profitably on Meta."),
        ("How we charge", "A monthly retainer, not a commission on your ad spend."),
        ("Starting ad spend", None),
        ("Your accounts", None),
    ],

    # 9 FAQs (also written into the FAQPage schema)
    "faqs": [
        ("How much does it cost to run Meta ads in Singapore?",
         "It depends on your goal and market. Meta's delivery works best when each ad set gets about 50 conversions a week, "
         "so we size the test budget around that, agree it with you before launch, then scale what works. Our fee is a "
         "monthly retainer, not a commission on spend."),
        ("How long before Meta ads show results?",
         "Most accounts leave Meta's learning phase within one to two weeks. Clients typically see clear improvements in "
         "CPA or ROAS within 30 to 60 days, once creative testing has found winners."),
        ("What is Meta's Andromeda update, and what should I change?",
         "Andromeda is the system Meta uses to choose which ads to show each person. It favours accounts with many "
         "genuinely different ads, so the biggest lever is now creative variety: different angles, hooks and formats, "
         "not small edits of one ad."),
        ("Should I use Advantage+ or manual campaigns?",
         "Usually both. Advantage+ sales campaigns find buyers efficiently at scale, while manual campaigns give control "
         "for launches, specific audiences and tests. We split budget based on your catalogue, data and goals."),
        ("Do you make the ad creative in-house?",
         "Yes. Our production team makes static, video and UGC-style ads for Facebook and Instagram placements, and we "
         "read results by creative, not just by campaign, so every round of ads learns from the last."),
        ("Meta or TikTok: which should I start with?",
         "Start where your customers already spend time and where you can make enough creative. Meta suits most brands "
         "first because of its reach and retargeting; TikTok suits brands that can feed it native, creator-led video. "
         "Many clients run both."),
    ],

    # 10 Related and closing
    "related": [
        ("TikTok Ads", None),
        ("Search Ads", None),
        ("TikTok Shop Ads", None),
        ("Social media content", "https://www.majorform.co/social-media-management-singapore-2026"),
    ],
    "closing": "Ready to grow on Meta?",
}
