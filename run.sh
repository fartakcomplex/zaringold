#!/bin/bash
cd /home/z/my-project
export NODE_OPTIONS="--max-old-space-size=512"
while true; do
  npx next dev --port 3000 2>&1 | tee -a dev.log
  echo "$(date): Server crashed, restarting in 2s..." >> dev.log
  sleep 2
done
