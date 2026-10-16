// Shared default settings for the background worker and the popup.
// Start a line with [pin] to pin that message.
const DEFAULT_SETTINGS = {
  running: false,
  intervalMinutes: 10,
  jitterMinutes: 1,
  // While a product is showing, every Nth timed message is a general one (0 = never).
  generalEvery: 3,
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
