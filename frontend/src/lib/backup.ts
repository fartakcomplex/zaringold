/**
 * Zarrin Gold — Database Backup System
 * 
 * Automatic daily & weekly backups for SQLite database.
 * - Daily backup: Every 20+ hours (keeps 30)
 * - Weekly backup: Every Saturday if 6+ days since last (keeps 8)
 * - Auto-cleanup of old backups
 */

import fs from 'fs';
import path from 'path';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Config                                                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

const DB_PATH = process.env.DATABASE_URL?.replace('file:', '') || path.join(process.cwd(), 'db', 'custom.db');
const BACKUP_DIR = path.join(process.cwd(), 'db', 'backups');
const META_FILE = path.join(BACKUP_DIR, 'backup-meta.json');

const KEEP_DAILY = 30;
const KEEP_WEEKLY = 8;
const DAILY_INTERVAL_MS = 20 * 60 * 60 * 1000; // 20 hours
const WEEKLY_INTERVAL_MS = 6 * 24 * 60 * 60 * 1000; // 6 days

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

export interface BackupRecord {
  filename: string;
  type: 'daily' | 'weekly';
  timestamp: string;       // ISO 8601
  sizeBytes: number;
  sizeHuman: string;
  dbSizeBytes: number;
  dbSizeHuman: string;
}

export interface BackupMeta {
  lastDailyAt: string | null;
  lastWeeklyAt: string | null;
  backups: BackupRecord[];
}

export interface AutoBackupResult {
  success: boolean;
  dailyCreated: boolean;
  weeklyCreated: boolean;
  cleanedCount: number;
  cleanedFiles: string[];
  dailyBackup?: BackupRecord;
  weeklyBackup?: BackupRecord;
  error?: string;
  duration: number; // ms
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Utilities                                                               */
/* ═══════════════════════════════════════════════════════════════════════════ */

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function getNowJalali(): string {
  const now = new Date();
  // Simple Jalali date formatting
  return now.toLocaleDateString('fa-IR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

function getDayOfWeek(): number {
  // 0 = Sunday, 6 = Saturday
  return new Date().getDay();
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Meta File Management                                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

function loadMeta(): BackupMeta {
  try {
    if (fs.existsSync(META_FILE)) {
      const raw = fs.readFileSync(META_FILE, 'utf-8');
      return JSON.parse(raw) as BackupMeta;
    }
  } catch (e) {
    console.error('[Backup] Failed to load meta file, starting fresh:', e);
  }
  return { lastDailyAt: null, lastWeeklyAt: null, backups: [] };
}

function saveMeta(meta: BackupMeta): void {
  fs.writeFileSync(META_FILE, JSON.stringify(meta, null, 2), 'utf-8');
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Core Backup Functions                                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

function ensureBackupDir(): void {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

export function createBackup(type: 'daily' | 'weekly'): BackupRecord {
  ensureBackupDir();

  // Validate source DB exists
  if (!fs.existsSync(DB_PATH)) {
    throw new Error(`Database file not found: ${DB_PATH}`);
  }

  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-');

  // Filename: daily-2024-04-22T23-30-00Z.db or weekly-2024-W16-Saturday.db
  let filename: string;
  if (type === 'daily') {
    filename = `daily-${timestamp}.db`;
  } else {
    const weekNum = getWeekNumber(now);
    const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][getDayOfWeek()];
    filename = `weekly-${now.getFullYear()}-W${String(weekNum).padStart(2, '0')}-${dayName}-${timestamp}.db`;
  }

  const backupPath = path.join(BACKUP_DIR, filename);

  // Copy the database file
  fs.copyFileSync(DB_PATH, backupPath);

  const dbStat = fs.statSync(DB_PATH);
  const backupStat = fs.statSync(backupPath);

  const record: BackupRecord = {
    filename,
    type,
    timestamp: now.toISOString(),
    sizeBytes: backupStat.size,
    sizeHuman: formatSize(backupStat.size),
    dbSizeBytes: dbStat.size,
    dbSizeHuman: formatSize(dbStat.size),
  };

  // Update meta
  const meta = loadMeta();
  meta.backups.push(record);
  if (type === 'daily') {
    meta.lastDailyAt = now.toISOString();
  } else {
    meta.lastWeeklyAt = now.toISOString();
  }
  saveMeta(meta);

  return record;
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Cleanup                                                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

export function cleanupOldBackups(): { cleanedCount: number; cleanedFiles: string[] } {
  const meta = loadMeta();
  const cleanedFiles: string[] = [];

  // Separate daily and weekly backups
  const dailyBackups = meta.backups.filter(b => b.type === 'daily').sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  const weeklyBackups = meta.backups.filter(b => b.type === 'weekly').sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  // Remove excess daily backups
  const excessDaily = dailyBackups.slice(KEEP_DAILY);
  // Remove excess weekly backups
  const excessWeekly = weeklyBackups.slice(KEEP_WEEKLY);

  const toRemove = [...excessDaily, ...excessWeekly];

  for (const backup of toRemove) {
    const filePath = path.join(BACKUP_DIR, backup.filename);
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        cleanedFiles.push(backup.filename);
      }
    } catch (e) {
      console.error(`[Backup] Failed to delete ${backup.filename}:`, e);
    }
  }

  // Update meta — remove deleted records
  const removeSet = new Set(toRemove.map(b => b.filename));
  meta.backups = meta.backups.filter(b => !removeSet.has(b.filename));
  saveMeta(meta);

  return { cleanedCount: cleanedFiles.length, cleanedFiles };
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Auto Backup (called by cron / API)                                      */
/* ═══════════════════════════════════════════════════════════════════════════ */

export function autoBackup(): AutoBackupResult {
  const startTime = Date.now();
  const meta = loadMeta();
  const now = new Date();
  const result: AutoBackupResult = {
    success: true,
    dailyCreated: false,
    weeklyCreated: false,
    cleanedCount: 0,
    cleanedFiles: [],
    duration: 0,
  };

  try {
    // ── Daily backup check ──
    const lastDaily = meta.lastDailyAt ? new Date(meta.lastDailyAt) : null;
    const dailyNeeded = !lastDaily || (now.getTime() - lastDaily.getTime() > DAILY_INTERVAL_MS);

    if (dailyNeeded) {
      result.dailyBackup = createBackup('daily');
      result.dailyCreated = true;
      console.log(`[Backup] Daily backup created: ${result.dailyBackup.filename} (${result.dailyBackup.sizeHuman})`);
    } else {
      const nextIn = DAILY_INTERVAL_MS - (now.getTime() - lastDaily!.getTime());
      const hoursLeft = Math.floor(nextIn / (1000 * 60 * 60));
      const minsLeft = Math.floor((nextIn % (1000 * 60 * 60)) / (1000 * 60));
      console.log(`[Backup] Daily backup not needed yet. Next in ~${hoursLeft}h ${minsLeft}m`);
    }

    // ── Weekly backup check (Saturday = day 6) ──
    const lastWeekly = meta.lastWeeklyAt ? new Date(meta.lastWeeklyAt) : null;
    const weeklyNeeded = !lastWeekly || (now.getTime() - lastWeekly.getTime() > WEEKLY_INTERVAL_MS);

    if (weeklyNeeded && getDayOfWeek() === 6) {
      result.weeklyBackup = createBackup('weekly');
      result.weeklyCreated = true;
      console.log(`[Backup] Weekly backup created: ${result.weeklyBackup.filename} (${result.weeklyBackup.sizeHuman})`);
    } else if (weeklyNeeded && getDayOfWeek() !== 6) {
      console.log(`[Backup] Weekly backup pending. Will create on Saturday. Current day: ${getDayOfWeek()}`);
    } else {
      const nextIn = WEEKLY_INTERVAL_MS - (now.getTime() - lastWeekly!.getTime());
      const daysLeft = Math.floor(nextIn / (1000 * 60 * 60 * 24));
      console.log(`[Backup] Weekly backup not needed yet. Next in ~${daysLeft} days`);
    }

    // ── Cleanup old backups ──
    const cleanupResult = cleanupOldBackups();
    result.cleanedCount = cleanupResult.cleanedCount;
    result.cleanedFiles = cleanupResult.cleanedFiles;

    if (cleanupResult.cleanedCount > 0) {
      console.log(`[Backup] Cleaned up ${cleanupResult.cleanedCount} old backup(s): ${cleanupResult.cleanedFiles.join(', ')}`);
    }

  } catch (error: any) {
    result.success = false;
    result.error = error.message || String(error);
    console.error('[Backup] Auto-backup failed:', error);
  }

  result.duration = Date.now() - startTime;
  return result;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  List & Restore                                                          */
/* ═══════════════════════════════════════════════════════════════════════════ */

export function listBackups(): {
  backups: BackupRecord[];
  totalSize: string;
  dailyCount: number;
  weeklyCount: number;
  lastDaily: string | null;
  lastWeekly: string | null;
} {
  const meta = loadMeta();
  const sorted = [...meta.backups].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  // Verify files exist and update sizes
  const verified = sorted.filter(b => {
    const filePath = path.join(BACKUP_DIR, b.filename);
    if (!fs.existsSync(filePath)) return false;
    try {
      const stat = fs.statSync(filePath);
      b.sizeBytes = stat.size;
      b.sizeHuman = formatSize(stat.size);
      return true;
    } catch {
      return false;
    }
  });

  const totalBytes = verified.reduce((sum, b) => sum + b.sizeBytes, 0);

  return {
    backups: verified,
    totalSize: formatSize(totalBytes),
    dailyCount: verified.filter(b => b.type === 'daily').length,
    weeklyCount: verified.filter(b => b.type === 'weekly').length,
    lastDaily: meta.lastDailyAt,
    lastWeekly: meta.lastWeeklyAt,
  };
}

export function restoreBackup(filename: string): {
  success: boolean;
  message: string;
  backupFile: string;
  dbFile: string;
  backupSize?: string;
  preRestoreBackup?: string;
} {
  ensureBackupDir();

  const backupPath = path.join(BACKUP_DIR, filename);
  const resolvedDbPath = path.resolve(DB_PATH);

  // Validate backup exists
  if (!fs.existsSync(backupPath)) {
    return {
      success: false,
      message: `فایل بکاپ "${filename}" پیدا نشد`,
      backupFile: filename,
      dbFile: resolvedDbPath,
    };
  }

  // Validate it looks like a backup file
  if (!filename.endsWith('.db')) {
    return {
      success: false,
      message: `فرمت فایل نامعتبر است. فقط فایل‌های .db پشتیبانی می‌شوند`,
      backupFile: filename,
      dbFile: resolvedDbPath,
    };
  }

  // Create a pre-restore safety backup
  const preRestoreName = `pre-restore-${new Date().toISOString().replace(/[:.]/g, '-')}.db`;
  const preRestorePath = path.join(BACKUP_DIR, preRestoreName);

  try {
    if (fs.existsSync(resolvedDbPath)) {
      fs.copyFileSync(resolvedDbPath, preRestorePath);
    }

    // Copy backup to database location
    fs.copyFileSync(backupPath, resolvedDbPath);

    const stat = fs.statSync(resolvedDbPath);

    return {
      success: true,
      message: `بازیابی با موفقیت انجام شد. بکاپ ایمنی قبل از بازیابی: ${preRestoreName}`,
      backupFile: filename,
      dbFile: resolvedDbPath,
      backupSize: formatSize(stat.size),
      preRestoreBackup: preRestoreName,
    };
  } catch (error: any) {
    return {
      success: false,
      message: `خطا در بازیابی: ${error.message}`,
      backupFile: filename,
      dbFile: resolvedDbPath,
    };
  }
}

export function deleteBackup(filename: string): {
  success: boolean;
  message: string;
} {
  const backupPath = path.join(BACKUP_DIR, filename);

  if (!fs.existsSync(backupPath)) {
    return { success: false, message: `فایل بکاپ "${filename}" پیدا نشد` };
  }

  try {
    fs.unlinkSync(backupPath);

    // Update meta
    const meta = loadMeta();
    meta.backups = meta.backups.filter(b => b.filename !== filename);
    saveMeta(meta);

    return { success: true, message: `بکاپ "${filename}" حذف شد` };
  } catch (error: any) {
    return { success: false, message: `خطا در حذف: ${error.message}` };
  }
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Stats                                                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

export function getBackupPath(filename: string): string | null {
  const backupPath = path.join(BACKUP_DIR, filename);
  if (!fs.existsSync(backupPath)) return null;
  return backupPath;
}

export function getBackupStats(): {
  dbExists: boolean;
  dbSize: string;
  dbPath: string;
  backupDirExists: boolean;
  backupDir: string;
  totalBackups: number;
  totalBackupSize: string;
  lastDaily: string | null;
  lastWeekly: string | null;
} {
  const meta = loadMeta();
  let dbSize = '0 B';
  let dbExists = false;

  try {
    if (fs.existsSync(DB_PATH)) {
      dbExists = true;
      dbSize = formatSize(fs.statSync(DB_PATH).size);
    }
  } catch {}

  const totalBytes = meta.backups.reduce((sum, b) => sum + b.sizeBytes, 0);

  return {
    dbExists,
    dbSize,
    dbPath: path.resolve(DB_PATH),
    backupDirExists: fs.existsSync(BACKUP_DIR),
    backupDir: BACKUP_DIR,
    totalBackups: meta.backups.length,
    totalBackupSize: formatSize(totalBytes),
    lastDaily: meta.lastDailyAt,
    lastWeekly: meta.lastWeeklyAt,
  };
}
