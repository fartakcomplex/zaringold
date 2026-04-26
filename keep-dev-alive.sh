#!/bin/bash
cd /home/z/my-project/zaringold
while true; do
    if ! lsof -i :3000 >/dev/null 2>&1; then
        echo "[$(date)] Starting server..."
        npx next dev -p 3000 >> /home/z/my-project/dev.log 2>&1
        echo "[$(date)] Server exited, restarting in 3s..."
        sleep 3
    else
        sleep 5
    fi
done
