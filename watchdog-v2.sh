#!/bin/bash
while true; do
  if ! lsof -i :3000 2>/dev/null | grep -q LISTEN; then
    cd /home/z/my-project
    pkill -9 -f "next" 2>/dev/null
    sleep 2
    NEXT_DISABLE_TURBOPACK=1 nohup npx next dev -H 0.0.0.0 -p 3000 > /home/z/my-project/dev.log 2>&1 &
    echo "[$(date)] Next.js restarted (PID: $!)" >> /home/z/my-project/watchdog.log
    sleep 15
  fi
  sleep 5
done
