const http = require('http');
const { parse } = require('url');
const { createServer } = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const server = createServer((req, res) => {
  // Simple health check
  if (req.url === '/health') {
    res.writeHead(200);
    res.end('ok');
    return;
  }
  
  // Proxy to next server
  const opts = {
    hostname: '127.0.0.1',
    port: 3001,
    path: req.url,
    method: req.method,
    headers: req.headers,
  };
  
  const proxy = require('http').request(opts, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });
  
  proxy.on('error', (err) => {
    res.writeHead(502);
    res.end('Next.js server not ready');
  });
  
  req.pipe(proxy);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Proxy listening on ${PORT}, forwarding to 3001`);
});
