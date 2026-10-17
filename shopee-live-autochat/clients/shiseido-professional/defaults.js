// Shiseido Professional default settings. Start a line with [pin] to pin that message.
const CLIENT_NAME = 'Shiseido Professional';
const DEFAULT_SETTINGS = {
  running: false,
  intervalMinutes: 10,
  jitterMinutes: 1,
  // While a product is showing, every Nth timed message is a general one (0 = never).
  generalEvery: 3,
  // Countdown messages: "minutes left | message", based on the live timer and live length.
  liveDurationMinutes: 120,
  countdownMessages: [
    "60 | [pin] 1 hour left! Our 12% live voucher & free Fuente Forte minis are only here during the stream ✨",
    "30 | [pin] 30 minutes left! Spend $90 & comment your order ID to win SUBLIMIC Luminoforce Shampoo 50ml 🎁",
    "10 | [pin] Final 10 minutes! Live-exclusive vouchers end with the stream, check out now ✨"
  ].join('\n'),
  // Product tips: "keyword | message", sent tipDelaySeconds after a new product's
  // first message when the product name contains the keyword.
  tipDelaySeconds: 10,
  productTips: [
    "Adenovital | 💡 SUBLIMIC Adenovital is for thinning, flat hair. Supports scalp, roots & hair for fuller-looking hair ✨",
    "Aqua Intensive | 💡 SUBLIMIC Aqua Intensive is for damaged hair from colouring & perming. Replenishes lost moisture ✨",
    "Luminoforce | 💡 SUBLIMIC Luminoforce is for coloured hair. Protects colour while boosting shine & smoothness ✨",
    "Airy Flow | 💡 SUBLIMIC Airy Flow is for frizzy, wavy hair. Uses everyday heat to make hair easier to manage ✨",
    "Fuente Forte | 💡 SUBLIMIC Fuente Forte is for scalp dryness, oiliness, dandruff & itchiness. Hydrates the scalp ✨",
    "Timetic | 💡 SUBLIMIC Timetic is for premium anti-ageing scalp & hair care that follows your circadian rhythm ✨",
    "Wonder Shield | 💡 SUBLIMIC Wonder Shield is for everyday protection from heat, UV, humidity & pollution ✨"
  ].join('\n'),
  productMessages: [
    "[pin] Now showing: {product} at {price}! Grab it with our 12% live voucher 🎟️",
    "Have questions about this product? Ask us in the comments and we'll answer live 💬",
    "Not sure which SUBLIMIC range suits you? Share your hair & scalp concerns and we'll recommend one 💬"
  ].join('\n'),
  generalMessages: [
    "[pin] Welcome to Shiseido Professional Live! SUBLIMIC is our premium salon range from Japan. Share your hair concerns & we'll recommend a match ✨",
    "[pin] LIVE-EXCLUSIVE: 12% off voucher with no min spend + 5% off all single items. Claim them in the bag icon 🎟️",
    "[pin] SPEND & WIN: Spend $90 during the live & comment your order ID to win SUBLIMIC Luminoforce Shampoo 50ml! 3 winners this live 🎁",
    "FREE GIFT: SUBLIMIC Fuente Forte Oily Scalp Shampoo & Treatment 10ml (worth $8) with any purchase, no min spend 🎁",
    "More savings storewide: 11% off min spend $90 (capped $10) & 13% off min spend $120 (capped $16) 🛍️"
  ].join('\n')
};

const MAX_CHARS = 150;
