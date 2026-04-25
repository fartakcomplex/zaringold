#!/bin/bash
# Keep-alive script for Next.js dev server
cd /home/z/my-project

while true; do
    # Check if port 3000 is responding
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null)
    
    if [ "$RESPONSE" != "200" ]; then
        echo "[$(date)] Server down (HTTP $RESPONSE). Restarting..." >> /home/z/my-project/keepalive.log
        
        # Kill any remaining processes
        kill -9 $(pgrep -f "next") 2>/dev/null
        kill -9 $(pgrep -f "bun.*dev") 2>/dev/null
        sleep 2
        
        # Clean build cache to save memory
        rm -rf /home/z/my-project/.next/cache 2>/dev/null
        
        # Restart
        nohup bun run dev > /home/z/my-project/dev.log 2>&1 &
        echo "[$(date)] Started new process PID: $!" >> /home/z/my-project/keepalive.log
        
        # Wait for it to come up
        sleep 15
    fi
    
    sleep 10
done
