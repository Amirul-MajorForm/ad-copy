"""Search Ads (Google Ads) page content. None means "not confirmed yet": it stays off the live page and build.py lists it.

Built from the Meta and TikTok sheets' structure, with every platform-specific slot written for search.
Process is shared across platform pages; fit is shared apart from its title.
"""

PAGE = {
    "key": "search",
    "name": "Search Ads",
    "crumb": "Search advertising",
    "short": "Search",
    "accent": "#fcb315",
    # Wada 257: Spectrum Red, Orange Yellow, Blue, Aconite Violet (a nod to Google's colours, not a copy)
    "arrow": "#006eb8",  # arrow on the white circles between cards
    "hi": "#fcb315",  # highlight text on the navy sections and the results tag
    # Slots placed on the site's navy sections (set those sections' background to this colour in Squarespace)
    "dark": {"shift": "#253551", "types": "#253551", "related": "#2a2829"},  # the closing block sits on the footer grey black
    "slots": ["hero", "shift", "types", "results", "process", "fit", "faq", "related"],
    # Hero numbers as a colour plate from Wada combination 257 (Meta uses 281, TikTok 264).
    # Violet only takes near-black text: white on it is too faint for small labels.
    "poster": [
        {"value": "$2M+", "label": "Ad spend managed", "bg": "#006eb8", "fg": "#ffffff", "hover": {"bg": "#fcb315", "fg": "#233551"}},
        {"value": "10+", "label": "Markets in Asia", "bg": "#fcb315", "fg": "#233551", "hover": {"bg": "#e31f26", "fg": "#ffffff"}},
        {"value": "1 team", "label": "Strategy, creative, media and data", "bg": "#e31f26", "fg": "#ffffff", "hover": {"bg": "#a36aa5", "fg": "#140f1f"}},
        {"value": "300+", "label": "Campaigns run since 2025", "bg": "#a36aa5", "fg": "#140f1f", "hover": {"bg": "#006eb8", "fg": "#ffffff"}},
    ],

    "logos": [("oatside", "Oatside"), ("yoga-movement", "Yoga Movement"), ("flexar", "Flexar")],
    "logos_label": "Brands we work with",
    "slug": "google-search-ads-agency-singapore",
    "title": "Google Ads & Search Advertising Agency Singapore | MajorForm",
    "description": "MajorForm plans and optimises Google Search, Shopping and Performance Max campaigns for brands in Singapore and across Asia, measured on leads and sales.",
    "service_name": "Google Ads and Search Advertising Management",
    "confirm": [
        "Hero figures: are $2M+ ad spend and 300+ campaigns right to show across all platforms here? Send search-only figures if you'd rather",
        "The three logos are brands you run search for (swap in the right ones)",
        "Process timings (research week 1, plan week 2, tests weeks 3 to 6, scaling from month 2) and weekly reporting",
        "Which 10+ markets to list in the schema (it names six Southeast Asian countries today)",
    ],
    "markets": ["Singapore", "Malaysia", "Indonesia", "Philippines", "Thailand", "Vietnam"],

    # 1 Hero
    "h1": "From Search to Sale. Powered by Google.",
    "thesis": "Keywords, data and optimisation, working as one system.",
    "answer": ("MajorForm plans and optimises Google Ads for brands in Singapore and across Asia, from Search and Shopping "
               "to Performance Max. One team runs strategy, keyword research, ad copy, landing page advice and measurement, "
               "so every campaign is built to reach people already looking for what you sell and is judged on leads and sales."),
    "stats": [
        ("$2M+", "Ad spend managed"),
        ("10+", "Asian markets"),
        ("300+", "Campaigns run since 2025"),
    ],

    # 2 How search works, and how we handle each step
    "shift": {
        "label": "How search advertising works",
        "title": "How search works, and how we work with it.",
        "lede": ("On Google, people tell you what they want before you show them an ad. Doing well there takes three things: "
                 "being there for the searches that matter, giving Google's bidding the right signals, and knowing which "
                 "clicks turned into customers. Here's how we handle each one."),
        "we_label": "How we handle it",
        "steps": [
            {"who": "you", "bg": "#fcb315", "fg": "#233551", "title": "Show up for the right searches",
             "changed": "Broad match and Google's AI now decide which searches trigger your ads, so the wrong terms can quietly use up the budget.",
             "we": "We plan keywords around buying intent, organise campaigns by what people search for, and check search terms every week to cut waste."},
            {"who": "meta", "bg": "transparent", "fg": "rgba(243, 242, 247, .86)", "title": "Google's bidding sets the price",
             "changed": "Smart Bidding sets a bid for every auction based on how likely each search is to convert, and it only learns from the conversions it can see.",
             "we": "We give bidding clear targets and clean conversion data, and test ad copy and landing pages so each click is worth more."},
            {"who": "you", "bg": "#006eb8", "fg": "#ffffff", "title": "Measured on leads and sales",
             "changed": "A form fill or a click on a phone number is not a customer. Optimising to the wrong action fills the pipeline with leads that never buy.",
             "we": "We track the actions that matter, feed lead quality and sales back to Google where possible, and report on cost per customer and revenue."},
        ],
        "close_lead": "One team, all three steps.",
        "close": "Strategy, copy, media and data, working together on your account.",
    },

    # 3 Campaign types, across the funnel (each campaign carries its own KPI pills)
    "funnel": {
        "label": "Campaign types",
        "title": "Google Ads campaigns across the whole funnel",
        "lede": "Search captures people who are ready to act, while other campaign types build the demand that searches come from. We set the mix by your goal and budget.",
        "stages": [
            {"label": "Stage 1", "title": "Build demand", "bg": "#fcb315", "fg": "#233551", "pill": {"bg": "#006eb8", "fg": "#ffffff"}, "items": [
                ("YouTube", "Video ads that introduce your brand to the right people before they start searching.", ["CPV", "View rate"]),
                ("Demand Gen", "Image and video ads across YouTube, Discover and Gmail, built for new audiences.", ["CPM", "CTR"]),
            ]},
            {"label": "Stage 2", "title": "Capture searches", "bg": "transparent", "fg": "rgba(243, 242, 247, .9)", "pill": {"bg": "#fcb315", "fg": "#233551"}, "items": [
                ("Non-brand search", "Ads for the problems and products people search for, before they know your name.", ["CPC", "Conversion rate"]),
                ("Brand search", "Protects your name in results, so competitors don't win the people already looking for you.", ["Impression share", "CPC"]),
                ("Dynamic Search Ads", "Ads written from your website's pages to catch searches your keywords miss.", ["CPA"]),
            ]},
            {"label": "Stage 3", "title": "Make the sale", "bg": "#006eb8", "fg": "#ffffff", "pill": {"bg": "#fcb315", "fg": "#233551"}, "items": [
                ("Lead generation", "Search and call ads that bring in enquiries, judged on qualified leads rather than form fills.", ["CPL", "Cost per qualified lead"]),
                ("Shopping", "Product ads with image, price and shop name, straight from your product feed.", ["ROAS"]),
                ("Performance Max", "One campaign across Search, Shopping, YouTube, Display and Maps, driven by your goals and feed.", ["ROAS", "CPA"]),
                ("Remarketing", "Brings back people who visited your site but didn't buy or enquire.", ["CPA"]),
            ]},
        ],
        "close_lead": "One plan, three stages.",
        "close": "Budget moves to whichever stage is holding growth back.",
    },
    "types_title": "Google Ads campaign types we run",
    "types_lede": "We pick the campaign type from your goal, then judge it against one number.",
    "types": [],

    # 4 Results: the first is the featured case; the rest sit beside it
    "results_label": "Results",
    "results_title": "What this looks like in practice",
    "results_lede": "Results from search campaigns we run, for brands across Asia.",
    "results": [
        {"brand": "Yoga Movement", "channel": "Google Search", "value": "+56%", "label": "Tracked purchase completions from Google Search",
         "note": "Purchase completions rose from 481 to 750 year over year on 4% more media spend (Aug\u2013Oct 2026 vs Aug\u2013Oct 2025).",
         "url": "https://www.majorform.co/our-work/yogamovement-digital-marketing-majorform-2026",
         # the Yoga Movement app on two phones, from yogamovement.com; the image is cut off at its bottom edge, so it sits on the panel's edge
         "image": "yoga-movement-app.webp", "image_anchor": "bottom", "image_bg": "#fcb315", "panel_logo": "yoga-movement",
         "image_alt": "The Yoga Movement app on two phones",
         "callouts": [{"text": "Google Search", "left": 52, "top": 4, "bg": "#04202c", "fg": "#ffffff"},
                      {"text": "Brand Search", "left": 66, "top": 40, "bg": "#006eb8", "fg": "#ffffff"},
                      {"text": "Local Search", "left": -4, "top": 70, "bg": "#ffffff", "fg": "#233551"}],
         "story": [("Challenge", "Turn more searches for Yoga Movement and its studios into class-pack purchases while keeping media spend steady."),
                   ("What we did", "Managed branded, studio-location and generic searches in separate campaigns, with studio-specific ad copy and starter-pack offers.")]},
    ],
    "quote": {"text": None, "who": None},

    # 5 Process (shared across platform pages)
    "process": {
        "label": "How we work",
        "title": "From Research to Scale",
        "lede": "A clear plan from day one, so you always know what's happening and what you'll get next.",
        "steps": [
            {"c": "#fcb315", "when": "Week 1", "title": "Research",
             "text": "We study your market, audience and competitors, audit your account and tracking, and agree the one number that matters.",
             "gets": ["Audit report", "Target KPI"]},
            {"c": "#006eb8", "ct": "#ffffff", "when": "Week 2", "title": "Plan",
             "text": "We map the campaigns across the funnel, build the keyword plan and write the first round of ads.", "gets": ["Media plan", "Keyword plan"]},
            {"c": "#e31f26", "ct": "#ffffff", "when": "Weeks 3 to 6", "title": "Test",
             "text": "We launch structured tests of keywords, ad copy, landing pages and bidding against that number.", "gets": ["Test results", "Weekly report"]},
            {"c": "#a36aa5", "ct": "#140f1f", "when": "Month 2 onwards", "title": "Scale",
             "text": "We move budget to what wins, cut wasted searches and refresh ads and landing pages every month.", "gets": ["Monthly review", "New ads"]},
        ],
    },

    # 6 Fit and terms
    "fit_title": "Is MajorForm right for you on search?",
    "fit": [
        ("Good fit", "Fast-growing startups, DTC brands and regional businesses that want more leads and sales from people already searching."),
        ("How we charge", "A monthly retainer, not a commission on your ad spend."),
        ("Starting ad spend", None),
        ("Your accounts", None),
    ],

    # FAQ in the performance page's style: navy panel with a Wada 257 tile, questions that flood with colour on hover
    "faq_panel": {
        "title": "Questions brands ask about search advertising",
        "intro": "What brands usually ask us before we start running Google Ads together.",
        "tile": ["#fcb315", "#006eb8", "#e31f26", "#a36aa5"],
        "floods": ["#fcb315", "#a36aa5"],
    },
    # 7 FAQs (also written into the FAQPage schema)
    "faqs": [
        ("How much does it cost to run Google Ads in Singapore?",
         "It depends on your industry and how competitive your keywords are, because you pay per click and clicks in "
         "some categories cost far more than others. We estimate costs from keyword research before launch, agree a test "
         "budget with you, then scale what converts. Our fee is a monthly retainer, not a commission on spend."),
        ("How long before Google Ads show results?",
         "Search can bring in enquiries within days of launch, because it reaches people already looking. Smart Bidding "
         "usually needs a few weeks of conversion data to settle, and clients typically see clear improvements in cost "
         "per lead or ROAS within 30 to 60 days."),
        ("Should I use Performance Max or Search campaigns?",
         "Usually both, for different jobs. Search gives you control over keywords and messaging for high-intent queries, "
         "while Performance Max finds buyers across all of Google's channels using your product feed and goals. We set the "
         "split based on your products, data and targets."),
        ("Why bid on my own brand name?",
         "Competitors can bid on your brand name, and ads appear above your website in the results. Brand campaigns are "
         "usually low-cost and protect the people already looking for you, though we check whether they are bringing in "
         "extra customers before recommending the spend."),
        ("Do you write the ads and advise on landing pages?",
         "Yes. We write and test the ad copy, and review the pages your ads send people to, because a strong landing page "
         "often lowers the cost of every lead or sale more than bidding changes do."),
        ("Google Ads or Meta: which should I start with?",
         "Start with search if people already look for what you sell, because you reach them at the moment of intent. Meta "
         "suits building demand for products people don't yet search for. Many clients run both, with each one feeding the other."),
    ],

    # 8 Related and closing
    "related": [
        ("Meta Ads", "https://majorform.co/meta-ads-agency-singapore"),
        ("TikTok Ads", "https://majorform.co/tiktok-ads-agency-singapore"),
        ("TikTok Shop Ads", None),
        ("Social media content", "https://www.majorform.co/social-media-management-singapore-2026"),
    ],
    "closing": "Ready to grow on search?",
    "closing_sub": "Tell us your goal and we'll show you how we'd plan it.",
    "related_floods": ["#fcb315", "#a36aa5"],  # pill hover colours in the closing block
}
