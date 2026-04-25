/**
 * Easy Installer — Export & Package System
 * Creates deployable packages of the Mili Gold project
 * with a standalone web-based installer wizard.
 */

import { execSync, exec } from 'child_process';
import { promises as fs, accessSync } from 'fs';
import { readFileSync } from 'fs';
import path from 'path';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const PROJECT_ROOT = process.cwd();
const PACKAGES_DIR = path.join(PROJECT_ROOT, 'db', 'easy-installer', 'packages');
const INSTALLER_DIR = path.join(PROJECT_ROOT, 'easy-installer', 'installer');
const DB_PATH = path.join(PROJECT_ROOT, 'db', 'custom.db');

// PostgreSQL connection info for database export
const PG_CONNECTION_STRING = (() => {
  try {
    const envContent = readFileSync(
      path.join(PROJECT_ROOT, '.env'),
      'utf-8'
    );
    const match = envContent.match(/DATABASE_URL=(.+)/);
    if (match && match[1].trim().startsWith('postgresql://')) {
      return match[1].trim();
    }
  } catch {}
  return null;
})();

/** Files and directories to EXCLUDE from the export package */
const EXCLUDE_PATTERNS = [
  'node_modules',
  '.next',
  '.git',
  '.env',
  '.env.local',
  '.env.production',
  'db/*.db',
  'db/backups',
  'db/easy-installer',
  'upload',
  'download',
  '*.png',
  '*.jpg',
  '*.jpeg',
  'agent-ctx',
  'worklog*.md',
  'worklog*.md.bak',
  'dev.log',
  'server.log',
  '*.log',
  'keepalive.sh',
  'keep-alive.sh',
  'watchdog.sh',
  'run.sh',
  'start.sh',
  'start-server.sh',
  'django-project',
  'bun.lock',
  'package-lock.json',
  'screenshot-*.png',
  'debug-screen*.png',
  'qa-*.png',
  'bottomnav-*.png',
];

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface ExportPackage {
  filename: string;
  size: number;
  sizeFormatted: string;
  createdAt: string;
  type: 'full' | 'code-only';
  includes: string[];
  status: 'completed' | 'failed';
}

export interface ExportOptions {
  type?: 'full' | 'code-only';
  includeDatabase?: boolean;
  includeUploads?: boolean;
  label?: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getTimestamp(): string {
  const now = new Date();
  return now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

function fileExists(filePath: string): boolean {
  try {
    accessSync(filePath);
    return true;
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ */
/*  Database Export                                                    */
/* ------------------------------------------------------------------ */

async function exportDatabase(): Promise<string | null> {
  const dumpPath = path.join(PROJECT_ROOT, 'db', 'database-export.sql');

  // Try pg_dump first (best method for PostgreSQL)
  try {
    const pgDumpCmd = PG_CONNECTION_STRING
      ? `pg_dump "${PG_CONNECTION_STRING}" --no-owner --no-acl --format=plain`
      : `pg_dump -U zaringold -d zaringold --no-owner --no-acl --format=plain`;

    const sqlDump = execSync(pgDumpCmd, {
      encoding: 'utf-8',
      maxBuffer: 100 * 1024 * 1024,
      env: {
        ...process.env,
        PGPASSWORD: 'zaringold_dev_2024',
      },
    });

    await fs.writeFile(dumpPath, sqlDump, 'utf-8');
    console.log(`[easy-installer] PostgreSQL database exported via pg_dump: ${formatBytes(sqlDump.length)}`);
    return dumpPath;
  } catch (err) {
    console.error('[easy-installer] pg_dump failed, trying Prisma method:', err);
  }

  // Fallback: Use Prisma to export table data as SQL
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    // PostgreSQL: get tables from information_schema
    const tables = await prisma.$queryRaw<Array<{ table_name: string }>>(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`
    );

    let sql = '';
    sql += '-- ZarinGold PostgreSQL Database Export\n';
    sql += `-- Generated: ${new Date().toISOString()}\n`;
    sql += '-- Exported via Prisma fallback method\n\n';

    for (const table of tables) {
      const tableName = table.table_name;
      sql += `-- Data for table: ${tableName}\n`;

      try {
        const rows = await prisma.$queryRaw<any[]>(
          `SELECT * FROM "${tableName}"`
        );

        if (rows.length > 0) {
          const cols = Object.keys(rows[0]);
          for (const row of rows) {
            const vals = cols.map(col => {
              const v = row[col];
              if (v === null || v === undefined) return 'NULL';
              if (typeof v === 'number') return String(v);
              if (typeof v === 'bigint') return String(v);
              if (v instanceof Date) return `'${v.toISOString()}'`;
              // Escape single quotes
              const escaped = String(v).replace(/'/g, "''");
              return `'${escaped}'`;
            });
            sql += `INSERT INTO "${tableName}" (${cols.map(c => `"${c}"`).join(', ')}) VALUES (${vals.join(', ')});\n`;
          }
        }
      } catch (e) {
        console.log(`[easy-installer] Could not export table ${tableName}:`, e);
      }

      sql += '\n';
    }

    await fs.writeFile(dumpPath, sql, 'utf-8');
    await prisma.$disconnect();

    console.log(`[easy-installer] Database exported via Prisma: ${formatBytes(sql.length)}`);
    return dumpPath;
  } catch (prismaErr) {
    console.error('[easy-installer] Prisma export also failed:', prismaErr);
    return null;
  }
}

/* ------------------------------------------------------------------ */
/*  Main Export Function                                               */
/* ------------------------------------------------------------------ */

export async function createExportPackage(
  options: ExportOptions = {}
): Promise<ExportPackage> {
  const {
    type = 'full',
    includeDatabase = true,
    includeUploads = false,
    label,
  } = options;

  await ensureDir(PACKAGES_DIR);

  const timestamp = getTimestamp();
  const filename = label
    ? `miligold-${label}-${timestamp}.tar.gz`
    : `miligold-${type}-${timestamp}.tar.gz`;
  const packagePath = path.join(PACKAGES_DIR, filename);

  const includes: string[] = [];

  try {
    // 1. Export database if requested
    let dbDumpPath: string | null = null;
    if (includeDatabase && type === 'full') {
      dbDumpPath = await exportDatabase();
      if (dbDumpPath) {
        includes.push('database-export.sql');
      }
    }

    // 2. Build exclude arguments for tar
    const excludeArgs = EXCLUDE_PATTERNS.flatMap(p => ['--exclude', p]);

    // 3. Build the tar command
    const items: string[] = [
      'src',
      'public',
      'prisma',
      'easy-installer',
      'package.json',
      'package-lock.json',
      'bun.lock',
      'next.config.ts',
      'tailwind.config.ts',
      'postcss.config.mjs',
      'tsconfig.json',
      'eslint.config.mjs',
      'components.json',
      '.env.example',
      'Caddyfile',
      'scripts',
    ];

    // Add database dump if available
    if (dbDumpPath) {
      // Copy it to project root for easy access
      const dbDest = path.join(PROJECT_ROOT, 'database-export.sql');
      await fs.copyFile(dbDumpPath, dbDest);
      items.push('database-export.sql');
      includes.push('database-export.sql');
    }

    // Add uploads if requested
    if (includeUploads) {
      items.push('public/uploads');
      includes.push('uploads');
    }

    const tarArgs = [
      'czf',
      packagePath,
      ...excludeArgs,
      // Don't exclude the database export
      ...items,
    ];

    console.log('[easy-installer] Creating package...');
    console.log(`[easy-installer] tar ${tarArgs.join(' ')}`);

    // Create tar.gz archive
    execSync(`tar ${tarArgs.join(' ')}`, {
      cwd: PROJECT_ROOT,
      stdio: 'pipe',
      timeout: 300000, // 5 minute timeout
    });

    // 4. Get package size
    const stats = await fs.stat(packagePath);
    const pkg: ExportPackage = {
      filename,
      size: stats.size,
      sizeFormatted: formatBytes(stats.size),
      createdAt: new Date().toISOString(),
      type,
      includes,
      status: 'completed',
    };

    // 5. Save metadata
    const metaPath = path.join(PACKAGES_DIR, 'exports-meta.json');
    let meta: Record<string, any> = {};
    try {
      const existing = await fs.readFile(metaPath, 'utf-8');
      meta = JSON.parse(existing);
    } catch {}

    meta[filename] = pkg;
    await fs.writeFile(metaPath, JSON.stringify(meta, null, 2), 'utf-8');

    // 6. Cleanup temp files
    try {
      await fs.unlink(path.join(PROJECT_ROOT, 'database-export.sql')).catch(() => {});
      if (dbDumpPath) {
        await fs.unlink(dbDumpPath).catch(() => {});
      }
    } catch {}

    console.log(`[easy-installer] Package created: ${filename} (${pkg.sizeFormatted})`);
    return pkg;

  } catch (err) {
    console.error('[easy-installer] Export failed:', err);
    return {
      filename,
      size: 0,
      sizeFormatted: '0 B',
      createdAt: new Date().toISOString(),
      type,
      includes: [],
      status: 'failed',
    };
  }
}

/* ------------------------------------------------------------------ */
/*  List & Manage Packages                                             */
/* ------------------------------------------------------------------ */

export async function listPackages(): Promise<ExportPackage[]> {
  try {
    await ensureDir(PACKAGES_DIR);
    const files = await fs.readdir(PACKAGES_DIR);
    const packages: ExportPackage[] = [];

    // Read metadata file
    const metaPath = path.join(PACKAGES_DIR, 'exports-meta.json');
    let meta: Record<string, any> = {};
    try {
      const existing = await fs.readFile(metaPath, 'utf-8');
      meta = JSON.parse(existing);
    } catch {}

    for (const file of files) {
      if (file === 'exports-meta.json') continue;
      if (!file.endsWith('.tar.gz')) continue;

      const filePath = path.join(PACKAGES_DIR, file);
      try {
        const stats = await fs.stat(filePath);

        if (meta[file]) {
          packages.push({
            ...meta[file],
            filename: file,
            size: stats.size,
            sizeFormatted: formatBytes(stats.size),
          });
        } else {
          packages.push({
            filename: file,
            size: stats.size,
            sizeFormatted: formatBytes(stats.size),
            createdAt: stats.mtime.toISOString(),
            type: 'full',
            includes: [],
            status: 'completed',
          });
        }
      } catch {}
    }

    // Sort by date, newest first
    packages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return packages;
  } catch {
    return [];
  }
}

export async function getPackagePath(filename: string): Promise<string | null> {
  const filePath = path.join(PACKAGES_DIR, filename);
  try {
    await fs.access(filePath);
    return filePath;
  } catch {
    return null;
  }
}

export async function deletePackage(filename: string): Promise<boolean> {
  const filePath = path.join(PACKAGES_DIR, filename);
  try {
    await fs.unlink(filePath);

    // Update metadata
    const metaPath = path.join(PACKAGES_DIR, 'exports-meta.json');
    try {
      const existing = await fs.readFile(metaPath, 'utf-8');
      const meta = JSON.parse(existing);
      delete meta[filename];
      await fs.writeFile(metaPath, JSON.stringify(meta, null, 2), 'utf-8');
    } catch {}

    return true;
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ */
/*  System Info for Installer                                          */
/* ------------------------------------------------------------------ */

export interface SystemInfo {
  projectSize: string;
  projectSizeBytes: number;
  dbSize: string;
  dbSizeBytes: number;
  fileCount: number;
  nodeModulesSize: string;
  hasGit: boolean;
  gitBranch: string;
  lastCommit?: string;
  diskFree: string;
  diskFreeBytes: number;
}

export async function getSystemInfo(): Promise<SystemInfo> {
  let projectSize = 0;
  let dbSize = 0;
  let fileCount = 0;
  let nodeModulesSize = 0;
  let hasGit = false;
  let gitBranch = '';
  let lastCommit = '';
  let diskFree = '';
  let diskFreeBytes = 0;

  try {
    // Get project directory size (excluding node_modules and .next)
    const duOutput = execSync(
      'du -sb --exclude=node_modules --exclude=.next --exclude=.git --exclude=upload --exclude=download --exclude=db --exclude=django-project .',
      { cwd: PROJECT_ROOT, encoding: 'utf-8' }
    );
    projectSize = parseInt(duOutput.split('\t')[0]) || 0;
  } catch {}

  try {
    if (fileExists(DB_PATH)) {
      const stats = await fs.stat(DB_PATH);
      dbSize = stats.size;
    }
  } catch {}

  try {
    const nmPath = path.join(PROJECT_ROOT, 'node_modules');
    if (fileExists(nmPath)) {
      const duOutput = execSync(`du -sb "${nmPath}"`, { encoding: 'utf-8' });
      nodeModulesSize = parseInt(duOutput.split('\t')[0]) || 0;
    }
  } catch {}

  try {
    const findOutput = execSync(
      'find . -type f -not -path "./node_modules/*" -not -path "./.next/*" -not -path "./.git/*" -not -path "./upload/*" -not -path "./download/*" | wc -l',
      { cwd: PROJECT_ROOT, encoding: 'utf-8' }
    );
    fileCount = parseInt(findOutput.trim()) || 0;
  } catch {}

  try {
    hasGit = fileExists(path.join(PROJECT_ROOT, '.git'));
    if (hasGit) {
      gitBranch = execSync('git rev-parse --abbrev-ref HEAD', {
        cwd: PROJECT_ROOT, encoding: 'utf-8'
      }).trim();
      try {
        lastCommit = execSync('git log -1 --format="%h %s (%cr)"', {
          cwd: PROJECT_ROOT, encoding: 'utf-8'
        }).trim();
      } catch {}
    }
  } catch {}

  try {
    const dfOutput = execSync('df -B1 .', { encoding: 'utf-8' });
    const lines = dfOutput.trim().split('\n');
    if (lines.length >= 2) {
      diskFreeBytes = parseInt(lines[1].split(/\s+/)[3]) || 0;
    }
  } catch {}

  return {
    projectSize: formatBytes(projectSize),
    projectSizeBytes: projectSize,
    dbSize: formatBytes(dbSize),
    dbSizeBytes: dbSize,
    fileCount,
    nodeModulesSize: formatBytes(nodeModulesSize),
    hasGit,
    gitBranch,
    lastCommit,
    diskFree: formatBytes(diskFreeBytes),
    diskFreeBytes,
  };
}

/* ------------------------------------------------------------------ */
/*  Cleanup Old Packages                                               */
/* ------------------------------------------------------------------ */

export async function cleanupOldPackages(maxAgeDays: number = 30): Promise<number> {
  const packages = await listPackages();
  const now = Date.now();
  const maxAge = maxAgeDays * 24 * 60 * 60 * 1000;
  let deleted = 0;

  for (const pkg of packages) {
    const age = now - new Date(pkg.createdAt).getTime();
    if (age > maxAge) {
      const success = await deletePackage(pkg.filename);
      if (success) deleted++;
    }
  }

  return deleted;
}
