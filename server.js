require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');

const { PLATFORMS, getPlatform } = require('./lib/platforms');
const { OBJECTIVES, getObjective } = require('./lib/objectives');
const { CLIENTS, getClient, clientSummary } = require('./lib/clients');
const { prepareCreative } = require('./lib/media');
const { generateCopy, MODEL } = require('./lib/generate');

const app = express();
const PORT = process.env.PORT || 3000;
const MAX_CREATIVES = 5;
// Vercel's writable temp dir; fall back to local ./tmp for other platforms
const TMP_DIR = process.env.VERCEL ? '/tmp' : path.join(__dirname, 'tmp');
if (!process.env.VERCEL && !fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('ERROR: ANTHROPIC_API_KEY is not set. Please copy .env.example to .env and fill in your key.');
}

const storage = multer.diskStorage({
  destination: TMP_DIR,
  filename: (req, file, cb) => cb(null, `upload_${Date.now()}_${Math.random().toString(36).slice(2)}`)
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

// Optional HTTP Basic Auth (same as ROAST)
if (process.env.APP_PASSWORD) {
  app.use((req, res, next) => {
    const auth = req.headers.authorization || '';
    const decoded = auth.startsWith('Basic ') ? Buffer.from(auth.slice(6), 'base64').toString() : '';
    const pass = decoded.includes(':') ? decoded.slice(decoded.indexOf(':') + 1) : '';
    if (pass !== process.env.APP_PASSWORD) {
      res.set('WWW-Authenticate', 'Basic realm="Ad Copy Studio"');
      return res.status(401).send('Authentication required');
    }
    next();
  });
}

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ─── GET /api/config ─────────────────────────────────────────────────────────

app.get('/api/config', (req, res) => {
  res.json({
    platforms: PLATFORMS,
    objectives: OBJECTIVES.map(({ id, label }) => ({ id, label })),
    clients: CLIENTS.map(clientSummary),
    maxCreatives: MAX_CREATIVES
  });
});

// ─── Settings validation ─────────────────────────────────────────────────────

function parseSettings(raw) {
  let s;
  try { s = JSON.parse(raw || '{}'); } catch (e) { throw new Error('Invalid request format'); }

  const platform = getPlatform(s.platformId);
  if (!platform) throw new Error('Choose a platform');
  const objective = getObjective(s.objectiveId);
  if (!objective) throw new Error('Choose an ad objective');

  let client = null;
  let customClient = null;
  if (s.clientId === 'custom') {
    const name = String((s.customClient && s.customClient.name) || '').trim();
    if (!name) throw new Error('Enter the brand name for a client that is not in the list');
    customClient = { name: name.slice(0, 100), notes: String(s.customClient.notes || '').slice(0, 4000) };
  } else {
    client = getClient(s.clientId);
    if (!client) throw new Error('Choose a client');
  }

  const counts = {};
  let total = 0;
  for (const f of platform.fields) {
    const n = Math.max(0, Math.min(f.maxCount, parseInt((s.counts || {})[f.key], 10) || 0));
    counts[f.key] = n;
    total += n;
  }
  if (!total) throw new Error('Request at least one variation');

  const brief = String(s.brief || '').trim().slice(0, 6000);
  return { platform, objective, client, customClient, counts, brief };
}

// ─── Optional Google Sheets logging (same webhook format as ROAST) ───────────

async function logToSheets(payload) {
  const webhookUrl = process.env.SHEETS_WEBHOOK_URL;
  if (!webhookUrl) return;
  try {
    const body = JSON.stringify(payload);
    const url = new URL(webhookUrl);
    const proto = webhookUrl.startsWith('https') ? https : http;
    await new Promise((resolve, reject) => {
      const req = proto.request({
        hostname: url.hostname,
        path: url.pathname + url.search,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
        timeout: 5000
      }, r => { r.resume(); resolve(); });
      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
      req.write(body);
      req.end();
    });
  } catch (e) {
    console.error('[sheets] logging failed:', e.message);
  }
}

// ─── POST /api/generate (SSE) ────────────────────────────────────────────────

app.post('/api/generate', upload.array('files', MAX_CREATIVES), async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  const sse = (type, data) => {
    res.write(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`);
    if (typeof res.flush === 'function') res.flush();
  };

  const files = req.files || [];
  const tempPaths = files.map(f => f.path);
  const cleanup = () => tempPaths.forEach(p => { try { if (fs.existsSync(p)) fs.unlinkSync(p); } catch (e) {} });

  try {
    const settings = parseSettings(req.body.settings);
    if (!files.length && !settings.brief) {
      throw new Error('Upload a creative or write a brief (or both)');
    }

    // 1. Read creatives (images compressed, videos sampled into key frames)
    const creatives = [];
    for (let i = 0; i < files.length; i++) {
      sse('progress', { pct: Math.round((i / files.length) * 25), label: `Reading creative ${i + 1} of ${files.length}...` });
      creatives.push(await prepareCreative(files[i], TMP_DIR, tempPaths));
    }
    const jobs = creatives.length ? creatives : [null];

    // 2. Generate copy for each creative in parallel
    let done = 0;
    sse('progress', { pct: 30, label: jobs.length > 1 ? `Writing copy for ${jobs.length} creatives...` : 'Writing copy...' });
    const results = await Promise.all(jobs.map(async (creative, i) => {
      const label = creative ? creative.label : 'Brief';
      try {
        const copy = await generateCopy({ ...settings, creative });
        return { label, isVideo: !!(creative && creative.type === 'video'), ...copy };
      } catch (e) {
        console.error('[generate]', label, e.message);
        return { label, error: e.message || 'Generation failed' };
      } finally {
        done++;
        sse('progress', { pct: 30 + Math.round((done / jobs.length) * 65), label: `Finished ${done} of ${jobs.length}...` });
      }
    }));

    if (results.every(r => r.error)) throw new Error(results[0].error);

    const meta = {
      client: settings.client ? settings.client.name : settings.customClient.name,
      platform: settings.platform.name,
      platformId: settings.platform.id,
      objective: settings.objective.label,
      countMode: settings.platform.countMode
    };
    sse('complete', { meta, results });

    logToSheets({
      timestamp: new Date().toISOString(),
      tool: 'ad-copy-studio',
      model: MODEL,
      ...meta,
      counts: settings.counts,
      brief: settings.brief,
      results
    });
  } catch (e) {
    console.error('[generate]', e.message);
    sse('error', { message: e.message || 'Generation failed' });
  } finally {
    cleanup();
    res.end();
  }
});

// ─── POST /api/revise (SSE) ──────────────────────────────────────────────────
// Rewrites existing copy using the team's feedback. Body:
//   { settings, feedback: [oldest ... newest], targets: [{ index, label, isVideo, creative_read, current: { field: [{ text, angle }] } }] }
// Images are not re-sent; the first round's creative read stands in for them.

function sanitiseCurrent(current, platform, counts) {
  const out = {};
  for (const f of platform.fields) {
    if (!counts[f.key]) continue;
    out[f.key] = ((current || {})[f.key] || []).slice(0, counts[f.key]).map(it => ({
      text: String((it && it.text) || '').slice(0, f.hardMax),
      angle: String((it && it.angle) || '').slice(0, 80)
    }));
  }
  return out;
}

app.post('/api/revise', express.json({ limit: '1mb' }), async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  const sse = (type, data) => {
    res.write(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`);
    if (typeof res.flush === 'function') res.flush();
  };

  try {
    const body = req.body || {};
    const settings = parseSettings(JSON.stringify(body.settings || {}));
    const feedback = (Array.isArray(body.feedback) ? body.feedback : [])
      .map(f => String(f || '').trim().slice(0, 2000)).filter(Boolean).slice(-10);
    if (!feedback.length) throw new Error('Write some feedback first');
    const targets = (Array.isArray(body.targets) ? body.targets : []).slice(0, MAX_CREATIVES);
    if (!targets.length) throw new Error('Nothing to revise');

    let done = 0;
    sse('progress', { pct: 10, label: targets.length > 1 ? `Revising copy for ${targets.length} creatives...` : 'Revising copy...' });
    const results = await Promise.all(targets.map(async t => {
      const label = String(t.label || 'Creative').slice(0, 200);
      try {
        const creative = { type: 'read', label, read: t.creative_read || null };
        const current = sanitiseCurrent(t.current, settings.platform, settings.counts);
        const copy = await generateCopy({ ...settings, creative, revision: { current, feedback } });
        return { index: t.index, label, isVideo: !!t.isVideo, ...copy };
      } catch (e) {
        console.error('[revise]', label, e.message);
        return { index: t.index, label, isVideo: !!t.isVideo, error: e.message || 'Revision failed' };
      } finally {
        done++;
        sse('progress', { pct: 10 + Math.round((done / targets.length) * 85), label: `Revised ${done} of ${targets.length}...` });
      }
    }));

    if (results.every(r => r.error)) throw new Error(results[0].error);
    sse('complete', { results });
    logToSheets({ timestamp: new Date().toISOString(), tool: 'ad-copy-studio', type: 'revision', model: MODEL, feedback, results });
  } catch (e) {
    console.error('[revise]', e.message);
    sse('error', { message: e.message || 'Revision failed' });
  } finally {
    res.end();
  }
});

// ─── Start ───────────────────────────────────────────────────────────────────

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Ad Copy Studio running at http://localhost:${PORT}`);
    console.log(`Model: ${MODEL} | Clients loaded: ${CLIENTS.map(c => c.name).join(', ')}`);
  });
}

module.exports = { app, parseSettings };
