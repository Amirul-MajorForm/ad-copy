"""App Install Ads page content. None means "not confirmed yet": it stays off the live page and build.py lists it.

Built from the Search sheet's structure, with every platform-specific slot written for app growth.
Process is shared across platform pages; fit is shared apart from its title and good-fit line.
"""

PAGE = {
    "key": "app",
    "name": "App Install Ads",
    "crumb": "App install ads",
    "short": "App",
    "pills_label": "App ads work best with",
    "accent": "#afd472",
    # Wada 276: Eosine Pink, Seashell Pink, Yellow Green, Black
    "arrow": "#111314",  # arrow on the white circles between cards
    "hi": "#afd472",  # highlight text on the navy sections and the results tag
    # Slots placed on the site's navy sections (set those sections' background to this colour in Squarespace)
    "dark": {"shift": "#253551", "types": "#253551", "related": "#2a2829"},  # the closing block sits on the footer grey black
    "slots": ["hero", "shift", "types", "results", "process", "fit", "faq", "related"],
    # Hero numbers as a colour plate from Wada combination 276 (Meta uses 281, TikTok 264, Search 257).
    # Only black takes white text: pink, peach and lime take navy.
    "poster": [
        {"value": "$2M+", "label": "Ad spend managed", "bg": "#111314", "fg": "#ffffff", "hover": {"bg": "#afd472", "fg": "#233551"}},
        {"value": "10+", "label": "Markets in Asia", "bg": "#afd472", "fg": "#233551", "hover": {"bg": "#f37f94", "fg": "#233551"}},
        {"value": "1 team", "label": "Creative, media and measurement", "bg": "#f37f94", "fg": "#233551", "hover": {"bg": "#fdd4bd", "fg": "#233551"}},
        {"value": "300+", "label": "Campaigns run since 2025", "bg": "#fdd4bd", "fg": "#233551", "hover": {"bg": "#111314", "fg": "#ffffff"}},
    ],

    "logos": [("oatside", "Oatside"), ("yoga-movement", "Yoga Movement"), ("flexar", "Flexar")],
    "logos_label": "Brands we work with",
    "slug": "app-install-ads-agency-singapore",
    "title": "App Install Ads Agency Singapore | MajorForm",
    "description": "MajorForm runs app install campaigns on Google, Apple, Meta and TikTok for brands in Singapore and Asia, judged on active and paying users.",
    "service_name": "App Install Ads Management",
    "confirm": [
        "Hero figures: are $2M+ ad spend and 300+ campaigns right to show across all platforms here? Send app-only figures if you'd rather",
        "The three logos are brands you run app campaigns for (swap in the right ones)",
        "Platforms: do you run Apple Ads (App Store search) as well as Google App campaigns, Meta and TikTok?",
        "Services: do you set up mobile measurement (AppsFlyer, Adjust or Firebase) and advise on app store pages?",
        "Process timings (research week 1, plan week 2, tests weeks 3 to 6, scaling from month 2) and weekly reporting",
        "Search Ads page link in the closing block: it goes to /google-search-ads-agency-singapore, so publish that page first",
    ],
    "markets": ["Singapore", "Malaysia", "Indonesia", "Philippines", "Thailand", "Vietnam"],

    # 1 Hero
    "h1": "From Install to Active User.",
    "thesis": "Creative, media and measurement, working as one system.",
    "answer": ("MajorForm plans and runs app install campaigns for brands in Singapore and across Asia, on Google, Apple, "
               "Meta and TikTok. One team handles ad creative, media buying, app store page advice and measurement, and every "
               "campaign is judged on people who sign up, buy and come back, not just downloads."),
    "stats": [
        ("$2M+", "Ad spend managed"),
        ("10+", "Asian markets"),
        ("300+", "Campaigns run since 2025"),
    ],

    # 2 How app advertising works, and how we handle each step
    "shift": {
        "label": "How app advertising works",
        "title": "How app ads work, and how we work with them.",
        "lede": ("A download is only the start. Growing an app takes three things: reaching people who will actually use it, "
                 "ads that show why it's worth opening, and knowing which installs turned into active users. "
                 "Here's how we handle each one."),
        "we_label": "How we handle it",
        "steps": [
            {"who": "you", "bg": "#afd472", "fg": "#233551", "title": "Reach people who will use the app",
             "changed": "The platforms now decide who sees your ads, based on the result you ask for. Ask for cheap installs and you get people who rarely open the app again.",
             "we": "We set campaigns to aim for actions inside the app, such as sign-ups, bookings or first purchases, as soon as there's enough data."},
            {"who": "meta", "bg": "transparent", "fg": "rgba(243, 242, 247, .86)", "title": "The ad does the targeting",
             "changed": "With broad targeting, your creative decides who stops scrolling, and app ads tire quickly once the same people have seen them.",
             "we": "We make and test short videos and screen recordings that show the app in use, and refresh them before results drop."},
            {"who": "you", "bg": "#f37f94", "fg": "#233551", "title": "Measured past the install",
             "changed": "Since Apple's privacy changes, iPhone results arrive late and in totals, and each platform counts installs its own way.",
             "we": "We set up tracking for the events that matter, count each install once across platforms, and report on cost per active or paying user."},
        ],
        "close_lead": "One team, all three steps.",
        "close": "Creative, media and data, working together on your app.",
    },

    # 3 Campaign types, across the funnel (each campaign carries its own KPI pills)
    "funnel": {
        "label": "Campaign types",
        "title": "App campaigns across the whole journey",
        "lede": "Some campaigns get your app discovered, some win the store search, and some turn downloads into regular users. We set the mix by your goal and budget.",
        "stages": [
            {"label": "Stage 1", "title": "Get discovered", "bg": "#afd472", "fg": "#233551", "pill": {"bg": "#111314", "fg": "#ffffff"}, "items": [
                ("Meta app ads", "Video and image ads in Facebook and Instagram feeds, Stories and Reels that open your app store page.", ["CPI", "CTR"]),
                ("TikTok app campaigns", "Short videos in the For You feed, made to feel native and drive downloads.", ["CPI", "CTR"]),
                ("Google App campaigns", "One campaign across Google Search, Google Play, YouTube and Discover, built from your text, images and videos.", ["CPI"]),
            ]},
            {"label": "Stage 2", "title": "Win the store search", "bg": "transparent", "fg": "rgba(243, 242, 247, .9)", "pill": {"bg": "#afd472", "fg": "#233551"}, "items": [
                ("Apple Ads", "Ads at the top of App Store search results for the words people type, including your own app's name.", ["Cost per tap", "Tap-to-install rate"]),
                ("Store page tests", "Icon, screenshot and description tests, so more people who visit your store page install.", ["Store conversion rate"]),
            ]},
            {"label": "Stage 3", "title": "Grow active users", "bg": "#fdd4bd", "fg": "#233551", "pill": {"bg": "#111314", "fg": "#ffffff"}, "items": [
                ("In-app action campaigns", "Campaigns that aim for sign-ups, bookings or first purchases rather than downloads.", ["CPA", "Cost per first purchase"]),
                ("Value campaigns", "Bidding towards people likely to spend more, once purchase data is coming through.", ["ROAS"]),
                ("Re-engagement", "Ads that bring lapsed users back, with links that open the right screen in the app.", ["Reactivation rate", "CPA"]),
            ]},
        ],
        "close_lead": "One plan, three stages.",
        "close": "Budget moves to whichever stage is holding growth back.",
    },
    "types_title": "App campaign types we run",
    "types_lede": "We pick the campaign type from your goal, then judge it against one number.",
    "types": [],

    # 4 Results: the first is the featured case; the rest sit beside it. None until an app result is confirmed.
    "results_label": "Results",
    "results_title": "What this looks like in practice",
    "results_lede": "Results from app campaigns we run, for brands across Asia.",
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
            {"c": "#afd472", "when": "Week 1", "title": "Research",
             "text": "We study your market, users and competitors, audit your app tracking and store pages, and agree the one number that matters.",
             "gets": ["Audit report", "Target KPI"]},
            {"c": "#111314", "ct": "#ffffff", "when": "Week 2", "title": "Plan",
             "text": "We map the campaigns across the journey, set up the events to track and plan the first round of ads.", "gets": ["Media plan", "Event map"]},
            {"c": "#f37f94", "ct": "#233551", "when": "Weeks 3 to 6", "title": "Test",
             "text": "We launch structured tests of creative, platforms, store pages and bidding against that number.", "gets": ["Test results", "Weekly report"]},
            {"c": "#fdd4bd", "ct": "#233551", "when": "Month 2 onwards", "title": "Scale",
             "text": "We move budget to what wins, cut what brings in users who don't stay, and refresh creative every month.", "gets": ["Monthly review", "New ads"]},
        ],
    },

    # 6 Fit and terms
    "fit_title": "Is MajorForm right for your app?",
    "fit": [
        ("Good fit", "Apps with a clear goal inside the app, such as sign-ups, bookings or purchases, that want more active users rather than just downloads."),
        ("How we charge", "A monthly retainer, not a commission on your ad spend."),
        ("Starting ad spend", None),
        ("Your accounts", None),
    ],

    # FAQ in the performance page's style: navy panel with a Wada 276 tile, questions that flood with colour on hover
    "faq_panel": {
        "title": "Questions brands ask about app install ads",
        "intro": "What brands usually ask us before we start growing their app together.",
        "tile": ["#afd472", "#111314", "#f37f94", "#fdd4bd"],
        "floods": ["#afd472", "#fdd4bd"],
    },
    # 7 FAQs (also written into the FAQPage schema)
    "faqs": [
        ("How much does it cost to get app installs in Singapore?",
         "It depends on the platform, your audience and whether you're after iPhone or Android users, and most platforms charge "
         "per impression or per tap rather than per install. We estimate costs from a test budget agreed with you, then judge "
         "campaigns on cost per active or paying user, because a cheap install that never opens the app costs more in the end. "
         "Our fee is a monthly retainer, not a commission on spend."),
        ("Which platforms should we run app ads on?",
         "It depends on where your users are. Google App campaigns reach people across Search, Google Play and YouTube, Apple "
         "Ads puts you at the top of App Store searches, and Meta and TikTok are strong for getting a new app discovered. Most "
         "apps start with two and add more once tracking shows which bring in users who stay."),
        ("Why not just aim for the cheapest installs?",
         "Because the platforms find exactly what you ask for. Campaigns set for installs often bring in people who download "
         "and never return. Once there's enough data, we set campaigns to aim for actions like sign-ups or first purchases, so "
         "the budget goes towards users who are worth more."),
        ("How do you track installs on iPhones after Apple's privacy changes?",
         "Apple now reports most ad results in totals and with a delay, rather than person by person. We set up Apple's "
         "attribution reporting alongside a measurement tool, and read results across a few days rather than day by day, so "
         "decisions aren't made on incomplete numbers."),
        ("Do we need a mobile measurement partner like AppsFlyer or Adjust?",
         "If you advertise on more than one platform, it usually helps. A mobile measurement partner counts each install once "
         "and credits it to the right campaign, instead of every platform claiming it. For an app running on one platform, "
         "Firebase can be enough to start."),
        ("What kind of creative works for app ads?",
         "Short videos that show the app being used, with the benefit clear in the first few seconds. Screen recordings, real "
         "people using the app and simple before-and-after stories tend to work well. We test several openings at once and "
         "refresh ads regularly, because app ads tire quickly."),
        ("Can you help with our app store page?",
         "Yes. Your store page is where people decide to install, so we review the icon, screenshots and description, and test "
         "changes that make the app's main benefit clear at a glance."),
        ("How long before app campaigns show results?",
         "Installs can start coming in within days of launch. Campaigns aimed at sign-ups or purchases need a few weeks of "
         "event data before the platforms' bidding settles, so we judge the first weeks on cost per install and move to cost "
         "per active user as data builds."),
    ],

    # 8 Related and closing
    "related": [
        ("Meta Ads", "https://majorform.co/meta-ads-agency-singapore"),
        ("TikTok Ads", "https://majorform.co/tiktok-ads-agency-singapore"),
        ("Search Ads", "https://majorform.co/google-search-ads-agency-singapore"),
    ],
    "closing": "Ready to grow your app?",
    "closing_sub": "Tell us your goal and we'll show you how we'd plan it.",
    "related_floods": ["#afd472", "#fdd4bd"],  # pill hover colours in the closing block
}
