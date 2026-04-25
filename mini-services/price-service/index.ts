import { createServer } from 'http';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Simulated Gold Price State                                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

const INITIAL_PRICES = {
  buyPrice: 39945281,
  sellPrice: 39547815,
  marketPrice: 39746548,
  ouncePrice: 2654.80,
  spread: 0.397,
};

let currentBuyPrice = INITIAL_PRICES.buyPrice;
let currentSellPrice = INITIAL_PRICES.sellPrice;
let currentOuncePrice = INITIAL_PRICES.ouncePrice;

const TICK_INTERVAL = 3000;
const HEARTBEAT_INTERVAL = 15000;
const PORT = 3004;

interface PriceUpdate {
  buyPrice: number;
  sellPrice: number;
  marketPrice: number;
  ouncePrice: number;
  spread: number;
  timestamp: string;
}

function generatePriceUpdate(): PriceUpdate {
  const buyDelta = Math.round((Math.random() - 0.5) * 100000);
  const sellDelta = Math.round((Math.random() - 0.5) * 100000);

  currentBuyPrice = Math.max(INITIAL_PRICES.sellPrice + 100000, currentBuyPrice + buyDelta);
  currentSellPrice = Math.max(INITIAL_PRICES.sellPrice - 2000000, currentSellPrice + sellDelta);

  if (currentBuyPrice <= currentSellPrice) {
    const mid = Math.round((currentBuyPrice + currentSellPrice) / 2);
    currentBuyPrice = mid + 200000;
    currentSellPrice = mid - 200000;
  }

  const marketPrice = Math.round((currentBuyPrice + currentSellPrice) / 2);
  const spread = parseFloat(((currentBuyPrice - currentSellPrice) / marketPrice * 100).toFixed(3));

  const ounceDelta = (Math.random() - 0.5) * 4;
  currentOuncePrice = Math.max(2400, parseFloat((currentOuncePrice + ounceDelta).toFixed(2)));

  return {
    buyPrice: currentBuyPrice,
    sellPrice: currentSellPrice,
    marketPrice,
    ouncePrice: currentOuncePrice,
    spread,
    timestamp: new Date().toISOString(),
  };
}

function getInitialPriceMessage(): object {
  const marketPrice = Math.round((currentBuyPrice + currentSellPrice) / 2);
  const spread = parseFloat(((currentBuyPrice - currentSellPrice) / marketPrice * 100).toFixed(3));
  return {
    type: 'price_update',
    data: {
      buyPrice: currentBuyPrice,
      sellPrice: currentSellPrice,
      marketPrice,
      ouncePrice: currentOuncePrice,
      spread,
      timestamp: new Date().toISOString(),
    },
  };
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Active Connections (using Bun.WebSocket)                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

const activeSockets = new Set<Bun.WebSocket>();

function broadcast(message: string) {
  for (const ws of activeSockets) {
    try {
      ws.send(message);
    } catch {
      activeSockets.delete(ws);
    }
  }
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Bun Server (Bun.serve handles WebSocket upgrades natively)                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

const server = Bun.serve({
  port: PORT,
  fetch(req, server) {
    // Only handle WebSocket upgrade requests
    const upgradeHeader = req.headers.get('upgrade');
    if (upgradeHeader === 'websocket') {
      const success = server.upgrade(req);
      if (!success) {
        return new Response('WebSocket upgrade failed', { status: 500 });
      }
      return; // Response handled by WebSocket open handler
    }

    // Regular HTTP response for health checks
    return new Response('Zarrin Gold Price WebSocket Service', {
      headers: { 'Content-Type': 'text/plain' },
    });
  },

  websocket: {
    open(ws: Bun.WebSocket) {
      console.log(`[PriceService] Client connected (total: ${activeSockets.size + 1})`);

      // Send initial prices immediately
      ws.send(JSON.stringify(getInitialPriceMessage()));

      activeSockets.add(ws);
    },

    message(ws: Bun.WebSocket, message: string | Buffer) {
      try {
        const msg = JSON.parse(message.toString());
        if (msg.type === 'subscribe' && Array.isArray(msg.channels)) {
          console.log(`[PriceService] Client subscribed to channels: ${msg.channels.join(', ')}`);
          ws.send(JSON.stringify({
            type: 'subscribed',
            data: { channels: msg.channels, status: 'ok' },
          }));
        }
      } catch {
        // Ignore non-JSON messages
      }
    },

    close(ws: Bun.WebSocket, code: number, reason: string) {
      activeSockets.delete(ws);
      console.log(`[PriceService] Client disconnected (code: ${code}, remaining: ${activeSockets.size})`);
    },

    drain(ws: Bun.WebSocket) {
      // Optional: handle backpressure
    },
  },
});

console.log(`[PriceService] Gold Price WebSocket server running on port ${PORT}`);
console.log(`[PriceService] Initial buy: ${INITIAL_PRICES.buyPrice}, sell: ${INITIAL_PRICES.sellPrice}`);

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Price Broadcast Loop                                                       */
/* ═══════════════════════════════════════════════════════════════════════════ */

const priceInterval = setInterval(() => {
  if (activeSockets.size === 0) return;

  const update = generatePriceUpdate();
  const message = JSON.stringify({ type: 'price_update', data: update });
  broadcast(message);

  console.log(`[PriceService] Broadcast: buy=${update.buyPrice} sell=${update.sellPrice} market=${update.marketPrice} clients=${activeSockets.size}`);
}, TICK_INTERVAL);

const heartbeatInterval = setInterval(() => {
  if (activeSockets.size === 0) return;

  const message = JSON.stringify({ type: 'heartbeat', data: { status: 'ok' } });
  broadcast(message);
}, HEARTBEAT_INTERVAL);

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Graceful Shutdown                                                          */
/* ═══════════════════════════════════════════════════════════════════════════ */

function shutdown() {
  console.log('[PriceService] Shutting down...');
  clearInterval(priceInterval);
  clearInterval(heartbeatInterval);
  server.stop();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
