import { NextResponse } from 'next/server';
import { deleteBackup, getBackupPath } from '@/lib/backup';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> },
) {
  const { filename } = await params;
  if (!filename || filename.includes('..') || filename.includes('/')) {
    return NextResponse.json({ success: false, message: 'Invalid filename' }, { status: 400 });
  }
  const filePath = getBackupPath(filename);
  if (!filePath) {
    return NextResponse.json({ success: false, message: `Backup not found: ${filename}` }, { status: 404 });
  }
  const fs = await import('fs');
  const stat = fs.statSync(filePath);
  return new NextResponse(fs.createReadStream(filePath), {
    headers: {
      'Content-Type': 'application/x-sqlite3',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': stat.size.toString(),
    },
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> },
) {
  const { filename } = await params;
  if (!filename || filename.includes('..') || filename.includes('/')) {
    return NextResponse.json({ success: false, message: 'Invalid filename' }, { status: 400 });
  }
  const result = deleteBackup(filename);
  return NextResponse.json(result);
}
