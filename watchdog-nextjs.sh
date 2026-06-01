#!/bin/bash
cd /home/z/my-project
echo "[$(date)] Next.js Watchdog started" >> watchdog.log
while true; do
    if ! ss -tlnp 2>/dev/null | grep -q ':3000 '; then
        echo "[$(date)] Next.js not running, restarting..." >> watchdog.log
        cd /home/z/my-project
        NEXT_DISABLE_TURBOPACK=1 nohup npx next dev -H 0.0.0.0 -p 3000 > /home/z/my-project/dev.log 2>&1 &
        disown
        echo "[$(date)] Started Next.js (PID: $!)" >> watchdog.log
        sleep 15
    fi
    sleep 5
done
