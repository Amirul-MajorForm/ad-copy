// Schwarzkopf Professional default settings (Shopee Live). Start a line with [pin] to pin that message.
const CLIENT_NAME = 'Schwarzkopf Professional';
// Which live dashboard this build works on.
const PLATFORM = { name: 'Shopee Live', liveUrl: 'https://live.shopee.sg/pc/*', livePath: '/pc/live', canPin: true };
const DEFAULT_SETTINGS = {
  running: false,
  // Google Sheet with sale dates and promo details (first tab) and product tips
  // ("Product Tips" tab). When set and read, its messages are used.
  sheetUrl: "https://docs.google.com/spreadsheets/d/1kxcTD1KU_g13m9p8S4BxmmUTpVA51oxnfWbkH8b26NA/edit",
  // Tab of the sheet above with product tips (Keywords | Only during sale | Pin | Tip message).
  // When it's read, it replaces the product tips below.
  tipsTabName: 'Product Tips',
  retiredSheetUrls: [],
  intervalMinutes: 10,
  jitterMinutes: 1,
  // While a product is showing, every Nth timed message is a general one (0 = never).
  generalEvery: 3,
  // Message templates used with the Google Sheet: {sale} is the sale name and
  // {voucher} {winspend} {winprize} {gift} {gifttiers} {storewide} come from that
  // sale's row. A template is skipped when a fact it uses is blank.
  generalTemplates: [
    "[pin] Welcome to Schwarzkopf Professional {sale} live! Salon-exclusive haircare from Germany since 1898. Tell us your hair concern ✨",
    "[pin] LIVE-EXCLUSIVE: {voucher}. Claim it in the bag icon 🎟️",
    "[pin] SPEND & WIN: Spend {winspend} during the live & comment your order ID for a chance to win {winprize}! 🎁",
    "LIVE-EXCLUSIVE GWP: Free {gift}! While stocks last 🎁",
    "MORE GIFTS: {gifttiers} 🎁",
    "STOREWIDE VOUCHERS: {storewide} 🛍️",
    "🏆 We pick 3 Spend & Win winners each live from {winspend}+ orders! Winners: screenshot the announcement & contact customer service within 1 day",
    "📦 Spend & Win prizes ship separately, about 20 working days after your order is completed with no cancellation, return or refund",
    "Which Fibre Clinix range? Hydrate (blue) for dry, Fortify (peach) for damaged, De-Frizz (purple) for frizzy, Vibrancy (pink) for coloured hair 💬",
    "💡 Salon routine: Shampoo > Mask > Conditioner > Leave-in > Styling. The mask repairs inside the hair strand, the conditioner smooths the outside ✨",
    "Our Professional range is salon-exclusive, and online it's only on our Shopee store. Tell us your hair concern & we'll suggest a routine 💬"
  ].join('\n'),
  countdownTemplates: [
    "60 | [pin] 1 hour left in our {sale} live! Our live-exclusive vouchers & gifts end with the stream ✨",
    "30 | [pin] 30 minutes left! Spend {winspend} & comment your order ID for a chance to win {winprize} 🎁",
    "10 | [pin] Final 10 minutes of our {sale} live! Live-exclusive vouchers & gifts end with the stream ✨"
  ].join('\n'),
  // Countdown messages: "minutes left | message", based on the live timer and live length.
  liveDurationMinutes: 120,
  countdownMessages: [
    "60 | [pin] 1 hour left in our live! Our live-exclusive vouchers & gifts end with the stream ✨",
    "30 | [pin] 30 minutes left! Spend $50 & comment your order ID for a chance to win OSiS Session 100ml (worth $17) 🎁",
    "10 | [pin] Final 10 minutes of our live! Live-exclusive vouchers & gifts end with the stream ✨"
  ].join('\n'),
  // Product tips: "keywords | message", sent tipDelaySeconds after a new product's
  // first message when the product name contains all the keywords.
  tipDelaySeconds: 10,
  productTips: [
    "Fortify, Duo | 🍑 Damaged Hair Care Duo: Fibre Clinix Fortify with Multi-Peptides rebuilds & strengthens damaged, over-processed hair ✨",
    "Damaged Hair, Duo | 🍑 Damaged Hair Care Duo: Fibre Clinix Fortify with Multi-Peptides rebuilds & strengthens damaged, over-processed hair ✨",
    "Hydrate, Duo | 💧 Dry & Brittle Hair Care Duo: Fibre Clinix Hydrate with Electrolytes balances moisture & boosts softness and shine ✨",
    "Brittle, Duo | 💧 Dry & Brittle Hair Care Duo: Fibre Clinix Hydrate with Electrolytes balances moisture & boosts softness and shine ✨",
    "Vibrancy, Duo | 🌸 Coloured Hair Care Duo: Fibre Clinix Vibrancy with AHA locks in colour vibrancy & helps reduce colour fading ✨",
    "Coloured Hair, Duo | 🌸 Coloured Hair Care Duo: Fibre Clinix Vibrancy with AHA locks in colour vibrancy & helps reduce colour fading ✨",
    "De-Frizz, Duo | 💜 Frizzy Hair Care Duo: Fibre Clinix De-Frizz with Passion Fruit Oil controls frizz for up to 48 hours ✨",
    "Frizzy Hair, Duo | 💜 Frizzy Hair Care Duo: Fibre Clinix De-Frizz with Passion Fruit Oil controls frizz for up to 48 hours ✨",
    "Travel, Session | ✈️ Your travel essentials: OSiS Session, our best-selling extra strong hold hairspray, trusted by professionals ✨",
    "Fortify, Spray | 🍑 Fortify Multi-Repair Spray detangles & instantly repairs mid-lengths and ends. Up to 9x stronger hair & up to 90% less breakage ✨",
    "Fortify, Treatment | 🍑 Fortify Treatment restructures damaged hair fibres for intense smoothness & brilliant shine. Leave on for 10 minutes, then rinse ✨",
    "Fortify, Conditioner | 🍑 Fortify Conditioner smooths damaged hair, detangles & improves resilience and shine. Leave on for 2 minutes, then rinse ✨",
    "Fortify, Shampoo | 🍑 Fortify Shampoo with Multi-Peptides rebuilds & strengthens damaged hair, for shine & a smoother hair surface ✨",
    "Fortify | 🍑 Fibre Clinix Fortify is for damaged & over-processed hair, e.g. from bleaching. Multi-Peptides for up to 8x stronger hair ✨",
    "Hydrate, Spray | 💧 Hydrate Spray Conditioner: a leave-in for towel-dried hair that detangles & locks hydration into the hair fibre, with heat protection ✨",
    "Hydrate, Treatment | 💧 Hydrate Treatment intensively moisturises dry, brittle hair for glass-like shine. Leave on for 10 minutes, then rinse ✨",
    "Hydrate, Conditioner | 💧 Hydrate Conditioner helps retain moisture, improves detangling & leaves hair soft and shiny ✨",
    "Hydrate, Shampoo | 💧 Hydrate Shampoo with Electrolytes balances moisture levels & improves elasticity for softer, shinier hair ✨",
    "Hydrate | 💧 Fibre Clinix Hydrate is for dry & brittle hair. Electrolytes help absorb moisture, for a 48-hour moisturised hair feeling ✨",
    "Vibrancy, Spray | 🌸 Vibrancy Spray Conditioner: a leave-in that detangles coloured hair & helps maintain colour vibrancy, with smoothness & shine ✨",
    "Vibrancy, Treatment | 🌸 Vibrancy Treatment nourishes coloured hair for intense smoothness & shine and helps maintain colour vibrancy. Leave on 10 minutes ✨",
    "Vibrancy, Conditioner | 🌸 Vibrancy Conditioner seals the hair surface, enhances shine & helps preserve colour ✨",
    "Vibrancy, Shampoo | 🌸 Vibrancy Shampoo with AHA protects & locks in colour vibrancy and helps reduce colour fading ✨",
    "Vibrancy | 🌸 Fibre Clinix Vibrancy, our most popular range globally for coloured hair: up to 90% less colour fading & 4x more colour vibrancy ✨",
    "De-Frizz, Spray | 💜 De-Frizz Smoothing Spray: a leave-in that controls frizz for up to 48 hours & protects against humidity. Blow-dry for best results ✨",
    "De-Frizz, Treatment | 💜 De-Frizz Treatment nourishes coarse hair for a silky, shiny finish & controls frizz for up to 48 hours ✨",
    "De-Frizz, Shampoo | 💜 De-Frizz Shampoo with Passion Fruit Oil controls frizz for up to 48 hours & protects against humidity ✨",
    "De-Frizz | 💜 Fibre Clinix De-Frizz is for coarse, unmanageable or curly hair. Passion Fruit Oil helps control frizz for up to 48 hours ✨",
    "Fibre Sealer | 🖤 Fibre Sealer: a lightweight leave-in for dry, rough hair & split ends. Instantly seals up to 94% of split ends, frizz control up to 48h ✨",
    "Leave-In Cream | 🖤 Fibre Sealer: a lightweight leave-in for dry, rough hair & split ends. Instantly seals up to 94% of split ends, frizz control up to 48h ✨",
    "Light Oil | 🖤 Light Oil, our best-seller for shine without greasiness: up to 99% more shine & 5x more nourishment, even for fine hair ✨",
    "Repair Oil | 🖤 Light Oil, our best-seller for shine without greasiness: up to 99% more shine & 5x more nourishment, even for fine hair ✨",
    "Fibre Clinix | ✨ Fibre Clinix is our salon-exclusive haircare with Bondfinity technology, which creates bonds inside the hair fibre. Tell us your hair concern 💬",
    "Flatliner | 🔥 OSiS Flatliner: heat protection up to 230°C with a light hold, for sleeker, smoother styles without stickiness ✨",
    "OSiS, Glow | ✨ OSiS Glow: anti-frizz shine serum for instant shine without greasiness. Controls flyaways, with heat protection up to 230°C ✨",
    "Bounty Balm | 🌀 OSiS Bounty Balm: a rich curl cream that defines curls while keeping them soft, and reduces frizz & flyaways ✨",
    "Tipsy Twirl | 🌀 OSiS Tipsy Twirl: wave & curl jelly with medium hold to help curls keep their shape. Scrunch into towel-dried hair ✨",
    "Upload | 🎈 OSiS Upload: bodifying cream for natural-looking volume & root lift without stiffness. Apply before blow-drying ✨",
    "OSiS, Grip | 🎈 OSiS Grip: extra strong mousse for maximum volume & bounce that holds all day, especially on thicker hair ✨",
    "Volume Up | 🎈 OSiS Volume Up: volume booster spray for instant root lift & fuller-looking hair without stickiness. Spray onto dry roots ✨",
    "Velvet | 🌬️ OSiS Velvet: a lightweight wax-effect spray with the lightest hold in the Texture range, for soft natural texture & movement ✨",
    "Dust It | 💨 OSiS Dust It: mattifying volume powder for instant root lift & strong grip with a matte finish. Great for on-the-go touch-ups ✨",
    "Mighty Matte | 🖤 OSiS Mighty Matte: strong matte cream for texture & separation. Remouldable all day & easy to wash out ✨",
    "Flexwax | ✨ OSiS Flexwax: strong cream wax with natural shine. Flexible & remouldable, easy to apply & wash out ✨",
    "Thrill | 🌀 OSiS Thrill: elastic fibre gum for flexible, piecey texture with medium hold. Controls flyaways & easy to restyle ✨",
    "G.Force | 💪 OSiS G.Force: our extra strong hold gel for structured or wet-look styles. Non-flaky & easy to wash out ✨",
    "OSiS, Freeze | ❄️ OSiS Freeze: strong, humidity-resistant hold hairspray that brushes out easily without flakes ✨",
    "Session | 🏆 OSiS Session: our best-selling extra strong hold hairspray, trusted by professionals. Wind & humidity resistant ✨",
    "OSiS | ✨ OSiS is our professional styling range, mostly vegan with heat protection. Tell us the look you want & we'll recommend a match 💬",
    "Root Activat | 🌱 Bonacure Root Activating range is for anyone with hair thinning concerns. Contains Biotin to help improve hair vitality & strength ✨",
    "Dandruff | 🍃 Bonacure Anti-Dandruff Serum: pH-balanced for oily or dry scalp. Instantly soothes the scalp to help prevent new visible flakes ✨",
    "Scalp Sooth | 🍃 Bonacure Scalp Soothing range is for dry & sensitive scalp, to soothe & calm the scalp while nourishing scalp and hair ✨",
    "Bonacure, Restore | 🌿 Bonacure Restore range is for mature & fragile hair, to help strengthen hair & restore scalp health ✨",
    "Bonacure | ✨ Bonacure cares for scalp & hair. Tell us your scalp or hair concern and we'll recommend the right Bonacure range 💬"
  ].join('\n'),
  productMessages: [
    "[pin] Now showing: {product} at {price}, with our live-exclusive voucher on top 🎟️",
    "Have questions about this product? Ask us in the comments and we'll answer live 💬",
    "Not sure which range suits you? Share your hair concern & the look you want, and we'll recommend a match 💬"
  ].join('\n'),
  generalMessages: [
    "[pin] Welcome to Schwarzkopf Professional live! Salon-exclusive haircare from Germany since 1898. Tell us your hair concern ✨",
    "[pin] LIVE-EXCLUSIVE: 15% off (no min spend) + 5% off all single items. Claim it in the bag icon 🎟️",
    "[pin] SPEND & WIN: Spend $50 during the live & comment your order ID for a chance to win OSiS Session 100ml (worth $17)! 🎁",
    "LIVE-EXCLUSIVE GWP: Free Bonacure Duo Sachet Moisture Kick x2 (worth $8) with any purchase! While stocks last 🎁",
    "🏆 We pick 3 Spend & Win winners each live from $50+ orders! Winners: screenshot the announcement & contact customer service within 1 day",
    "📦 Spend & Win prizes ship separately, about 20 working days after your order is completed with no cancellation, return or refund",
    "Which Fibre Clinix range? Hydrate (blue) for dry, Fortify (peach) for damaged, De-Frizz (purple) for frizzy, Vibrancy (pink) for coloured hair 💬",
    "💡 Salon routine: Shampoo > Mask > Conditioner > Leave-in > Styling. The mask repairs inside the hair strand, the conditioner smooths the outside ✨",
    "Our Professional range is salon-exclusive, and online it's only on our Shopee store. Tell us your hair concern & we'll suggest a routine 💬"
  ].join('\n')
};

const MAX_CHARS = 150;
