#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
export PORT="${PORT:-43173}"
exec cargo run
