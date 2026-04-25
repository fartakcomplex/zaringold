/**
 * @module events/handlers/trading
 * @description Trading event handlers for the ZarinGold platform.
 *
 * Handles gold trading events including buy/sell operations,
 * price updates, portfolio changes, and price alerts.
 */

import type { EventEnvelope, EventHandlerRegistration } from '../types';
import {
  TRADING_EVENTS,
} from '../types';

// ─── Handler: Process Gold Buy Order ─────────────────────────────────────────

/**
 * Process a completed gold buy order.
 * Updates user portfolio, records the transaction, and triggers notifications.
 */
export async function handleGoldBuyCompleted(event: EventEnvelope): Promise<void> {
  const { orderId, userId, goldAmount, pricePerGram, totalCost, paymentId } = event.data as {
    orderId: string;
    userId: string;
    goldAmount: number;
    pricePerGram: number;
    totalCost: number;
    paymentId?: string;
  };

  console.log(
    `[Trading] Gold buy completed: orderId=${orderId}, userId=${userId}, ` +
    `amount=${goldAmount}g @ ${pricePerGram} IRR/g = ${totalCost} IRR`,
  );

  // TODO: Integrate with Prisma/DB
  // 1. Create GoldTransaction record
  // 2. Update user gold wallet balance
  // 3. Publish wallet.balance.updated event
  // 4. Publish gamification.xp.earned event (10 XP per trade)
  // 5. Check if user qualifies for achievements
}

/**
 * Handle a failed gold buy order.
 * Refunds payment and logs the failure reason.
 */
export async function handleGoldBuyFailed(event: EventEnvelope): Promise<void> {
  const { orderId, userId, reason, paymentId } = event.data as {
    orderId: string;
    userId: string;
    reason: string;
    paymentId?: string;
  };

  console.error(`[Trading] Gold buy failed: orderId=${orderId}, reason=${reason}`);

  // TODO: Integrate with payment system for refund
  // 1. If payment was made, initiate refund
  // 2. Update order status to FAILED
  // 3. Notify user via notification subsystem
}

// ─── Handler: Process Gold Sell Order ────────────────────────────────────────

/**
 * Process a completed gold sell order.
 * Deducts gold from wallet, credits fiat, and records the transaction.
 */
export async function handleGoldSellCompleted(event: EventEnvelope): Promise<void> {
  const { orderId, userId, goldAmount, pricePerGram, totalRevenue } = event.data as {
    orderId: string;
    userId: string;
    goldAmount: number;
    pricePerGram: number;
    totalRevenue: number;
  };

  console.log(
    `[Trading] Gold sell completed: orderId=${orderId}, userId=${userId}, ` +
    `amount=${goldAmount}g @ ${pricePerGram} IRR/g = ${totalRevenue} IRR`,
  );

  // TODO: Integrate with Prisma/DB
  // 1. Create GoldTransaction record (type: SELL)
  // 2. Deduct gold from user wallet
  // 3. Credit fiat wallet
  // 4. Publish wallet.balance.updated event
  // 5. Publish gamification.xp.earned event
}

/**
 * Handle a failed gold sell order.
 */
export async function handleGoldSellFailed(event: EventEnvelope): Promise<void> {
  const { orderId, userId, reason } = event.data as {
    orderId: string;
    userId: string;
    reason: string;
  };

  console.error(`[Trading] Gold sell failed: orderId=${orderId}, reason=${reason}`);
  // TODO: Notify user, update order status
}

// ─── Handler: Price Update ───────────────────────────────────────────────────

/**
 * Handle gold price updates.
 * Broadcasts new prices to connected clients and checks price alerts.
 */
export async function handleGoldPriceUpdated(event: EventEnvelope): Promise<void> {
  const { prices, source, timestamp } = event.data as {
    prices: Record<string, { buy: number; sell: number }>;
    source: string;
    timestamp: string;
  };

  // In production: push to WebSocket clients
  console.log(
    `[Trading] Price updated: ${Object.keys(prices).length} price types from ${source}`,
  );

  // TODO: Check active price alerts
  // 1. Query all active price alerts
  // 2. Compare new prices against alert thresholds
  // 3. Trigger TRADING_EVENTS.GOLD_PRICE_ALERT_TRIGGERED for matching alerts
}

// ─── Handler: Price Alert Triggered ──────────────────────────────────────────

/**
 * Handle triggered price alerts.
 * Sends notification to the user when a price target is reached.
 */
export async function handlePriceAlertTriggered(event: EventEnvelope): Promise<void> {
  const { alertId, userId, goldType, targetPrice, currentPrice, direction } = event.data as {
    alertId: string;
    userId: string;
    goldType: string;
    targetPrice: number;
    currentPrice: number;
    direction: 'above' | 'below';
  };

  console.log(
    `[Trading] Price alert triggered: alertId=${alertId}, ` +
    `${goldType} ${direction} ${targetPrice}, current=${currentPrice}`,
  );

  // TODO: Send push notification and SMS
  // 1. Mark alert as triggered
  // 2. Send push notification
  // 3. Send in-app notification
}

// ─── Handler: Gold Gift ──────────────────────────────────────────────────────

/**
 * Handle a gold gift sent from one user to another.
 */
export async function handleGoldGiftSent(event: EventEnvelope): Promise<void> {
  const { giftId, senderId, recipientId, goldAmount, message } = event.data as {
    giftId: string;
    senderId: string;
    recipientId: string;
    goldAmount: number;
    message?: string;
  };

  console.log(
    `[Trading] Gold gift sent: ${goldAmount}g from ${senderId} to ${recipientId}`,
  );

  // TODO: Deduct from sender, notify recipient
}

/**
 * Handle a received gold gift.
 */
export async function handleGoldGiftReceived(event: EventEnvelope): Promise<void> {
  const { giftId, recipientId, goldAmount, senderName } = event.data as {
    giftId: string;
    recipientId: string;
    goldAmount: number;
    senderName?: string;
  };

  console.log(
    `[Trading] Gold gift received: ${goldAmount}g by ${recipientId}`,
  );

  // TODO: Credit gold to recipient, send notification
}

// ─── Handler: Gold Transfer ──────────────────────────────────────────────────

/**
 * Process a completed gold transfer between users.
 */
export async function handleGoldTransferCompleted(event: EventEnvelope): Promise<void> {
  const { transferId, fromUserId, toUserId, goldAmount } = event.data as {
    transferId: string;
    fromUserId: string;
    toUserId: string;
    goldAmount: number;
  };

  console.log(
    `[Trading] Gold transfer completed: ${goldAmount}g from ${fromUserId} to ${toUserId}`,
  );
  // TODO: Update both wallets, send notifications
}

// ─── Handler: Auto-Trade ─────────────────────────────────────────────────────

/**
 * Process an auto-trade order execution.
 */
export async function handleAutoTradeExecuted(event: EventEnvelope): Promise<void> {
  const { orderId, userId, action, goldAmount, price, profit } = event.data as {
    orderId: string;
    userId: string;
    action: 'buy' | 'sell';
    goldAmount: number;
    price: number;
    profit?: number;
  };

  console.log(
    `[Trading] Auto-trade executed: ${action} ${goldAmount}g @ ${price} for user ${userId}`,
  );
  // TODO: Create transaction, update portfolio
}

// ─── Handler Registration ────────────────────────────────────────────────────

/**
 * Register all trading event handlers.
 * Returns handler registrations for use with the subscriber.
 */
export function getTradingHandlerRegistrations(): EventHandlerRegistration[] {
  return [
    {
      pattern: TRADING_EVENTS.GOLD_BUY_COMPLETED,
      handler: handleGoldBuyCompleted,
      name: 'handleGoldBuyCompleted',
    },
    {
      pattern: TRADING_EVENTS.GOLD_BUY_FAILED,
      handler: handleGoldBuyFailed,
      name: 'handleGoldBuyFailed',
    },
    {
      pattern: TRADING_EVENTS.GOLD_SELL_COMPLETED,
      handler: handleGoldSellCompleted,
      name: 'handleGoldSellCompleted',
    },
    {
      pattern: TRADING_EVENTS.GOLD_SELL_FAILED,
      handler: handleGoldSellFailed,
      name: 'handleGoldSellFailed',
    },
    {
      pattern: TRADING_EVENTS.GOLD_PRICE_UPDATED,
      handler: handleGoldPriceUpdated,
      name: 'handleGoldPriceUpdated',
    },
    {
      pattern: TRADING_EVENTS.GOLD_PRICE_ALERT_TRIGGERED,
      handler: handlePriceAlertTriggered,
      name: 'handlePriceAlertTriggered',
    },
    {
      pattern: TRADING_EVENTS.GOLD_GIFT_SENT,
      handler: handleGoldGiftSent,
      name: 'handleGoldGiftSent',
    },
    {
      pattern: TRADING_EVENTS.GOLD_GIFT_RECEIVED,
      handler: handleGoldGiftReceived,
      name: 'handleGoldGiftReceived',
    },
    {
      pattern: TRADING_EVENTS.GOLD_TRANSFER_COMPLETED,
      handler: handleGoldTransferCompleted,
      name: 'handleGoldTransferCompleted',
    },
    {
      pattern: TRADING_EVENTS.AUTO_TRADE_ORDER_EXECUTED,
      handler: handleAutoTradeExecuted,
      name: 'handleAutoTradeExecuted',
    },
  ];
}
