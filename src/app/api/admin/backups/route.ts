import { NextResponse } from 'next/server';
import { listBackups, getBackupStats, createBackup, cleanupOldBackups } from '@/lib/backup';
import fs from 'fs';
import path from 'path';

/**
 * GET /api/admin/backups
 * Returns list of backups + stats for the admin panel
 */
export async function GET() {
  try {
    const data = listBackups();
    const stats = getBackupStats();

    // Map backend BackupRecord fields to UI-expected fields
    const backups = data.backups.map(b => ({
      filename: b.filename,
      type: b.type,
      size: b.sizeBytes,
      createdAt: b.timestamp,
    }));

    // Map stats for UI
    const uiStats: {
      dbSize: number;
      backupCount: number;
      totalBackupSize: number;
      lastBackupAt: string | null;
    } = {
      dbSize: 0,
      backupCount: data.backups.length,
      totalBackupSize: data.backups.reduce((sum, b) => sum + b.sizeBytes, 0),
      lastBackupAt: data.lastDaily || data.lastWeekly,
    };

    // Get actual DB size
    try {
      const dbPath = process.env.DATABASE_URL?.replace('file:', '') || path.join(process.cwd(), 'db', 'custom.db');
      if (fs.existsSync(dbPath)) {
        uiStats.dbSize = fs.statSync(dbPath).size;
      }
    } catch {}

    return NextResponse.json({ success: true, backups, stats: uiStats });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

/**
 * POST /api/admin/backups
 * Create a backup manually.
 * Body: { type: 'daily' | 'weekly' }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const type: 'daily' | 'weekly' = body.type === 'weekly' ? 'weekly' : 'daily';

    const backup = createBackup(type);
    const cleanup = cleanupOldBackups();

    return NextResponse.json({
      success: true,
      message: type === 'daily' ? 'بکاپ روزانه ایجاد شد' : 'فول بکاپ هفتگی ایجاد شد',
      backup: {
        filename: backup.filename,
        type: backup.type,
        size: backup.sizeBytes,
        createdAt: backup.timestamp,
      },
      cleanup,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
