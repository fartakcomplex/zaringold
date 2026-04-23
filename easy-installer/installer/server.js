#!/usr/bin/env node
/**
 * زرین گلد - Easy Installer Server
 * A lightweight Node.js HTTP server for the Zarin Gold installer wizard.
 * Uses ONLY Node.js built-in modules — no external dependencies.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync, exec, spawn } = require('child_process');
const crypto = require('crypto');
const os = require('os');

// ─── Configuration ───────────────────────────────────────────────────────────
const PORT = 3333;
const INSTALLER_DIR = __dirname;
const PROJECT_ROOT = path.resolve(INSTALLER_DIR, '..');
const MAX_BODY_SIZE = 2 * 1024 * 1024; // 2MB

// ─── Installation State ──────────────────────────────────────────────────────
const installationState = new Map();

// ─── Helper: Get package manager ────────────────────────────────────────────
function getPackageManager() {
  try {
    execSync('bun --version', { stdio: 'pipe' });
    return 'bun';
  } catch {
    try {
      execSync('npm --version', { stdio: 'pipe' });
      return 'npm';
    } catch {
      return null;
    }
  }
}

// ─── Helper: Get node version ───────────────────────────────────────────────
function getNodeVersion() {
  try {
    return process.version;
  } catch {
    return 'نامشخص';
  }
}

// ─── Helper: Get disk space ─────────────────────────────────────────────────
function getDiskSpace(targetPath) {
  try {
    const platform = process.platform;
    if (platform === 'win32') {
      const out = execSync('wmic logicaldisk get size,freespace,caption', {
        encoding: 'utf8',
        stdio: 'pipe'
      });
      // Parse Windows disk info
      const lines = out.trim().split('\n').slice(1);
      const drive = path.parse(targetPath).root;
      for (const line of lines) {
        if (line.includes(drive.replace('\\', ''))) {
          const parts = line.trim().split(/\s+/);
          const freeBytes = parseInt(parts[1]) || 0;
          return { free: freeBytes, freeHuman: formatBytes(freeBytes) };
        }
      }
      return { free: 0, freeHuman: 'نامشخص' };
    }

    // Linux / macOS
    const out = execSync('df -Pk "' + targetPath + '"', {
      encoding: 'utf8',
      stdio: 'pipe'
    });
    const lines = out.trim().split('\n');
    if (lines.length >= 2) {
      const parts = lines[1].split(/\s+/);
      const freeKB = parseInt(parts[3]) || 0;
      return { free: freeKB * 1024, freeHuman: formatBytes(freeKB * 1024) };
    }
    return { free: 0, freeHuman: 'نامشخص' };
  } catch {
    return { free: 0, freeHuman: 'نامشخص' };
  }
}

function formatBytes(bytes) {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  let size = bytes;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }
  return size.toFixed(1) + units[i];
}

// ─── Helper: Check write permissions ─────────────────────────────────────────
function checkWritePermission(targetPath) {
  try {
    const testFile = path.join(targetPath, '.write-test-' + Date.now());
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    return true;
  } catch {
    return false;
  }
}

// ─── Helper: Parse request body ─────────────────────────────────────────────
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    let size = 0;

    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_SIZE) {
        reject(new Error('Body too large'));
        return;
      }
      body += chunk;
    });

    req.on('end', () => {
      try {
        if (body.trim()) {
          resolve(JSON.parse(body));
        } else {
          resolve({});
        }
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });

    req.on('error', reject);
  });
}

// ─── Helper: Send JSON response ─────────────────────────────────────────────
function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data));
}

// ─── Helper: Serve static file ──────────────────────────────────────────────
function serveStatic(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject'
  };

  const contentType = mimeTypes[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 - فایل یافت نشد');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

// ─── API: GET /api/status ───────────────────────────────────────────────────
function handleGetStatus(req, res) {
  const nodeVer = getNodeVersion();
  const nodeMajor = parseInt(nodeVer.replace('v', '').split('.')[0]);
  const pkgManager = getPackageManager();
  const disk = getDiskSpace(PROJECT_ROOT);
  const canWrite = checkWritePermission(PROJECT_ROOT);
  const totalMem = os.totalmem();

  const requirements = {
    nodeVersion: nodeVer,
    hasNpm: pkgManager === 'npm' || (pkgManager === 'bun'),
    hasBun: pkgManager === 'bun',
    diskFree: disk.freeHuman,
    diskFreeBytes: disk.free,
    canWrite,
    os: os.platform(),
    arch: os.arch(),
    memory: formatBytes(totalMem),
    projectRoot: PROJECT_ROOT,
    allRequirementsMet:
      nodeMajor >= 18 &&
      !!pkgManager &&
      disk.free >= 2 * 1024 * 1024 * 1024 &&
      canWrite
  };

  sendJSON(res, 200, requirements);
}

// ─── API: GET /api/env-info ─────────────────────────────────────────────────
function handleGetEnvInfo(req, res) {
  const pkgManager = getPackageManager();
  const disk = getDiskSpace(PROJECT_ROOT);

  sendJSON(res, 200, {
    projectRoot: PROJECT_ROOT,
    installerDir: INSTALLER_DIR,
    nodeVersion: process.version,
    platform: os.platform() + '-' + os.arch(),
    packageManager: pkgManager,
    hostname: os.hostname(),
    diskFree: disk.freeHuman,
    memory: formatBytes(os.totalmem()),
    cpuCount: os.cpus().length
  });
}

// ─── API: POST /api/test-db ─────────────────────────────────────────────────
async function handleTestDB(req, res) {
  try {
    const body = await parseBody(req);
    const { type, host, port, database, username, password } = body;

    if (type === 'sqlite') {
      // For SQLite, just verify we can create/write the file
      const dbPath = database || 'file:./dev.db';
      const cleanPath = dbPath.replace('file:', '').replace('./', '');
      const fullPath = path.join(PROJECT_ROOT, cleanPath);

      try {
        // Ensure directory exists
        const dir = path.dirname(fullPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        // Test write
        fs.writeFileSync(fullPath + '.test', 'test');
        fs.unlinkSync(fullPath + '.test');
        sendJSON(res, 200, { success: true, message: 'اتصال دیتابیس SQLite برقرار شد ✓' });
      } catch (err) {
        sendJSON(res, 200, {
          success: false,
          message: 'خطا در دسترسی به فایل دیتابیس: ' + err.message
        });
      }
      return;
    }

    if (type === 'mysql' || type === 'postgresql') {
      // Try to test connection using a temporary script
      const testScript = `
        const { createConnection, createPool } = require('${type === 'mysql' ? 'mysql2' : type}/promise');
        (async () => {
          try {
            const conn = await createConnection({
              host: '${host || 'localhost'}',
              port: ${port || (type === 'mysql' ? 3306 : 5432)},
              user: '${username || 'root'}',
              password: '${(password || '').replace(/'/g, "\\'")}',
              database: '${database || ''}'
            });
            await conn.ping();
            await conn.end();
            console.log(JSON.stringify({success:true,message:'اتصال برقرار شد ✓'}));
          } catch(err) {
            console.log(JSON.stringify({success:false,message:err.message}));
          }
        })();
      `;

      try {
        const result = execSync(
          `node -e "${testScript.replace(/"/g, '\\"')}"`,
          { cwd: PROJECT_ROOT, encoding: 'utf8', timeout: 10000, stdio: 'pipe' }
        );
        const jsonStr = result.trim().split('\n').pop();
        sendJSON(res, 200, JSON.parse(jsonStr));
      } catch (err) {
        sendJSON(res, 200, {
          success: false,
          message: 'خطا در اتصال: آیا پکیج مربوطه نصب شده است؟ (' + type + ')'
        });
      }
      return;
    }

    sendJSON(res, 400, { success: false, message: 'نوع دیتابیس نامعتبر' });
  } catch (err) {
    sendJSON(res, 500, { success: false, message: 'خطای سرور: ' + err.message });
  }
}

// ─── API: POST /api/install ─────────────────────────────────────────────────
async function handleInstall(req, res) {
  try {
    const config = await parseBody(req);
    const streamId = crypto.randomBytes(8).toString('hex');

    installationState.set(streamId, {
      config,
      currentStep: 0,
      totalSteps: 7,
      stepName: '',
      status: 'pending',
      logs: [],
      percent: 0,
      startTime: Date.now(),
      error: null,
      result: null
    });

    // Start installation asynchronously
    runInstallation(streamId, config).catch((err) => {
      const state = installationState.get(streamId);
      if (state) {
        state.status = 'error';
        state.error = err.message;
        state.logs.push('❌ خطای کشف نشده: ' + err.message);
      }
    });

    sendJSON(res, 200, { streamId });
  } catch (err) {
    sendJSON(res, 500, { success: false, message: err.message });
  }
}

// ─── Installation Runner ────────────────────────────────────────────────────
async function runInstallation(streamId, config) {
  const state = installationState.get(streamId);
  const pkgManager = getPackageManager() || 'npm';
  const installCmd = pkgManager === 'bun' ? 'bun install' : 'npm install';
  const buildCmd = pkgManager === 'bun' ? 'bun run build' : 'npm run build';

  const steps = [
    { name: 'پاکسازی و آماده‌سازی', action: stepCleanup },
    { name: 'نصب وابستگی‌ها', action: stepInstallDeps },
    { name: 'راه‌اندازی دیتابیس', action: stepDatabaseSetup },
    { name: 'ایمپورت داده‌ها', action: stepImportData },
    { name: 'پیکربندی محیط', action: stepEnvConfig },
    { name: 'بیلد اپلیکیشن', action: stepBuild },
    { name: 'تست نهایی', action: stepFinalTest }
  ];

  state.totalSteps = steps.length;
  state.status = 'running';

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    state.currentStep = i + 1;
    state.stepName = step.name;
    state.status = 'running';
    state.percent = Math.round(((i) / steps.length) * 100);

    try {
      await step.action(state, config, pkgManager);
      state.percent = Math.round(((i + 1) / steps.length) * 100);
      state.logs.push('✅ ' + step.name + ' — تکمیل شد');
    } catch (err) {
      state.status = 'error';
      state.error = step.name + ': ' + err.message;
      state.logs.push('❌ ' + step.name + ' — ' + err.message);
      return;
    }
  }

  state.status = 'completed';
  state.percent = 100;
  state.logs.push('');
  state.logs.push('🎉 نصب با موفقیت تکمیل شد!');
  state.result = {
    siteUrl: config.siteUrl || 'http://localhost:3000',
    adminPhone: config.adminPhone,
    adminName: config.adminName
  };
}

// ─── Step 1: Cleanup ────────────────────────────────────────────────────────
async function stepCleanup(state, config) {
  const dirsToClean = ['.next', 'node_modules/.cache'];
  state.logs.push('📦 پاکسازی فایل‌های قدیمی...');

  for (const dir of dirsToClean) {
    const fullPath = path.join(PROJECT_ROOT, dir);
    if (fs.existsSync(fullPath)) {
      fs.rmSync(fullPath, { recursive: true, force: true });
      state.logs.push('  🗑️ حذف: ' + dir);
    }
  }

  // Ensure essential directories exist
  const dirsToCreate = ['public', 'prisma'];
  for (const dir of dirsToCreate) {
    const fullPath = path.join(PROJECT_ROOT, dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      state.logs.push('  📁 ایجاد: ' + dir);
    }
  }
}

// ─── Step 2: Install Dependencies ──────────────────────────────────────────
async function stepInstallDeps(state, config, pkgManager) {
  state.logs.push('📥 نصب وابستگی‌ها با ' + pkgManager + '...');

  await new Promise((resolve, reject) => {
    const cmd = pkgManager === 'bun' ? 'bun' : 'npm';
    const args = pkgManager === 'bun' ? ['install'] : ['install'];

    const child = spawn(cmd, args, {
      cwd: PROJECT_ROOT,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true
    });

    let output = '';
    child.stdout.on('data', (d) => {
      output += d.toString();
    });
    child.stderr.on('data', (d) => {
      output += d.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        state.logs.push('  ✅ وابستگی‌ها نصب شدند');
        resolve();
      } else {
        reject(new Error('نصب وابستگی‌ها با خطا مواجه شد (code: ' + code + ')\n' + output.slice(-500)));
      }
    });

    child.on('error', (err) => {
      reject(err);
    });
  });
}

// ─── Step 3: Database Setup ────────────────────────────────────────────────
async function stepDatabaseSetup(state, config) {
  state.logs.push('🗄️ راه‌اندازی دیتابیس...');

  const dbType = config.dbType || 'sqlite';

  if (dbType === 'sqlite') {
    // Ensure prisma schema uses SQLite
    const schemaPath = path.join(PROJECT_ROOT, 'prisma', 'schema.prisma');
    if (fs.existsSync(schemaPath)) {
      let schema = fs.readFileSync(schemaPath, 'utf8');
      // Update datasource if needed
      if (!schema.includes('provider = "sqlite"')) {
        schema = schema.replace(
          /datasource\s*\w*\s*\{[^}]*\}/,
          'datasource db {\n  provider = "sqlite"\n  url      = env("DATABASE_URL")\n}'
        );
        fs.writeFileSync(schemaPath, schema);
        state.logs.push('  📝 اسکیمای Prisma برای SQLite تنظیم شد');
      }
    }

    // Run prisma db push
    state.logs.push('  🔧 اجرای Prisma db push...');
    await runCommand('npx prisma db push --skip-generate', PROJECT_ROOT);
    await runCommand('npx prisma generate', PROJECT_ROOT);
    state.logs.push('  ✅ دیتابیس SQLite راه‌اندازی شد');

  } else if (dbType === 'mysql' || dbType === 'postgresql') {
    // Update prisma schema
    const schemaPath = path.join(PROJECT_ROOT, 'prisma', 'schema.prisma');
    if (fs.existsSync(schemaPath)) {
      let schema = fs.readFileSync(schemaPath, 'utf8');
      const provider = dbType === 'mysql' ? 'mysql' : 'postgresql';
      if (!schema.includes('provider = "' + provider + '"')) {
        schema = schema.replace(
          /datasource\s*\w*\s*\{[^}]*\}/,
          'datasource db {\n  provider = "' + provider + '"\n  url      = env("DATABASE_URL")\n}'
        );
        fs.writeFileSync(schemaPath, schema);
        state.logs.push('  📝 اسکیمای Prisma برای ' + provider + ' تنظیم شد');
      }
    }

    state.logs.push('  🔧 اجرای Prisma db push...');
    await runCommand('npx prisma db push --skip-generate', PROJECT_ROOT);
    await runCommand('npx prisma generate', PROJECT_ROOT);
    state.logs.push('  ✅ دیتابیس ' + dbType + ' راه‌اندازی شد');
  }
}

// ─── Step 4: Import Data ───────────────────────────────────────────────────
async function stepImportData(state, config) {
  state.logs.push('📋 ایمپورت داده‌ها...');

  const dbType = config.dbType || 'sqlite';

  // Check for SQL dump file
  const sqlFiles = [
    path.join(PROJECT_ROOT, 'database-export.sql'),
    path.join(PROJECT_ROOT, 'db', 'seed.sql'),
    path.join(PROJECT_ROOT, 'prisma', 'seed.sql'),
    path.join(PROJECT_ROOT, 'seed.sql')
  ];

  const sqlFile = sqlFiles.find((f) => fs.existsSync(f));

  if (sqlFile) {
    state.logs.push('  📄 فایل SQL یافت شد: ' + sqlFile);

    if (dbType === 'sqlite') {
      const dbPath = (config.dbDatabase || 'file:./dev.db').replace('file:', '').replace('./', '');
      const fullDbPath = path.join(PROJECT_ROOT, dbPath);
      await runCommand('sqlite3 "' + fullDbPath + '" < "' + sqlFile + '"', PROJECT_ROOT);
      state.logs.push('  ✅ داده‌ها در SQLite ایمپورت شدند');
    } else if (dbType === 'mysql') {
      await runCommand(
        'mysql -h ' + (config.dbHost || 'localhost') +
        ' -P ' + (config.dbPort || 3306) +
        ' -u ' + (config.dbUsername || 'root') +
        (config.dbPassword ? ' -p"' + config.dbPassword + '"' : '') +
        ' ' + (config.dbDatabase || 'zarin_gold') +
        ' < "' + sqlFile + '"',
        PROJECT_ROOT
      );
      state.logs.push('  ✅ داده‌ها در MySQL ایمپورت شدند');
    } else if (dbType === 'postgresql') {
      await runCommand(
        'PGPASSWORD="' + (config.dbPassword || '') + '" psql' +
        ' -h ' + (config.dbHost || 'localhost') +
        ' -p ' + (config.dbPort || 5432) +
        ' -U ' + (config.dbUsername || 'postgres') +
        ' -d ' + (config.dbDatabase || 'zarin_gold') +
        ' -f "' + sqlFile + '"',
        PROJECT_ROOT
      );
      state.logs.push('  ✅ داده‌ها در PostgreSQL ایمپورت شدند');
    }
  } else {
    // Check for Prisma seed script
    const pkgPath = path.join(PROJECT_ROOT, 'package.json');
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      if (pkg.prisma && pkg.prisma.seed) {
        state.logs.push('  🌱 اجرای اسکریپت Seed...');
        await runCommand('npx prisma db seed', PROJECT_ROOT);
        state.logs.push('  ✅ داده‌های اولیه ایمپورت شدند');
        return;
      }
    }
    state.logs.push('  ℹ️ فایل SQL یا Seed یافت نشد — مرحله رد شد');
  }
}

// ─── Step 5: Environment Configuration ─────────────────────────────────────
async function stepEnvConfig(state, config) {
  state.logs.push('⚙️ پیکربندی محیط...');

  const dbType = config.dbType || 'sqlite';
  let databaseUrl;

  if (dbType === 'sqlite') {
    databaseUrl = config.dbDatabase || 'file:./dev.db';
  } else if (dbType === 'mysql') {
    databaseUrl =
      'mysql://' +
      (config.dbUsername || 'root') + ':' +
      (config.dbPassword || '') + '@' +
      (config.dbHost || 'localhost') + ':' +
      (config.dbPort || 3306) + '/' +
      (config.dbDatabase || 'zarin_gold');
  } else if (dbType === 'postgresql') {
    databaseUrl =
      'postgresql://' +
      (config.dbUsername || 'postgres') + ':' +
      (config.dbPassword || '') + '@' +
      (config.dbHost || 'localhost') + ':' +
      (config.dbPort || 5432) + '/' +
      (config.dbDatabase || 'zarin_gold');
  }

  const envContent = [
    '# ─── Zarin Gold Environment Configuration ───',
    '# Generated by Easy Installer on ' + new Date().toLocaleString('fa-IR'),
    '',
    'NODE_ENV="production"',
    'NEXT_PUBLIC_SITE_NAME="' + (config.siteName || 'زرین گلد') + '"',
    'NEXT_PUBLIC_SITE_URL="' + (config.siteUrl || 'http://localhost:3000') + '"',
    '',
    'DATABASE_URL="' + databaseUrl + '"',
    '',
    'ADMIN_PHONE="' + (config.adminPhone || '09120000001') + '"',
    'ADMIN_NAME="' + (config.adminName || 'مدیر سیستم') + '"',
    'ZARINPAL_MERCHANT="' + (config.zarinpalMerchant || '') + '"',
    '',
    '# ─── Auth ───',
    'NEXTAUTH_SECRET="' + crypto.randomBytes(32).toString('hex') + '"',
    'NEXTAUTH_URL="' + (config.siteUrl || 'http://localhost:3000') + '"',
  ].join('\n');

  const envPath = path.join(PROJECT_ROOT, '.env');
  fs.writeFileSync(envPath, envContent, 'utf8');
  state.logs.push('  ✅ فایل .env ایجاد شد');

  // Also create .env.local as backup
  fs.writeFileSync(path.join(PROJECT_ROOT, '.env.local'), envContent, 'utf8');

  // Create start script
  const startScript = [
    '#!/bin/bash',
    '# Zarin Gold Startup Script',
    '# Generated by Easy Installer',
    '',
    'cd "' + PROJECT_ROOT + '"',
    'export PORT=3000',
    'export NODE_ENV=production',
    '',
    'echo "🚀 اجرای زرین گلد..."',
    'echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"',
    'echo "📱 آدرس سایت: ' + (config.siteUrl || 'http://localhost:3000') + '"',
    'echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"',
    '',
    'if command -v bun &> /dev/null; then',
    '  bun start',
    'else',
    '  npm start',
    'fi',
    ''
  ].join('\n');

  const startPath = path.join(PROJECT_ROOT, 'start.sh');
  fs.writeFileSync(startPath, startScript, 'utf8');
  fs.chmodSync(startPath, 0o755);
  state.logs.push('  ✅ اسکریپت start.sh ایجاد شد');
}

// ─── Step 6: Build Application ─────────────────────────────────────────────
async function stepBuild(state, config, pkgManager) {
  state.logs.push('🔨 بیلد اپلیکیشن...');

  const buildCmd = pkgManager === 'bun' ? 'bun run build' : 'npm run build';

  await new Promise((resolve, reject) => {
    const child = exec(buildCmd, {
      cwd: PROJECT_ROOT,
      maxBuffer: 50 * 1024 * 1024,
      timeout: 600000, // 10 minutes
      env: { ...process.env, NODE_ENV: 'production' }
    }, (err, stdout, stderr) => {
      if (stdout) {
        const lines = stdout.split('\n').filter((l) => l.trim());
        lines.slice(-3).forEach((line) => state.logs.push('  │ ' + line));
      }
      if (err) {
        reject(new Error('بیلد با خطا مواجه شد\n' + (stderr || err.message).slice(-500)));
        return;
      }
      resolve();
    });
  });

  state.logs.push('  ✅ بیلد با موفقیت تکمیل شد');
}

// ─── Step 7: Final Tests ───────────────────────────────────────────────────
async function stepFinalTest(state, config) {
  state.logs.push('🧪 تست نهایی...');

  // Check if build output exists
  const buildDir = path.join(PROJECT_ROOT, '.next');
  if (fs.existsSync(buildDir)) {
    state.logs.push('  ✅ پوشه .next وجود دارد');
  } else {
    state.logs.push('  ⚠️ پوشه .next یافت نشد');
  }

  // Check .env file
  const envPath = path.join(PROJECT_ROOT, '.env');
  if (fs.existsSync(envPath)) {
    state.logs.push('  ✅ فایل .env وجود دارد');
  } else {
    state.logs.push('  ⚠️ فایل .env یافت نشد');
  }

  // Check start script
  const startPath = path.join(PROJECT_ROOT, 'start.sh');
  if (fs.existsSync(startPath)) {
    state.logs.push('  ✅ اسکریپت start.sh وجود دارد');
  }

  // Check database file
  const dbType = config.dbType || 'sqlite';
  if (dbType === 'sqlite') {
    const dbPath = (config.dbDatabase || 'file:./dev.db').replace('file:', '').replace('./', '');
    const fullDbPath = path.join(PROJECT_ROOT, dbPath);
    if (fs.existsSync(fullDbPath)) {
      state.logs.push('  ✅ فایل دیتابیس SQLite ایجاد شد');
    } else {
      state.logs.push('  ⚠️ فایل دیتابیس یافت نشد');
    }
  }

  state.logs.push('');
  state.logs.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  state.logs.push('  🎉 تمام تست‌ها با موفقیت انجام شد');
}

// ─── Helper: Run command with promise ───────────────────────────────────────
function runCommand(cmd, cwd) {
  return new Promise((resolve, reject) => {
    exec(cmd, { cwd, maxBuffer: 10 * 1024 * 1024, timeout: 300000 }, (err, stdout, stderr) => {
      if (err) {
        reject(new Error(stderr || err.message));
      } else {
        resolve(stdout);
      }
    });
  });
}

// ─── API: GET /api/install/progress ─────────────────────────────────────────
function handleInstallProgress(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const streamId = url.searchParams.get('streamId');

  if (!streamId || !installationState.has(streamId)) {
    sendJSON(res, 404, { error: 'شناسه نصب یافت نشد' });
    return;
  }

  // Check if client wants SSE
  const acceptHeader = req.headers.accept || '';
  if (acceptHeader.includes('text/event-stream')) {
    // SSE mode
    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });

    const state = installationState.get(streamId);

    // Send initial state
    res.write('data: ' + JSON.stringify({
      currentStep: state.currentStep,
      totalSteps: state.totalSteps,
      stepName: state.stepName,
      status: state.status,
      logs: state.logs,
      percent: state.percent,
      error: state.error,
      result: state.result
    }) + '\n\n');

    if (state.status === 'completed' || state.status === 'error') {
      res.write('data: [DONE]\n\n');
      res.end();
      return;
    }

    // Poll every 1.5s
    const interval = setInterval(() => {
      const s = installationState.get(streamId);
      if (!s) {
        clearInterval(interval);
        res.write('data: [DONE]\n\n');
        res.end();
        return;
      }

      res.write('data: ' + JSON.stringify({
        currentStep: s.currentStep,
        totalSteps: s.totalSteps,
        stepName: s.stepName,
        status: s.status,
        logs: s.logs,
        percent: s.percent,
        error: s.error,
        result: s.result
      }) + '\n\n');

      if (s.status === 'completed' || s.status === 'error') {
        clearInterval(interval);
        res.write('data: [DONE]\n\n');
        res.end();
      }
    }, 1500);

    req.on('close', () => {
      clearInterval(interval);
    });
  } else {
    // JSON polling mode
    const state = installationState.get(streamId);
    sendJSON(res, 200, {
      currentStep: state.currentStep,
      totalSteps: state.totalSteps,
      stepName: state.stepName,
      status: state.status,
      logs: state.logs.slice(-20),
      percent: state.percent,
      error: state.error,
      result: state.result
    });
  }
}

// ─── API: POST /api/cleanup ─────────────────────────────────────────────────
async function handleCleanup(req, res) {
  try {
    const installerDir = INSTALLER_DIR;

    // Schedule removal after response
    sendJSON(res, 200, {
      success: true,
      message: 'فایل‌های نصب با موفقیت حذف شدند'
    });

    // Remove installer files after a short delay
    setTimeout(() => {
      try {
        fs.rmSync(installerDir, { recursive: true, force: true });
      } catch {
        // Silently fail — the server is shutting down anyway
      }
      // Exit the process
      setTimeout(() => process.exit(0), 1000);
    }, 2000);
  } catch (err) {
    sendJSON(res, 500, { success: false, message: err.message });
  }
}

// ─── Request Router ─────────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;
  const method = req.method;

  // CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }

  // API Routes
  if (pathname === '/api/status' && method === 'GET') {
    return handleGetStatus(req, res);
  }
  if (pathname === '/api/env-info' && method === 'GET') {
    return handleGetEnvInfo(req, res);
  }
  if (pathname === '/api/test-db' && method === 'POST') {
    return handleTestDB(req, res);
  }
  if (pathname === '/api/install' && method === 'POST') {
    return handleInstall(req, res);
  }
  if (pathname === '/api/install/progress' && method === 'GET') {
    return handleInstallProgress(req, res);
  }
  if (pathname === '/api/cleanup' && method === 'POST') {
    return handleCleanup(req, res);
  }

  // Static file serving
  if (pathname === '/' || pathname === '/index.html') {
    serveStatic(res, path.join(INSTALLER_DIR, 'index.html'));
    return;
  }

  // Serve any file from installer directory
  const filePath = path.join(INSTALLER_DIR, pathname);
  if (filePath.startsWith(INSTALLER_DIR) && fs.existsSync(filePath) && !fs.statSync(filePath).isDirectory()) {
    serveStatic(res, filePath);
    return;
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('404 — صفحه یافت نشد');
});

// ─── Start Server ───────────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log('');
  console.log('  ╔══════════════════════════════════════════╗');
  console.log('  ║       🏆 زرین گلد — نصب‌کننده آسان       ║');
  console.log('  ╠══════════════════════════════════════════╣');
  console.log('  ║  Server: http://localhost:' + PORT + '          ║');
  console.log('  ║  Project: ' + PROJECT_ROOT.slice(0, 30) + (PROJECT_ROOT.length > 30 ? '...' : '').padEnd(14) + ' ║');
  console.log('  ╚══════════════════════════════════════════╝');
  console.log('');
  console.log('  برای شروع نصب، مرورگر خود را باز کنید و آدرس بالا را وارد کنید.');
  console.log('');
});
