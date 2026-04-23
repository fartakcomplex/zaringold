import { NextResponse } from 'next/server';

/**
 * POST /api/admin/backups/auto
 * Called by cron job daily at 3:00 AM Asia/Tehran
 * Creates daily backup (if >20h since last) and weekly backup (on Saturday if >6d since last)
 */

export async function POST() {
  try {
    const { autoBackup } = await import('@/lib/backup');
    const result = autoBackup();

    const messages: string[] = [];
    if (result.dailyCreated && result.dailyBackup) {
      messages.push(`Daily backup created: ${result.dailyBackup.filename} (${result.dailyBackup.sizeHuman})`);
    } else {
      messages.push('Daily backup not needed (last backup <20 hours ago)');
    }
    if (result.weeklyCreated && result.weeklyBackup) {
      messages.push(`Weekly full backup created: ${result.weeklyBackup.filename} (${result.weeklyBackup.sizeHuman})`);
    }

    return NextResponse.json({
      success: result.success,
      messages,
      dailyCreated: result.dailyCreated,
      weeklyCreated: result.weeklyCreated,
      dailyBackup: result.dailyBackup,
      weeklyBackup: result.weeklyBackup,
      cleanedCount: result.cleanedCount,
      cleanedFiles: result.cleanedFiles,
      duration: result.duration,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 },
    );
  }
}
