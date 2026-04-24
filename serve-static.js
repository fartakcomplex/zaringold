const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const BUILD_DIR = path.join(__dirname, '.next');

// MIME types
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.map': 'application/json',
};

const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0];
  
  // API routes - return mock JSON
  if (url.startsWith('/api/')) {
    handleAPI(req, res, url);
    return;
  }

  // Try to serve static files
  let filePath;
  
  // Try standalone build first
  const standalonePath = path.join(__dirname, '.next/standalone', url === '/' ? '/index.html' : url);
  if (fs.existsSync(standalonePath)) {
    filePath = standalonePath;
  }
  
  // Try .next/server
  if (!filePath) {
    const serverPath = path.join(BUILD_DIR, 'server', url === '/' ? '/app/index.html' : url);
    if (fs.existsSync(serverPath)) {
      filePath = serverPath;
    }
  }

  // Try static files
  if (!filePath) {
    const staticPath = path.join(BUILD_DIR, 'static', url);
    if (fs.existsSync(staticPath)) {
      filePath = staticPath;
    }
  }

  // Try public
  if (!filePath) {
    const publicPath = path.join(__dirname, 'public', url);
    if (fs.existsSync(publicPath)) {
      filePath = publicPath;
    }
  }

  if (filePath) {
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    // Fallback to cached HTML
    const cachedPath = '/tmp/cached-page.html';
    if (fs.existsSync(cachedPath) && (url === '/' || url === '/index.html')) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      fs.createReadStream(cachedPath).pipe(res);
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  }
});

// Mock API handler
function handleAPI(req, res, url) {
  res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
  
  const mocks = {
    '/api/sms/stats': { totalSent: 12450, delivered: 11820, failed: 630, todayCost: 187500, deliveryRate: 94.9, failRate: 5.1, chartData: [{day:"شنبه",count:450},{day:"یکشنبه",count:380},{day:"دوشنبه",count:520},{day:"سه‌شنبه",count:310},{day:"چهارشنبه",count:480},{day:"پنجشنبه",count:290},{day:"جمعه",count:150}] },
    '/api/sms/campaigns': [{ id:'c1', name:'تخفیف نوروزی', type:'marketing', segment:'all', status:'completed', recipientCount:1200, deliveredCount:1150, failedCount:50, message:'عید نوروز مبارک!', createdAt:'2024-03-15T10:00:00Z', cost:54000 },{ id:'c2', name:'هشدار قیمت', type:'price_alert', segment:'active', status:'sending', recipientCount:800, deliveredCount:340, failedCount:12, message:'قیمت طلا افزایش یافت', createdAt:'2024-03-20T14:30:00Z', cost:15660 }],
    '/api/sms/templates': [{ id:'t1', name:'خوش‌آمدگویی', slug:'welcome', content:'به زرین گلد خوش آمدید {name} عزیز!', type:'marketing', variables:['{name}'], active:true },{ id:'t2', name:'تراکنش', slug:'transaction', content:'تراکنش {type} به مبلغ {amount} تومان انجام شد', type:'transactional', variables:['{type}','{amount}'], active:true }],
    '/api/sms/birthday': { contacts: [{ id:'b1', name:'علی محمدی', phone:'09121234567', birthDate:'۱۴۰۴/۰۴/۰۵', sent:false }], stats: { sentThisMonth:12, totalSent:145 } },
    '/api/sms/blacklist': [{ id:'bl1', phone:'09120000000', reason:'درخواست کاربر', addedAt:'۱۴۰۳/۰۳/۱۰' }],
    '/api/sms/logs': { logs: [{ id:'l1', date:'2024-03-20', phone:'09121234567', type:'otp', status:'delivered', cost:45 }], total:1, totalPages:1 },
    '/api/sms/config': { provider: { name:'kavenegar', apiKey:'****', senderNumber:'30005050', status:'connected', costPerSms:45, dailyLimit:10000, dailyUsed:3420 }, transactionSms: { deposit: { enabled:true, template:'واریز شد' }, withdrawal: { enabled:true, template:'برداشت شد' } }, contactGroups: [{ id:'g1', name:'VIP', description:'کاربران VIP', count:156, auto:true }], settings: { autoBlacklistAfterFailed:5, birthdayAutoSend:true } },
    '/api/auth/status': { authenticated: false },
  };

  // Match API path
  let matched = null;
  for (const key of Object.keys(mocks)) {
    if (url === key || url.startsWith(key.replace(/\/[^/]*$/, ''))) {
      matched = mocks[key];
      break;
    }
  }
  
  res.end(JSON.stringify(matched || { success: true }));
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Zarin Gold server on ${PORT}`);
});
