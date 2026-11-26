"""Amazon Ads page content. None means "not confirmed yet": it stays off the live page and build.py lists it.

Built from the Search sheet's structure, with every platform-specific slot written for Amazon.
Process is shared across platform pages; fit is shared apart from its title and good-fit line.
"""

PAGE = {
    "key": "amazon",
    "name": "Amazon Ads",
    "crumb": "Amazon ads",
    "short": "Amazon",
    "accent": "#d8a37b",
    # Wada 339: Ochraceous Salmon, English Red, Light Glaucous Blue, Violet Blue
    "arrow": "#40456a",  # arrow on the white circles between cards
    "hi": "#d8a37b",  # highlight text on the navy sections and the results tag
    # Slots placed on the site's navy sections (set those sections' background to this colour in Squarespace)
    "dark": {"shift": "#253551", "types": "#253551", "related": "#2a2829"},  # the closing block sits on the footer grey black
    "slots": ["hero", "shift", "types", "results", "process", "fit", "faq", "related"],
    # Hero numbers as a colour plate from Wada combination 339 (Meta 281, TikTok 264, Search 257, App 276).
    # English red only takes near-black text: neither white nor navy is clear enough on it for small labels.
    "poster": [
        {"value": "$2M+", "label": "Ad spend managed", "bg": "#40456a", "fg": "#ffffff", "hover": {"bg": "#d8a37b", "fg": "#233551"}},
        {"value": "10+", "label": "Markets in Asia", "bg": "#d8a37b", "fg": "#233551", "hover": {"bg": "#d96629", "fg": "#140f1f"}},
        {"value": "1 team", "label": "Ads, listings and retail data", "bg": "#d96629", "fg": "#140f1f", "hover": {"bg": "#a5c8d1", "fg": "#233551"}},
        {"value": "300+", "label": "Campaigns run since 2025", "bg": "#a5c8d1", "fg": "#233551", "hover": {"bg": "#40456a", "fg": "#ffffff"}},
    ],

    "logos": [("oatside", "Oatside"), ("blackmores", "Blackmores"), ("the-ordinary", "The Ordinary")],
    "logos_label": "Brands we work with",
    "slug": "amazon-ads-agency-singapore",
    "title": "Amazon Ads Agency Singapore | MajorForm",
    "description": "MajorForm runs Amazon Ads for brands in Singapore and across Asia: Sponsored Products, Brands and Display, judged on sales and ACOS.",
    "service_name": "Amazon Ads Management",
    "confirm": [
        "Hero figures: are $2M+ ad spend and 300+ campaigns right to show across all platforms here? Send Amazon-only figures if you'd rather",
        "The three logos are brands you run Amazon ads for (swap in the right ones)",
        "Which Amazon stores you run ads on (Amazon.sg only, or others such as Japan, Australia or India)",
        "Services: do you run Amazon DSP, and do you advise on listings and A+ content?",
        "Process timings (research week 1, plan week 2, tests weeks 3 to 6, scaling from month 2) and weekly reporting",
    ],
    "markets": ["Singapore", "Malaysia", "Indonesia", "Philippines", "Thailand", "Vietnam"],

    # 1 Hero
    "h1": "Turn Amazon Searches into Sales.",
    "thesis": "Ads, listings and retail data, working as one system.",
    "answer": ("MajorForm plans and runs Amazon Ads for brands in Singapore and across Asia, from Sponsored Products to "
               "Sponsored Brands and Display. One team handles keyword research, bidding, product listing advice and reporting, "
               "and every campaign is judged on sales and return on ad spend, not clicks."),
    "stats": [
        ("$2M+", "Ad spend managed"),
        ("10+", "Asian markets"),
        ("300+", "Campaigns run since 2025"),
    ],

    # 2 How Amazon advertising works, and how we handle each step
    "shift": {
        "label": "How Amazon advertising works",
        "title": "How Amazon ads work, and how we work with them.",
        "lede": ("On Amazon, people are already shopping, and your ad sits right next to the buy button. Doing well takes three "
                 "things: showing up for the right product searches, product pages that turn clicks into sales, and knowing "
                 "what each ad really earns. Here's how we handle each one."),
        "we_label": "How we handle it",
        "steps": [
            {"who": "you", "bg": "#d8a37b", "fg": "#233551", "title": "Show up for the right searches",
             "changed": "Most Amazon sales start with a search, and where your ad shows depends on your bid and how well your product sells for that search.",
             "we": "We research the words shoppers use, split campaigns by brand, category and competitor searches, and cut terms that spend without selling."},
            {"who": "meta", "bg": "transparent", "fg": "rgba(243, 242, 247, .86)", "title": "The product page closes the sale",
             "changed": "An ad can only bring shoppers to your page. Weak images, unclear titles or few reviews mean they click and leave, and you still pay.",
             "we": "We review your titles, images, A+ content and stock levels, and pause ads on products that aren't ready to sell."},
            {"who": "you", "bg": "#d96629", "fg": "#140f1f", "title": "Measured on sales, not clicks",
             "changed": "Amazon's reports only count sales made soon after an ad, and ads also lift organic sales that the reports don't show.",
             "we": "We report on ACOS alongside total ACOS (ad spend against all sales), so you see what ads add to your whole Amazon business."},
        ],
        "close_lead": "One team, all three steps.",
        "close": "Ads, listings and data, working together on your store.",
    },

    # 3 Campaign types, across the funnel (each campaign carries its own KPI pills)
    "funnel": {
        "label": "Campaign types",
        "title": "Amazon campaigns across the whole funnel",
        "lede": "Some campaigns put your products in front of new shoppers, some win the searches that lead to a sale, and some protect and grow the customers you have. We set the mix by your goal and budget.",
        "stages": [
            {"label": "Stage 1", "title": "Get discovered", "bg": "#d8a37b", "fg": "#233551", "pill": {"bg": "#40456a", "fg": "#ffffff"}, "items": [
                ("Sponsored Display", "Ads on and off Amazon that reach shoppers browsing similar products or your category.", ["CPM", "Detail page views"]),
                ("Amazon DSP", "Display and video ads bought with Amazon's shopper data, on Amazon and across other sites and apps.", ["CPM", "Reach"]),
            ]},
            {"label": "Stage 2", "title": "Win the search", "bg": "transparent", "fg": "rgba(243, 242, 247, .9)", "pill": {"bg": "#d8a37b", "fg": "#233551"}, "items": [
                ("Sponsored Products", "Product ads in search results and on product pages, the core of most Amazon accounts.", ["ACOS", "CPC"]),
                ("Sponsored Brands", "Your logo, a headline and several products together at the top of search results.", ["ACOS", "New-to-brand"]),
                ("Sponsored Brands video", "Short video ads in search results that show the product in use.", ["CTR", "ACOS"]),
            ]},
            {"label": "Stage 3", "title": "Protect and grow", "bg": "#a5c8d1", "fg": "#233551", "pill": {"bg": "#40456a", "fg": "#ffffff"}, "items": [
                ("Brand defence", "Ads on your own product pages and brand searches, so competitors can't take shoppers who are already yours.", ["ACOS", "Impression share"]),
                ("Remarketing", "Brings back shoppers who viewed your product but didn't buy.", ["ROAS"]),
                ("Brand Store traffic", "Sends shoppers to your branded store on Amazon, where they see your full range.", ["Store visits", "Sales"]),
            ]},
        ],
        "close_lead": "One plan, three stages.",
        "close": "Budget moves to whichever stage is holding growth back.",
    },
    "types_title": "Amazon campaign types we run",
    "types_lede": "We pick the campaign type from your goal, then judge it against one number.",
    "types": [],

    # 4 Results: the first is the featured case; the rest sit beside it. None until an Amazon result is confirmed.
    "results_label": "Results",
    "results_title": "What this looks like in practice",
    "results_lede": "Results from Amazon campaigns we run, for brands across Asia.",
    "results": [
        {"brand": None, "value": None, "label": None, "url": None},
    ],
    "quote": {"text": None, "who": None},

    # 5 Process (shared across platform pages)
    "process": {
        "label": "How we work",
        "title": "From Research to Scale",
        "lede": "A clear plan from day one, so you always know what's happening and what you'll get next.",
        "steps": [
            {"c": "#d8a37b", "when": "Week 1", "title": "Research",
             "text": "We study your category, shoppers and competitors, audit your Amazon account and listings, and agree the one number that matters.",
             "gets": ["Audit report", "Target KPI"]},
            {"c": "#40456a", "ct": "#ffffff", "when": "Week 2", "title": "Plan",
             "text": "We map the campaigns across the funnel, build the keyword plan and set targets for each product from its margin.", "gets": ["Media plan", "Keyword plan"]},
            {"c": "#d96629", "ct": "#140f1f", "when": "Weeks 3 to 6", "title": "Test",
             "text": "We launch structured tests of keywords, products, bids and ad creative against that number.", "gets": ["Test results", "Weekly report"]},
            {"c": "#a5c8d1", "ct": "#233551", "when": "Month 2 onwards", "title": "Scale",
             "text": "We move budget to the products and searches that sell at a profit, cut wasted terms and refresh ads every month.", "gets": ["Monthly review", "New ads"]},
        ],
    },

    # 6 Fit and terms
    "fit_title": "Is MajorForm right for you on Amazon?",
    "fit": [
        ("Good fit", "Brands selling on Amazon that want ad spend tied to sales and margin, from new launches to established products."),
        ("How we charge", "A monthly retainer, not a commission on your ad spend."),
        ("Starting ad spend", None),
        ("Your accounts", None),
    ],

    # FAQ in the performance page's style: navy panel with a Wada 339 tile, questions that flood with colour on hover
    "faq_panel": {
        "title": "Questions brands ask about Amazon ads",
        "intro": "What brands usually ask us before we start running Amazon Ads together.",
        "tile": ["#d8a37b", "#40456a", "#d96629", "#a5c8d1"],
        "floods": ["#d8a37b", "#a5c8d1"],
    },
    # 7 FAQs (also written into the FAQPage schema)
    "faqs": [
        ("How much do Amazon Ads cost in Singapore?",
         "Most Amazon ads charge per click, with the price set in an auction each time a shopper searches. It depends on how "
         "competitive your category is and how well your product sells. We set a target for each product from its margin, "
         "agree a test budget with you, then scale what sells at a profit. Our fee is a monthly retainer, not a commission on spend."),
        ("What is ACOS, and what should ours be?",
         "ACOS is your ad spend divided by the sales those ads brought in, so a lower number means each sale cost less in ads. "
         "A good target depends on your margin: if a product makes 30% profit before advertising, an ACOS above 30% loses money on "
         "each ad sale. New launches often run higher for a while to build sales history."),
        ("Sponsored Products, Brands or Display: which should we use?",
         "Most accounts start with Sponsored Products, because they show your product right where shoppers search. Sponsored "
         "Brands put your logo and several products at the top of results, which helps shoppers remember you. Sponsored Display "
         "reaches people browsing similar products and brings back those who viewed yours."),
        ("Do Amazon ads help our organic ranking?",
         "They can. Amazon doesn't publish how it ranks products, but sales for a search are widely seen as a strong factor, so "
         "ads that bring in sales for a search can help your product rank for it without ads over time."),
        ("Do we need Amazon Brand Registry?",
         "Sponsored Products works without it. If you sell on Amazon as a seller, you need Brand Registry for Sponsored Brands, "
         "your own Brand Store and A+ content, so it's worth setting up if you own your brand."),
        ("Can you help with our product listings?",
         "Yes. Ads work best on strong product pages, so we review your titles, images, bullet points and A+ content, and flag "
         "listings that need work before we put spend behind them."),
        ("How do you measure results on Amazon?",
         "We track ACOS and return on ad spend for each campaign, and total ACOS, which compares ad spend with all your Amazon "
         "sales, to show what ads add overall. We also watch new-to-brand sales, which shows how many buyers are new to you."),
        ("How long before Amazon ads show results?",
         "Ads can start bringing in sales within days of launch. Bids and keywords need a few weeks of sales data to settle, "
         "and organic ranking gains build more slowly, so we review results weekly and judge the bigger picture month by month."),
    ],

    # 8 Related and closing
    "related": [
        ("Meta Ads", "https://majorform.co/meta-ads-agency-singapore"),
        ("TikTok Ads", "https://majorform.co/tiktok-ads-agency-singapore"),
        ("Search Ads", "https://majorform.co/google-search-ads-agency-singapore"),
    ],
    "closing": "Ready to grow on Amazon?",
    "closing_sub": "Tell us your goal and we'll show you how we'd plan it.",
    "related_floods": ["#d8a37b", "#a5c8d1"],  # pill hover colours in the closing block
}
