#!/bin/bash
cd /home/z/my-project
rm -rf .next
exec npx next dev -H 0.0.0.0 -p 3000
