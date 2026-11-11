#!/usr/bin/env bash
set -euo pipefail

export PATH="/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:$PATH"

PROJECT_DIR="/Users/aksingh/Documents/New project/work/loankaise-github"
LOCK_DIR="$PROJECT_DIR/data/autopost.lock"
LOGS_DIR="$PROJECT_DIR/logs"

mkdir -p "$LOGS_DIR" "$PROJECT_DIR/data"
cd "$PROJECT_DIR"

if mkdir "$LOCK_DIR" 2>/dev/null; then
  trap 'rmdir "$LOCK_DIR" 2>/dev/null || true' EXIT
else
  if [ -d "$LOCK_DIR" ] && [ -n "$(find "$LOCK_DIR" -maxdepth 0 -mmin +20 -print -quit 2>/dev/null)" ]; then
    rmdir "$LOCK_DIR" 2>/dev/null || true
    mkdir "$LOCK_DIR"
    trap 'rmdir "$LOCK_DIR" 2>/dev/null || true' EXIT
  else
    echo "$(date '+%Y-%m-%d %H:%M:%S') | INFO | finance-autopost | Previous sync active; skipping cycle." >> "$LOGS_DIR/finance-autopost.log"
    exit 0
  fi
fi

echo "$(date '+%Y-%m-%d %H:%M:%S') | INFO | finance-autopost | Starting 5-min Top-10 finance sync (--limit 2 --push)..." >> "$LOGS_DIR/finance-autopost.log"
set +e
/usr/local/bin/node "$PROJECT_DIR/scripts/finance_autoposter.mjs" --limit 2 --push >> "$LOGS_DIR/finance-autopost.log" 2>&1
STATUS=$?
set -e

if [ "$STATUS" -ne 0 ]; then
  echo "$(date '+%Y-%m-%d %H:%M:%S') | ERROR | finance-autopost | Failed with exit $STATUS." >> "$LOGS_DIR/finance-autopost.log"
else
  echo "$(date '+%Y-%m-%d %H:%M:%S') | INFO | finance-autopost | Completed successfully." >> "$LOGS_DIR/finance-autopost.log"
fi
exit "$STATUS"
