const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const DIRS = [
  path.join(__dirname, '.next/standalone'),
  path.join(__dirname, '.next/server'),
  path.join(__dirname, '.next/static'),
  path.join(__dirname, 'public'),
];
const MIME = {
  '.html':'text/html;charset=utf-8','.js':'application/javascript;charset=utf-8',
  '.css':'text/css;charset=utf-8','.json':'application/json',
  '.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml',
  '.ico':'image/x-icon','.woff':'font/woff','.woff2':'font/woff2',
  '.map':'application/json','.webp':'image/webp','.gif':'image/gif',
};

// Pre-cache the HTML
let cachedHTML = '';
try { cachedHTML = fs.readFileSync('/tmp/cached-page.html','utf8'); } catch(e){}

function handleAPI(req, res, url) {
  res.writeHead(200, {'Content-Type':'application/json;charset=utf-8','Access-Control-Allow-Origin':'*'});
  const mocks = {
    '/api/sms/stats': {totalSent:12450,delivered:11820,failed:630,todayCost:187500,deliveryRate:94.9,failRate:5.1,chartData:[{day:"شنبه",count:450},{day:"یکشنبه",count:380},{day:"دوشنبه",count:520},{day:"سه‌شنبه",count:310},{day:"چهارشنبه",count:480},{day:"پنجشنبه",count:290},{day:"جمعه",count:150}]},
    '/api/sms/campaigns': [{id:'c1',name:'تخفیف نوروزی',type:'marketing',status:'completed',recipientCount:1200,deliveredCount:1150,failedCount:50,createdAt:'2024-03-15',cost:54000},{id:'c2',name:'هشدار قیمت',type:'price_alert',status:'sending',recipientCount:800,deliveredCount:340,failedCount:12,createdAt:'2024-03-20',cost:15660}],
    '/api/sms/templates': [{id:'t1',name:'خوش‌آمدگویی',content:'به زرین گلد خوش آمدید {name} عزیز!',type:'marketing',variables:['{name}'],active:true}],
    '/api/sms/birthday': {contacts:[{id:'b1',name:'علی محمدی',phone:'09121234567',birthDate:'۱۴۰۴/۰۴/۰۵',sent:false}],stats:{sentThisMonth:12,totalSent:145}},
    '/api/sms/blacklist': [{id:'bl1',phone:'09120000000',reason:'درخواست کاربر'}],
    '/api/sms/logs': {logs:[{id:'l1',date:'2024-03-20',phone:'09121234567',type:'otp',status:'delivered',cost:45}],total:1,totalPages:1},
    '/api/sms/config': {provider:{name:'kavenegar',senderNumber:'30005050',status:'connected',costPerSms:45,dailyLimit:10000,dailyUsed:3420},transactionSms:{deposit:{enabled:true,template:'واریز شد'},withdrawal:{enabled:true,template:'برداشت شد'}},contactGroups:[{id:'g1',name:'VIP',count:156}],settings:{birthdayAutoSend:true}},
    '/api/auth/status': {authenticated:false},
    '/api/gold/price': {buyPrice:35000000,sellPrice:34800000,marketPrice:34900000,updatedAt:new Date().toISOString()},
  };
  let found = null;
  for (const key of Object.keys(mocks)) {
    if (url.startsWith(key)) { found = mocks[key]; break; }
  }
  res.end(JSON.stringify(found || {success:true}));
}

const server = http.createServer((req, res) => {
  try {
    const url = req.url.split('?')[0];
    if (url.startsWith('/api/')) { handleAPI(req, res, url); return; }
    
    let fp = null;
    const decoded = decodeURIComponent(url);
    
    for (const dir of DIRS) {
      const p = path.join(dir, decoded === '/' ? 'index.html' : decoded);
      try { if (fs.statSync(p).isFile()) { fp = p; break; } } catch(e){}
      // Try with .next prefix for static
      if (url.startsWith('/_next/')) {
        const p2 = path.join(__dirname, '.next', url);
        try { if (fs.statSync(p2).isFile()) { fp = p2; break; } } catch(e){}
      }
    }
    
    if (fp) {
      const ext = path.extname(fp).toLowerCase();
      res.writeHead(200, {'Content-Type': MIME[ext]||'application/octet-stream','Cache-Control':'public,max-age=31536000'});
      fs.createReadStream(fp).pipe(res);
    } else if (cachedHTML && (url === '/' || url === '/index.html')) {
      res.writeHead(200, {'Content-Type':'text/html;charset=utf-8'});
      res.end(cachedHTML);
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  } catch(e) {
    res.writeHead(500);
    res.end('Error');
  }
});

server.listen(PORT, '0.0.0.0', () => console.log('Zarin Gold on ' + PORT));
