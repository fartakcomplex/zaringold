#!/bin/bash
cd /home/z/my-project/zaringold/.next/standalone
while true; do
    node server.js 2>&1 &
    PID=$!
    echo "[$(date)] Started server PID=$PID"
    # Wait for process to exit
    wait $PID 2>/dev/null
    EXIT=$?
    echo "[$(date)] Server exited with code=$EXIT, restarting in 2s..."
    sleep 2
done
