#!/bin/bash
cd /home/z/my-project
while true; do
  node /home/z/my-project/static-server.js
  echo "[$(date)] Static server crashed, restarting..."
  sleep 2
done
