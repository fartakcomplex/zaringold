/**
 * Zarrin Gold — Automated Backup Scheduler
 * 
 * Runs as a standalone background process using Bun.
 * Checks every 60 minutes whether a daily/weekly backup is needed.
 * Creates backups when conditions are met (daily: >20h, weekly: Saturday & >6d).
 * Cleans up old backups automatically.
 * 
 * Usage:
 *   bun run scripts/backup-scheduler.ts
 * 
 * Schedule:
 *   - Daily backup: Every 20 hours (keeps last 30)
 *   - Weekly backup: Every Saturday if 6+ days since last (keeps last 8)
 */

import { autoBackup } from '../src/lib/backup';
import fs from 'fs';
import path from 'path';

const LOG_FILE = path.join(process.cwd(), 'db', 'backups', 'scheduler.log');
const CHECK_INTERVAL_MS = 60 * 60 * 1000; // Check every 60 minutes

function log(message: string): void {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${message}\n`;
  console.log(line.trim());
  try {
    fs.appendFileSync(LOG_FILE, line, 'utf-8');
  } catch {}
}

/* ── Main loop ── */
async function main(): Promise<void> {
  log('=== Zarrin Gold Backup Scheduler started ===');
  log(`Check interval: every ${CHECK_INTERVAL_MS / 60000} minutes`);
  log(`Database: ${process.env.DATABASE_URL || 'db/custom.db'}`);

  // Run an initial check on startup
  try {
    log('Running initial backup check...');
    const result = autoBackup();
    if (result.dailyCreated) {
      log(`Daily backup created: ${result.dailyBackup?.filename} (${result.dailyBackup?.sizeHuman})`);
    } else {
      log('Daily backup not needed yet');
    }
    if (result.weeklyCreated) {
      log(`Weekly backup created: ${result.weeklyBackup?.filename} (${result.weeklyBackup?.sizeHuman})`);
    }
    if (result.cleanedCount > 0) {
      log(`Cleaned up ${result.cleanedCount} old backup(s)`);
    }
    log(`Initial check completed in ${result.duration}ms`);
  } catch (err: any) {
    log(`Initial check failed: ${err.message}`);
  }

  // Schedule periodic checks
  setInterval(async () => {
    try {
      log('Running scheduled backup check...');
      const result = autoBackup();
      if (result.dailyCreated) {
        log(`Daily backup created: ${result.dailyBackup?.filename} (${result.dailyBackup?.sizeHuman})`);
      }
      if (result.weeklyCreated) {
        log(`Weekly backup created: ${result.weeklyBackup?.filename} (${result.weeklyBackup?.sizeHuman})`);
      }
      if (result.cleanedCount > 0) {
        log(`Cleaned up ${result.cleanedCount} old backup(s)`);
      }
      if (!result.dailyCreated && !result.weeklyCreated && result.cleanedCount === 0) {
        log('No action needed');
      }
    } catch (err: any) {
      log(`Scheduled check failed: ${err.message}`);
    }
  }, CHECK_INTERVAL_MS);
}

main().catch((err) => {
  console.error('Backup scheduler crashed:', err);
  process.exit(1);
});
