#!/bin/bash
while true; do
  echo "$(date): Starting Next.js server..."
  cd /home/z/my-project
  node --max-old-space-size=2048 .next/standalone/server.js 2>&1
  echo "$(date): Server exited, restarting in 2s..."
  sleep 2
done
