# Shopee Live Auto Chat (Chrome extension)

Posts a host message into your Shopee Live session every ~10 minutes. When a product
is set to "Showing", it writes about that product (name and price are read from the
dashboard). When nothing is showing, it uses your general messages instead.

## Install (Mac)

1. Download this `shopee-live-autochat` folder to your Mac.
2. In Chrome, go to `chrome://extensions`.
3. Turn on **Developer mode** (top right).
4. Click **Load unpacked** and select the `shopee-live-autochat` folder.
5. Click the puzzle icon in the toolbar and pin **Shopee Live Auto Chat**.
6. Open (or refresh) your live dashboard at `https://live.shopee.sg/pc/live?session=...`.

## Use

- Click the extension icon. It shows which product it sees as Showing.
- Edit the messages: one per line, start a line with `[pin]` to pin it.
  - `{product}` is the product name, `{price}` the full price (e.g. `$18.10 ~ $63.80`),
    `{lowprice}` the lowest price (e.g. `$18.10`).
  - Shopee allows 150 characters per message; longer messages are cut off.
- **Send one now** posts the next message right away (good for a first test).
- **Start** posts every N minutes, give or take the random variation. **Stop** ends it.
- While a product is showing, every Nth message (default 3rd) is a general message, so
  welcome and voucher reminders keep going out. Set it to 0 to turn this off.
- Countdown messages go out once per live when the timer reaches each mark, e.g.
  `60 | [pin] Only 1 hour left!` sends at 1:00:00 on a 120-minute live. A mark is skipped
  if the extension was started more than 5 minutes after it.
- **Product tips** (`keyword | message`): a set number of seconds (default 10) after a new
  product's first message, the tip whose keyword appears in the product's name is sent, if that
  product is still showing.
- Messages rotate in order. The log at the bottom shows what was sent and any errors.

## Google Sheet (sales)

- When a sheet link is set (top of the popup, or `sheetUrl` in a client's defaults), the general
  and countdown messages are built from the sheet's facts using the client's `generalTemplates`
  and `countdownTemplates`. Product messages and product tips stay in the extension.
- One row per sale, header row first (columns found by name, any order):
  `Sale name | Starts | Ends | Live vouchers | Spend & Win: min spend | Spend & Win: prize |
  Free gift | Gift tiers | Storewide vouchers | Extra messages`. Other columns (e.g. Check) are ignored.
- The row covering today is used; otherwise the row with no dates (the everyday row).
- Templates use `{sale}` `{voucher}` `{winspend}` `{winprize}` `{gift}` `{gifttiers}` `{storewide}`.
  A template is skipped when a fact it uses is blank. Extra messages are added one per line.
- Read on Start and every 10 minutes (or **Refresh**). If it can't be read, the last copy read is
  used; with no copy, the built-in messages. **Preview** lists everything that will be posted today.
- Product tips come from the sheet's **Product Tips** tab (`tipsTabName`): `Keywords | Only during sale | Pin | Tip message`.
  A tip matches when all its keywords are in the pinned product's name (ignoring spaces and capitals);
  the most keywords wins, then the higher row. "Only during sale" limits a tip to sales whose name contains it.
- `retiredSheetUrls` in a client's defaults: a saved link to one of these is replaced on update.
- The sheet must be shared as "Anyone with the link: Viewer".

## Clients

- Each client gets its own build with its messages filled in: `clients/<client>/defaults.js`.
- Build a client's zip with `./build-client.sh shiseido-professional`. Install it in that
  client's Chrome profile from its own folder.
- Settings are saved per Chrome profile and per computer; they do not sync between computers.

## Notes

- Keep the live dashboard tab open. It does not need to be the active tab.
- If you change the extension files, click the reload icon on `chrome://extensions`
  and refresh the live tab.
- Shopee uses build-specific class names. If Shopee updates its dashboard and the
  extension stops finding the chat box or product, the selectors in `content.js` need updating.
