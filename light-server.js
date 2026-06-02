const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const MIME = {'.html':'text/html;charset=utf-8','.js':'application/javascript;charset=utf-8','.css':'text/css;charset=utf-8','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.ico':'image/x-icon','.woff':'font/woff','.woff2':'font/woff2','.webp':'image/webp','.gif':'image/gif','.map':'application/json'};
let html = '';
try { html = fs.readFileSync('/tmp/cached-page.html','utf8'); } catch(e){}

const server = http.createServer((req, res) => {
  try {
    const url = decodeURIComponent(req.url.split('?')[0]);
    if (url.startsWith('/api/')) {
      res.writeHead(200,{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'});
      const m = {'/api/sms/stats':'{totalSent:12450}','/api/auth/status':'{}'};
      res.end(JSON.stringify({success:true}));
      return;
    }
    if (url === '/' && html) { res.writeHead(200,{'Content-Type':'text/html;charset=utf-8'}); res.end(html); return; }
    let fp = null;
    const candidates = [
      path.join(__dirname, '.next', url),
      path.join(__dirname, '.next/static', url.replace('/_next/','')),
      path.join(__dirname, 'public', url)
    ];
    for (const c of candidates) { try { if (fs.statSync(c).isFile()) { fp=c; break; } } catch(e){} }
    if (fp) {
      const ext = path.extname(fp).toLowerCase();
      res.writeHead(200,{'Content-Type':MIME[ext]||'application/octet-stream','Cache-Control':'public,max-age=86400'});
      fs.createReadStream(fp,{highWaterMark:65536}).pipe(res);
    } else { res.writeHead(404); res.end(); }
  } catch(e) { try { res.writeHead(500); res.end(); } catch(e2){} }
});
server.listen(PORT,'0.0.0.0',()=>console.log('ZG:'+PORT));
