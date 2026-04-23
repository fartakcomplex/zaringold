#!/bin/sh
# Start Mili Gold dev server
# Usage: sh start.sh
cd /home/z/my-project
pkill -f "next-server" 2>/dev/null
pkill -f "next dev" 2>/dev/null
sleep 1
rm -f dev.log
nohup bun run dev > dev.log 2>&1 &
echo "Server starting... (port 3000)"
echo "Waiting 15s..."
sleep 15
if ss -tlnp | grep -q 3000; then
  echo "✅ Server is RUNNING on port 3000"
else
  echo "❌ Server failed to start"
  tail -20 dev.log
fi
