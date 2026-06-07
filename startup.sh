#!/usr/bin/env bash
# startup.sh — Start the SCHOOLME101 MCP Server
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DIST="$SCRIPT_DIR/dist/index.js"

# Build if dist is missing
if [ ! -f "$DIST" ]; then
  echo "Building TypeScript..." >&2
  npm --prefix "$SCRIPT_DIR" run build
fi

export CURRICULUM_PATH="${CURRICULUM_PATH:-$SCRIPT_DIR}"
export MCP_TRANSPORT="${MCP_TRANSPORT:-stdio}"

exec node "$DIST"
