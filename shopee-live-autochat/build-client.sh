#!/usr/bin/env bash
# Builds a ready-to-install zip for one client: the shared extension code with
# that client's messages (clients/<slug>/defaults.js) as the defaults. The
# client's PLATFORM decides the page script and permissions: Shopee Live
# (content.js) or TikTok Shop LIVE Manager (content-tiktok.js).
# Usage: ./build-client.sh shiseido-professional [output-dir]
set -euo pipefail
cd "$(dirname "$0")"
slug="$1"; out="${2:-.}"
defaults="clients/$slug/defaults.js"
[ -f "$defaults" ] || { echo "No $defaults" >&2; exit 1; }

# A client with clients/<slug>/frozen-at is built exactly as it was at that commit
# (code and messages), so later changes never reach it.
if [ -f "clients/$slug/frozen-at" ]; then
  rev=$(tr -d '[:space:]' < "clients/$slug/frozen-at")
  src=$(mktemp -d); out=$(cd "$out" && pwd)
  git archive "$rev" . | tar -x -C "$src"
  "$src/build-client.sh" "$slug" "$out"
  rm -rf "$src"
  exit 0
fi

# Platform and client name from the client's defaults.
read -r platform prefix name < <(node -e "
  const vm = require('vm'), ctx = {};
  vm.createContext(ctx);
  vm.runInContext(require('fs').readFileSync('$defaults', 'utf8') + ';this.P = PLATFORM; this.N = CLIENT_NAME;', ctx);
  const tiktok = ctx.P.liveUrl.includes('tiktok');
  console.log(tiktok ? 'tiktok' : 'shopee', tiktok ? 'tiktok' : 'shopee', ctx.N);
")

tmp=$(mktemp -d); dir="$tmp/$prefix-live-autochat-$slug"
mkdir "$dir"
cp -R manifest.json background.js sheet.js popup.html popup.js README.md icons fonts "$dir/"
cp "$defaults" "$dir/defaults.js"
if [ "$platform" = tiktok ]; then cp content-tiktok.js "$dir/content.js"; else cp content.js "$dir/content.js"; fi

node -e "
  const f = '$dir/manifest.json', m = require(f), tiktok = '$platform' === 'tiktok';
  m.name = (tiktok ? 'TikTok' : 'Shopee') + ' Live Auto Chat ($name)';
  m.action.default_title = m.name;
  if (tiktok) {
    m.description = 'Posts scheduled host messages about the pinned product in a TikTok Shop LIVE.';
    m.host_permissions = m.host_permissions.map((h) => h.replace('https://live.shopee.sg/*', 'https://shop.tiktok.com/*'));
    m.content_scripts[0].matches = ['https://shop.tiktok.com/streamer/live/*'];
  }
  require('fs').writeFileSync(f, JSON.stringify(m, null, 2) + '\n');
"
out=$(cd "$out" && pwd); zipname="$prefix-live-autochat-$slug.zip"; rm -f "$out/$zipname"
(cd "$tmp" && zip -qr "$out/$zipname" "$(basename "$dir")")
rm -rf "$tmp"
echo "$out/$zipname"
