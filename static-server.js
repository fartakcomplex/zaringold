const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const STATIC_DIR = '/home/z/my-project/public';
const NEXT_DIR = '/home/z/my-project/.next';
const STANDALONE_DIR = '/home/z/my-project/.next/standalone';

// Load cached page
let cachedPage = fs.readFileSync('/tmp/cached-page.html', 'utf8');

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
};

function serveFile(filePath, res) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      // Try alternate paths
      const alt = filePath.replace(STANDALONE_DIR + '/.next', NEXT_DIR)
                         .replace(STANDALONE_DIR + '/public', STATIC_DIR);
      fs.readFile(alt, (err2, data2) => {
        if (err2) {
          // Try public dir
          const pub = path.join(STATIC_DIR, filePath.replace(STANDALONE_DIR, ''));
          fs.readFile(pub, (err3, data3) => {
            if (err3) {
              res.writeHead(404);
              res.end('Not found');
              return;
            }
            send(data3, pub, res);
          });
          return;
        }
        send(data2, alt, res);
      });
      return;
    }
    send(data, filePath, res);
  });
}

function send(data, filePath, res) {
  const ext = path.extname(filePath);
  res.writeHead(200, {
    'Content-Type': MIME[ext] || 'application/octet-stream',
    'Cache-Control': 'public, max-age=31536000',
  });
  res.end(data);
}

const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0];
  
  // Health check
  if (url === '/health') {
    res.writeHead(200);
    res.end('ok');
    return;
  }
  
  // Main page
  if (url === '/' || url === '') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(cachedPage);
    return;
  }
  
  // Static files - try multiple locations
  const candidates = [
    path.join(STANDALONE_DIR, url),
    path.join(STATIC_DIR, url),
    path.join(NEXT_DIR, url),
  ];
  
  serveFile(candidates[0], res);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Zarin Gold static server on ${PORT}`);
});
