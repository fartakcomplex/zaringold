const http = require('http');
const fs = require('fs');

const STATIC_PAGE = fs.readFileSync('/tmp/cached-page.html', 'utf8');
const PORT = 3000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
};

let nextAlive = false;

// Check Next.js health periodically
setInterval(() => {
  const req = http.get('http://127.0.0.1:3001/health', (res) => {
    nextAlive = res.statusCode === 200;
    res.resume();
  });
  req.on('error', () => { nextAlive = false; });
  req.setTimeout(2000, () => { nextAlive = false; req.destroy(); });
}, 5000);

const server = http.createServer((req, res) => {
  // Health endpoint
  if (req.url === '/health') {
    res.writeHead(200);
    res.end('ok');
    return;
  }
  
  // Try Next.js on 3001 first
  if (nextAlive) {
    const proxy = http.request({
      hostname: '127.0.0.1',
      port: 3001,
      path: req.url,
      method: req.method,
      headers: { ...req.headers, host: 'localhost:3000' },
      timeout: 5000,
    }, (proxyRes) => {
      if (proxyRes.statusCode >= 500) {
        // Next.js error, serve static
        serveStatic(req, res);
        return;
      }
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    });
    proxy.on('error', () => {
      nextAlive = false;
      serveStatic(req, res);
    });
    proxy.on('timeout', () => {
      proxy.destroy();
      serveStatic(req, res);
    });
    req.pipe(proxy);
  } else {
    serveStatic(req, res);
  }
});

function serveStatic(req, res) {
  if (req.url === '/' || req.url === '') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(STATIC_PAGE);
    return;
  }
  
  // Serve static assets
  const path = require('path');
  let filePath = path.join('/home/z/my-project/.next/standalone', req.url.split('?')[0]);
  const ext = path.extname(filePath);
  
  fs.readFile(filePath, (err, data) => {
    if (err) {
      // Try .next directory
      filePath = filePath.replace('/.next/standalone/_next/', '/.next/');
      fs.readFile(filePath, (err2, data2) => {
        if (err2) {
          res.writeHead(404);
          res.end('Not found');
          return;
        }
        res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
        res.end(data2);
      });
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Smart proxy on ${PORT} (static fallback + Next.js on 3001)`);
});
