#!/bin/bash
trap "" PIPE
cd /home/z/my-project
exec node node_modules/.bin/next dev -p 3000
