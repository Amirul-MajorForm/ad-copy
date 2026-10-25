#!/usr/bin/env bash
# Builds a ready-to-install zip for one client: the shared extension code with
# that client's messages (clients/<slug>/defaults.js) as the defaults.
# Usage: ./build-client.sh shiseido-professional [output-dir]
set -euo pipefail
cd "$(dirname "$0")"
slug="$1"; out="${2:-.}"
[ -f "clients/$slug/defaults.js" ] || { echo "No clients/$slug/defaults.js" >&2; exit 1; }
name=$(sed -n "s/^const CLIENT_NAME = '\(.*\)';/\1/p" "clients/$slug/defaults.js")
tmp=$(mktemp -d); dir="$tmp/shopee-live-autochat-$slug"
mkdir "$dir"
cp -R manifest.json background.js content.js sheet.js popup.html popup.js README.md icons fonts "$dir/"
cp "clients/$slug/defaults.js" "$dir/defaults.js"
node -e "const f='$dir/manifest.json',m=require(f);m.name='Shopee Live Auto Chat ($name)';require('fs').writeFileSync(f,JSON.stringify(m,null,2)+'\n')"
out=$(cd "$out" && pwd); rm -f "$out/shopee-live-autochat-$slug.zip"
(cd "$tmp" && zip -qr "$out/shopee-live-autochat-$slug.zip" "shopee-live-autochat-$slug")
rm -rf "$tmp"
echo "$out/shopee-live-autochat-$slug.zip"
