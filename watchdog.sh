#!/bin/bash
cd /home/z/my-project
while true; do
  if ! ss -tlnp 2>/dev/null | grep -q ':3000'; then
    echo "$(date '+%H:%M:%S') - Server down, killing leftovers..."
    pkill -f "standalone/server" 2>/dev/null
    sleep 3
    echo "$(date '+%H:%M:%S') - Starting server..."
    node --max-old-space-size=2048 .next/standalone/server.js > /dev/null 2>&1 &
    disown
    sleep 5
    echo "$(date '+%H:%M:%S') - Server should be up now"
  fi
  sleep 3
done
