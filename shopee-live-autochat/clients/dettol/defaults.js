// Dettol default settings (TikTok Shop LIVE). TikTok can't pin messages, so no [pin].
const CLIENT_NAME = 'Dettol';
// Which live dashboard this build works on.
const PLATFORM = {
  name: 'TikTok LIVE',
  liveUrl: 'https://shop.tiktok.com/streamer/live/*',
  livePath: '/streamer/live',
  canPin: false
};
const DEFAULT_SETTINGS = {
  running: false,
  // Google Sheet with sale dates and promo details (first tab) and product tips
  // ("Product Tips" tab). When set and read, its messages are used.
  sheetUrl: 'https://docs.google.com/spreadsheets/d/13q3zM1cMPasFpkcwQguPwfp65MY2mwwFmdmka6Va6MY/edit',
  // Tab of the sheet above with product tips (Keywords | Only during sale | Pin | Tip message).
  tipsTabName: 'Product Tips',
  retiredSheetUrls: [],
  intervalMinutes: 10,
  jitterMinutes: 2,
  // Pick messages in random order (never the same one twice in a row).
  randomOrder: true,
  // While a product is showing, every Nth timed message is a general one (0 = never).
  generalEvery: 3,
  // Message templates used with the Google Sheet: {sale} is the sale name and
  // {voucher} {winspend} {winprize} {gift} {gifttiers} {storewide} come from that
  // sale's row. A template is skipped when a fact it uses is blank.
  generalTemplates: [
    "Welcome to Dettol's {sale} live! Ask us anything about keeping your home germ-free 🏠",
    "LIVE-EXCLUSIVE: {voucher}. Claim it in the bag icon 🎟️",
    "SPEND & WIN: Spend {winspend} & comment your order ID to win {winprize}! 🎁",
    "FREE GIFT: {gift} 🎁",
    "MORE GIFTS: {gifttiers} 🎁",
    "STOREWIDE VOUCHERS: {storewide} 🛍️",
    "Got a question about a product? Drop it in the comments and we'll answer live 💬",
    "Enjoying the live? Tap ❤️ and share it with a friend!"
  ].join('\n'),
  countdownTemplates: [
    "60 | 1 hour left in our {sale} live! Live-exclusive deals end with the stream 🛒",
    "30 | 30 minutes left! Grab your live-exclusive deals before they're gone ⏰",
    "10 | Final 10 minutes of our {sale} live! Check out now for live-only prices 🔥"
  ].join('\n'),
  // Countdown messages: "minutes left | message", based on the live timer and live length.
  liveDurationMinutes: 120,
  countdownMessages: [
    "60 | 1 hour left in our live! Live-exclusive deals end with the stream 🛒",
    "30 | 30 minutes left! Grab your live-exclusive deals before they're gone ⏰",
    "10 | Final 10 minutes of our live! Check out now for live-only prices 🔥"
  ].join('\n'),
  // Product tips: "keyword, keyword | message", sent tipDelaySeconds after a new product's
  // first message; the tip with the most keywords found in the product name wins.
  tipDelaySeconds: 10,
  productTips: [
    "Pods, Washing Machine | 🧺 Clean clothes + clean machine: 56 Laundry Pods + 2 Washing Machine Cleaners in one bundle!",
    "Plant-Based, Tea | 🍃 Plant-based Dettol in Tea & Citrus: kills 99.999% of germs & safe for homes with pets 🐾",
    "Plant-Based, Citrus | 🍃 Plant-based Dettol in Tea & Citrus: kills 99.999% of germs & safe for homes with pets 🐾",
    "Plant-Based, Grapefruit | 🌸 Plant-based Dettol in Grapefruit: kills 99.999% of germs & safe for homes with babies 👶",
    "Plant-Based | 🌿 NEW plant-based Dettol kills 99.999% of germs & is safe for homes with babies & pets!",
    "Washing Machine Cleaner, Lemon | 🍋 Our popular Lemon scent! 6-in-1 cleaner removes hidden dirt, residue & odour in your machine",
    "Washing Machine Cleaner, Bundle | 🔁 Bundle of 2 for regular machine care! Keeps your washer fresh for cleaner-smelling laundry ✨",
    "Washing Machine Cleaner | 🫧 6-in-1 cleaner cleans the machine itself! Low-suds formula removes hidden dirt & odour",
    "ProPod, Citrus Rose | 🌹 ProPod Citrus Rose: 72-hour germ protection + a luxury-inspired fragrance. Just 1 pod per wash!",
    "ProPod, Rainforest | 🌳 ProPod Rainforest Fresh: 72-hour germ protection + a luxury-inspired fragrance. 1 pod per wash!",
    "ProPod, 56 | 💰 Super Value refill: 56 ProPods! 1 pod handles an 8kg load, so one pack goes a long way",
    "ProPod | ✨ 12-in-1 ProPod: removes stains, mites & odour, softens fabric & is great for indoor drying!",
    "Laundry, Capsule | 👕 Dettol Laundry Capsules: no measuring needed! Just toss one in for fresh, clean laundry",
    "Laundry, Pods | 👕 Dettol Laundry Pods: no measuring needed! One pack can last 3+ months if you wash every 2 days",
    "Laundry, Saniti | 🧺 Add to your detergent to remove 99.9% of germs it leaves behind. Works even in cold water!",
    "Antiseptic, Spray | 🧴 No diluting, no bleach! Antiseptic spray gives 24hr antibacterial protection & is food-area safe",
    "Disinfectant, Spray | 💨 Just spray, no need to wipe! Kills 99.9% of germs on mattresses, shoes, pet beds & car seats",
    "Spray, 2-in-1 | 👜 2-in-1 Sani Spray: germ protection for skin AND surfaces, with aloe vera. Perfect for on-the-go!",
    "Antiseptic | 🧴 Classic Dettol protects against 100 illness-causing germs. Use it for floors, laundry & bathing!",
    "Multi, Cleaner | 🏠 4-in-1 cleaning power: kills 99.9% of germs & lifts stubborn stains on floors, kitchen & bathroom",
    "Kitchen | 🍳 Kitchen spray cuts through tough grease & grime on worktops, cooker tops & bins",
    "Bathroom | 🚿 Bathroom spray dissolves tough soap scum on sinks, tiles, taps & toilet seats",
    "Surface | ✨ Easy everyday cleaning for all your hard surfaces. Just spray & wipe!",
    "Hand Wash | 🧼 Dettol Hand Wash kills 99.9% of germs. Keep one by every sink for the whole family!",
    "Saniti | 👜 Dettol Hand Sanitiser kills 99.9% of germs, the perfect on-the-go companion!",
    "Wipe | 🧻 Dettol wipes are alcohol-free & kill 99.9% of germs. Toss a pack in your bag!",
    "Bar Soap, Gentle Care | 🌼 Gentle Care bar soap with Habbatus Sauda & White Jasmine: gentle on skin, everyday protection",
    "Bar Soap, Skincare | 🌸 Skincare bar soap in Sakura Blossom: skin protection for soft, healthy-feeling skin",
    "Hydra Cool | 🧊 Hydra Cool: feel 5°C cooler instantly! Menthol & cucumber with 12-hour odour protection 🥒",
    "Instant Cool | ❄️ Instant Cool: feel 5°C cooler instantly! Mint & sea minerals with 12-hour odour protection",
    "Lasting Fresh | 🍈 Lasting Fresh: honeydew & cucumber with 12-hour protection from odour-causing germs",
    "Re-energi | 🍊 Re-energize: an energizing scent with 12-hour protection from odour-causing germs!",
    "Botany, Lavender | 💜 Activ-Botany Lavender & Chamomile: plant-derived ingredients, 99.9% germ protection 🌿",
    "Botany, Green Tea | 🍵 Activ-Botany Green Tea & Bergamot: plant-derived ingredients, 99.9% germ protection 🌿",
    "Botany | 🌿 Activ-Botany: free from parabens & triclosan, halal & 96% of reviewers would recommend it!",
    "Moisturi | 🥑 Onzen Moisturizing: aloe vera & avocado with 8-hour long-lasting moisturisation",
    "Revitali | 🍑 Onzen Revitalising: peach & raspberry with 8-hour long-lasting moisturisation",
    "Gentle Care | 🤍 Gentle Care: soap-free & pH balanced with Habbatus Sauda & White Jasmine. 8-hour moisture!",
    "Skincare | 🌸 Skincare: Sakura Blossom with calming fragrance & 8-hour long-lasting moisturisation",
    "Original | 🛡️ Dettol Original: our classic protection from 99.99% of germs, trusted for over 90 years!",
    "Fresh | 🍋 Dettol Fresh: zesty yuzu citrus with 12-hour protection from odour-causing germs",
    "Shower Gel | 🚿 Dettol shower gels are dermatologically tested for everyday use. Grab a bottle or a refill!",
    "Body Wash | 🚿 Dettol body washes are dermatologically tested for everyday use. Grab a bottle or a refill!"
  ].join('\n'),
  productMessages: [
    "Now showing: {product} at {price}! Tap the bag icon to grab it 🛒",
    "Questions about this product? Ask us in the comments and we'll answer live 💬",
    "Add it to cart now and check out before the live ends! 🛒"
  ].join('\n'),
  generalMessages: [
    "Welcome to Dettol's live! Ask us anything about keeping your home germ-free 🏠",
    "Live-exclusive deals are waiting in the bag icon, check them out before the live ends 🛍️",
    "Enjoying the live? Tap ❤️ and share it with a friend!",
    "Got a question about a product? Drop it in the comments and we'll answer live 💬"
  ].join('\n')
};

// TikTok's comment box allows 100 characters.
const MAX_CHARS = 100;
