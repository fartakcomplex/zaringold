#!/bin/bash
cd /home/z/my-project
while true; do
  node --max-old-space-size=2048 .next/standalone/server.js 2>&1 &
  PID=$!
  echo "$(date '+%H:%M:%S') - Next.js started (PID: $PID)"
  wait $PID
  EXIT=$?
  echo "$(date '+%H:%M:%S') - Server exited (code: $EXIT), restarting in 3s..."
  sleep 3
done
