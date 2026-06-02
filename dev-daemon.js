#!/usr/bin/env node
// Daemon script to keep Next.js dev server alive
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const LOG = '/home/z/my-project/dev.log';
const PORT = 3000;
const DIR = '/home/z/my-project/zaringold';

// Fork process to daemonize
if (process.pid !== 1) {
  // Write PID file
  fs.writeFileSync('/tmp/zaringold-dev.pid', String(process.pid));
}

function startServer() {
  const child = spawn('node', ['node_modules/.bin/next', 'dev', '-p', String(PORT)], {
    cwd: DIR,
    detached: false,
    stdio: ['ignore', fs.openSync(LOG, 'a'), fs.openSync(LOG, 'a')],
    env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=512' },
  });

  child.on('error', (err) => {
    const msg = `[${new Date().toISOString()}] Server error: ${err.message}\n`;
    fs.appendFileSync(LOG, msg);
  });

  child.on('exit', (code) => {
    const msg = `[${new Date().toISOString()}] Server exited with code ${code}, restarting in 3s...\n`;
    fs.appendFileSync(LOG, msg);
    setTimeout(startServer, 3000);
  });

  child.on('spawn', () => {
    const msg = `[${new Date().toISOString()}] Server started (PID: ${child.pid})\n`;
    fs.appendFileSync(LOG, msg);
  });

  return child;
}

// Handle signals
process.on('SIGTERM', () => {
  fs.appendFileSync(LOG, `[${new Date().toISOString()}] Daemon received SIGTERM\n`);
  process.exit(0);
});
process.on('SIGINT', () => {
  fs.appendFileSync(LOG, `[${new Date().toISOString()}] Daemon received SIGINT\n`);
  process.exit(0);
});

fs.appendFileSync(LOG, `[${new Date().toISOString()}] Dev daemon starting\n`);
const server = startServer();

// Keep the daemon alive
setInterval(() => {
  // Heartbeat
}, 60000);
