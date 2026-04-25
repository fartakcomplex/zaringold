#!/bin/bash
cd /home/z/my-project
export NODE_OPTIONS="--max-old-space-size=256"

while true; do
    if ! curl -s --max-time 2 http://localhost:3000/ > /dev/null 2>&1; then
        # Clean up
        kill -9 $(pgrep -f "next-server") 2>/dev/null
        kill -9 $(pgrep -f "next dev") 2>/dev/null
        rm -rf .next/cache 2>/dev/null
        sleep 1
        # Start fresh
        nohup bun run dev > dev.log 2>&1 &
        sleep 12
    fi
    sleep 5
done
