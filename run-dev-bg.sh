#!/bin/bash
# Start the dev server and keep it running
cd /home/z/my-project/zaringold

# Kill any existing process
kill $(lsof -ti :3000) 2>/dev/null

# Start the production standalone server
cd .next/standalone
exec node server.js >> /home/z/my-project/dev.log 2>&1
