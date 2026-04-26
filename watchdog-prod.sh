#!/bin/bash
# Zarin Gold Production Watchdog
# Starts standalone server and restarts if killed
cd /home/z/my-project

while true; do
  export NODE_OPTIONS="--max-old-space-size=128"
  node .next/standalone/server.js >> dev.log 2>&1
  sleep 2
done
