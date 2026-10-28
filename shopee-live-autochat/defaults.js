// Shared default settings for the background worker and the popup.
// Start a line with [pin] to pin that message.
// Which live dashboard this build works on.
const PLATFORM = { name: 'Shopee Live', liveUrl: 'https://live.shopee.sg/pc/*', livePath: '/pc/live', canPin: true };
const DEFAULT_SETTINGS = {
  running: false,
  // Google Sheet with the messages and sale periods. When set, its messages are used
  // instead of the boxes below (see sheet.js for the layout).
  sheetUrl: '',
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
    "[pin] Welcome to our {sale} live! Tell us what you're looking for and we'll help ✨",
    "[pin] LIVE-EXCLUSIVE: {voucher}. Claim it in the bag icon 🎟️",
    "[pin] SPEND & WIN: Spend {winspend} during the live & comment your order ID to win {winprize}! 🎁",
    "FREE GIFT: {gift} 🎁",
    "MORE GIFTS: {gifttiers} 🎁",
    "STOREWIDE VOUCHERS: {storewide} 🛍️"
  ].join('\n'),
  countdownTemplates: [
    "60 | [pin] 1 hour left in our {sale} live! Live-exclusive deals end with the stream, grab them now ✨",
    "30 | [pin] 30 minutes left! Add to cart now to enjoy our live-exclusive prices 🛒",
    "10 | [pin] Final 10 minutes of our {sale} live! Live-exclusive vouchers end with the stream, check out now ✨"
  ].join('\n'),
  // Countdown messages: "minutes left | message", based on the live timer and live length.
  liveDurationMinutes: 120,
  countdownMessages: [
    '60 | [pin] Only 1 hour left in our live! Grab your live-only vouchers before they are gone 🛍️',
    '30 | [pin] 30 minutes left! Check out now to enjoy live-only prices ⏰',
    '10 | [pin] Final 10 minutes! Last chance for our live-only deals, check out now 🔥'
  ].join('\n'),
  // Product tips: "keyword | message", sent tipDelaySeconds after a new product's
  // first message when the product name contains the keyword.
  tipDelaySeconds: 10,
  productTips: '',
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
