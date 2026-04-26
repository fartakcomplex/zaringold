const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const LOG_FILE = path.join(__dirname, 'dev.log');
const PORT = 3000;

function startServer() {
    const now = new Date().toISOString();
    fs.appendFileSync(LOG_FILE, `\n[${now}] Starting Next.js dev server...\n`);
    
    const child = spawn('node', [
        path.join(__dirname, 'node_modules/.bin/next'),
        'dev', '-p', String(PORT)
    ], {
        cwd: __dirname,
        stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env }
    });

    child.stdout.on('data', (data) => {
        fs.appendFileSync(LOG_FILE, data.toString());
    });

    child.stderr.on('data', (data) => {
        fs.appendFileSync(LOG_FILE, data.toString());
    });

    child.on('exit', (code, signal) => {
        const now = new Date().toISOString();
        fs.appendFileSync(LOG_FILE, `\n[${now}] Server exited with code=${code} signal=${signal}\n`);
        // Restart after 2 seconds
        setTimeout(startServer, 2000);
    });

    return child;
}

startServer();

// Keep the process alive
setInterval(() => {}, 60000);
