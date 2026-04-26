#!/bin/bash
cd /home/z/my-project
while true; do
  if ! ss -tlnp 2>/dev/null | grep -q ':3000'; then
    NODE_OPTIONS="--max-old-space-size=256" nohup npx next dev -p 3000 > dev.log 2>&1 &
    disown
  fi
  sleep 3
done
