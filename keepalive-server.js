const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');

const LOG = '/home/z/my-project/dev.log';
const KEEPALIVE_PORT = 3001;
const NEXT_PORT = 3000;
const DIR = '/home/z/my-project/zaringold';

let nextProcess = null;

function startNext() {
  if (nextProcess) {
    try { nextProcess.kill(); } catch {}
  }
  
  const logStream = fs.openSync(LOG, 'a');
  nextProcess = spawn('npx', ['next', 'dev', '-p', String(NEXT_PORT)], {
    cwd: DIR,
    stdio: ['ignore', logStream, logStream],
    env: { ...process.env },
  });
  
  nextProcess.on('exit', () => {
    console.log('Next.js process exited, restarting in 5s...');
    setTimeout(startNext, 5000);
  });
  
  console.log('Next.js dev server starting on port', NEXT_PORT);
}

// Create keepalive HTTP server
const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200);
    res.end('OK');
    return;
  }
  res.writeHead(200);
  res.end('ZarrinGold Keepalive');
});

server.listen(KEEPALIVE_PORT, () => {
  console.log('Keepalive server on port', KEEPALIVE_PORT);
  startNext();
});

// Prevent process from exiting
setInterval(() => {}, 10000);
