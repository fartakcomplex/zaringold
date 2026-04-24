#!/bin/bash
# Lightweight watchdog for Next.js production server
cd /home/z/my-project

while true; do
    # Check if port 3000 is listening
    if ! lsof -i :3000 > /dev/null 2>&1; then
        echo "[$(date)] Restarting server..." >> watchdog.log
        # Kill any leftover processes
        pkill -f "node.*server.js" 2>/dev/null
        sleep 1
        # Start fresh
        cd /home/z/my-project
        NODE_ENV=production node .next/standalone/server.js >> server.log 2>&1 &
        echo "[$(date)] Started PID: $!" >> watchdog.log
    fi
    sleep 5
done
