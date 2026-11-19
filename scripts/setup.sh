#!/usr/bin/env bash
# One-command setup: checks prerequisites, installs dependencies, builds once.
set -euo pipefail
cd "$(dirname "$0")/.."

need() { command -v "$1" >/dev/null || { echo "Missing: $1 ($2)"; exit 1; }; }
need node   "install Node.js 22+ from https://nodejs.org"
need npm    "comes with Node.js"
need python3 "install Python 3.10+"

node_major=$(node -p 'process.versions.node.split(".")[0]')
[ "$node_major" -ge 22 ] || { echo "Node.js 22+ required (found $(node -v))"; exit 1; }

npm ci 2>/dev/null || npm install
python3 -m venv .venv
.venv/bin/python -m pip install -q -r requirements.txt
npx astro build >/dev/null

cat <<MSG

Setup complete.
  make dev      start local server at http://localhost:4321
  make papers   refresh publications from arXiv / OpenAlex
  make github   publish to GitHub Pages (needs: gh auth login)
  make help     all commands
MSG
