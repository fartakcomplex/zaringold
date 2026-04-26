#!/bin/bash
cd /home/z/my-project
while true; do
  if ! ss -tlnp 2>/dev/null | grep -q ':3000'; then
    echo "[$(date '+%H:%M:%S')] Starting Next.js dev server..."
    rm -f dev.log
    NODE_OPTIONS="--max-old-space-size=384" nohup bun run dev > dev.log 2>&1 &
    disown
    sleep 30
    if ss -tlnp 2>/dev/null | grep -q ':3000'; then
      echo "[$(date '+%H:%M:%S')] Next.js is running on port 3000"
    else
      echo "[$(date '+%H:%M:%S')] Failed to start, retrying in 10s..."
    fi
  fi
  sleep 15
done
