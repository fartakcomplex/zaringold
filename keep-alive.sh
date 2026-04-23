#!/bin/bash
if ! ss -tlnp | grep -q ":3000 "; then
  cd /home/z/my-project
  export NODE_OPTIONS="--max-old-space-size=512"
  nohup bun run dev > /home/z/my-project/dev.log 2>&1 &
  disown
  echo "$(date): Started Next.js" >> /home/z/my-project/keep-alive.log
fi
