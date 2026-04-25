#!/bin/bash
cd /home/z/my-project
while true; do
    echo "[$(date)] Starting server..." >> /home/z/my-project/server.log
    NODE_OPTIONS="--max-old-space-size=512" bun run dev >> /home/z/my-project/server.log 2>&1
    EXIT_CODE=$?
    echo "[$(date)] Server exited with code $EXIT_CODE" >> /home/z/my-project/server.log
    sleep 2
done
