import { serve } from "bun";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const STATIC_DIR = join(import.meta.dir, '.next', 'static');
const STANDALONE_STATIC = join(import.meta.dir, '.next', 'standalone', '.next', 'static');
const PUBLIC_DIR = join(import.meta.dir, 'public');
const INDEX_HTML = join(import.meta.dir, '.next', 'standalone', '.next', 'server', 'app', 'index.html');

let indexHTML = '';
try { indexHTML = readFileSync(INDEX_HTML, 'utf-8'); } catch {}

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.map': 'application/json',
};

console.log(`Starting on port 3000 with ${Math.round(indexHTML.length / 1024)}KB HTML`);

serve({
  port: 3000,
  hostname: '0.0.0.0',
  fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;

    // API endpoints
    if (path.startsWith('/api/')) {
      return new Response(JSON.stringify({ status: 'ok', uptime: process.uptime() }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // Static Next.js assets
    if (path.startsWith('/_next/static/')) {
      const relPath = path.replace('/_next/static/', '');
      for (const dir of [STATIC_DIR, STANDALONE_STATIC]) {
        const filePath = join(dir, relPath);
        if (existsSync(filePath)) {
          const ext = filePath.substring(filePath.lastIndexOf('.'));
          return new Response(readFileSync(filePath), {
            headers: { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': 'public, max-age=31536000, immutable' }
          });
        }
      }
      return new Response('Not found', { status: 404 });
    }

    // Public assets
    if (path !== '/') {
      const filePath = join(PUBLIC_DIR, path);
      if (existsSync(filePath)) {
        const ext = filePath.substring(filePath.lastIndexOf('.'));
        return new Response(readFileSync(filePath), {
          headers: { 'Content-Type': MIME[ext] || 'application/octet-stream' }
        });
      }
    }

    // Serve index.html for all routes (SPA)
    if (indexHTML) {
      return new Response(indexHTML, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    return new Response('Starting...', { status: 503 });
  }
});
