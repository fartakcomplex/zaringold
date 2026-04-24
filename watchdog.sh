#!/bin/bash
cd /home/z/my-project
echo "[$(date)] Watchdog started" >> watchdog.log
while true; do
  if ! ss -tlnp 2>/dev/null | grep -q ':3000 '; then
    pkill -f "ultra-server" 2>/dev/null
    sleep 1
    echo "[$(date)] Starting server..." >> watchdog.log
    node ultra-server.js >> ultra.log 2>&1 &
    disown
    sleep 2
  fi
  sleep 3
done
