#!/bin/bash
# Keep-alive wrapper for Next.js dev server + Backup Scheduler
# Restarts the server automatically if it crashes

LOG_DIR="/home/z/my-project"
LOG_FILE="$LOG_DIR/dev.log"
PID_FILE="$LOG_DIR/.dev-server.pid"
SCHEDULER_PID_FILE="$LOG_DIR/.backup-scheduler.pid"
SCHEDULER_LOG="$LOG_DIR/db/backups/scheduler.log"

cd "$LOG_DIR"

# Kill any existing server and scheduler
if [ -f "$PID_FILE" ]; then
  OLD_PID=$(cat "$PID_FILE")
  kill -9 "$OLD_PID" 2>/dev/null
fi
if [ -f "$SCHEDULER_PID_FILE" ]; then
  OLD_SCHED_PID=$(cat "$SCHEDULER_PID_FILE")
  kill -9 "$OLD_SCHED_PID" 2>/dev/null
fi
pkill -f "next-server" 2>/dev/null
pkill -f "next dev" 2>/dev/null
pkill -f "backup-scheduler" 2>/dev/null
sleep 1

echo "[$(date)] Starting Next.js dev server with keep-alive..." > "$LOG_FILE"

while true; do
  echo "[$(date)] === Server starting ===" >> "$LOG_FILE"
  
  # Run Next.js dev server
  npx next dev -p 3000 >> "$LOG_FILE" 2>&1
  
  EXIT_CODE=$?
  echo "[$(date)] Server exited with code $EXIT_CODE" >> "$LOG_FILE"
  
  # Wait a bit before restarting
  sleep 3
done &

echo $! > "$PID_FILE"
disown
echo "Keep-alive wrapper started. PID: $(cat $PID_FILE)"

# ── Start Backup Scheduler ──
mkdir -p "$LOG_DIR/db/backups"
echo "[$(date)] Starting backup scheduler..." >> "$SCHEDULER_LOG"

while true; do
  echo "[$(date)] === Backup scheduler starting ===" >> "$SCHEDULER_LOG"
  bun run scripts/backup-scheduler.ts >> "$SCHEDULER_LOG" 2>&1
  EXIT_CODE=$?
  echo "[$(date)] Backup scheduler exited with code $EXIT_CODE" >> "$SCHEDULER_LOG"
  sleep 10
done &

echo $! > "$SCHEDULER_PID_FILE"
disown
echo "Backup scheduler started. PID: $(cat $SCHEDULER_PID_FILE)"
