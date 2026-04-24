#!/bin/bash
while true; do
  cd /home/z/my-project
  bun run dev 2>&1
  echo "Server crashed, restarting in 3s..."
  sleep 3
done
