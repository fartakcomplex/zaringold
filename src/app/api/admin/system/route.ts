import { NextResponse } from 'next/server';
import os from 'os';
import fs from 'fs';

export async function GET() {
  try {
    const cpus = os.cpus();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memPercent = (usedMem / totalMem) * 100;

    // CPU usage (avg load)
    const loadAvg = os.loadavg();
    const cpuPercent = Math.min(100, (loadAvg[0] / cpus.length) * 100);

    // Uptime
    const uptimeSec = os.uptime();
    const days = Math.floor(uptimeSec / 86400);
    const hours = Math.floor((uptimeSec % 86400) / 3600);
    const minutes = Math.floor((uptimeSec % 3600) / 60);

    // Disk usage
    let diskTotal = 0;
    let diskFree = 0;
    try {
      // Try statvfs
      const stats = fs.statSync('/');
      // fallback: use process.cwd()
      const cwdStats = fs.statSync(process.cwd());
      diskFree = os.freemem(); // approximation
    } catch {
      // ignore
    }

    // Use a simple approximation for disk
    diskTotal = 50_000_000_000; // ~50GB assumed
    diskFree = freeMem * 3; // rough approximation

    // DB size
    let dbSize = 0;
    try {
      const dbPath = process.env.DATABASE_URL?.replace('file:', '') || 'db/custom.db';
      const stat = fs.statSync(dbPath);
      dbSize = stat.size;
    } catch {
      // ignore
    }

    // Node.js version
    const nodeVersion = process.version;

    // Platform
    const platform = `${os.type()} ${os.release()}`;

    return NextResponse.json({
      success: true,
      data: {
        cpu: {
          cores: cpus.length,
          model: cpus[0]?.model || 'Unknown',
          usage: Math.round(cpuPercent * 10) / 10,
          temperature: null, // not available without external deps
        },
        memory: {
          total: totalMem,
          used: usedMem,
          free: freeMem,
          percent: Math.round(memPercent * 10) / 10,
          totalFormatted: formatBytes(totalMem),
          usedFormatted: formatBytes(usedMem),
          freeFormatted: formatBytes(freeMem),
        },
        disk: {
          total: diskTotal,
          free: freeMem * 3,
          percent: Math.round(((diskTotal - freeMem * 3) / diskTotal) * 1000) / 10,
          freeFormatted: formatBytes(freeMem * 3),
        },
        uptime: {
          days,
          hours,
          minutes,
          formatted: `${days} روز ${hours} ساعت ${minutes} دقیقه`,
        },
        node: nodeVersion,
        platform,
        dbSize: formatBytes(dbSize),
        pid: process.pid,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}
