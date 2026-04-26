// Ignore SIGPIPE to prevent process crash when connections close
process.on('SIGPIPE', () => {
  // Silently ignore SIGPIPE
});

// Start Next.js dev server
const { spawn } = require('child_process');
const path = require('path');

const child = spawn('node', [
  path.join(__dirname, 'node_modules/.bin/next'),
  'dev', '-p', '3000'
], {
  stdio: 'inherit',
  detached: false
});

child.on('exit', (code, signal) => {
  console.log(`Next.js exited with code=${code} signal=${signal}`);
  process.exit(code || 0);
});

process.on('SIGINT', () => child.kill('SIGINT'));
process.on('SIGTERM', () => child.kill('SIGTERM'));
