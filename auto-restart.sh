#!/bin/bash
# Auto-restart watchdog for Zarin Gold server
cd /home/z/my-project
while true; do
  bun ultra-server.js > ultra.log 2>&1 &
  PID=$!
  # Monitor and auto-restart every 2 seconds
  while kill -0 $PID 2>/dev/null; do
    sleep 2
  done
  echo "[$(date)] Server (PID $PID) died, restarting..." >> watchdog.log
  sleep 1
done
