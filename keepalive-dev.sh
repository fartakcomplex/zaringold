#!/bin/bash
while true; do
  if ! ss -tlnp | grep -q ":3000 "; then
    cd /home/z/my-project/zaringold
    NODE_OPTIONS="--max-old-space-size=512" NEXT_DISABLE_TURBOPACK=1 nohup bun run dev > /home/z/my-project/dev.log 2>&1 &
    disown
    echo "$(date): Restarted Next.js" >> /home/z/my-project/zaringold/keepalive.log
  fi
  sleep 10
done
