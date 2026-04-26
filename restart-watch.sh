#!/bin/bash
# Auto-restart watcher for zaringold dev server
cd /home/z/my-project

while true; do
  sleep 3
  if ! ss -tlnp | grep -q 3000; then
    echo "[$(date)] Server down, restarting..." >> restart-watch.log
    pkill -9 -f "bun" 2>/dev/null
    rm -rf .next
    sleep 2
    setsid sh -c 'bun --bun run dev > dev.log 2>&1' </dev/null &
    disown
    echo "[$(date)] Server restarted" >> restart-watch.log
  fi
done &
