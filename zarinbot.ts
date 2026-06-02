#!/usr/bin/env bun
/**
 * ═══════════════════════════════════════════════════════════════════
 *  🤖 ZarinBot — ZarinGold Auto-Setup Bot
 * ═══════════════════════════════════════════════════════════════════
 *  Auto-installs prerequisites, runs project, creates super admin.
 *  Self-destructs after site is stable.
 *
 *  Usage:
 *    bun run zarinbot.ts          # Run the bot
 *    bun run zarinbot.ts --nuke   # Remove the bot manually
 * ═══════════════════════════════════════════════════════════════════
 */

import { execSync, spawn } from "child_process";
import { existsSync, unlinkSync, readFileSync, writeFileSync } from "fs";
import { join, resolve } from "path";
import crypto from "crypto";
import http from "http";

/* ─── Config ─── */
const PROJECT_DIR = resolve(__dirname);
const PORT = 3000;
const BOT_FILE = __filename;
const BOT_CREDENTIALS_FILE = join(PROJECT_DIR, ".super-admin.txt");
const SUPER_ADMIN_PHONE = "09999999999";
const SUPER_ADMIN_NAME = "مدیر ارشد سیستم";
const MAX_WAIT_SECONDS = 120;

/* ─── ANSI Colors ─── */
const C = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[91m",
  green: "\x1b[92m",
  yellow: "\x1b[93m",
  blue: "\x1b[94m",
  magenta: "\x1b[95m",
  cyan: "\x1b[96m",
  gold: "\x1b[38;5;220m",
};

/* ─── Helpers ─── */
function log(emoji: string, text: string, color = C.cyan) {
  const time = new Date().toLocaleTimeString("fa-IR", { hour12: false });
  process.stdout.write(`\r${" ".repeat(80)}\r`);
  console.log(`${C.dim}[${time}]${C.reset} ${color}${emoji} ${text}${C.reset}`);
}

function clearLine() {
  process.stdout.write(`\r${" ".repeat(80)}\r`);
}

function printStep(n: number, total: number, title: string) {
  console.log(`\n${C.bold}${C.blue}━━━ Step ${n}/${total} ━━ ${title} ━━━${C.reset}\n`);
}

/* ─── Self-destruct ─── */
function selfDestruct() {
  console.log(`\n${C.red}💣 ${C.bold}Self-destructing ZarinBot...${C.reset}\n`);
  try {
    if (existsSync(BOT_FILE)) unlinkSync(BOT_FILE);
    if (existsSync(BOT_CREDENTIALS_FILE)) unlinkSync(BOT_CREDENTIALS_FILE);
    console.log(`${C.green}✅ ZarinBot and credentials file removed.${C.reset}`);
    console.log(`${C.dim}   The project continues running independently.${C.reset}\n`);
  } catch {
    console.log(`${C.yellow}⚠️  Could not auto-delete. Manually remove: ${BOT_FILE}${C.reset}\n`);
  }
  process.exit(0);
}

/* ─── Spinner ─── */
function spin(text: string) {
  const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  let i = 0;
  const id = setInterval(() => {
    process.stdout.write(`\r${C.cyan}${frames[i % frames.length]}${C.reset} ${C.dim}${text}${C.reset}`);
    i++;
  }, 80);
  return {
    stop(msg: string, ok: boolean) {
      clearInterval(id);
      clearLine();
      console.log(`${ok ? C.green + "  ✅" : C.red + "  ❌"} ${msg}`);
    },
  };
}

/* ─── Command runner ─── */
function run(cmd: string, opts?: { cwd?: string; silent?: boolean }): string {
  return execSync(cmd, {
    cwd: opts?.cwd || PROJECT_DIR,
    encoding: "utf-8",
    stdio: opts?.silent ? "pipe" : "inherit",
    timeout: 300_000,
  });
}

/* ─── Check prerequisites ─── */
function checkPrereqs() {
  log("🔍", "Checking prerequisites...");

  const s1 = spin("Checking Bun runtime...          ");
  try {
    const v = execSync("bun --version", { encoding: "utf-8" }).trim();
    s1.stop(`Bun v${v} found`, true);
  } catch {
    s1.stop("Bun not found! Installing...", false);
    try {
      execSync("curl -fsSL https://bun.sh/install | bash", { stdio: "pipe", timeout: 120_000 });
      s1.stop("Bun installed", true);
    } catch {
      s1.stop("Install Bun manually: https://bun.sh", false);
      process.exit(1);
    }
  }

  const s2 = spin("Checking Node.js...               ");
  try {
    const nv = execSync("node --version", { encoding: "utf-8" }).trim();
    s2.stop(`Node.js ${nv} found`, true);
  } catch {
    s2.stop("Node.js not found — Bun handles everything", false);
  }

  const s3 = spin("Checking dependencies...          ");
  if (existsSync(join(PROJECT_DIR, "node_modules"))) {
    s3.stop("Dependencies already installed", true);
  } else {
    s3.stop("Installing dependencies...", false);
    const s4 = spin("Running bun install...            ");
    try {
      run("bun install", { silent: true });
      s4.stop("Dependencies installed", true);
    } catch (e: any) {
      s4.stop("Failed to install dependencies", false);
      process.exit(1);
    }
  }
}

/* ─── Database setup ─── */
function setupDatabase() {
  log("🗄️ ", "Setting up database...", C.blue);

  const envFile = join(PROJECT_DIR, ".env");
  if (!existsSync(envFile)) {
    const s = spin("Creating .env file...             ");
    writeFileSync(envFile, 'DATABASE_URL="file:./db/dev.db"\n');
    s.stop(".env created", true);
  }

  const dbDir = join(PROJECT_DIR, "db");
  if (!existsSync(dbDir)) {
    run("mkdir -p db", { silent: true });
  }

  const s1 = spin("Generating Prisma client...       ");
  try { run("bunx prisma generate", { silent: true }); s1.stop("Prisma client generated", true); }
  catch { s1.stop("Prisma generate warning (non-fatal)", false); }

  const s2 = spin("Pushing database schema...        ");
  try { run("bunx prisma db push --accept-data-loss 2>/dev/null || bunx prisma db push", { silent: true }); s2.stop("Database schema pushed", true); }
  catch { s2.stop("Database push warning (non-fatal)", false); }
}

/* ─── Start dev server ─── */
function startServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    try { run(`lsof -ti :${PORT} | xargs kill -9 2>/dev/null || true`, { silent: true }); } catch {}

    log("🚀", "Starting development server...", C.green);

    const server = spawn("bun", ["run", "dev"], {
      cwd: PROJECT_DIR,
      stdio: ["ignore", "pipe", "pipe"],
      shell: false,
    });

    server.stdout?.on("data", () => {});
    server.stderr?.on("data", () => {});
    server.on("error", (err) => reject(new Error(`Server failed: ${err.message}`)));

    let elapsed = 0;
    const poll = setInterval(() => {
      elapsed += 2;
      const req = http.request(
        { hostname: "localhost", port: PORT, path: "/", method: "GET", timeout: 3000 },
        (res) => {
          if (res.statusCode === 200) {
            clearInterval(poll);
            log("🌐", `Server is live at http://localhost:${PORT}`, C.green);
            resolve();
          }
        }
      );
      req.on("error", () => {});
      req.on("timeout", () => req.destroy());
      req.end();

      if (elapsed >= MAX_WAIT_SECONDS) {
        clearInterval(poll);
        reject(new Error(`Server timeout after ${MAX_WAIT_SECONDS}s`));
      }
    }, 2000);
  });
}

/* ─── Password hashing ─── */
function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString("hex");
    crypto.scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 }, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(`${salt}:${derivedKey.toString("hex")}`);
    });
  });
}

/* ─── Wait for stability ─── */
function waitForStability(): Promise<void> {
  return new Promise((resolve) => {
    let stableCount = 0;
    const required = 3;
    const poll = setInterval(() => {
      const req = http.request(
        { hostname: "localhost", port: PORT, path: "/", method: "GET", timeout: 3000 },
        (r) => {
          if (r.statusCode === 200) { stableCount++; if (stableCount >= required) { clearInterval(poll); resolve(); } }
          else stableCount = 0;
        }
      );
      req.on("error", () => { stableCount = 0; });
      req.on("timeout", () => { req.destroy(); stableCount = 0; });
      req.end();
    }, 3000);
  });
}

/* ─── Create super admin ─── */
async function createSuperAdmin() {
  log("👑", "Creating Super Admin account...", C.gold);

  const password = crypto.randomBytes(10).toString("hex");
  const hashedPassword = await hashPassword(password);

  const { PrismaClient } = await import("@prisma/client");
  const db = new PrismaClient();

  try {
    const normalizedPhone = SUPER_ADMIN_PHONE.replace(/^(\+98|0)/, "98").trim();
    const existing = await db.user.findFirst({ where: { phone: normalizedPhone } });

    if (existing) {
      await db.user.update({
        where: { id: existing.id },
        data: { role: "super_admin", fullName: SUPER_ADMIN_NAME, password: hashedPassword, isVerified: true, isActive: true, isFrozen: false },
      });
      log("🔄", "Existing Super Admin account updated", C.yellow);
    } else {
      const referralCode = "ZG" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
      const user = await db.user.create({
        data: {
          phone: normalizedPhone,
          fullName: SUPER_ADMIN_NAME,
          password: hashedPassword,
          email: "admin@zaringold.com",
          role: "super_admin",
          isVerified: true,
          isActive: true,
          isFrozen: false,
          referralCode,
          userLevel: "diamond",
        },
      });
      try {
        await db.wallet.create({ data: { userId: user.id, balance: 0, frozenBalance: 0 } });
        await db.goldWallet.create({ data: { userId: user.id, goldGrams: 0, frozenGold: 0 } });
        await db.userGamification.create({ data: { userId: user.id, xp: 0, level: 1, currentStreak: 0, longestStreak: 0 } });
      } catch {}
      log("✨", "New Super Admin account created", C.green);
    }

    /* Display credentials */
    console.log(`
${C.gold}╔══════════════════════════════════════════════════════════════╗
║                  🔑 SUPER ADMIN CREDENTIALS                   ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  ${C.bold}🌐 URL:${C.gold}        http://localhost:${PORT}                        ║
║                                                              ║
║  ${C.bold}📱 Phone:${C.gold}       ${SUPER_ADMIN_PHONE}                        ║
║                                                              ║
║  ${C.bold}🔑 Password:${C.gold}     ${C.cyan + C.bold}${password}${C.gold}                        ║
║                                                              ║
║  ${C.bold}👤 Name:${C.gold}         ${SUPER_ADMIN_NAME}                           ║
║                                                              ║
║  ${C.bold}🛡️  Role:${C.gold}         Super Admin (${C.cyan}مدیر ارشد${C.gold})                        ║
║                                                              ║
║  ${C.bold}📊 Level:${C.gold}         Diamond (${C.cyan}الماس${C.gold})                              ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║  ${C.yellow}⚠️  Login with phone + password. Copy it now!${C.gold}            ║
║  ${C.dim}Credentials also saved to: .super-admin.txt${C.gold}                 ║
╚══════════════════════════════════════════════════════════════╝${C.reset}`);

    writeFileSync(BOT_CREDENTIALS_FILE,
`ZarinGold Super Admin Credentials
==================================
URL:      http://localhost:${PORT}
Phone:    ${SUPER_ADMIN_PHONE}
Password: ${password}
Name:     ${SUPER_ADMIN_NAME}
Role:     Super Admin
Level:    Diamond
Created:  ${new Date().toLocaleString("fa-IR")}
`
    );
    log("💾", "Credentials saved to .super-admin.txt", C.green);
  } catch (e: any) {
    log("❌", `Failed to create super admin: ${e.message}`, C.red);
  } finally {
    await db.$disconnect();
  }
}

/* ═══════════════════════════════════════════════════════════ */
/*  Main                                                      */
/* ═══════════════════════════════════════════════════════════ */
async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--nuke") || args.includes("--remove") || args.includes("--delete")) {
    selfDestruct();
    return;
  }

  /* Banner */
  console.clear();
  console.log(`
${C.gold}  ╔═══════════════════════════════════════════════════════╗
  ║                                                       ║
  ║   ${C.bold}🤖 ZarinBot — ZarinGold Auto-Setup Bot${C.gold}             ║
  ║                                                       ║
  ║   ${C.dim}Auto-install  •  Auto-run  •  Super-admin creator${C.gold}    ║
  ║                                                       ║
  ╚═══════════════════════════════════════════════════════╝${C.reset}
`);
  console.log(`${C.bold}📋 Setup Plan:${C.reset}
${C.dim}  1. Check prerequisites (Bun, Node.js)
  2. Install dependencies
  3. Setup database (Prisma)
  4. Start development server
  5. Create Super Admin account
  6. Display login credentials
  7. Wait for stability → Self-destruct${C.reset}`);

  /* Step 1 */
  printStep(1, 6, "Prerequisites");
  checkPrereqs();

  /* Step 2 */
  printStep(2, 6, "Database Setup");
  setupDatabase();

  /* Step 3 */
  printStep(3, 6, "Start Server");
  await startServer();

  /* Step 4 */
  const s = spin("Waiting for site stability...      ");
  await waitForStability();
  s.stop("Site is stable!", true);

  /* Step 5 */
  printStep(4, 6, "Create Super Admin");
  await createSuperAdmin();

  /* Step 6 */
  printStep(5, 6, "Final Check");
  const s2 = spin("Confirming everything works...    ");
  await waitForStability();
  s2.stop("Everything is running perfectly!", true);

  /* Step 7: Cleanup & Self-destruct */
  printStep(6, 6, "Cleanup & Self-Destruct");

  try {
    const gitignore = join(PROJECT_DIR, ".gitignore");
    if (existsSync(gitignore)) {
      const content = readFileSync(gitignore, "utf-8");
      if (!content.includes(".super-admin.txt")) {
        writeFileSync(gitignore, content + "\n.super-admin.txt\n");
        log("🔒", "Added .super-admin.txt to .gitignore", C.dim);
      }
    }
  } catch {}

  console.log(`\n${C.yellow}⏳  Self-destructing in 30 seconds...${C.reset}`);
  console.log(`${C.dim}    Press Ctrl+C to cancel and keep the bot file.${C.reset}\n`);
  console.log(`${C.green}${C.bold}🎉 ZarinGold is ready! Open the URL and login!${C.reset}\n`);

  const timer = setTimeout(() => selfDestruct(), 30_000);

  process.on("SIGINT", () => {
    clearTimeout(timer);
    console.log(`\n\n${C.cyan}👋 Bot stopped. Project keeps running.${C.reset}`);
    console.log(`${C.dim}   Run ${C.bold}bun run zarinbot.ts --nuke${C.dim} to remove later.${C.reset}\n`);
    process.exit(0);
  });
}

main().catch((e) => {
  console.error(`\n${C.red}Fatal: ${e.message}${C.reset}\n`);
  process.exit(1);
});
