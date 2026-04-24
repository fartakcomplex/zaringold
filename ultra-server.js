// Ultra-lightweight server with built-in keepalive
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PORT = 3000;
const PROJECT_DIR = '/home/z/my-project';
const PUBLIC_DIR = path.join(PROJECT_DIR, 'public');
const NEXT_DIR = path.join(PROJECT_DIR, '.next');

// MIME types
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.map': 'application/json',
  '.txt': 'text/plain',
};

// Read cached homepage
const cachedHTML = fs.readFileSync(path.join(PROJECT_DIR, 'cached-homepage.html'), 'utf8');

const server = http.createServer((req, res) => {
  try {
    const url = req.url.split('?')[0];

    // Health endpoint
    if (url === '/health' || url === '/api/health') {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('ok');
      return;
    }

    // Homepage
    if (url === '/' || url === '') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(cachedHTML);
      return;
    }

    // _next static files - serve from .next directory
    if (url.startsWith('/_next/')) {
      serveStatic(res, path.join(NEXT_DIR, url));
      return;
    }

    // Public files
    serveStatic(res, path.join(PUBLIC_DIR, url));
  } catch (e) {
    res.writeHead(500);
    res.end('Error');
  }
});

function serveStatic(res, filePath) {
  const ext = path.extname(filePath);
  fs.readFile(filePath, (err, data) => {
    if (err) {
      // Try alternate: standalone dir
      const alt = filePath.replace(NEXT_DIR, path.join(PROJECT_DIR, '.next/standalone/.next'));
      fs.readFile(alt, (err2, data2) => {
        if (err2) {
          res.writeHead(404);
          res.end('Not found');
          return;
        }
        respond(res, ext, data2);
      });
      return;
    }
    respond(res, ext, data);
  });
}

function respond(res, ext, data) {
  res.writeHead(200, {
    'Content-Type': MIME[ext] || 'application/octet-stream',
    'Cache-Control': 'public, max-age=86400',
  });
  res.end(data);
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Zarin Gold server on port ${PORT}`);
});
