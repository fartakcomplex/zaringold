/**
 * @module events/handlers/payment
 * @description Payment event handlers for the ZarinGold platform.
 *
 * Handles payment lifecycle including creation, verification,
 * failures, refunds, merchant payments, and cashback.
 */

import type { EventEnvelope, EventHandlerRegistration } from '../types';
import { PAYMENT_EVENTS } from '../types';

// ─── Handler: Payment Created ────────────────────────────────────────────────

/**
 * Handle a new payment creation.
 * Logs the payment and triggers gateway-specific processing.
 */
export async function handlePaymentCreated(event: EventEnvelope): Promise<void> {
  const { paymentId, userId, amount, gateway, authority, callbackUrl } = event.data as {
    paymentId: string;
    userId: string;
    amount: number;
    gateway: string;
    authority: string;
    callbackUrl: string;
  };

  console.log(
    `[Payment] Created: paymentId=${paymentId}, ${amount} IRR via ${gateway}, ` +
    `authority=${authority}`,
  );

  // TODO: Store payment record, schedule expiry check
}

// ─── Handler: Payment Verified ───────────────────────────────────────────────

/**
 * Handle a successful payment verification.
 * This is the most critical handler - it triggers order fulfillment.
 */
export async function handlePaymentVerified(event: EventEnvelope): Promise<void> {
  const { paymentId, userId, amount, refId, orderId } = event.data as {
    paymentId: string;
    userId: string;
    amount: number;
    refId: string;
    orderId?: string;
  };

  console.log(
    `[Payment] Verified: paymentId=${paymentId}, ${amount} IRR, refId=${refId}`,
  );

  // TODO: Payment verification pipeline
  // 1. Update payment status to VERIFIED
  // 2. If linked to an order, trigger order fulfillment
  // 3. Credit user wallet if it's a topup
  // 4. Trigger webhook callbacks to merchant
  // 5. Publish analytics event
  // 6. Award gamification XP
}

// ─── Handler: Payment Failed ─────────────────────────────────────────────────

/**
 * Handle a failed payment.
 */
export async function handlePaymentFailed(event: EventEnvelope): Promise<void> {
  const { paymentId, userId, amount, reason, code } = event.data as {
    paymentId: string;
    userId: string;
    amount: number;
    reason: string;
    code?: number;
  };

  console.error(
    `[Payment] Failed: paymentId=${paymentId}, ${amount} IRR, reason=${reason}`,
  );

  // TODO: Update status, notify user
}

// ─── Handler: Payment Refunded ───────────────────────────────────────────────

/**
 * Handle a payment refund.
 * Credits back the user and logs the refund.
 */
export async function handlePaymentRefunded(event: EventEnvelope): Promise<void> {
  const { paymentId, userId, amount, reason, refundTxId } = event.data as {
    paymentId: string;
    userId: string;
    amount: number;
    reason: string;
    refundTxId?: string;
  };

  console.log(
    `[Payment] Refunded: paymentId=${paymentId}, ${amount} IRR, reason=${reason}`,
  );

  // TODO: Update payment record, credit wallet, notify user
}

// ─── Handler: Payment Expired ────────────────────────────────────────────────

/**
 * Handle an expired payment.
 */
export async function handlePaymentExpired(event: EventEnvelope): Promise<void> {
  const { paymentId, userId, amount } = event.data as {
    paymentId: string;
    userId: string;
    amount: number;
  };

  console.warn(`[Payment] Expired: paymentId=${paymentId}, ${amount} IRR`);
  // TODO: Update status, release any reserved funds
}

// ─── Handler: Merchant Payment ───────────────────────────────────────────────

/**
 * Handle a merchant receiving a payment.
 */
export async function handleMerchantPaymentReceived(event: EventEnvelope): Promise<void> {
  const { merchantId, paymentId, amount, customerName, description } = event.data as {
    merchantId: string;
    paymentId: string;
    amount: number;
    customerName?: string;
    description?: string;
  };

  console.log(
    `[Payment] Merchant payment: ${amount} IRR received by merchant ${merchantId}`,
  );

  // TODO: Credit merchant account, send webhook, update invoice
}

/**
 * Handle a merchant settlement request.
 */
export async function handleMerchantSettlementRequested(event: EventEnvelope): Promise<void> {
  const { merchantId, settlementId, amount, bankAccount } = event.data as {
    merchantId: string;
    settlementId: string;
    amount: number;
    bankAccount: string;
  };

  console.log(
    `[Payment] Merchant settlement: ${amount} IRR requested by merchant ${merchantId}`,
  );
  // TODO: Create settlement record, notify admin
}

// ─── Handler: Cashback ───────────────────────────────────────────────────────

/**
 * Handle cashback earned from a transaction.
 */
export async function handleCashbackEarned(event: EventEnvelope): Promise<void> {
  const { userId, amount, transactionId, cashbackPercent } = event.data as {
    userId: string;
    amount: number;
    transactionId: string;
    cashbackPercent: number;
  };

  console.log(
    `[Payment] Cashback earned: ${amount} IRR (${cashbackPercent}%) for user ${userId}`,
  );

  // TODO: Credit cashback wallet, send notification
}

/**
 * Handle cashback claimed by user.
 */
export async function handleCashbackClaimed(event: EventEnvelope): Promise<void> {
  const { userId, amount, cashbackId } = event.data as {
    userId: string;
    amount: number;
    cashbackId: string;
  };

  console.log(`[Payment] Cashback claimed: ${amount} IRR by user ${userId}`);
  // TODO: Transfer cashback to main wallet
}

// ─── Handler: Gateway Settlement ─────────────────────────────────────────────

/**
 * Handle a gateway settlement completion.
 */
export async function handleGatewaySettlementCompleted(event: EventEnvelope): Promise<void> {
  const { settlementId, totalAmount, transactions, bankRef } = event.data as {
    settlementId: string;
    totalAmount: number;
    transactions: number;
    bankRef?: string;
  };

  console.log(
    `[Payment] Gateway settlement: ${totalAmount} IRR (${transactions} txns) settled`,
  );
  // TODO: Update settlement records
}

// ─── Handler Registration ────────────────────────────────────────────────────

/**
 * Register all payment event handlers.
 */
export function getPaymentHandlerRegistrations(): EventHandlerRegistration[] {
  return [
    {
      pattern: PAYMENT_EVENTS.PAYMENT_CREATED,
      handler: handlePaymentCreated,
      name: 'handlePaymentCreated',
    },
    {
      pattern: PAYMENT_EVENTS.PAYMENT_VERIFIED,
      handler: handlePaymentVerified,
      name: 'handlePaymentVerified',
    },
    {
      pattern: PAYMENT_EVENTS.PAYMENT_FAILED,
      handler: handlePaymentFailed,
      name: 'handlePaymentFailed',
    },
    {
      pattern: PAYMENT_EVENTS.PAYMENT_REFUNDED,
      handler: handlePaymentRefunded,
      name: 'handlePaymentRefunded',
    },
    {
      pattern: PAYMENT_EVENTS.PAYMENT_EXPIRED,
      handler: handlePaymentExpired,
      name: 'handlePaymentExpired',
    },
    {
      pattern: PAYMENT_EVENTS.MERCHANT_PAYMENT_RECEIVED,
      handler: handleMerchantPaymentReceived,
      name: 'handleMerchantPaymentReceived',
    },
    {
      pattern: PAYMENT_EVENTS.MERCHANT_SETTLEMENT_REQUESTED,
      handler: handleMerchantSettlementRequested,
      name: 'handleMerchantSettlementRequested',
    },
    {
      pattern: PAYMENT_EVENTS.CASHBACK_EARNED,
      handler: handleCashbackEarned,
      name: 'handleCashbackEarned',
    },
    {
      pattern: PAYMENT_EVENTS.CASHBACK_CLAIMED,
      handler: handleCashbackClaimed,
      name: 'handleCashbackClaimed',
    },
    {
      pattern: PAYMENT_EVENTS.GATEWAY_SETTLEMENT_COMPLETED,
      handler: handleGatewaySettlementCompleted,
      name: 'handleGatewaySettlementCompleted',
    },
  ];
}
