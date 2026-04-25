#!/bin/bash
cd /home/z/my-project
while true; do
  echo "Starting Next.js dev server..."
  npx next dev --turbopack -p 3000 2>&1 | tee -a /home/z/my-project/dev.log
  echo "Server crashed, restarting in 3s..."
  sleep 3
done
