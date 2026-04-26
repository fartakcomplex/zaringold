#!/bin/bash
cd /home/z/my-project/zaringold

# Kill any existing process on port 3000
kill $(lsof -ti :3000) 2>/dev/null
sleep 1

# Start dev server with NODE_OPTIONS
exec npx next dev -p 3000 >> /home/z/my-project/dev.log 2>&1
