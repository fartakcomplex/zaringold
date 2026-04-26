#!/bin/bash
cd /home/z/my-project
while true; do
  if ! ss -tlnp 2>/dev/null | grep -q ':3000'; then
    echo "$(date '+%H:%M:%S') - Restarting dev server..."
    pkill -9 -f "next" 2>/dev/null
    sleep 3
    npx next dev -p 3000 --turbopack > /dev/null 2>&1 &
    disown
    sleep 12
  fi
  sleep 4
done
