const { spawn } = require('child_process');
const fs = require('fs');

const log = fs.openSync('/home/z/my-project/dev.log', 'a');

function start() {
  const child = spawn('npx', ['next', 'dev', '--turbopack', '-p', '3000'], {
    stdio: ['ignore', log, log],
    cwd: '/home/z/my-project',
    env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=512' }
  });
  
  child.on('exit', (code) => {
    console.log(`Server exited with code ${code}, restarting in 3s...`);
    setTimeout(start, 3000);
  });
  
  child.on('error', (err) => {
    console.log(`Server error: ${err.message}, restarting...`);
    setTimeout(start, 3000);
  });
  
  return child;
}

const server = start();
console.log(`Started server wrapper, PID: ${process.pid}`);

// Keep this process alive
setInterval(() => {}, 1000);
