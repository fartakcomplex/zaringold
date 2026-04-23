#!/bin/bash
cd /home/z/my-project
export NODE_OPTIONS="--max-old-space-size=512"

while true; do
  echo "[$(date)] Starting Next.js server..."
  npx next dev --port 3000 >> dev.log 2>&1
  EXIT_CODE=$?
  echo "[$(date)] Server exited with code $EXIT_CODE, restarting in 3s..."
  sleep 3
  # Clean up stale .next cache on crash
  rm -rf .next/cache 2>/dev/null
done
