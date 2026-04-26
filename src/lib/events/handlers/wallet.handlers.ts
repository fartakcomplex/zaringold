/**
 * @module events/handlers/wallet
 * @description Wallet event handlers for the ZarinGold platform.
 *
 * Handles wallet operations including deposits, withdrawals,
 * transfers, topups, balance updates, and loan management.
 */

import type { EventEnvelope, EventHandlerRegistration } from '../types';
import { WALLET_EVENTS } from '../types';

// ─── Handler: Deposit Verified ───────────────────────────────────────────────

/**
 * Process a verified wallet deposit.
 * Credits the user's wallet and sends confirmation.
 */
export async function handleDepositVerified(event: EventEnvelope): Promise<void> {
  const { depositId, userId, amount, currency, referenceId } = event.data as {
    depositId: string;
    userId: string;
    amount: number;
    currency: 'IRR' | 'GOLD';
    referenceId?: string;
  };

  console.log(
    `[Wallet] Deposit verified: ${amount} ${currency} for user ${userId}`,
  );

  // TODO: Integrate with Prisma/DB
  // 1. Update deposit status to VERIFIED
  // 2. Credit user wallet balance
  // 3. Publish wallet.balance.updated event
  // 4. Send confirmation notification
}

/**
 * Handle a failed deposit.
 */
export async function handleDepositFailed(event: EventEnvelope): Promise<void> {
  const { depositId, userId, reason } = event.data as {
    depositId: string;
    userId: string;
    reason: string;
  };

  console.error(`[Wallet] Deposit failed: depositId=${depositId}, reason=${reason}`);
  // TODO: Notify user, update status
}

// ─── Handler: Withdrawal ─────────────────────────────────────────────────────

/**
 * Process a withdrawal request.
 * Initiates approval workflow and deducts balance.
 */
export async function handleWithdrawalCreated(event: EventEnvelope): Promise<void> {
  const { withdrawalId, userId, amount, currency, destination } = event.data as {
    withdrawalId: string;
    userId: string;
    amount: number;
    currency: 'IRR' | 'GOLD';
    destination: string;
  };

  console.log(
    `[Wallet] Withdrawal created: ${amount} ${currency} to ${destination} for user ${userId}`,
  );

  // TODO: Create withdrawal record, notify admin for approval
}

/**
 * Process a completed withdrawal.
 */
export async function handleWithdrawalCompleted(event: EventEnvelope): Promise<void> {
  const { withdrawalId, userId, amount, currency, txRef } = event.data as {
    withdrawalId: string;
    userId: string;
    amount: number;
    currency: 'IRR' | 'GOLD';
    txRef?: string;
  };

  console.log(
    `[Wallet] Withdrawal completed: ${amount} ${currency} for user ${userId}`,
  );

  // TODO: Update status, notify user
}

/**
 * Handle a failed withdrawal.
 * Refunds the balance to the user.
 */
export async function handleWithdrawalFailed(event: EventEnvelope): Promise<void> {
  const { withdrawalId, userId, amount, currency, reason } = event.data as {
    withdrawalId: string;
    userId: string;
    amount: number;
    currency: 'IRR' | 'GOLD';
    reason: string;
  };

  console.error(`[Wallet] Withdrawal failed: ${amount} ${currency}, reason=${reason}`);

  // TODO: Refund user balance, notify user
}

// ─── Handler: Transfer ───────────────────────────────────────────────────────

/**
 * Process a wallet transfer between users.
 */
export async function handleTransferCompleted(event: EventEnvelope): Promise<void> {
  const { transferId, fromUserId, toUserId, amount, currency } = event.data as {
    transferId: string;
    fromUserId: string;
    toUserId: string;
    amount: number;
    currency: 'IRR' | 'GOLD';
  };

  console.log(
    `[Wallet] Transfer completed: ${amount} ${currency} from ${fromUserId} to ${toUserId}`,
  );

  // TODO: Update both wallets, send notifications
}

/**
 * Handle a failed transfer.
 */
export async function handleTransferFailed(event: EventEnvelope): Promise<void> {
  const { transferId, fromUserId, reason } = event.data as {
    transferId: string;
    fromUserId: string;
    reason: string;
  };

  console.error(`[Wallet] Transfer failed: ${transferId}, reason=${reason}`);
  // TODO: Refund sender
}

// ─── Handler: Topup ──────────────────────────────────────────────────────────

/**
 * Process a completed wallet topup.
 */
export async function handleTopupCompleted(event: EventEnvelope): Promise<void> {
  const { topupId, userId, amount, currency, gateway } = event.data as {
    topupId: string;
    userId: string;
    amount: number;
    currency: 'IRR' | 'GOLD';
    gateway: string;
  };

  console.log(
    `[Wallet] Topup completed: ${amount} ${currency} via ${gateway} for user ${userId}`,
  );

  // TODO: Credit wallet, send confirmation
}

// ─── Handler: Balance Updated ────────────────────────────────────────────────

/**
 * Handle a balance update event.
 * Broadcasts to WebSocket and updates cached balances.
 */
export async function handleBalanceUpdated(event: EventEnvelope): Promise<void> {
  const { userId, currency, newBalance, change, reason } = event.data as {
    userId: string;
    currency: 'IRR' | 'GOLD';
    newBalance: number;
    change: number;
    reason: string;
  };

  console.log(
    `[Wallet] Balance updated: user ${userId}, ${currency} balance=${newBalance}, ` +
    `change=${change > 0 ? '+' : ''}${change} (${reason})`,
  );

  // TODO: Push to WebSocket, invalidate cache
}

// ─── Handler: Loan ───────────────────────────────────────────────────────────

/**
 * Process a new loan creation.
 */
export async function handleLoanCreated(event: EventEnvelope): Promise<void> {
  const { loanId, userId, amount, goldCollateral, interestRate, dueDate } = event.data as {
    loanId: string;
    userId: string;
    amount: number;
    goldCollateral: number;
    interestRate: number;
    dueDate: string;
  };

  console.log(
    `[Wallet] Loan created: ${amount} IRR for user ${userId}, ` +
    `collateral=${goldCollateral}g, rate=${interestRate}%, due=${dueDate}`,
  );
  // TODO: Create loan record, deduct collateral
}

/**
 * Handle a loan repayment.
 */
export async function handleLoanRepaid(event: EventEnvelope): Promise<void> {
  const { loanId, userId, amountPaid, remainingBalance } = event.data as {
    loanId: string;
    userId: string;
    amountPaid: number;
    remainingBalance: number;
  };

  console.log(
    `[Wallet] Loan repayment: ${amountPaid} IRR for loan ${loanId}, remaining=${remainingBalance}`,
  );
  // TODO: Update loan status, return collateral if fully repaid
}

// ─── Handler: Family Wallet ──────────────────────────────────────────────────

/**
 * Handle a family wallet contribution.
 */
export async function handleFamilyWalletContribution(event: EventEnvelope): Promise<void> {
  const { familyWalletId, userId, goldAmount, message } = event.data as {
    familyWalletId: string;
    userId: string;
    goldAmount: number;
    message?: string;
  };

  console.log(
    `[Wallet] Family contribution: ${goldAmount}g to wallet ${familyWalletId} by ${userId}`,
  );
  // TODO: Credit family wallet, notify members
}

// ─── Handler Registration ────────────────────────────────────────────────────

/**
 * Register all wallet event handlers.
 */
export function getWalletHandlerRegistrations(): EventHandlerRegistration[] {
  return [
    {
      pattern: WALLET_EVENTS.DEPOSIT_VERIFIED,
      handler: handleDepositVerified,
      name: 'handleDepositVerified',
    },
    {
      pattern: WALLET_EVENTS.DEPOSIT_FAILED,
      handler: handleDepositFailed,
      name: 'handleDepositFailed',
    },
    {
      pattern: WALLET_EVENTS.WITHDRAWAL_CREATED,
      handler: handleWithdrawalCreated,
      name: 'handleWithdrawalCreated',
    },
    {
      pattern: WALLET_EVENTS.WITHDRAWAL_COMPLETED,
      handler: handleWithdrawalCompleted,
      name: 'handleWithdrawalCompleted',
    },
    {
      pattern: WALLET_EVENTS.WITHDRAWAL_FAILED,
      handler: handleWithdrawalFailed,
      name: 'handleWithdrawalFailed',
    },
    {
      pattern: WALLET_EVENTS.TRANSFER_COMPLETED,
      handler: handleTransferCompleted,
      name: 'handleTransferCompleted',
    },
    {
      pattern: WALLET_EVENTS.TRANSFER_FAILED,
      handler: handleTransferFailed,
      name: 'handleTransferFailed',
    },
    {
      pattern: WALLET_EVENTS.TOPUP_COMPLETED,
      handler: handleTopupCompleted,
      name: 'handleTopupCompleted',
    },
    {
      pattern: WALLET_EVENTS.BALANCE_UPDATED,
      handler: handleBalanceUpdated,
      name: 'handleBalanceUpdated',
    },
    {
      pattern: WALLET_EVENTS.LOAN_CREATED,
      handler: handleLoanCreated,
      name: 'handleLoanCreated',
    },
    {
      pattern: WALLET_EVENTS.LOAN_REPAID,
      handler: handleLoanRepaid,
      name: 'handleLoanRepaid',
    },
    {
      pattern: WALLET_EVENTS.FAMILY_WALLET_CONTRIBUTION,
      handler: handleFamilyWalletContribution,
      name: 'handleFamilyWalletContribution',
    },
  ];
}
