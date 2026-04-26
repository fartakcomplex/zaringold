// Ultra-lightweight static server using Node.js http module
const fs = require('fs');
const path = require('path');

const STATIC_DIR = path.join(__dirname, '.next', 'static');
const STANDALONE_STATIC = path.join(__dirname, '.next', 'standalone', '.next', 'static');
const PUBLIC_DIR = path.join(__dirname, 'public');
const INDEX_HTML = path.join(__dirname, '.next', 'standalone', '.next', 'server', 'app', 'index.html');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain',
  '.wasm': 'application/wasm',
  '.map': 'application/json',
};

let indexHTML = '';
try { indexHTML = fs.readFileSync(INDEX_HTML, 'utf-8'); } catch {}

function getMime(ext) { return MIME[ext] || 'application/octet-stream'; }

function serveStatic(res, filePath) {
  try {
    if (!fs.existsSync(filePath)) return false;
    const stat = fs.statSync(filePath);
    if (!stat.isFile()) return false;
    const content = fs.readFileSync(filePath);
    res.writeHead(200, {
      'Content-Type': getMime(path.extname(filePath)),
      'Content-Length': content.length,
      'Cache-Control': 'public, max-age=31536000, immutable',
    });
    res.end(content);
    return true;
  } catch { return false; }
}

function json(res, data) {
  const body = JSON.stringify(data);
  res.writeHead(200, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': '*',
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk) => { data += chunk; });
    req.on('end', () => { try { resolve(JSON.parse(data) || {}); } catch { resolve({}); } });
    req.on('error', () => resolve({}));
    setTimeout(() => resolve({}), 3000);
  });
}

async function handleAPI(req, res, urlPath) {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': '*', 'Access-Control-Allow-Headers': '*' });
    res.end();
    return;
  }
  const body = await readBody(req);

  if (urlPath === '/api/utility/topup' && req.method === 'POST') {
    return json(res, { success: true, data: { referenceCode: 'TOP' + Date.now(), totalPrice: body?.amount || 10000, status: 'success' } });
  }
  if (urlPath === '/api/utility/internet' && req.method === 'POST') {
    return json(res, { success: true, data: { referenceCode: 'NET' + Date.now(), totalPrice: body?.amount || 15000, status: 'success' } });
  }
  if (urlPath === '/api/utility/bills' && req.method === 'POST') {
    if (body?.action === 'inquiry') {
      return json(res, { success: true, data: { billNumber: body?.billNumber, amount: Math.floor(Math.random() * 500000) + 50000, period: '1404/01' } });
    }
    return json(res, { success: true, data: { referenceCode: 'BIL' + Date.now(), totalPrice: body?.amount || 100000, status: 'success' } });
  }
  if (urlPath === '/api/utility/history') {
    return json(res, { success: true, data: [], summary: { totalSpent: 0, totalFee: 0, totalCount: 0 } });
  }
  if (urlPath === '/api/health') {
    return json(res, { status: 'ok', uptime: process.uptime() });
  }
  return json(res, { success: true });
}

const http = require('http');
const server = http.createServer(async (req, res) => {
  try {
    const urlPath = (req.url || '/').split('?')[0];

    if (urlPath.startsWith('/api/')) {
      return handleAPI(req, res, urlPath);
    }

    if (urlPath.startsWith('/_next/static/')) {
      const relPath = urlPath.replace('/_next/static/', '');
      if (serveStatic(res, path.join(STATIC_DIR, relPath))) return;
      if (serveStatic(res, path.join(STANDALONE_STATIC, relPath))) return;
    }

    if (urlPath.startsWith('/_next/image')) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
      return;
    }

    if (urlPath !== '/') {
      if (serveStatic(res, path.join(PUBLIC_DIR, urlPath))) return;
    }

    if (indexHTML) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(indexHTML);
      return;
    }

    res.writeHead(503, { 'Content-Type': 'text/plain' });
    res.end('Starting...');
  } catch (err) {
    console.error('Error:', err.message);
    try { res.writeHead(500); res.end('Error'); } catch {}
  }
});

server.on('error', (err) => { console.error('Server error:', err.message); });
process.on('uncaughtException', (err) => { console.error('Uncaught:', err.message); });
process.on('unhandledRejection', () => {});

server.listen(3000, '0.0.0.0', () => {
  console.log('Server on :3000 (' + Math.round(indexHTML.length / 1024) + 'KB HTML)');
});
