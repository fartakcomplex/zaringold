#!/bin/bash
cd /home/z/my-project
while true; do
  if ! ss -tlnp 2>/dev/null | grep -q ':3001'; then
    echo "$(date '+%H:%M:%S') - Starting Next.js..."
    PORT=3001 NODE_OPTIONS="--max-old-space-size=512" node .next/standalone/server.js > /dev/null 2>&1 &
    disown
    sleep 10
  fi
  sleep 5
done
