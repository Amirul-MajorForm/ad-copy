# Ad Copy Studio by MajorForm

A hosted web app that writes platform-safe ad copy (headlines, primary text, descriptions, long headlines) for MajorForm clients.

The team uploads a creative, writes a brief in plain language, or both. They pick the **client**, **platform**, **ad objective** and **how many variations** of each field they need. The app returns copy that:

- follows the MajorForm copywriting method (`prompts/copywriter-system-prompt.md`)
- matches the client's voice, using their approved copy from past campaigns as a style reference
- fits each platform's character limits: every line is counted, and anything over the limit is sent back to Claude to be rewritten
- pastes straight into Google Sheets as TSV

Static and video creatives are read the same way as in **ROAST** (creative-analyzer): images are resized to 1200px JPEG, and videos are sampled into 6 key frames with FFmpeg and sent in order.

---

## How it works

```
Upload / brief ──► server.js ──► lib/media.js       (image resize / 6 video key frames, from ROAST)
                              ──► lib/prompt.js      (method + client DB + platform limits + objective + brief)
                              ──► lib/generate.js    (Claude, structured JSON output)
                                     │
                                     ▼
                              lib/copy-rules.js      (count chars, strip dashes, find over-limit / missing lines)
                                     │ problems?
                                     ▼
                              repair pass (up to 2 rounds, only the broken lines)
                                     │
                                     ▼
                              UI: per-line char counts, inline editing, Copy for Sheets
```

Each uploaded creative gets its own copy set (up to 5 per run, generated in parallel). With no upload, the brief alone produces one set.

All creatives appear in **one consolidated table**, laid out like the activation sheet: one row per creative, then Headline 1..n, Primary Text 1..n, Description 1..n across. Every cell is editable and shows its character count. **Copy table for Sheets** copies the whole table; click one cell in Google Sheets and paste.

Below the table there is a **feedback box**: write what should change (for example "lead headlines with the offer, make primary text 2 more playful") and press **Revise copy**. You can apply feedback to all creatives or just one. Manual edits are kept, feedback stacks across rounds, changed cells are marked in green, and **Undo last revision** restores the previous version. Revisions are text-only (images are not re-sent), so they are faster and cheaper than the first run.

---

## Platforms and character limits

Limits live in `lib/platforms.js` (last verified September 2026). For Meta, TikTok and LinkedIn the app writes to the length that shows before truncation ("See more"); for Google it writes to the hard cap.

| Platform | Field | Limit used | Platform max | Per ad |
|---|---|---|---|---|
| Meta - Feed, Stories & Reels | Primary text | 125 | 2,200 | 5 |
| | Headline | 40 | 255 | 5 |
| | Description | 30 | 255 | 5 |
| Meta - Carousel | Primary text | 80 | 2,200 | 1 |
| | Card headline | 32 | 255 | 1 per card |
| | Card description | 18 | 255 | 1 per card |
| TikTok - In-Feed | Ad text | 100 | 100 | 5 |
| Google Search RSA | Headline | 30 | 30 | 15 |
| | Description | 90 | 90 | 4 |
| Google Performance Max | Headline | 30 | 30 | 15 |
| | Long headline | 90 | 90 | 5 |
| | Description | 90 (one must be ≤ 60) | 90 | 5 |
| Google Demand Gen / YouTube | Headline | 40 (one must be ≤ 30) | 40 | 5 |
| | Long headline (video) | 90 | 90 | 5 |
| | Description | 90 | 90 | 5 |
| LinkedIn Sponsored Content | Introductory text | 150 | 600 | 1 |
| | Headline | 70 | 70 | 1 |
| | Description | 100 | 300 | 1 |

Google counts Chinese, Japanese and Korean characters as 2; the counter does the same for Google platforms. Platform policy notes (for example Meta's personal attributes policy and Google's no-exclamation-marks rule for headlines) are passed to Claude with the limits.

To add a platform or change a limit, edit `lib/platforms.js`. The UI updates automatically.

---

## Client database

One JSON file per client in `data/clients/`. The four clients from the activation sheet are loaded:

| File | Client | Approved copy sets |
|---|---|---|
| `strong-sg.json` | STRONG Singapore (DFM) | 20 |
| `yoga-movement-sg.json` | Yoga Movement Singapore (YMSG) | 23 |
| `yoga-movement-hk.json` | Yoga Movement Hong Kong (YMHK) | 11 |
| `yoga-movement-academy.json` | Yoga Movement Academy (YMA) | 7 |

Each file holds the brand voice, naming rules, words to avoid, products and evergreen facts, past offers, and approved headlines and primary text tagged by objective. When the team picks an objective, examples with that objective are shown to Claude first.

Past offers are marked as history: the app only puts an offer, price, date or promo code in the copy if it is in the brief or on the creative.

**Adding a client or new approved copy:** copy one of the JSON files, keep the same structure, and restart the server. For a client that is not in the database, pick **Other (not in database)** in the UI and add brand notes.

---

## Local setup

Requires Node.js 18+ and an Anthropic API key. FFmpeg is bundled through `ffmpeg-static`, so nothing else needs installing.

```bash
npm install
cp .env.example .env   # add ANTHROPIC_API_KEY
npm start              # http://localhost:3000
npm test               # unit + end-to-end tests (Claude is mocked)
```

### Environment variables

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | Yes | Anthropic API key. This is the only variable you need. |
| `CLAUDE_MODEL` | No | Defaults to `claude-opus-5-5` |
| `CLAUDE_EFFORT` | No | `low`, `medium` (default), `high` |
| `APP_PASSWORD` | No | Turns on HTTP Basic Auth for the whole app |
| `SHEETS_WEBHOOK_URL` | No | Logs each run to Google Sheets (same Apps Script webhook as ROAST) |
| `PORT` | No | Defaults to 3000 |

Requests use structured JSON output and the API's `fallbacks: "default"` option, so if a safety classifier declines a request it is re-run on Anthropic's recommended fallback model instead of failing.

## Deploy

Same as ROAST: Railway or Render with `npm install` and `npm start`, then add the environment variables. It can be embedded in Squarespace with an iframe code block.

## Editing the copywriting method

`prompts/copywriter-system-prompt.md` is the MajorForm creative strategist prompt, unchanged. Edit it to change how copy is written. The app adds a short block of operating rules after it (JSON output, exact counts, hard character limits, no em dashes, no invented offers); those live in `lib/prompt.js`.
