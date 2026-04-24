#!/bin/bash
cd /home/z/my-project
while true; do
  if ! ss -tlnp | grep -q ":3000 "; then
    echo "[$(date)] Server not running, starting..."
    npx next dev -p 3000 -H 0.0.0.0 > dev.log 2>&1 &
    echo "[$(date)] Started with PID $!"
  fi
  sleep 5
done
