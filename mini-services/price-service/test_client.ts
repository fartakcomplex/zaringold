import { WebSocket } from 'ws';
const ws = new WebSocket('ws://127.0.0.1:3004');
ws.on('open', () => { console.log('OPENED'); });
ws.on('message', (data) => { console.log('MSG:', data.toString().substring(0, 200)); });
ws.on('error', (err) => { console.log('ERROR:', err.message); });
ws.on('close', (code, reason) => { console.log('CLOSED:', code, reason.toString()); process.exit(0); });
setTimeout(() => { ws.close(); process.exit(0); }, 3000);
