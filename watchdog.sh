#!/bin/bash
while true; do
  if ! pgrep -f "node.*server.js" > /dev/null 2>&1; then
    cd /home/z/my-project
    nohup node .next/standalone/server.js > /dev/null 2>&1 &
    echo "$(date): Server restarted" >> /home/z/my-project/watchdog.log
  fi
  sleep 3
done
