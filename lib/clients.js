'use strict';

const fs = require('fs');
const path = require('path');

// Internal client database. One JSON file per client in data/clients/.
// Files are read at startup; restart the server after adding or editing one.

const CLIENTS_DIR = path.join(__dirname, '..', 'data', 'clients');

function loadClients(dir = CLIENTS_DIR) {
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.json'))
    .map(f => {
      const client = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
      if (!client.id || !client.name) throw new Error(`Client file ${f} needs an "id" and a "name"`);
      client.approved_copy = client.approved_copy || [];
      return client;
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

const CLIENTS = loadClients();
const CLIENT_MAP = Object.fromEntries(CLIENTS.map(c => [c.id, c]));

function getClient(id) {
  return CLIENT_MAP[id] || null;
}

// Approved examples ordered so the ones matching the chosen objective come first.
function rankExamples(client, objective) {
  const tags = objective ? objective.tags : [];
  const score = ex => (tags.includes(ex.objective) ? 0 : 1);
  return [...client.approved_copy].sort((a, b) => score(a) - score(b));
}

function clientSummary(client) {
  return {
    id: client.id,
    name: client.name,
    market: client.market,
    business_unit: client.business_unit,
    voice: client.brand_voice && client.brand_voice.summary,
    example_count: client.approved_copy.length
  };
}

module.exports = { CLIENTS, getClient, rankExamples, clientSummary, loadClients };
