// Shared default settings for the background worker and the popup.
// Start a line with [pin] to pin that message.
const DEFAULT_SETTINGS = {
  running: false,
  intervalMinutes: 10,
  jitterMinutes: 1,
  // While a product is showing, every Nth timed message is a general one (0 = never).
  generalEvery: 3,
  // Countdown messages: "minutes left | message", based on the live timer and live length.
  liveDurationMinutes: 120,
  countdownMessages: [
    '60 | [pin] Only 1 hour left in our live! Grab your live-only vouchers before they are gone 🛍️',
    '30 | [pin] 30 minutes left! Check out now to enjoy live-only prices ⏰',
    '10 | [pin] Final 10 minutes! Last chance for our live-only deals, check out now 🔥'
  ].join('\n'),
  // Product tips: "keyword | tip". Used by {range} and {tip} in messages.
  productTips: '',
  // Tip message: sent this many seconds after a new product's first message.
  tipDelaySeconds: 10,
  tipMessages: '💡 {range}: {tip}',
  productMessages: [
    '[pin] Now showing: {product}! Only {price} on this live. Tap the bag icon to grab it 🛒',
    'Loving the {product}? Get it from {lowprice} today, add to cart now!',
    'Any questions about the {product}? Drop them in the comments and we will answer live 💬'
  ].join('\n'),
  generalMessages: [
    '[pin] Welcome to our live! Live-only vouchers are waiting in the bag icon 🛍️',
    'Enjoying the live? Tap ❤️ and share it with a friend!'
  ].join('\n')
};

const MAX_CHARS = 150;
