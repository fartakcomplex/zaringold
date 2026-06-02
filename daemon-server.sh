#!/bin/bash
cd /home/z/my-project
while true; do
  echo "$(date): Starting server..." >> /tmp/daemon-server.log
  node .next/standalone/server.js -H 0.0.0.0 -p 3000 >> /tmp/daemon-server.log 2>&1
  echo "$(date): Server exited with code $?. Restarting in 3s..." >> /tmp/daemon-server.log
  sleep 3
done
