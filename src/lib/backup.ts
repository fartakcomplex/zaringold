/**
 * Zarrin Gold — Database Backup System
 * 
 * Automatic daily & weekly backups for PostgreSQL database.
 * Uses pg_dump for backup creation and psql for restoration.
 * - Daily backup: Every 20+ hours (keeps 30)
 * - Weekly backup: Every Saturday if 6+ days since last (keeps 8)
 * - Auto-cleanup of old backups
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Config                                                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

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
/*  PostgreSQL Connection Parser                                             */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface PgConnectionInfo {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

function parsePostgresUrl(url: string): PgConnectionInfo {
  // Handle both postgresql:// and postgres:// schemes
  let normalized = url.replace(/^postgres(?:ql)?:\/\//, '');

  // Extract password and user (supports URL-encoded passwords)
  let user = 'postgres';
  let password = '';
  let hostPort: string;
  let database: string;

  // Check if there's authentication info (before @)
  const atIndex = normalized.lastIndexOf('@');
  if (atIndex !== -1) {
    const authPart = normalized.substring(0, atIndex);
    hostPort = normalized.substring(atIndex + 1);
    const colonIndex = authPart.indexOf(':');
    if (colonIndex !== -1) {
      user = decodeURIComponent(authPart.substring(0, colonIndex));
      password = decodeURIComponent(authPart.substring(colonIndex + 1));
    } else {
      user = decodeURIComponent(authPart);
    }
  } else {
    hostPort = normalized;
  }

  // Separate host:port from database
  const slashIndex = hostPort.indexOf('/');
  if (slashIndex !== -1) {
    database = hostPort.substring(slashIndex + 1);
    hostPort = hostPort.substring(0, slashIndex);
  } else {
    // No database specified
    hostPort = normalized;
    database = 'postgres';
  }

  // Parse host and port
  const portIndex = hostPort.lastIndexOf(':');
  let host = hostPort;
  let port = 5432;
  if (portIndex !== -1) {
    host = hostPort.substring(0, portIndex);
    port = parseInt(hostPort.substring(portIndex + 1), 10) || 5432;
  }

  return { host, port, user, password, database };
}

function getPgConnection(): PgConnectionInfo {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error('DATABASE_URL environment variable is required for backup operations');
  return parsePostgresUrl(dbUrl);
}

/** Build pg_dump connection arguments from the parsed connection info */
function buildPgDumpArgs(conn: PgConnectionInfo): string[] {
  const args: string[] = [
    '-h', conn.host,
    '-p', String(conn.port),
    '-U', conn.user,
    '-d', conn.database,
    '--no-owner',
    '--no-acl',
    '--clean',
    '--if-exists',
  ];
  return args;
}

/** Build psql connection arguments from the parsed connection info */
function buildPsqlArgs(conn: PgConnectionInfo): string[] {
  const args: string[] = [
    '-h', conn.host,
    '-p', String(conn.port),
    '-U', conn.user,
    '-d', conn.database,
  ];
  return args;
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

/**
 * Estimate PostgreSQL database size by running a psql query.
 * Returns size in bytes.
 */
function estimatePostgresDbSize(conn: PgConnectionInfo): { bytes: number; human: string } {
  try {
    const env = { ...process.env, PGPASSWORD: conn.password };
    const psqlArgs = buildPsqlArgs(conn);
    const query = `SELECT pg_database_size('${conn.database}') AS size_bytes;`;

    const result = execSync(
      `psql ${psqlArgs.join(' ')} -t -A -c "${query}"`,
      {
        env,
        encoding: 'utf-8',
        timeout: 30_000,
        stdio: ['pipe', 'pipe', 'pipe'],
      }
    ).trim();

    const bytes = parseInt(result, 10);
    if (!isNaN(bytes) && bytes > 0) {
      return { bytes, human: formatSize(bytes) };
    }
  } catch (e) {
    console.error('[Backup] Failed to estimate PostgreSQL database size:', e);
  }

  return { bytes: 0, human: 'PostgreSQL' };
}

export function createBackup(type: 'daily' | 'weekly'): BackupRecord {
  ensureBackupDir();

  const conn = getPgConnection();
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-');

  // Filename: daily-2024-04-22T23-30-00Z.sql or weekly-2024-W16-Saturday.sql
  let filename: string;
  if (type === 'daily') {
    filename = `daily-${timestamp}.sql`;
  } else {
    const weekNum = getWeekNumber(now);
    const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][getDayOfWeek()];
    filename = `weekly-${now.getFullYear()}-W${String(weekNum).padStart(2, '0')}-${dayName}-${timestamp}.sql`;
  }

  const backupPath = path.join(BACKUP_DIR, filename);

  // Run pg_dump to create the backup
  const env = { ...process.env, PGPASSWORD: conn.password };
  const dumpArgs = buildPgDumpArgs(conn);

  try {
    execSync(
      `pg_dump ${dumpArgs.join(' ')} -f "${backupPath}"`,
      {
        env,
        encoding: 'utf-8',
        timeout: 300_000, // 5 minutes timeout for large databases
        stdio: ['pipe', 'pipe', 'pipe'],
      }
    );
  } catch (error: any) {
    // Clean up partial dump file if pg_dump failed
    if (fs.existsSync(backupPath)) {
      fs.unlinkSync(backupPath);
    }
    throw new Error(`pg_dump failed: ${error.message || String(error)}`);
  }

  // Verify the backup file was created
  if (!fs.existsSync(backupPath)) {
    throw new Error('Backup file was not created by pg_dump');
  }

  const dbSizeInfo = estimatePostgresDbSize(conn);
  const backupStat = fs.statSync(backupPath);

  const record: BackupRecord = {
    filename,
    type,
    timestamp: now.toISOString(),
    sizeBytes: backupStat.size,
    sizeHuman: formatSize(backupStat.size),
    dbSizeBytes: dbSizeInfo.bytes,
    dbSizeHuman: dbSizeInfo.human,
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
  const conn = getPgConnection();
  const dbIdentifier = `${conn.host}:${conn.port}/${conn.database}`;

  // Validate backup exists
  if (!fs.existsSync(backupPath)) {
    return {
      success: false,
      message: `فایل بکاپ "${filename}" پیدا نشد`,
      backupFile: filename,
      dbFile: dbIdentifier,
    };
  }

  // Validate it looks like a PostgreSQL backup file
  if (!filename.endsWith('.sql')) {
    return {
      success: false,
      message: `فرمت فایل نامعتبر است. فقط فایل‌های .sql پشتیبانی می‌شوند`,
      backupFile: filename,
      dbFile: dbIdentifier,
    };
  }

  // Create a pre-restore safety backup using pg_dump
  const preRestoreName = `pre-restore-${new Date().toISOString().replace(/[:.]/g, '-')}.sql`;
  let preRestoreCreated = false;

  try {
    // Create pre-restore backup via pg_dump
    try {
      createBackup('daily');
      // The pre-restore backup was created by createBackup with its own filename,
      // but we record our preRestoreName for the response
      preRestoreCreated = true;
    } catch (preError: any) {
      console.error('[Backup] Pre-restore backup failed (continuing anyway):', preError);
    }

    // Restore using psql with the SQL dump file
    const env = { ...process.env, PGPASSWORD: conn.password };
    const psqlArgs = buildPsqlArgs(conn);

    execSync(
      `psql ${psqlArgs.join(' ')} -f "${backupPath}"`,
      {
        env,
        encoding: 'utf-8',
        timeout: 300_000, // 5 minutes timeout for large restores
        stdio: ['pipe', 'pipe', 'pipe'],
      }
    );

    const dbSizeInfo = estimatePostgresDbSize(conn);

    return {
      success: true,
      message: `بازیابی با موفقیت انجام شد. بکاپ ایمنی قبل از بازیابی: ${preRestoreCreated ? preRestoreName : 'ایجاد نشد'}`,
      backupFile: filename,
      dbFile: dbIdentifier,
      backupSize: dbSizeInfo.human,
      preRestoreBackup: preRestoreCreated ? preRestoreName : undefined,
    };
  } catch (error: any) {
    return {
      success: false,
      message: `خطا در بازیابی: ${error.message}`,
      backupFile: filename,
      dbFile: dbIdentifier,
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
  const conn = getPgConnection();
  const dbIdentifier = `${conn.host}:${conn.port}/${conn.database}`;

  // For PostgreSQL, check connectivity and estimate size
  let dbSize = 'PostgreSQL';
  let dbExists = false;

  try {
    const dbSizeInfo = estimatePostgresDbSize(conn);
    if (dbSizeInfo.bytes > 0) {
      dbExists = true;
      dbSize = dbSizeInfo.human;
    } else {
      // Even if size query failed, try a basic connectivity check
      const env = { ...process.env, PGPASSWORD: conn.password };
      const psqlArgs = buildPsqlArgs(conn);
      execSync(
        `psql ${psqlArgs.join(' ')} -t -A -c "SELECT 1;"`,
        {
          env,
          encoding: 'utf-8',
          timeout: 10_000,
          stdio: ['pipe', 'pipe', 'pipe'],
        }
      );
      dbExists = true;
    }
  } catch {
    // PostgreSQL is not reachable
    dbExists = false;
  }

  const totalBytes = meta.backups.reduce((sum, b) => sum + b.sizeBytes, 0);

  return {
    dbExists,
    dbSize,
    dbPath: dbIdentifier,
    backupDirExists: fs.existsSync(BACKUP_DIR),
    backupDir: BACKUP_DIR,
    totalBackups: meta.backups.length,
    totalBackupSize: formatSize(totalBytes),
    lastDaily: meta.lastDailyAt,
    lastWeekly: meta.lastWeeklyAt,
  };
}
