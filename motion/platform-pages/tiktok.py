"""TikTok Ads page content. None means "not confirmed yet": it stays off the live page and build.py lists it.

Built from the Meta sheet's structure, with every platform-specific slot rewritten for TikTok.
Process is shared across platform pages; fit is shared apart from its title.
"""

PAGE = {
    "key": "tiktok",
    "name": "TikTok Ads",
    "crumb": "TikTok advertising",
    "short": "TikTok",
    "accent": "#f8b6ba",
    # Wada 264: Corinthian Pink, Red Orange, Dark Greenish Glaucous, Cerulean Blue
    "arrow": "#dd4027",  # arrow on the white circles between cards
    "hi": "#f8b6ba",  # highlight text on the navy sections and the results tag
    # Slots placed on the site's navy sections (set those sections' background to this colour in Squarespace)
    "dark": {"shift": "#253551", "types": "#253551"},
    "slots": ["hero", "shift", "types", "results", "work", "process", "fit", "faq", "related"],
    # Hero numbers as a colour plate from Wada combination 264 (the Meta page uses 281)
    "poster": [
        {"value": "$2M+", "label": "Ad spend managed", "bg": "#0093a5", "fg": "#ffffff", "hover": {"bg": "#f8b6ba", "fg": "#233551"}},
        {"value": "10+", "label": "Markets in Asia", "bg": "#f8b6ba", "fg": "#233551", "hover": {"bg": "#0093a5", "fg": "#ffffff"}},
        {"value": "1 team", "label": "Strategy, creative, media and data", "bg": "#dd4027", "fg": "#ffffff", "hover": {"bg": "#b7c2a9", "fg": "#233551"}},
        {"value": "LIVE", "label": "TikTok Shop and livestream selling", "bg": "#b7c2a9", "fg": "#233551", "hover": {"bg": "#dd4027", "fg": "#ffffff"}},
    ],

    "logos": [("blackmores", "Blackmores"), ("the-ordinary", "The Ordinary"), ("dettol", "Dettol"), ("sunday", "Sunday"), ("urban-company", "Urban Company")],
    "logos_label": "Brands we work with",
    "slug": "tiktok-ads-agency-singapore",
    "title": "TikTok Ads & Advertising Agency Singapore | MajorForm",
    "description": "MajorForm plans, produces and optimises TikTok ads, Spark Ads and TikTok Shop campaigns for brands in Singapore and across Asia, with in-house creative.",
    "service_name": "TikTok Ads Management",
    "confirm": [
        "$2M+ ad spend managed: is it right to show across all platforms here? Send a TikTok-only figure if you'd rather",
        "The five logos are brands from your homepage marquee; swap in the ones you run TikTok for",
        "Process timings (research week 1, plan week 2, tests weeks 3 to 6, scaling from month 2) and weekly reporting",
        "Which 10+ markets to list in the schema (it names six Southeast Asian countries today)",
    ],
    "markets": ["Singapore", "Malaysia", "Indonesia", "Philippines", "Thailand", "Vietnam"],

    # 1 Hero
    "h1": "From Scroll to Sale. Powered by TikTok.",
    "thesis": "Native creative, data and optimisation, working as one system.",
    "answer": ("MajorForm plans, produces and optimises TikTok ads for brands in Singapore and across Asia, from in-feed "
               "and Spark Ads to TikTok Shop and LIVE. One team runs strategy, creative production, media buying and "
               "measurement, so every video we make is built to be tested and tied to sales, cost per acquisition or reach."),
    "stats": [
        ("$2M+", "Ad spend managed"),
        ("10+", "Asian markets"),
        ("LIVE", "TikTok Shop and livestream selling"),
    ],

    # 2 How TikTok works, and how we handle each step
    "shift": {
        "label": "How TikTok works",
        "title": "How TikTok works, and how we work with it.",
        "lede": ("TikTok shows each video to people based on what they watch, not who they follow. Doing well there takes "
                 "three things: creative people stop for, room for the algorithm to find buyers, and results tied to sales. "
                 "Here's how we handle each one."),
        "we_label": "How we handle it",
        "steps": [
            {"who": "you", "bg": "#f8b6ba", "fg": "#233551", "title": "Creative made for the feed",
             "changed": "People scroll fast, and ads that look like ads get skipped. TikTok rewards videos that feel native and hook people in the first few seconds, and tires of them quickly.",
             "we": "Our in-house production team makes native, sound-on videos and tests new hooks and formats continuously."},
            {"who": "meta", "bg": "transparent", "fg": "rgba(243, 242, 247, .86)", "title": "TikTok's algorithm finds the audience",
             "changed": "TikTok tries each video on a small audience, then shows it to more people like the ones who watched. Broad targeting and Smart+ campaigns usually beat narrow interests, as long as the algorithm has room and budget to learn.",
             "we": "We build simple, broad campaigns with clear testing rules, and boost the best organic and creator posts as Spark Ads."},
            {"who": "you", "bg": "#b7c2a9", "fg": "#233551", "title": "Measured on business outcomes",
             "changed": "Many people see a TikTok ad, then search or buy later somewhere else, so last-click reports undercount what TikTok drives.",
             "we": "We set up TikTok tracking properly and judge results on revenue, ROAS or cost per customer, not views."},
        ],
        "close_lead": "One team, all three steps.",
        "close": "Strategy, creative, media and data, working together on your account.",
    },

    # 3 Campaign types, across the funnel (each campaign carries its own KPI pills)
    "funnel": {
        "label": "Campaign types",
        "title": "TikTok campaigns across the whole funnel",
        "lede": "Most accounts need a campaign at each stage. We set the mix by your goal and budget, then judge each campaign on its own numbers.",
        "stages": [
            {"label": "Stage 1", "title": "Get seen", "bg": "#f8b6ba", "fg": "#233551", "pill": {"bg": "#0093a5", "fg": "#ffffff"}, "items": [
                ("Reach", "Shows your videos to as many of the right people as possible, with frequency control.", ["CPM", "Reach"]),
                ("Video views", "Builds an engaged audience from people who watch your videos, ready to retarget.", ["Cost per view", "6-second views"]),
                ("TopView", "The first ad people see when they open TikTok, for launches and big moments.", ["Reach", "Ad recall"]),
            ]},
            {"label": "Stage 2", "title": "Build interest", "bg": "transparent", "fg": "rgba(243, 242, 247, .9)", "pill": {"bg": "#f8b6ba", "fg": "#233551"}, "items": [
                ("Traffic", "Sends the right people to your site, app or landing page.", ["CPC", "Landing page views"]),
                ("Lead generation", "Instant forms inside TikTok or your own site, for services, education and property.", ["CPL"]),
                ("Spark Ads", "Boosts your own or creators' posts, keeping the likes, comments and follows on the original post.", ["Engagement rate", "Cost per follower"]),
            ]},
            {"label": "Stage 3", "title": "Make the sale", "bg": "#b7c2a9", "fg": "#233551", "pill": {"bg": "#dd4027", "fg": "#ffffff"}, "items": [
                ("Smart+ sales", "TikTok's automated campaigns that find buyers at scale from your best videos.", ["ROAS"]),
                ("Website conversions", "Tighter control of audiences, placements and offers.", ["CPA"]),
                ("Catalogue ads", "Shows products from your catalogue to the people most likely to buy them.", ["ROAS"]),
                ("GMV Max for TikTok Shop", "Promotes your shop products and LIVE sessions to drive sales on TikTok Shop.", ["GMV", "ROI"]),
            ]},
        ],
        "close_lead": "One plan, three stages.",
        "close": "Budget moves to whichever stage is holding growth back.",
    },
    "types_title": "TikTok campaign types we run",
    "types_lede": "We pick the campaign type from your goal, then judge it against one number.",
    "types": [],

    # 4 Results: the first is the featured case; the rest sit beside it once confirmed
    "results_label": "Results",
    "results_title": "What this looks like in practice",
    "results_lede": "Results from TikTok campaigns we run, for brands across Asia.",
    "results": [
        {"brand": "Blackmores", "value": "+30%", "label": "Increase in ROI from TikTok GMV Max",
         "url": "https://www.majorform.co/our-work/blackmores-tiktok-livestreaming-majorform-2026",
         # three products staged on an empty canvas: Fish Oil in front, the others behind, each floating on its own rhythm
         "image": "blackmores-stage.png", "stage": True, "image_bg": "#f8b6ba",
         "image_alt": "Blackmores Fish Oil 1000, Omega Mini and Power Up",
         "layers": [{"src": "blackmores-omega-mini.webp", "left": 6, "top": 24, "width": 28, "motion": "bob-r", "delay": -1.6},
                    {"src": "blackmores-power-up.webp", "left": 66, "top": 24, "width": 28, "motion": "bob-r", "delay": -3.1},
                    {"src": "blackmores-fish-oil.webp", "left": 30, "top": 2, "width": 40, "motion": "bob", "z": 2}],
         "story": [("Challenge", None), ("What we did", None)]},
        {"brand": None, "value": None, "label": "result on TikTok", "url": None, "bg": "#b7c2a9"},
        {"brand": None, "value": None, "label": "result on TikTok", "url": None, "bg": "#f8b6ba"},
    ],
    "quote": {"text": None, "who": None},

    # 5 The work: add real ads by uploading each video or image to Squarespace and pasting its URL into src
    "work_title": "TikTok ads we've made",
    "work_lede": "Made by our in-house production team for the TikTok feed, and tested in-market.",
    "work": [
        {"src": None, "alt": "", "title": "Hook test", "note": "[brand]: what it tested"},
        {"src": None, "alt": "", "title": "UGC-style review", "note": "[brand]: what it tested"},
        {"src": None, "alt": "", "title": "Spark Ad", "note": "[brand]: what it tested"},
        {"src": None, "alt": "", "title": "Product demo", "note": "[brand]: what it tested"},
        {"src": None, "alt": "", "title": "LIVE clip", "note": "[brand]: what it tested"},
        {"src": None, "alt": "", "title": "TikTok Shop video", "note": "[brand]: what it tested"},
    ],

    # 6 Process (shared across platform pages)
    "process": {
        "label": "How we work",
        "title": "From Research to Scale",
        "lede": "A clear plan from day one, so you always know what's happening and what you'll get next.",
        "steps": [
            {"c": "#f8b6ba", "when": "Week 1", "title": "Research",
             "text": "We study your market, audience and competitors, audit your account and tracking, and agree the one number that matters.",
             "gets": ["Audit report", "Target KPI"]},
            {"c": "#b7c2a9", "when": "Week 2", "title": "Plan",
             "text": "We map the campaigns across the funnel and brief the first round of creative.", "gets": ["Media plan", "Creative brief"]},
            {"c": "#0093a5", "ct": "#ffffff", "when": "Weeks 3 to 6", "title": "Test",
             "text": "We launch structured tests of angles, formats and campaign types against that number.", "gets": ["Test results", "Weekly report"]},
            {"c": "#dd4027", "ct": "#ffffff", "when": "Month 2 onwards", "title": "Scale",
             "text": "We move budget to what wins and refresh creative before it tires, every month.", "gets": ["Monthly review", "New creative"]},
        ],
    },

    # 7 Fit and terms
    "fit_title": "Is MajorForm right for you on TikTok?",
    "fit": [
        ("Good fit", "Fast-growing startups, DTC brands and regional businesses ready to grow sales with video on TikTok."),
        ("How we charge", "A monthly retainer, not a commission on your ad spend."),
        ("Starting ad spend", None),
        ("Your accounts", None),
    ],

    # 8 FAQs (also written into the FAQPage schema)
    "faqs": [
        ("How much does it cost to run TikTok ads in Singapore?",
         "It depends on your goal and market. TikTok sets minimum daily budgets, and its algorithm needs enough conversions "
         "to learn, so we size the test budget around that, agree it with you before launch, then scale what works. Our fee "
         "is a monthly retainer, not a commission on spend."),
        ("How long before TikTok ads show results?",
         "Most campaigns leave TikTok's learning phase within the first week or two. Clients typically see clear improvements "
         "in CPA or ROAS within 30 to 60 days, once creative testing has found winners."),
        ("What are Spark Ads?",
         "Spark Ads run real TikTok posts, from your account or a creator's, as ads. The likes, comments and follows stay on "
         "the original post, and because they look like normal content, people are more likely to watch them."),
        ("Do you run TikTok Shop and LIVE campaigns?",
         "Yes. We run GMV Max campaigns for TikTok Shop and promote LIVE sessions to drive shop sales. Our TikTok "
         "livestreaming work with Blackmores delivered a 4X ecommerce ROI."),
        ("Do you make the TikTok creative in-house?",
         "Yes. Our production team makes native, sound-on videos for TikTok, from hooks and product demos to UGC-style ads, "
         "and we read results by creative, not just by campaign, so every round of videos learns from the last."),
        ("TikTok or Meta: which should I start with?",
         "Start where your customers already spend time and where you can keep making video. TikTok suits brands that can "
         "feed it native, creator-led video; Meta suits most brands first because of its reach and retargeting. Many "
         "clients run both."),
    ],

    # 9 Related and closing
    "related": [
        ("Meta Ads", "https://majorform.co/meta-ads-agency-singapore"),
        ("TikTok Shop Ads", None),
        ("Search Ads", None),
        ("Social media content", "https://www.majorform.co/social-media-management-singapore-2026"),
    ],
    "closing": "Ready to grow on TikTok?",
}
