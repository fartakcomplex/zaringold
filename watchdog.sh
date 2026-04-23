#!/bin/bash
while true; do
  if ! ss -tlnp | grep -q ":3000 "; then
    echo "[$(date)] Port 3000 down, restarting Next.js..."
    cd /home/z/my-project
    rm -rf .next/cache
    NODE_OPTIONS="--max-old-space-size=512" setsid npx next dev --port 3000 >> /home/z/my-project/dev.log 2>&1 &
    disown
  fi
  sleep 5
done
